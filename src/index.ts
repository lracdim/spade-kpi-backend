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

// Root route (for basic health check)
app.get('/', (req, res) => {
    res.send('KPI API is operational');
});

// Error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
    console.error('Unhandled Error:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
});

// Start server only if not running in Vite dev mode
if (!process.env.VITE) {
    const server = app.listen(PORT, () => {
        const address = server.address();
        const bind = typeof address === 'string' ? `pipe ${address}` : `port ${address?.port}`;
        console.log(`[server]: Backend is listening on ${bind} (0.0.0.0)`);
    });
}

export const viteNodeApp = app;

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
