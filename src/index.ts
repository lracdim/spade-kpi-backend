import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import guardRoutes from './routes/guardRoutes';
import evaluationRoutes from './routes/evaluationRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware (Fully permissive CORS for API without cookies)
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));
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
    app.listen(PORT as number, '0.0.0.0', () => {
        console.log(`[server]: Server is running at http://0.0.0.0:${PORT}`);
    });
}

export const viteNodeApp = app;
