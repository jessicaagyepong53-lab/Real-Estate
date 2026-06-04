import 'dotenv/config';
import mongoose from 'mongoose';
import Block from './models/Block.js';

await mongoose.connect(process.env.MONGO_URI);
const blocks = await Block.find();
const today = new Date();
let totalMonthly = 0;
for (const b of blocks) {
  console.log('\nBLOCK:', b.name);
  for (const u of b.units) {
    console.log(`  Unit: ${u.name} | unitRent: ${u.monthlyRent}`);
    for (const t of u.tenants) {
      const expired = t.leaseEnd && new Date(t.leaseEnd) < today;
      const effStatus = t.leaseStatus === 'active' && expired ? 'EXPIRED' : t.leaseStatus;
      const counted = t.leaseStatus === 'active' && !expired;
      if (counted) totalMonthly += (t.monthlyRent || u.monthlyRent || 0);
      console.log(`    Tenant: ${t.name} | status: ${t.leaseStatus} | effStatus: ${effStatus} | leaseEnd: ${t.leaseEnd || 'none'} | tenantRent: ${t.monthlyRent} | counted: ${counted}`);
    }
  }
}
console.log('\nTotal Monthly Revenue (active, not expired):', totalMonthly);
await mongoose.disconnect();
