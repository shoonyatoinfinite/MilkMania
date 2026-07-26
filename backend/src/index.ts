import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Load Environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

import authRouter from './routes/auth';
import animalsRouter from './routes/animals';
import productionRouter from './routes/production';
import customersRouter from './routes/customers';
import salesRouter from './routes/sales';
import paymentsRouter from './routes/payments';
import expensesRouter from './routes/expenses';
import inventoryRouter from './routes/inventory';
import settingsRouter from './routes/settings';
import dashboardRouter from './routes/dashboard';
import adjustmentsRouter from './routes/adjustments';

import { seedDatabase } from './db/seeder';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for local/easy configurations
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    databaseMode: process.env.USE_MOCK_DB === 'true' ? 'MOCK_JSON' : 'POSTGRESQL'
  });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/animals', animalsRouter);
app.use('/api/production', productionRouter);
app.use('/api/customers', customersRouter);
app.use('/api/sales', salesRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/adjustments', adjustmentsRouter);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    message: 'Internal server error occurred.',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Auto seed and Start Server
async function startServer() {
  try {
    // Run the seeder on start
    await seedDatabase();
    
    app.listen(PORT, () => {
      console.log(`================================================`);
      console.log(`🥛 Milk Mania Server running on port ${PORT}`);
      console.log(`📂 DB Mode: ${process.env.USE_MOCK_DB === 'true' ? 'Mock Local JSON' : 'PostgreSQL via Prisma'}`);
      console.log(`🚀 Ready to handle dairy records!`);
      console.log(`================================================`);
    });
  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
}

startServer();
