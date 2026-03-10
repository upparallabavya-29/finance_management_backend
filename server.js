import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import transactionRoutes from './routes/transactionRoutes.js';
import authRoutes from './routes/authRoutes.js';
import budgetRoutes from './routes/budgetRoutes.js';
import goalRoutes from './routes/goalRoutes.js';
import billRoutes from './routes/billRoutes.js';
import debtRoutes from './routes/debtRoutes.js';
import insightRoutes from './routes/insightRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import logger from './utils/logger.js';
import cronService from './services/cronService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Security Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            "default-src": ["'self'"],
            "script-src": ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            "font-src": ["'self'", "https://fonts.gstatic.com"],
            "img-src": ["'self'", "data:", "https:", "http:", "https://ui-avatars.com"],
            "connect-src": ["'self'", "https://ykfnzvkcqelxopnhndjw.supabase.co", "wss://ykfnzvkcqelxopnhndjw.supabase.co"]
        },
    },
    crossOriginEmbedderPolicy: false
}));

// Middleware
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

// Rate Limiting - Apply AFTER CORS to ensure 429s have correct headers
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Increased for development and dashboard stability
    message: 'Too many requests from this IP, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', apiLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/debts', debtRoutes);
app.use('/api/insights', insightRoutes);

// Root route to test API status
app.get('/', (req, res) => {
    res.json({ message: 'Finance Management API is running' });
});

// Remove Catch-all fallback code - no longer serving SPA frontend

// Error handling middleware
app.use(errorHandler);

// Start Server and Background Jobs
app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
    cronService.start();
});
