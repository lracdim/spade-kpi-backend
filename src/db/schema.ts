import { pgTable, serial, varchar, timestamp, text, pgEnum, decimal, jsonb, index } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['user', 'admin']);

export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    userid: varchar('userid', { length: 50 }).unique(),
    name: varchar('name', { length: 255 }),
    email: varchar('email', { length: 255 }).unique().notNull(),
    password: varchar('password', { length: 255 }).notNull(),
    role: userRoleEnum('role').default('admin'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const guards = pgTable('guards', {
    id: serial('id').primaryKey(),
    guardId: varchar('guard_id', { length: 50 }).unique().notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const evaluations = pgTable('evaluations', {
    id: serial('id').primaryKey(),
    clientId: varchar('client_id', { length: 100 }).notNull(),
    guardId: varchar('guard_id', { length: 50 }).notNull(),
    kpiScores: jsonb('kpi_scores').default({}),
    totalScore: decimal('total_score', { precision: 5, scale: 2 }).default('0'),
    editableUntil: timestamp('editable_until', { withTimezone: true }),
    remarks: text('remarks'),
    evaluatedBy: varchar('evaluated_by', { length: 255 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => {
    return {
        idxGuardId: index('idx_guard_id').on(table.guardId),
        idxClientId: index('idx_client_id').on(table.clientId),
    };
});
