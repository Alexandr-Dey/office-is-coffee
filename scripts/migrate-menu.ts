/**
 * Миграция меню из MENU-DATA.json в Firestore коллекцию menu_items.
 * Требует service-account.json в корне проекта.
 *
 * Запуск: npx tsx scripts/migrate-menu.ts
 *
 * TODO: Скачать service-account.json из Firebase Console ->
 *       Project Settings -> Service accounts -> Generate new private key
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import menuData from "../MENU-DATA.json";

initializeApp({
  credential: cert(require("../service-account.json")),
});

const db = getFirestore();

async function migrate() {
  const batch = db.batch();

  for (const item of menuData) {
    const ref = db.collection("menu_items").doc(item.id);
    batch.set(ref, {
      ...item,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  await batch.commit();
  console.log(`Migrated ${menuData.length} menu items`);
}

migrate().catch(console.error);
