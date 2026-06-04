/**
 * One-time fix: Set Samuel's advanceAmount to 20,000
 * (was incorrectly stored as 30,000; balanceOwed of 12,500 stays unchanged)
 *
 * Run: node server/fix-samuel-advance.mjs
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import Block from './models/Block.js';

await mongoose.connect(process.env.MONGO_URI);
console.log('Connected to MongoDB');

let found = false;

const blocks = await Block.find();
for (const block of blocks) {
  let changed = false;
  for (const unit of block.units) {
    for (const tenant of unit.tenants) {
      if (/samuel/i.test(tenant.name)) {
        console.log(`\nFound: "${tenant.name}" in unit "${unit.name}" / block "${block.name}"`);
        console.log(`  advanceAmount before: ${tenant.advanceAmount}`);
        console.log(`  balanceOwed:          ${tenant.balanceOwed}`);
        tenant.advanceAmount = 20000;
        changed = true;
        found = true;
      }
    }
  }
  if (changed) {
    block.markModified('units');
    await block.save();
    console.log('  ✅ advanceAmount updated to 20,000');
  }
}

if (!found) {
  console.error('\n❌ No tenant named Samuel found. Check the name in the database.');
}

await mongoose.disconnect();
console.log('\nDone.');
