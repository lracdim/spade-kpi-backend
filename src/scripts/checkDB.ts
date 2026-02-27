import { db } from '../db';
import { sql } from 'drizzle-orm';

async function check() {
    try {
        console.log('--- Checking PostgreSQL Tables ---');
        const tables = await db.execute(sql`SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public';`);
        console.log('Tables in public schema:');
        tables.rows.forEach(row => console.log(` - ${row.tablename}`));

        if (tables.rows.length === 0) {
            console.log('⚠️ No tables found! The schema might not be initialized.');
        }

    } catch (e: any) {
        console.error('❌ Connection or Query failed:');
        console.error(e.message);
    } finally {
        process.exit(0);
    }
}

check();
