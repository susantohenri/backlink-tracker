/**
 * Seed script: bulk import websites into Firestore with dedicated DR column.
 * Run once with: npx tsx scripts/seed-websites.ts
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { PRESET_WEBSITES } from '../src/data/presetWebsites';

const firebaseConfig = {
  apiKey: "AIzaSyDRdGf65oWBZvA5LQ1HDxo_d4jYz8xhNEc",
  authDomain: "backlink-tracker-bf7c7.firebaseapp.com",
  projectId: "backlink-tracker-bf7c7",
  storageBucket: "backlink-tracker-bf7c7.firebasestorage.app",
  messagingSenderId: "1021726638369",
  appId: "1:1021726638369:web:f46a64fe9f8a0ec61fbe60"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

async function seedWebsites() {
  console.log(`\n🚀 Starting bulk import of ${PRESET_WEBSITES.length} websites into Firestore...\n`);

  const col = collection(db, 'websites');
  let added = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const site of PRESET_WEBSITES) {
    try {
      // Check if already exists (by name)
      const q = query(col, where('name', '==', site.name));
      const existing = await getDocs(q);

      if (!existing.empty) {
        console.log(`  ⏭  SKIP (already exists): ${site.name}`);
        skipped++;
        continue;
      }

      const now = new Date().toISOString();
      const docData: Record<string, unknown> = {
        name: site.name,
        url: site.url,
        notes: site.notes || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdAtFallback: now,
      };
      if (typeof site.dr === 'number') {
        docData.dr = site.dr;
      }

      await addDoc(col, docData);

      console.log(`  ✅ ADDED: ${site.name} (DR: ${site.dr})`);
      added++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ❌ ERROR: ${site.name} — ${msg}`);
      errors.push(`${site.name}: ${msg}`);
    }
  }

  console.log('\n─────────────────────────────────────');
  console.log(`✅ Added   : ${added}`);
  console.log(`⏭  Skipped : ${skipped} (duplicates)`);
  console.log(`❌ Errors  : ${errors.length}`);
  if (errors.length > 0) {
    console.log('\nError details:');
    errors.forEach(e => console.log(`  • ${e}`));
  }
  console.log('\n🎉 Done!\n');

  process.exit(0);
}

seedWebsites().catch((err) => {
  console.error('\n💥 Fatal error:', err);
  process.exit(1);
});
