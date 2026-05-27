import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import uploadRoutes from '../routes/uploadRoutes.js';
import analyzeRoutes from '../routes/analyzeRoutes.js';
import historyRoutes from '../routes/historyRoutes.js';
import authRoutes from '../routes/authRoutes.js';
import { notFound, errorHandler } from '../middleware/errorMiddleware.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || '*'}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(morgan('dev'));

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'TermsWise API is live 🚀',
  });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'TermsWise API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/analyze', analyzeRoutes);
app.use('/api/history', historyRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
