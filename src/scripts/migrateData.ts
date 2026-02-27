import mysql from 'mysql2/promise';
import { db } from '../db';
import { users, guards, evaluations } from '../db/schema';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function migrate() {
    console.log('🚀 Starting data migration from MySQL to PostgreSQL...');
    console.log(`Connecting to MySQL: ${process.env.MYSQL_HOST} as ${process.env.MYSQL_USER}`);
    console.log(`Connecting to PostgreSQL: ${process.env.DB_HOST}:${process.env.DB_PORT}`);

    let mysqlConn;

    try {
        const mysqlConfig = {
            host: process.env.MYSQL_HOST,
            port: parseInt(process.env.MYSQL_PORT || '3306'),
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_NAME,
        };

        mysqlConn = await mysql.createConnection(mysqlConfig);
        console.log('✅ Connected to MySQL');

        // Test PostgreSQL connection
        console.log('--- Testing PostgreSQL Connection ---');
        await db.select().from(users).limit(1);
        console.log('✅ Connected to PostgreSQL');

        // 1. Migrate Users
        console.log('--- Migrating Users ---');
        const [mysqlUsers]: any = await mysqlConn.query('SELECT * FROM users');
        for (const user of mysqlUsers) {
            console.log(`Migrating user: ${user.email}`);
            const hashedPassword = await bcrypt.hash(user.password, 10);

            await db.insert(users).values({
                id: user.id,
                userid: user.userid,
                name: user.name,
                email: user.email,
                password: hashedPassword,
                role: user.role === 'admin' ? 'admin' : 'user',
                createdAt: user.created_at ? new Date(user.created_at) : new Date(),
                updatedAt: user.updated_at ? new Date(user.updated_at) : new Date(),
            }).onConflictDoUpdate({
                target: users.id,
                set: {
                    userid: user.userid,
                    name: user.name,
                    email: user.email,
                    password: hashedPassword,
                    role: user.role === 'admin' ? 'admin' : 'user',
                    updatedAt: user.updated_at ? new Date(user.updated_at) : new Date(),
                }
            });
        }

        // 2. Migrate Guards
        console.log('--- Migrating Guards ---');
        const [mysqlGuards]: any = await mysqlConn.query('SELECT * FROM guards');
        for (const guard of mysqlGuards) {
            console.log(`Migrating guard: ${guard.name} (${guard.guard_id})`);
            await db.insert(guards).values({
                id: guard.id,
                guardId: guard.guard_id,
                name: guard.name,
                createdAt: guard.created_at ? new Date(guard.created_at) : new Date(),
                updatedAt: guard.updated_at ? new Date(guard.updated_at) : new Date(),
            }).onConflictDoUpdate({
                target: guards.id,
                set: {
                    guardId: guard.guard_id,
                    name: guard.name,
                    updatedAt: guard.updated_at ? new Date(guard.updated_at) : new Date(),
                }
            });
        }

        // 3. Migrate Evaluations
        console.log('--- Migrating Evaluations ---');
        const [mysqlEvals]: any = await mysqlConn.query('SELECT * FROM evaluations');
        for (const eval_ of mysqlEvals) {
            console.log(`Migrating evaluation for guard ${eval_.guard_id} by ${eval_.evaluated_by}`);

            let kpiScores = {};
            try {
                kpiScores = typeof eval_.kpi_scores === 'string' ? JSON.parse(eval_.kpi_scores) : (eval_.kpi_scores || {});
            } catch (e) {
                console.error(`Failed to parse kpi_scores for eval ID ${eval_.id}`);
            }

            await db.insert(evaluations).values({
                id: eval_.id,
                clientId: eval_.client_id,
                guardId: eval_.guard_id,
                kpiScores: kpiScores,
                totalScore: eval_.total_score?.toString() || '0',
                editableUntil: eval_.editable_until ? new Date(eval_.editable_until) : null,
                remarks: eval_.remarks,
                evaluatedBy: eval_.evaluated_by,
                createdAt: eval_.created_at ? new Date(eval_.created_at) : new Date(),
                updatedAt: eval_.updated_at ? new Date(eval_.updated_at) : new Date(),
            }).onConflictDoUpdate({
                target: evaluations.id,
                set: {
                    clientId: eval_.client_id,
                    guardId: eval_.guard_id,
                    kpiScores: kpiScores,
                    totalScore: eval_.total_score?.toString() || '0',
                    editableUntil: eval_.editable_until ? new Date(eval_.editable_until) : null,
                    remarks: eval_.remarks,
                    evaluatedBy: eval_.evaluated_by,
                    updatedAt: eval_.updated_at ? new Date(eval_.updated_at) : new Date(),
                }
            });
        }

        console.log('✅ Migration COMPLETED successfully!');
    } catch (error: any) {
        console.error('❌ Migration FAILED!');
        console.error('Error Message:', error.message);
        if (error.code) console.error('Error Code:', error.code);
        if (error.detail) console.error('Error Detail:', error.detail);
        if (error.table) console.error('Failing Table:', error.table);
        console.error('Stack Trace:', error.stack);
        process.exit(1);
    } finally {
        if (mysqlConn) await mysqlConn.end();
        process.exit(0);
    }
}

migrate();
