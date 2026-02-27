import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { users } from '../db/schema';
import { eq, or, sql } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || 'Spade2024SecureJWTKey!@#$EvaluationSystem789XYZ';

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email/UserID and password are required' });
    }

    try {
        // Search by email OR userid (case-insensitive) using Drizzle
        const userResults = await db.select()
            .from(users)
            .where(
                or(
                    sql`LOWER(${users.email}) = LOWER(${email})`,
                    sql`LOWER(${users.userid}) = LOWER(${email})`
                )
            )
            .limit(1);

        const user = userResults[0];

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            data: {
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            }
        });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const getMe = async (req: any, res: Response) => {
    res.json({
        success: true,
        data: req.user
    });
};
