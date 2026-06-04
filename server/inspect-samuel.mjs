import 'dotenv/config';
import mongoose from 'mongoose';
import Block from './models/Block.js';

await mongoose.connect(process.env.MONGO_URI);
const blocks = await Block.find();
for (const b of blocks) {
  for (const u of b.units) {
    for (const t of u.tenants) {
      if (/samuel/i.test(t.name)) {
        console.log(JSON.stringify(t, null, 2));
      }
    }
  }
}
await mongoose.disconnect();
