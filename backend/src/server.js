import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import itemsRoutes from './routes/items.routes.js';
import transactionsRoutes from './routes/transactions.routes.js';
import healthRoutes from './routes/health.routes.js';

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());

app.use(cors({
    origin: 'http://localhost:5173',
}));

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(morgan('dev'));

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/transactions', transactionsRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'CV Sintesa Mandiri Karya Inventory API',
        version: '1.0.0',
    });
});

app.use('/api/auth', authRoutes);

// Start server
app.listen(PORT, () => {
    console.log('================================');
    console.log('CV SINTESA INVENTORY BACKEND');
    console.log('================================');
    console.log(`Server running: http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
});