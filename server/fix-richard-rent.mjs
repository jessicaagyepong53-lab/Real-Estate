import 'dotenv/config';
import mongoose from 'mongoose';
import Block from './models/Block.js';

await mongoose.connect(process.env.MONGO_URI);

const block = await Block.findOne({ name: 'Block A' });
const unit = block.units.find(u => u.name === 'Room 3');
const tenant = unit.tenants.find(t => /richard/i.test(t.name));

console.log('BEFORE:', {
  monthlyRent:   tenant.monthlyRent,
  advanceMonths: tenant.advanceMonths,
  advanceAmount: tenant.advanceAmount,
  depositAmount: tenant.depositAmount,
  depositPaid:   tenant.depositPaid,
});

unit.monthlyRent       = 2000;
tenant.monthlyRent     = 2000;
tenant.advanceMonths   = 12;
tenant.advanceAmount   = 24000;  // 12 × 2,000
tenant.depositPaid     = true;
tenant.depositAmount   = 2000;   // 1 month security deposit

await block.save();
console.log('AFTER:', {
  monthlyRent:   tenant.monthlyRent,
  advanceMonths: tenant.advanceMonths,
  advanceAmount: tenant.advanceAmount,
  depositAmount: tenant.depositAmount,
});
await mongoose.disconnect();

