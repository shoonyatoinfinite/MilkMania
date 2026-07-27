import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import http from 'http';
import { WebSocketServer } from 'ws';
import { registerClient } from './utils/websocket';

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

// Global Date Validation Middleware
app.use((req: any, res: any, next: any) => {
  if ((req.method === 'POST' || req.method === 'PUT') && req.body) {
    const getLocalDateStr = (dVal: string | Date = new Date()) => {
      const d = new Date(dVal);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const isFutureDate = (dateVal: string | Date) => {
      if (!dateVal) return false;
      return getLocalDateStr(dateVal) > getLocalDateStr(new Date());
    };

    const isEveningBlockedToday = (dateVal: string | Date, shift: string) => {
      if (!dateVal || !shift) return false;
      const targetStr = getLocalDateStr(dateVal);
      const todayStr = getLocalDateStr(new Date());
      if (targetStr === todayStr && shift.toUpperCase() === 'EVENING') {
        const currentHour = new Date().getHours();
        if (currentHour < 12) {
          return true;
        }
      }
      return false;
    };

    // Check 'date' property in request body if provided
    if (req.body.date && isFutureDate(req.body.date)) {
      return res.status(400).json({ message: 'Cannot add or modify records for future dates.' });
    }

    // Check 'shift' property in request body if provided
    if (req.body.date && req.body.shift && isEveningBlockedToday(req.body.date, req.body.shift)) {
      return res.status(400).json({ message: 'Evening session data cannot be recorded before 12:00 PM today.' });
    }
  }
  next();
});

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

// Create HTTP and WebSocket Server
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  registerClient(ws);
});

// Auto seed and Start Server
async function startServer() {
  try {
    // Run the seeder on start
    await seedDatabase();

    server.listen(PORT, () => {
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

