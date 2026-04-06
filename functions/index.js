const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

initializeApp();
const db = getFirestore();

/* ═══ ON ORDER CREATE — set pending + push to baristas ═══ */
exports.onOrderCreate = onDocumentCreated("orders/{orderId}", async (event) => {
  const data = event.data?.data();
  if (!data) return;
  const orderId = event.params.orderId;

  // Auto-transition new → pending
  await event.data.ref.update({ status: "pending" });

  // Push to all baristas
  const baristasSnap = await db.collection("users").where("role", "in", ["barista", "ceo"]).get();
  const tokens = [];
  for (const d of baristasSnap.docs) {
    const tokenSnap = await db.collection("push_tokens").doc(d.id).get();
    if (tokenSnap.exists && tokenSnap.data().token) tokens.push(tokenSnap.data().token);
  }

  if (tokens.length > 0) {
    const itemNames = (data.items || []).map((i) => i.name).join(", ");
    await getMessaging().sendEachForMulticast({
      tokens,
      notification: {
        title: "Новый заказ!",
        body: `${itemNames} от ${data.name || "Клиент"}`,
      },
    }).catch(() => {});
  }
});

/* ═══ ON ORDER READY — bonus + loyalty ═══ */
exports.onOrderReady = onDocumentUpdated("orders/{orderId}", async (event) => {
  const before = event.data?.before?.data();
  const after = event.data?.after?.data();
  if (!before || !after) return;
  if (before.status === after.status) return;

  const orderId = event.params.orderId;

  // ready → push to client + bonus + loyalty
  if (after.status === "ready") {
    // Barista bonus (+5₸) only if not free
    if (!after.isFreeByLoyalty) {
      const baristaId = after.baristaid;
      if (baristaId) {
        const bonusRef = db.collection("barista_bonuses").doc(baristaId);
        const bonusSnap = await bonusRef.get();
        const history = bonusSnap.exists ? (bonusSnap.data().history || []) : [];
        if (!history.some((h) => h.orderId === orderId)) {
          if (bonusSnap.exists) {
            await bonusRef.update({
              totalBonus: FieldValue.increment(5),
              pendingPayout: FieldValue.increment(5),
              history: FieldValue.arrayUnion({ orderId, amount: 5, date: new Date().toISOString() }),
            });
          } else {
            await bonusRef.set({
              totalBonus: 5, pendingPayout: 5,
              history: [{ orderId, amount: 5, date: new Date().toISOString() }],
            });
          }
          await event.data.after.ref.update({ baristaBonus: 5 });
        }
      }
    }

    // Update loyalty count
    const userId = after.userId;
    if (userId && userId !== "anonymous") {
      const userRef = db.collection("users").doc(userId);
      const userSnap = await userRef.get();
      if (userSnap.exists) {
        let lc = (userSnap.data().loyaltyCount || 0) + 1;
        if (lc > 8) lc = 8;
        await userRef.update({ loyaltyCount: lc });
      }
    }

    // Push to client
    if (userId && userId !== "anonymous") {
      const tokenSnap = await db.collection("push_tokens").doc(userId).get();
      if (tokenSnap.exists && tokenSnap.data().token) {
        await getMessaging().send({
          token: tokenSnap.data().token,
          notification: {
            title: "Твой кофе готов!",
            body: `Забирай у стойки ☕`,
          },
        }).catch(() => {});
      }
    }
  }
});

/* ═══ DEPOSIT TOPUP — callable by barista/ceo ═══ */
exports.onDepositTopup = onCall(async (request) => {
  const { uid: callerUid } = request.auth || {};
  if (!callerUid) throw new HttpsError("unauthenticated", "Not authenticated");

  // Check role
  const callerSnap = await db.collection("users").doc(callerUid).get();
  const role = callerSnap.exists ? callerSnap.data().role : null;
  if (role !== "barista" && role !== "ceo") throw new HttpsError("permission-denied", "Only barista/ceo");

  const { targetUid, amount } = request.data;
  if (!targetUid || !amount || amount <= 0) throw new HttpsError("invalid-argument", "Bad args");

  const depRef = db.collection("deposits").doc(targetUid);
  const depSnap = await depRef.get();

  if (depSnap.exists) {
    await depRef.update({
      balance: FieldValue.increment(amount),
      totalTopup: FieldValue.increment(amount),
      lastTopupAt: new Date().toISOString(),
      history: FieldValue.arrayUnion({
        type: "topup", amount, date: new Date().toISOString(), baristaid: callerUid,
      }),
    });
  } else {
    await depRef.set({
      balance: amount, totalTopup: amount, totalSpent: 0,
      lastTopupAt: new Date().toISOString(),
      history: [{ type: "topup", amount, date: new Date().toISOString(), baristaid: callerUid }],
    });
  }

  // Push to client
  const tokenSnap = await db.collection("push_tokens").doc(targetUid).get();
  if (tokenSnap.exists && tokenSnap.data().token) {
    await getMessaging().send({
      token: tokenSnap.data().token,
      notification: { title: "Депозит пополнен!", body: `+${amount}₸ 🎉` },
    }).catch(() => {});
  }

  return { success: true };
});

/* ═══ STREAK REMINDER — daily at 17:00 UTC+5 (12:00 UTC) ═══ */
exports.streakReminder = onSchedule("every day 12:00", async () => {
  const today = new Date().toLocaleString("sv", { timeZone: "Asia/Almaty" }).split(" ")[0];
  const usersSnap = await db.collection("users").where("role", "==", "client").get();

  let pushCount = 0;
  for (const userDoc of usersSnap.docs) {
    const data = userDoc.data();
    if (data.lastOrderDate === today) continue; // already ordered today
    if ((data.streak || 0) <= 0) continue; // no streak to lose

    const tokenSnap = await db.collection("push_tokens").doc(userDoc.id).get();
    if (!tokenSnap.exists || !tokenSnap.data().token) continue;

    await getMessaging().send({
      token: tokenSnap.data().token,
      notification: {
        title: "Стрик под угрозой! 🔥",
        body: "Зайди за кофе чтобы сохранить стрик",
      },
    }).catch(() => {});
    pushCount++;
  }

  console.log(`Sent ${pushCount} streak reminders`);
});
