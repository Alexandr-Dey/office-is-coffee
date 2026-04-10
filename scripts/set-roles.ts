/**
 * Одноразовый скрипт для назначения ролей через Custom Claims.
 * Требует service-account.json в корне проекта.
 *
 * Запуск: npx tsx scripts/set-roles.ts
 *
 * Замени EMAIL_* на реальные email-адреса перед запуском.
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

initializeApp({
  credential: cert(require("../service-account.json")),
});

const ROLES: Record<string, string> = {
  "alex.d.workt@gmail.com": "ceo",
  "dey.alex.ex@gmail.com": "barista",
};

async function setRoles() {
  for (const [email, role] of Object.entries(ROLES)) {
    try {
      const user = await getAuth().getUserByEmail(email);
      await getAuth().setCustomUserClaims(user.uid, { role });
      console.log(`Set role "${role}" for ${email} (uid: ${user.uid})`);
    } catch (err) {
      console.error(`Failed for ${email}:`, err);
    }
  }
  console.log("Done.");
}

setRoles().catch(console.error);
