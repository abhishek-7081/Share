import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import sessionRoutes from './routes/sessionRoutes.js';
import transferRoutes from './routes/transferRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Endpoints
app.use('/api/session', sessionRoutes);
app.use('/api/transfer', transferRoutes);
app.use('/', healthRoutes);

// Global Error Middleware
app.use(errorHandler);

export default app;
