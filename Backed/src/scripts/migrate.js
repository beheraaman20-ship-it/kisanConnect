import { getDb, closeDb } from '../config/db.js';

getDb();
console.log('SQLite schema is up to date.');
console.log('For production PostgreSQL, apply migrations/*.sql on your database server.');
closeDb();