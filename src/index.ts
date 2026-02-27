import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import guardRoutes from './routes/guardRoutes';
import evaluationRoutes from './routes/evaluationRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', authRoutes);
app.use('/api/guards', guardRoutes);
app.use('/api/evaluations', evaluationRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ success: true, message: 'KPI TypeScript Backend (Vite/Drizzle) is running' });
});

if (!process.env.VITE) {
    app.listen(PORT, () => {
        console.log(`[server]: Server is running at http://localhost:${PORT}`);
    });
}

export const viteNodeApp = app;
