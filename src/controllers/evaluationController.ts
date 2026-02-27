import { Request, Response } from 'express';
import { db } from '../db';
import { evaluations } from '../db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

export const getAllEvaluations = async (req: Request, res: Response) => {
    const { guard_id, client_id } = req.query;

    try {
        let query = db.select().from(evaluations);
        const conditions = [];

        if (guard_id) {
            conditions.push(eq(evaluations.guardId, guard_id as string));
        }

        if (client_id) {
            conditions.push(eq(evaluations.clientId, client_id as string));
        }

        if (conditions.length > 0) {
            query = query.where(and(...conditions)) as any;
        }

        const result = await query.orderBy(desc(evaluations.createdAt));
        res.json({ success: true, data: result });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const getEvaluationById = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    try {
        const result = await db.select().from(evaluations).where(eq(evaluations.id, parseInt(id))).limit(1);
        if (result.length === 0) {
            return res.status(404).json({ success: false, message: 'Evaluation not found' });
        }
        res.json({ success: true, data: result[0] });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const createEvaluation = async (req: Request, res: Response) => {
    const { guard_id, client_id, kpi_scores, total_score, remarks, evaluated_by } = req.body;

    if (!guard_id || !client_id) {
        return res.status(400).json({ success: false, message: 'guard_id and client_id are required' });
    }

    const editableUntil = new Date();
    editableUntil.setHours(editableUntil.getHours() + 24);

    try {
        const result = await db.insert(evaluations).values({
            guardId: guard_id,
            clientId: client_id,
            kpiScores: kpi_scores || {},
            totalScore: total_score?.toString() || '0',
            remarks: remarks || null,
            evaluatedBy: evaluated_by || null,
            editableUntil: editableUntil
        }).returning();

        res.status(201).json({ success: true, data: result[0] });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const updateEvaluation = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { kpi_scores, total_score, remarks } = req.body;

    try {
        const existing = await db.select().from(evaluations).where(eq(evaluations.id, parseInt(id))).limit(1);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Evaluation not found' });
        }

        const evaluation = existing[0];
        if (evaluation.editableUntil && new Date(evaluation.editableUntil) < new Date()) {
            return res.status(403).json({ success: false, message: 'Evaluation is no longer editable' });
        }

        const result = await db.update(evaluations)
            .set({
                kpiScores: kpi_scores,
                totalScore: total_score?.toString(),
                remarks: remarks,
                updatedAt: new Date()
            })
            .where(eq(evaluations.id, parseInt(id)))
            .returning();

        res.json({ success: true, data: result[0] });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const deleteEvaluation = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    try {
        const result = await db.delete(evaluations).where(eq(evaluations.id, parseInt(id))).returning({ id: evaluations.id });
        if (result.length === 0) {
            return res.status(404).json({ success: false, message: 'Evaluation not found' });
        }
        res.json({ success: true, message: 'Evaluation deleted successfully' });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};
