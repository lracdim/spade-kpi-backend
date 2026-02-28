import { Request, Response } from 'express';
import { db } from '../db';
import { guards } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

export const getAllGuards = async (req: Request, res: Response) => {
    try {
        const result = await db.select().from(guards).orderBy(desc(guards.createdAt));
        const formatted = result.map(g => ({
            id: g.id,
            name: g.name,
            guard_id: g.guardId,
            created_at: g.createdAt,
            updated_at: g.updatedAt
        }));
        res.json({ success: true, data: formatted });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const getGuardById = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    try {
        const result = await db.select().from(guards).where(eq(guards.id, parseInt(id))).limit(1);
        if (result.length === 0) {
            return res.status(404).json({ success: false, message: 'Guard not found' });
        }
        const g = result[0];
        res.json({
            success: true,
            data: {
                id: g.id,
                name: g.name,
                guard_id: g.guardId,
                created_at: g.createdAt,
                updated_at: g.updatedAt
            }
        });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const createGuard = async (req: Request, res: Response) => {
    const { name, guard_id } = req.body;

    if (!name || !guard_id) {
        return res.status(400).json({ success: false, message: 'Name and guard_id are required' });
    }

    try {
        // Check for duplicates
        const existing = await db.select().from(guards).where(eq(guards.guardId, guard_id)).limit(1);
        if (existing.length > 0) {
            return res.status(409).json({ success: false, message: 'A guard with this ID already exists' });
        }

        const result = await db.insert(guards).values({
            name,
            guardId: guard_id
        }).returning();

        res.status(201).json({ success: true, data: result[0] });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const deleteGuard = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    try {
        const result = await db.delete(guards).where(eq(guards.id, parseInt(id))).returning({ id: guards.id });
        if (result.length === 0) {
            return res.status(404).json({ success: false, message: 'Guard not found' });
        }
        res.json({ success: true, message: 'Guard deleted successfully' });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};
