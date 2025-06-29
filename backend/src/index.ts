import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { checkInRouter } from './routes/checkIn';
import { studentCheckInRouter } from './routes/studentCheckIn';
import { simpleStudentCheckInRouter } from './routes/simpleStudentCheckIn';
import { testCheckInRouter } from './routes/testCheckIn';
import { autoCheckInRouter } from './routes/autoCheckIn';
import { config } from './config/supabase';

// Load environment variables
dotenv.config();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'learnify-backend',
    version: '1.0.0'
  });
});

// API routes
app.use('/api', checkInRouter);
app.use('/api', studentCheckInRouter);
app.use('/api', simpleStudentCheckInRouter);
app.use('/api', testCheckInRouter);
app.use('/api', autoCheckInRouter);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Learnify Backend API',
    version: '1.0.0',
    documentation: '/api/docs',
    health: '/health'
  });
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// Global error handler
app.use((error: Error, req: Request, res: Response, next: Function) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'INTERNAL_ERROR',
    message: 'Internal server error'
  });
});

const PORT = config.port;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Learnify Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔥 Environment: ${config.nodeEnv}`);
  console.log(`⏰ Check-in cooldown: ${config.checkInCooldownHours} hours`);
});

export default app;