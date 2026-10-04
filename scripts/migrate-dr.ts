/**
 * Migration script:
 * 1. Reads all documents in Firestore 'websites' collection.
 * 2. Extracts DR (from PRESET_WEBSITES dictionary or from notes regex 'DR: XX').
 * 3. Sets the 'dr' field as a number in Firestore.
 * 4. Cleans up the 'notes' field so DR is no longer stored in notes.
 *
 * Run with: npx tsx scripts/migrate-dr.ts
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';
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

// Build lookup map by lowercase name & url
const presetMapByName = new Map<string, number>();
const presetMapByUrl = new Map<string, number>();

for (const p of PRESET_WEBSITES) {
  if (typeof p.dr === 'number') {
    presetMapByName.set(p.name.toLowerCase().trim(), p.dr);
    if (p.url) {
      const cleanUrl = p.url.toLowerCase().trim().replace(/\/+$/, '');
      presetMapByUrl.set(cleanUrl, p.dr);
    }
  }
}

async function migrateDr() {
  console.log('🔄 Starting DR migration for Firestore websites...\n');

  const snapshot = await getDocs(collection(db, 'websites'));
  console.log(`Found ${snapshot.docs.length} websites in Firestore.\n`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const id = docSnap.id;
    const currentName = (data.name || '').trim();
    const currentUrl = (data.url || '').trim().toLowerCase().replace(/\/+$/, '');
    const currentNotes = (data.notes || '').trim();
    const currentDr = data.dr;

    let targetDr: number | undefined = undefined;

    // 1. Try matching from preset map
    if (presetMapByName.has(currentName.toLowerCase())) {
      targetDr = presetMapByName.get(currentName.toLowerCase());
    } else if (presetMapByUrl.has(currentUrl)) {
      targetDr = presetMapByUrl.get(currentUrl);
    }

    // 2. If not found in preset, try parsing from notes "DR: 74" or "DR 74"
    if (targetDr === undefined && currentNotes) {
      const match = currentNotes.match(/DR:?\s*(\d+)/i);
      if (match) {
        targetDr = parseInt(match[1], 10);
      }
    }

    // Determine clean notes (strip "DR: XX" if notes was just that)
    let cleanNotes = currentNotes;
    if (cleanNotes.match(/^DR:?\s*\d+$/i)) {
      cleanNotes = '';
    } else if (cleanNotes.match(/DR:?\s*\d+/i)) {
      cleanNotes = cleanNotes.replace(/DR:?\s*\d+\s*[•,;-]?\s*/gi, '').trim();
    }

    // Check if update is needed
    const needsDrUpdate = typeof targetDr === 'number' && currentDr !== targetDr;
    const needsNotesUpdate = currentNotes !== cleanNotes;

    if (needsDrUpdate || needsNotesUpdate) {
      const updatePayload: Record<string, unknown> = {};
      if (needsDrUpdate && typeof targetDr === 'number') {
        updatePayload.dr = targetDr;
      }
      if (needsNotesUpdate) {
        updatePayload.notes = cleanNotes;
      }

      await updateDoc(doc(db, 'websites', id), updatePayload);
      console.log(`  ✅ Updated [${currentName}]: DR -> ${targetDr ?? currentDr}, Notes -> "${cleanNotes}"`);
      updatedCount++;
    } else {
      skippedCount++;
    }
  }

  console.log('\n─────────────────────────────────────');
  console.log(`✅ Successfully updated: ${updatedCount} websites`);
  console.log(`⏭  Already up to date : ${skippedCount} websites`);
  console.log('🎉 Migration completed successfully!\n');

  process.exit(0);
}

migrateDr().catch((err) => {
  console.error('\n💥 Migration failed:', err);
  process.exit(1);
});
