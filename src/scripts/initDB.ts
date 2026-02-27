import { db } from '../db';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

async function init() {
    try {
        console.log('--- Initializing PostgreSQL Schema ---');
        // Path to the schema file (relative to project root/src/scripts)
        const schemaPath = path.resolve(__dirname, '../../../backend/postgres_schema.sql');
        console.log(`Reading schema from: ${schemaPath}`);

        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        // Split by semicolon but be careful with functions/triggers
        // Actually, drizzle.execute can take a raw string but pg doesn't support multiple statements in one execute easily if they return results.
        // But for DDL it usually works.

        await db.execute(sql.raw(schemaSql));
        console.log('✅ Schema initialized successfully!');

    } catch (e: any) {
        console.error('❌ Schema initialization failed:');
        console.error(e.message);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

init();
