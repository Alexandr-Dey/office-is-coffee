/**
 * Назначение ролей через Custom Claims + Firestore.
 * Требует service-account.json в корне проекта.
 *
 * Запуск: npx tsx scripts/set-roles.ts
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

initializeApp({
  credential: cert(require("../service-account.json")),
});

const db = getFirestore();

const ROLES: Record<string, { role: string; baristaCharacter?: string }> = {
  "alex.d.workt@gmail.com": { role: "ceo" },
  "dey.alex.ex@gmail.com": { role: "barista" },
  "Aslan.mussilim0018@inbox.ru": { role: "barista", baristaCharacter: "aslan" },
  "Vladislavryakin1985@gmail.com": { role: "barista" },
  "alolha18@gmail.com": { role: "barista", baristaCharacter: "vitaliy" },
};

async function setRoles() {
  for (const [email, config] of Object.entries(ROLES)) {
    try {
      const user = await getAuth().getUserByEmail(email);

      // Set Custom Claims
      await getAuth().setCustomUserClaims(user.uid, { role: config.role });

      // Update Firestore user doc
      const updates: Record<string, unknown> = { role: config.role };
      if (config.baristaCharacter) {
        updates.baristaCharacter = config.baristaCharacter;
      }
      await db.collection("users").doc(user.uid).update(updates).catch(async () => {
        // Doc might not exist yet — create it
        await db.collection("users").doc(user.uid).set({
          displayName: user.displayName ?? email.split("@")[0],
          email,
          role: config.role,
          baristaCharacter: config.baristaCharacter ?? null,
          loyaltyCount: 0,
          streak: 0,
          lastOrderDate: null,
          pushToken: null,
          geolocationAllowed: false,
          favoriteItem: null,
          onboardingDone: false,
          createdAt: new Date().toISOString(),
        });
      });

      console.log(`✅ ${email} → ${config.role}${config.baristaCharacter ? ` (character: ${config.baristaCharacter})` : ""} (uid: ${user.uid})`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("user-not-found")) {
        console.log(`⏳ ${email} → ещё не зарегистрирован, пропускаю`);
      } else {
        console.error(`❌ ${email}:`, msg);
      }
    }
  }
  console.log("\nDone. Незарегистрированные пользователи должны сначала войти в приложение.");
}

setRoles().catch(console.error);
