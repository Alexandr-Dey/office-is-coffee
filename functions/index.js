const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

initializeApp();
const db = getFirestore();

/* ═══ HELPERS ═══ */
function getAlmatyDate(date) {
  const d = date || new Date();
  return d.toLocaleString("sv", { timeZone: "Asia/Almaty" }).split(" ")[0];
}

async function sendPush(uid, title, body, data) {
  const tokenSnap = await db.collection("push_tokens").doc(uid).get();
  if (!tokenSnap.exists || !tokenSnap.data().token) {
    console.log(`sendPush: no token for ${uid}`);
    return;
  }
  console.log(`sendPush: sending to ${uid} — "${title}"`);
  await getMessaging().send({
    token: tokenSnap.data().token,
    notification: { title, body },
    data: data || {},
    webpush: {
      notification: { icon: "/icon-192.png", badge: "/icon-192.png" },
    },
  }).catch((err) => console.warn("Push failed for", uid, err.message));
}

async function sendPushMulti(tokens, title, body, data) {
  if (tokens.length === 0) return;
  await getMessaging().sendEachForMulticast({
    tokens,
    notification: { title, body },
    data: data || {},
    webpush: {
      notification: { icon: "/icon-192.png", badge: "/icon-192.png" },
    },
  }).catch((err) => console.warn("Multi push failed:", err.message));
}

async function getBaristaTokens() {
  const baristasSnap = await db.collection("users").where("role", "in", ["barista", "ceo"]).get();
  const tokens = [];
  for (const d of baristasSnap.docs) {
    const tokenSnap = await db.collection("push_tokens").doc(d.id).get();
    if (tokenSnap.exists && tokenSnap.data().token) tokens.push(tokenSnap.data().token);
  }
  return tokens;
}

/* ═══ 1. ON ORDER CREATE — set pending + push baristas + deposit deduction + loyalty ═══ */
exports.onOrderCreate = onDocumentCreated("orders/{orderId}", async (event) => {
  const data = event.data?.data();
  if (!data) return;
  console.log(`New order ${event.params.orderId} from ${data.userId}: ${data.items?.length ?? 0} items, total ${data.total}`);
  const orderId = event.params.orderId;
  const orderRef = event.data.ref;
  const userId = data.userId;

  // Defense in depth: валидация total и items
  const items = Array.isArray(data.items) ? data.items : [];
  if (items.length === 0) {
    await orderRef.update({ status: "cancelled", cancelReason: "Пустой заказ" });
    return;
  }
  // Recompute total из items
  const computedTotal = items.reduce((sum, i) => {
    const tp = typeof i.totalPrice === "number" ? i.totalPrice
             : typeof i.price === "number" ? i.price : 0;
    const qty = typeof i.qty === "number" && i.qty > 0 ? i.qty : 1;
    return sum + tp * qty;
  }, 0);
  // Допуск 1₸ на округление; если клиент прислал меньше — отклоняем
  if (typeof data.total !== "number" || data.total < 0 || data.total > computedTotal + 1) {
    await orderRef.update({
      status: "cancelled",
      cancelReason: `Несоответствие total (${data.total} vs ${computedTotal})`,
    });
    return;
  }
  // Sanity cap: один заказ не должен превышать 100,000₸
  if (computedTotal > 100000) {
    await orderRef.update({ status: "cancelled", cancelReason: "Слишком большая сумма" });
    return;
  }

  // Cafe-closed guard: фронт уже проверяет, но между render и create могла
  // случиться смена состояния (auto-close по расписанию / ручное закрытие).
  // Защищаем сервер.
  const cafeSnap = await db.collection("cafe_status").doc("aksay_main").get();
  if (cafeSnap.exists && cafeSnap.data().isOpen === false) {
    await orderRef.update({ status: "cancelled", cancelReason: "Кофейня закрыта" });
    return;
  }

  // Deposit pre-flight + списание ПЕРЕД pending-переходом и пушем баристам:
  // если депозита нет / не хватает — сразу отменяем с понятной причиной,
  // не дёргая баристов зря. История триммируется до последних 100 записей
  // чтобы документ не упёрся в лимит 1MB.
  if (data.paymentMethod === "deposit" && !data.isFreeByLoyalty && data.total > 0 && userId) {
    const depRef = db.collection("deposits").doc(userId);
    let depositFailed = null; // { reason, bal }
    try {
      await db.runTransaction(async (tx) => {
        const depSnap = await tx.get(depRef);
        const bal = depSnap.exists ? (depSnap.data().balance || 0) : 0;
        if (!depSnap.exists || bal < data.total) {
          depositFailed = { bal };
          throw new Error("INSUFFICIENT");
        }
        const existing = depSnap.data().history || [];
        const newHistory = [
          ...existing,
          { type: "payment", amount: data.total, date: new Date().toISOString(), orderId },
        ].slice(-100);
        tx.update(depRef, {
          balance: bal - data.total,
          totalSpent: (depSnap.data().totalSpent || 0) + data.total,
          history: newHistory,
        });
        tx.update(orderRef, { depositDeductedAt: new Date().toISOString() });
      });
    } catch (e) {
      if (!depositFailed) throw e;
    }
    if (depositFailed) {
      const reason = depositFailed.bal === 0
        ? "На депозите 0₸. Пополни у баристы или выбери наличными"
        : `На депозите ${depositFailed.bal}₸, нужно ${data.total}₸ — не хватает ${data.total - depositFailed.bal}₸`;
      await orderRef.update({ status: "cancelled", cancelReason: reason });
      if (userId && userId !== "anonymous") {
        await sendPush(userId, "Заказ не оформлен 😔", reason, { type: "order_cancelled", orderId });
      }
      return; // не идём дальше — баристов не дёргаем
    }
  }

  // Auto-transition new → pending
  await orderRef.update({ status: "pending" });

  // Push to all baristas
  const tokens = await getBaristaTokens();
  const itemNames = (data.items || []).map((i) => i.name).join(", ");
  await sendPushMulti(tokens, "Новый заказ!", `${itemNames} от ${data.name || "Клиент"}`);

  // Update loyalty count + streak (new logic: count coffee items, free = cheapest coffee basePrice)
  // Includes legacy IDs for historical orders — remove when old orders age out (см. normalizeCategoryId).
  const coffeeCategories = [
    'classic_coffee', 'author_coffee', 'ice_coffee',
    'coffee_classic', 'coffee_author', // legacy
  ];
  if (userId && userId !== "anonymous") {
    const userRef = db.collection("users").doc(userId);
    await db.runTransaction(async (tx) => {
      const userSnap = await tx.get(userRef);
      if (!userSnap.exists) return;
      const userData = userSnap.data();
      const items = data.items || [];

      // Count coffee items (by category + countsForLoyalty is determined client-side by category)
      const coffeeItems = items.filter((i) => coffeeCategories.includes(i.category));
      const coffeeQty = coffeeItems.reduce((sum, i) => sum + (i.qty || 1), 0);

      // Streak
      const today = getAlmatyDate();
      const lastOrder = userData.lastOrderDate;
      const yesterday = getAlmatyDate(new Date(Date.now() - 86400000));
      let newStreak = 1;
      if (lastOrder === yesterday) newStreak = (userData.streak || 0) + 1;
      else if (lastOrder === today) newStreak = userData.streak || 1;

      // Лояльность считаем ТОЛЬКО по кофейным позициям. Лимонад/смузи/фреш
      // не дают баллы — иначе клиент мог бы заработать бесплатный кофе без
      // кофе.
      const loyaltyIncrement = coffeeQty;
      let lc = (userData.loyaltyCount || 0) + loyaltyIncrement;
      let discount = 0;

      if (lc >= 8 && coffeeItems.length > 0) {
        // Free = cheapest coffee item's basePrice only
        const cheapest = coffeeItems.reduce((min, i) =>
          (i.basePrice || i.totalPrice || i.price || 0) < (min.basePrice || min.totalPrice || min.price || 0) ? i : min
        );
        discount = cheapest.basePrice || cheapest.totalPrice || cheapest.price || 0;
        lc = lc - 8; // carry over остаток
      }

      tx.update(userRef, {
        loyaltyCount: lc,
        streak: newStreak,
        lastOrderDate: today,
      });

      // Apply discount to order
      if (discount > 0) {
        const newTotal = Math.max(0, (data.total || 0) - discount);
        tx.update(orderRef, {
          isFreeByLoyalty: true,
          loyaltyDiscount: discount,
          total: newTotal,
        });
      }
    });

    // Track order after push (within 24 hours of push sent)
    const userSnap2 = await db.collection("users").doc(userId).get();
    if (userSnap2.exists) {
      const ud = userSnap2.data();
      if (ud.lastPushSentAt && ud.lastPushId) {
        const pushTime = new Date(ud.lastPushSentAt).getTime();
        const twentyFourHours = 24 * 60 * 60 * 1000;
        if (Date.now() - pushTime < twentyFourHours) {
          const pushLogRef = db.collection("push_log").doc(ud.lastPushId);
          const pushLogSnap = await pushLogRef.get();
          const existingOrderers = pushLogSnap.exists ? (pushLogSnap.data().orderedUids || []) : [];
          const isUnique = !existingOrderers.includes(userId);

          await pushLogRef.update({
            ordersAfterCount: FieldValue.increment(1),
            ...(isUnique ? { uniqueOrderers: FieldValue.increment(1), orderedUids: FieldValue.arrayUnion(userId) } : {}),
          }).catch(() => {});

          console.log(`Order after push: user ${userId}, pushLog ${ud.lastPushId}, unique: ${isUnique}, orders: +1`);
        } else {
          console.log(`Order NOT after push: user ${userId}, pushTime ${ud.lastPushSentAt}, diff: ${((Date.now() - new Date(ud.lastPushSentAt).getTime()) / 3600000).toFixed(1)}h`);
        }
      } else {
        console.log(`No lastPushId for user ${userId}`);
      }
    }
  }
});

/* ═══ 2. ON ORDER STATUS CHANGE — push + bonus ═══ */
exports.onOrderReady = onDocumentUpdated("orders/{orderId}", async (event) => {
  const before = event.data?.before?.data();
  const after = event.data?.after?.data();
  if (!before || !after) return;
  if (before.status === after.status) return;

  const orderId = event.params.orderId;
  const userId = after.userId;
  const clientName = after.name || "Клиент";

  console.log(`Order ${orderId}: ${before.status} → ${after.status} (user: ${userId}, name: ${clientName})`);

  /* ── accepted → push client ── */
  if (after.status === "accepted") {
    if (userId && userId !== "anonymous") {
      const mins = after.estimatedMinutes ? ` (~${after.estimatedMinutes} мин)` : "";
      await sendPush(userId, "Ваш кофе готовится! ☕", `Бариста принял заказ${mins}`, {
        type: "order_ready", orderId,
      });
    }
  }

  /* ── ready → bonus + push client ── */
  if (after.status === "ready") {
    // Barista bonus (+5₸) только если не бесплатный И ещё не начислялся
    // (защита от повторного срабатывания при ready→pending→ready)
    if (!after.isFreeByLoyalty && !after.bonusAwardedAt) {
      const baristaId = after.baristaid;
      if (baristaId) {
        const bonusRef = db.collection("barista_bonuses").doc(baristaId);
        const orderRef = event.data.after.ref;
        await db.runTransaction(async (tx) => {
          // Проверяем флаг на самом order (атомарно)
          const orderSnap = await tx.get(orderRef);
          if (orderSnap.exists && orderSnap.data().bonusAwardedAt) return;

          const bonusSnap = await tx.get(bonusRef);
          if (bonusSnap.exists) {
            const history = bonusSnap.data().history || [];
            if (history.some((h) => h.orderId === orderId)) {
              // Бэкап-проверка: уже в истории — только проставляем флаг
              tx.update(orderRef, { bonusAwardedAt: new Date().toISOString() });
              return;
            }
            tx.update(bonusRef, {
              totalBonus: FieldValue.increment(5),
              pendingPayout: FieldValue.increment(5),
              history: FieldValue.arrayUnion({ orderId, amount: 5, date: new Date().toISOString() }),
            });
          } else {
            tx.set(bonusRef, {
              totalBonus: 5, pendingPayout: 5,
              history: [{ orderId, amount: 5, date: new Date().toISOString() }],
            });
          }
          tx.update(orderRef, {
            baristaBonus: 5,
            bonusAwardedAt: new Date().toISOString(),
          });
        });
      }
    }

    if (userId && userId !== "anonymous") {
      await sendPush(userId, "Твой кофе готов! 🎉", "Забирай у стойки", {
        type: "order_ready", orderId,
      });
    }

    // Push baristas that order is ready for pickup
    const tokens = await getBaristaTokens();
    await sendPushMulti(tokens, "Заказ готов к выдаче", `${clientName} — можно выдавать`);
  }

  /* ── cancelled → refund депозита (если списывали) + push клиенту ── */
  if (after.status === "cancelled" && before.status !== "cancelled") {
    // Возврат депозита, если он был списан в onOrderCreate
    if (after.depositDeductedAt && !after.depositRefundedAt
        && after.total > 0 && userId && userId !== "anonymous") {
      const depRef = db.collection("deposits").doc(userId);
      const orderRef = event.data.after.ref;
      await db.runTransaction(async (tx) => {
        const orderSnap = await tx.get(orderRef);
        if (orderSnap.exists && orderSnap.data().depositRefundedAt) return;
        const depSnap = await tx.get(depRef);
        if (!depSnap.exists) return;
        const existing = depSnap.data().history || [];
        const newHistory = [
          ...existing,
          {
            type: "refund",
            amount: after.total,
            date: new Date().toISOString(),
            orderId,
            reason: after.cancelReason || "cancelled",
          },
        ].slice(-100);
        tx.update(depRef, {
          balance: (depSnap.data().balance || 0) + after.total,
          totalSpent: Math.max(0, (depSnap.data().totalSpent || 0) - after.total),
          history: newHistory,
        });
        tx.update(orderRef, { depositRefundedAt: new Date().toISOString() });
      });
      console.log(`Refunded ${after.total}₸ to ${userId} for cancelled order ${orderId}`);
    }

    if (userId && userId !== "anonymous") {
      const reason = after.cancelReason || "Нет в наличии";
      const refundNote = after.depositDeductedAt && after.total > 0
        ? ` Депозит возвращён: +${after.total}₸`
        : "";
      await sendPush(userId, "Заказ отменён 😔", `${reason}${refundNote}`, {
        type: "order_cancelled", orderId,
      });
    }
  }

  /* ── paid → push barista confirmation ── */
  if (after.status === "paid") {
    const baristaId = after.baristaid;
    if (baristaId) {
      await sendPush(baristaId, "Заказ завершён ✅", `${clientName} — оплачен`);
    }
  }
});

/* ═══ 3. DEPOSIT TOPUP — callable by barista/ceo ═══ */
exports.onDepositTopup = onCall(async (request) => {
  const { uid: callerUid } = request.auth || {};
  if (!callerUid) throw new HttpsError("unauthenticated", "Not authenticated");

  // Check role via Custom Claims
  const callerRole = request.auth.token.role;
  if (callerRole !== "barista" && callerRole !== "ceo") {
    throw new HttpsError("permission-denied", "Only barista/ceo");
  }

  const { targetUid, amount } = request.data;
  if (typeof amount !== "number" || !targetUid || amount <= 0) {
    throw new HttpsError("invalid-argument", "Bad args");
  }
  // Sanity cap: одно пополнение ≤ 500 000₸ (защита от опечатки в админке)
  if (amount > 500000) throw new HttpsError("invalid-argument", "Сумма слишком большая");

  const depRef = db.collection("deposits").doc(targetUid);
  await db.runTransaction(async (tx) => {
    const depSnap = await tx.get(depRef);
    const entry = { type: "topup", amount, date: new Date().toISOString(), baristaid: callerUid };
    if (depSnap.exists) {
      const existing = depSnap.data().history || [];
      tx.update(depRef, {
        balance: FieldValue.increment(amount),
        totalTopup: FieldValue.increment(amount),
        lastTopupAt: new Date().toISOString(),
        history: [...existing, entry].slice(-100),
      });
    } else {
      tx.set(depRef, {
        balance: amount, totalTopup: amount, totalSpent: 0,
        lastTopupAt: new Date().toISOString(),
        history: [entry],
      });
    }
  });

  // Push to client
  await sendPush(targetUid, "Депозит пополнен!", `+${amount}₸ 🎉`, { type: "deposit" });

  return { success: true };
});

/* ═══ 4. STREAK CHECK — daily at 17:00 UTC+5 (12:00 UTC) ═══ */
exports.scheduledStreakCheck = onSchedule("every day 12:00", async () => {
  const today = getAlmatyDate();
  const yesterday = getAlmatyDate(new Date(Date.now() - 86400000));
  const usersSnap = await db.collection("users").where("role", "==", "client").get();

  const batch = db.batch();
  let pushCount = 0;

  for (const userDoc of usersSnap.docs) {
    const data = userDoc.data();

    // Reset streak if lastOrderDate is older than yesterday
    if (data.lastOrderDate && data.lastOrderDate < yesterday && (data.streak || 0) > 0) {
      batch.update(userDoc.ref, { streak: 0 });
    }

    // Send reminder if they haven't ordered today and have a streak to lose
    if (data.lastOrderDate !== today && (data.streak || 0) > 0) {
      await sendPush(userDoc.id, "Стрик под угрозой! 🔥", "Зайди за кофе чтобы сохранить стрик");
      pushCount++;
    }
  }

  await batch.commit();
  console.log(`Streak check: sent ${pushCount} reminders`);
});

/* ═══ 5. ON CAFE OPEN — push all clients ═══ */
exports.onCafeOpen = onDocumentUpdated("cafe_status/aksay_main", async (event) => {
  const before = event.data?.before?.data();
  const after = event.data?.after?.data();
  if (!before || !after) return;

  // Only trigger when isOpen changes from false to true
  if (before.isOpen === true || after.isOpen !== true) return;

  const clientsSnap = await db.collection("users").where("role", "==", "client").get();
  const tokens = [];
  for (const d of clientsSnap.docs) {
    const tokenSnap = await db.collection("push_tokens").doc(d.id).get();
    if (tokenSnap.exists && tokenSnap.data().token) tokens.push(tokenSnap.data().token);
  }

  await sendPushMulti(tokens, "Кофейня открыта! ☕", "Love is Coffee ждёт тебя. Заходи за кофе!", {
    type: "cafe_open",
  });
});

/* ═══ 6. MANUAL PUSH — CEO only, with monitoring ═══ */
exports.sendManualPush = onCall(async (request) => {
  const callerUid = request.auth?.uid;
  if (!callerUid) throw new HttpsError("unauthenticated", "Not authenticated");
  if (request.auth.token.role !== "ceo") throw new HttpsError("permission-denied", "CEO only");

  const { tokens, title, body, segment } = request.data;
  if (!tokens || !Array.isArray(tokens) || !title || !body) {
    throw new HttpsError("invalid-argument", "tokens, title, body required");
  }

  // Create push log first to get ID
  const logRef = await db.collection("push_log").add({
    sentBy: callerUid,
    sentAt: new Date().toISOString(),
    title,
    body,
    segment: segment || "manual",
    recipientCount: tokens.length,
    deliveredCount: 0,
    openedCount: 0,
    ordersAfterCount: 0,
    uniqueOrderers: 0,
    orderedUids: [],
    deadTokensFound: 0,
  });
  const pushLogId = logRef.id;

  let totalDelivered = 0;
  let totalDead = 0;

  // Process in chunks of 500
  for (let i = 0; i < tokens.length; i += 500) {
    const chunk = tokens.slice(i, i + 500);
    try {
      const response = await getMessaging().sendEachForMulticast({
        tokens: chunk,
        notification: { title, body },
        data: { pushLogId },
        webpush: {
          notification: { icon: "/icon-192.png", badge: "/icon-192.png" },
          fcmOptions: { link: "/?pushId=" + pushLogId },
        },
      });

      // Process responses
      for (let j = 0; j < response.responses.length; j++) {
        const r = response.responses[j];
        if (r.success) {
          totalDelivered++;
        } else if (r.error) {
          const code = r.error.code;
          if (code === "messaging/registration-token-not-registered" || code === "messaging/invalid-registration-token") {
            totalDead++;
            // Clean dead token
            const deadToken = chunk[j];
            const tokenSnap = await db.collection("push_tokens").where("token", "==", deadToken).get();
            for (const td of tokenSnap.docs) {
              await td.ref.delete();
            }
          }
        }
      }
    } catch (err) {
      console.error("Multicast error:", err);
    }
  }

  // Update log with results
  await logRef.update({ deliveredCount: totalDelivered, deadTokensFound: totalDead });

  // Update each recipient's lastPush — use push_tokens doc IDs (uid = doc ID)
  const pushTokensSnap = await db.collection("push_tokens").get();
  const tokenToUid = new Map();
  for (const d of pushTokensSnap.docs) {
    if (d.data().token) tokenToUid.set(d.data().token, d.id);
  }

  const batch = db.batch();
  let batchCount = 0;
  const updatedUids = new Set();
  for (const token of tokens) {
    const uid = tokenToUid.get(token);
    if (uid && !updatedUids.has(uid)) {
      updatedUids.add(uid);
      batch.update(db.collection("users").doc(uid), {
        lastPushSentAt: new Date().toISOString(),
        lastPushId: pushLogId,
      });
      batchCount++;
      if (batchCount >= 499) break;
    }
  }
  if (batchCount > 0) {
    await batch.commit();
    console.log(`sendManualPush: updated lastPushId for ${batchCount} users`);
  }

  return { pushLogId, deliveredCount: totalDelivered, deadTokensFound: totalDead };
});

/* ═══ 7. MIGRATE STOP LIST — one-time callable ═══ */
exports.migrateStopList = onCall(async (request) => {
  const callerUid = request.auth?.uid;
  if (!callerUid) throw new HttpsError("unauthenticated", "Not authenticated");
  if (request.auth.token.role !== "barista" && request.auth.token.role !== "ceo") {
    throw new HttpsError("permission-denied", "Only barista/ceo");
  }

  const ref = db.collection("cafe_status").doc("aksay_main");
  const snap = await ref.get();
  if (!snap.exists) {
    await ref.set({ isOpen: true, stopList: { items: [], modifiers: [] } });
    return { migrated: true, from: "empty" };
  }

  const data = snap.data();
  const sl = data.stopList;

  // Already migrated
  if (sl && typeof sl === "object" && !Array.isArray(sl)) {
    return { migrated: false, reason: "already_object" };
  }

  // Migrate from array to object
  const items = Array.isArray(sl) ? sl : [];
  await ref.update({
    stopList: { items, modifiers: [] },
  });

  return { migrated: true, itemsCount: items.length };
});

/* ═══ 8. TRACK PUSH OPENED ═══ */
exports.trackPushOpened = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Not authenticated");

  const { pushLogId } = request.data;
  if (!pushLogId) throw new HttpsError("invalid-argument", "pushLogId required");

  console.log(`trackPushOpened: user ${uid}, pushLogId ${pushLogId}`);

  const logRef = db.collection("push_log").doc(pushLogId);
  const logSnap = await logRef.get();
  if (!logSnap.exists) {
    console.log(`trackPushOpened: push_log ${pushLogId} not found`);
    return { ok: false };
  }

  await logRef.update({ openedCount: FieldValue.increment(1) });
  console.log(`trackPushOpened: incremented openedCount for ${pushLogId}`);
  return { ok: true };
});
