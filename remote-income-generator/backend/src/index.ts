import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { initDatabase } from './services/database';
import jobsRouter from './routes/jobs';
import profileRouter from './routes/profile';
import documentsRouter from './routes/documents';
import authRouter from './routes/auth';
import favoritesRouter from './routes/favorites';
import resumeRouter from './routes/resume';
import optimizeRouter from './routes/optimize';

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

// CORS configuration
const corsOrigins = isProduction
  ? [process.env.FRONTEND_URL || '*']
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: corsOrigins,
  credentials: true
}));
app.use(express.json());

// Initialize database
initDatabase();
console.log('Database initialized');

// Routes
app.use('/api/auth', authRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/profile', profileRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/favorites', favoritesRouter);
app.use('/api/resumes', resumeRouter);
app.use('/api/optimize', optimizeRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Serve static files in production
if (isProduction) {
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendPath));

  // Handle SPA routing - serve index.html for non-API routes
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(frontendPath, 'index.html'));
    }
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║   Remote AI Agent Income Generator - Backend Server        ║
╠════════════════════════════════════════════════════════════╣
║   Server running on: http://localhost:${PORT}                 ║
║                                                            ║
║   API Endpoints:                                           ║
║   - GET  /api/health          Health check                 ║
║   - GET  /api/jobs/recent     Get recent jobs              ║
║   - GET  /api/jobs/top        Get top matching jobs        ║
║   - GET  /api/jobs/search     Search jobs with filters     ║
║   - POST /api/jobs/refresh    Refresh jobs from sources    ║
║   - GET  /api/profile         Get user profile             ║
║   - POST /api/profile         Update profile               ║
║   - POST /api/documents/upload Upload document             ║
╚════════════════════════════════════════════════════════════╝
  `);
});

export default app;
