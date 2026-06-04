/**
 * Split Samuel Yeboah Gyimah into two separate tenant entries:
 *   1. "ended" — 2025-2026 (old lease, carries the document and old notes)
 *   2. "active" — 2026-2027 (new lease, clean slate for user to fill in)
 *
 * Run: node server/split-samuel-leases.mjs
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import Block from './models/Block.js';

await mongoose.connect(process.env.MONGO_URI);
console.log('Connected to MongoDB');

let done = false;

const blocks = await Block.find();
for (const block of blocks) {
  for (const unit of block.units) {
    const idx = unit.tenants.findIndex((t) => /samuel/i.test(t.name) && t.leaseStatus === 'active');
    if (idx === -1) continue;

    const current = unit.tenants[idx];
    console.log(`\nFound: "${current.name}" in unit "${unit.name}" / block "${block.name}"`);

    // ── 1. Build the 2025-2026 "ended" entry from leaseHistory[0] ──────────
    const hist = current.leaseHistory?.[0];
    const past2025 = {
      name:           current.name,
      phone:          current.phone,
      address:        current.address,
      email:          current.email || '',
      occupation:     current.occupation || '',
      leaseStatus:    'ended',
      leaseStart:     hist?.leaseStart  || '2025-03-07',
      leaseEnd:       hist?.leaseEnd    || '2026-03-07',
      moveInDate:     '2025-03-07',
      cancelReason:   'Lease completed — renewed for 2026-2027',
      cancelDate:     hist?.leaseEnd    || '2026-03-07',
      depositPaid:    true,
      depositAmount:  hist?.depositAmount ?? 2000,
      monthlyRent:    2000,           // 24,000 / 12 months (from original notes)
      advanceMonths:  12,
      advanceAmount:  24000,
      balanceOwed:    0,
      lastPaymentAmount: 0,
      notes:          current.notes || '',   // existing notes describe this period
      documents:      current.documents || [],
      leaseHistory:   [],
    };

    // ── 2. Update the current "active" entry for 2026-2027 ─────────────────
    current.leaseStart     = '2026-03-07';
    current.leaseEnd       = '2027-03-07';
    current.moveInDate     = '2025-03-07';   // original move-in date preserved
    current.leaseHistory   = [];             // no longer needed — past is its own entry
    current.documents      = [];             // document moved to past entry
    current.notes          = '';             // user can add 2026-2027 notes fresh
    // keep: name, phone, address, monthlyRent (2500), advanceAmount (20000),
    //       advanceMonths (12), balanceOwed (12500), depositAmount (2500)

    // ── 3. Insert the past entry BEFORE the active one so it appears older ──
    unit.tenants.splice(idx, 0, past2025);

    block.markModified('units');
    await block.save();
    console.log('  ✅ 2025-2026 "ended" entry inserted');
    console.log('  ✅ 2026-2027 "active" entry cleaned up');
    done = true;
  }
}

if (!done) {
  console.error('\n❌ Samuel not found or already split. Nothing changed.');
}

await mongoose.disconnect();
console.log('\nDone.');
