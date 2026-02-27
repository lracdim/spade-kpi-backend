import { db } from '../db';
import { users, guards, evaluations } from '../db/schema';
import fs from 'fs';
import path from 'path';

async function migrate() {
    try {
        console.log('🚀 Starting data migration from SQL file...');
        const sqlPath = path.resolve(__dirname, '../../../kpi-old-db.sql');
        console.log(`Reading SQL dump from: ${sqlPath}`);

        const sqlContent = fs.readFileSync(sqlPath, 'utf8');

        // Helper to extract values from INSERT INTO `table` (...) VALUES (...);
        const extractValues = (tableName: string) => {
            const regex = new RegExp(`INSERT INTO \`${tableName}\` [^)]*\\) VALUES\\s*([\\s\\S]*?);`, 'i');
            const match = sqlContent.match(regex);
            if (!match) return [];

            // Split by "), (" but be careful of quotes. 
            // Simple split for this specific dump:
            const valuesStr = match[1].trim();
            // This is a naive split, but usually works for simple dumps. 
            // Better: use a proper SQL parser or follow the standard structure.
            // In this dump, it's: (val1, val2, ...), (val1, val2, ...);

            // For this specific dump, we can split by "),("
            const rows = valuesStr.split(/\),\s*\(/g).map(r => r.replace(/^\(/, '').replace(/\)$/, ''));
            return rows;
        };

        // Helper to parse a single CSV line into an array
        const parseRow = (row: string) => {
            const result: string[] = [];
            let current = '';
            let inQuotes = false;
            let escape = false;

            for (let i = 0; i < row.length; i++) {
                const char = row[i];
                if (escape) {
                    current += char;
                    escape = false;
                } else if (char === '\\') {
                    escape = true;
                } else if (char === "'") {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    result.push(current.trim().replace(/^'|'$/g, ''));
                    current = '';
                } else {
                    current += char;
                }
            }
            result.push(current.trim().replace(/^'|'$/g, ''));
            return result;
        };

        // 1. Migrate Users
        console.log('--- Migrating Users ---');
        const userRows = extractValues('users');
        for (const row of userRows) {
            const vals = parseRow(row);
            // cols: id, userid, name, email, password, role, created_at, updated_at
            console.log(`Inserting user: ${vals[3]}`);
            await db.insert(users).values({
                id: parseInt(vals[0]),
                userid: vals[1],
                name: vals[2],
                email: vals[3],
                password: vals[4],
                role: vals[5] === 'admin' ? 'admin' : 'user',
                createdAt: new Date(vals[6]),
                updatedAt: new Date(vals[7])
            }).onConflictDoUpdate({
                target: users.id,
                set: {
                    userid: vals[1],
                    name: vals[2],
                    email: vals[3],
                    password: vals[4],
                    role: vals[5] === 'admin' ? 'admin' : 'user',
                    updatedAt: new Date(vals[7])
                }
            });
        }

        // 2. Migrate Guards
        console.log('--- Migrating Guards ---');
        const guardRows = extractValues('guards');
        for (const row of guardRows) {
            const vals = parseRow(row);
            // cols: id, guard_id, name, created_at, updated_at
            console.log(`Inserting guard: ${vals[2]} (${vals[1]})`);
            await db.insert(guards).values({
                id: parseInt(vals[0]),
                guardId: vals[1],
                name: vals[2],
                createdAt: new Date(vals[3]),
                updatedAt: new Date(vals[4])
            }).onConflictDoUpdate({
                target: guards.id,
                set: {
                    guardId: vals[1],
                    name: vals[2],
                    updatedAt: new Date(vals[4])
                }
            });
        }

        // 3. Migrate Evaluations
        console.log('--- Migrating Evaluations ---');
        const evalRows = extractValues('evaluations');
        for (const row of evalRows) {
            const vals = parseRow(row);
            // cols: id, client_id, guard_id, kpi_scores, total_score, editable_until, remarks, evaluated_by, created_at, updated_at
            console.log(`Inserting evaluation ID: ${vals[0]}`);

            let kpiScores = {};
            try {
                kpiScores = JSON.parse(vals[3].replace(/\\"/g, '"').replace(/\\\\/g, '\\'));
            } catch (e) {
                console.error(`Failed to parse KPI scores for eval ${vals[0]}`);
            }

            await db.insert(evaluations).values({
                id: parseInt(vals[0]),
                clientId: vals[1],
                guardId: vals[2],
                kpiScores: kpiScores,
                totalScore: vals[4],
                editableUntil: vals[5] !== 'NULL' && vals[5] ? new Date(vals[5]) : null,
                remarks: vals[6],
                evaluatedBy: vals[7],
                createdAt: new Date(vals[8]),
                updatedAt: new Date(vals[9])
            }).onConflictDoUpdate({
                target: evaluations.id,
                set: {
                    clientId: vals[1],
                    guardId: vals[2],
                    kpiScores: kpiScores,
                    totalScore: vals[4],
                    editableUntil: vals[5] !== 'NULL' && vals[5] ? new Date(vals[5]) : null,
                    remarks: vals[6],
                    evaluatedBy: vals[7],
                    updatedAt: new Date(vals[9])
                }
            });
        }

        console.log('✅ Data migration COMPLETED successfully!');

    } catch (e: any) {
        console.error('❌ Migration failed:');
        console.error(e.message);
        console.error(e.stack);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

migrate();
