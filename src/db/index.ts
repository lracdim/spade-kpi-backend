import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
    console.warn('[db]: DATABASE_URL is not defined in environment variables.');
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

export const db = drizzle(pool, { schema });
export default pool;
