import { getDb } from '../config/db.js';
import { seed } from '../config/seed.js';

getDb();
seed();
console.log('Seed complete.');