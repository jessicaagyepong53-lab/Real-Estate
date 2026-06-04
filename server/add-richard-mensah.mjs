/**
 * One-time script: Add MR. Richard Mensah to Unit 4 / Room 3
 * Lease details extracted from signed Tenancy Agreement (1st April 2025).
 *
 * Run: node server/add-richard-mensah.mjs
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import Block from './models/Block.js';

await mongoose.connect(process.env.MONGO_URI);
console.log('Connected to MongoDB');

// ── Find the block that has a unit named "Unit 4" (or "Block A" etc.)
// List all blocks so we can confirm the right one
const blocks = await Block.find({}, 'name units.name units.tenants.name');
console.log('\nBlocks in DB:');
for (const b of blocks) {
  console.log(`  Block: ${b.name}`);
  for (const u of b.units) {
    const tenants = u.tenants.map(t => t.name).join(', ') || '(empty)';
    console.log(`    Unit: "${u.name}" — tenants: ${tenants}`);
  }
}

// ── Locate "Unit 4" / "Room 3" (adjust match logic if names differ)
let targetBlock = null;
let targetUnit  = null;

for (const b of await Block.find()) {
  for (const u of b.units) {
    // Match "Unit 4", "unit 4", "UNIT 4", or any unit whose name contains "4"
    // AND check we're looking at room/unit 3 within it — adjust if your naming differs
    if (/unit\s*4/i.test(u.name) || /room\s*3/i.test(u.name) || u.name === 'Room 3' || u.name === 'Unit 4') {
      targetBlock = b;
      targetUnit  = u;
      break;
    }
  }
  if (targetBlock) break;
}

if (!targetUnit) {
  console.error('\n❌ Could not find Unit 4 / Room 3. Check the block names printed above and adjust the script.');
  process.exit(1);
}

console.log(`\n✅ Found unit "${targetUnit.name}" in block "${targetBlock.name}"`);

// ── Check if Richard Mensah already exists
const already = targetUnit.tenants.find(t => /richard/i.test(t.name) && /mensah/i.test(t.name));
if (already) {
  console.log('⚠️  MR. Richard Mensah already exists in this unit — aborting to avoid duplicates.');
  await mongoose.disconnect();
  process.exit(0);
}

// ── Add tenant
targetUnit.tenants.push({
  name:          'Mr. Richard Mensah',
  leaseStatus:   'active',
  leaseStart:    '2025-04-01',
  leaseEnd:      '2026-03-31',
  moveInDate:    '2025-04-01',
  depositPaid:   true,
  depositAmount: 2000,
  notes:         'Tenancy Agreement signed 26/07/25. Rent GHS 2,000/month. Advance: GHS 24,000 (12 months). No pets. Ghana card required.',
  documents:     [],
});

await targetBlock.save();
console.log('✅ Mr. Richard Mensah added successfully.');
console.log('   ➜ Now upload the signed Tenancy Agreement PDF through the app UI under his Documents tab.');

await mongoose.disconnect();
