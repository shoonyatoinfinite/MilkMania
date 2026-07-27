import { Router, Response } from 'express';
import { db } from '../db/db';
import { authenticateJWT } from '../middleware/auth';
import { broadcast } from '../utils/websocket';

const router = Router();

router.use(authenticateJWT);

// GET /api/settings
router.get('/', async (req: any, res: Response) => {
  try {
    const list = await db.settings.findMany();
    return res.json(list);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return res.status(500).json({ message: 'Error retrieving settings.' });
  }
});

// POST /api/settings
router.post('/', async (req: any, res: Response) => {
  const { settings } = req.body; // Expect array of { key: string, value: string, description?: string }

  if (!settings || !Array.isArray(settings)) {
    return res.status(400).json({ message: 'Settings list is required.' });
  }

  try {
    const updatedSettings = [];
    for (const item of settings) {
      const existing = await db.settings.findUnique({ where: { key: item.key } });
      if (existing) {
        const u = await db.settings.update({
          where: { key: item.key },
          data: { value: String(item.value), description: item.description }
        });
        updatedSettings.push(u);
      } else {
        const c = await db.settings.create({
          data: { key: item.key, value: String(item.value), description: item.description }
        });
        updatedSettings.push(c);
      }
    }
    broadcast({ type: 'REFRESH_DATA' });
    return res.json({ message: 'Settings updated successfully!', settings: updatedSettings });
  } catch (error) {
    console.error('Error updating settings:', error);
    return res.status(500).json({ message: 'Error updating settings.' });
  }
});

// GET /api/settings/backup
router.get('/backup', async (req: any, res: Response) => {
  try {
    // If running in Mock DB mode, we can read JSON collections directly.
    // If Postgres, we do findMany on all tables.
    // To be clean and compatible, we run findMany for all entities via the unified db adapter.
    const usersList = await db.users.findMany();
    const animalsList = await db.animals.findMany();
    const prodList = await db.productions.findMany();
    const custList = await db.customers.findMany();
    const salesList = await db.sales.findMany();
    const payList = await db.payments.findMany();
    const expList = await db.expenses.findMany();
    const invList = await db.inventory.findMany();
    const setList = await db.settings.findMany();

    const backupData = {
      backupDate: new Date().toISOString(),
      version: '1.0.0',
      users: usersList,
      animals: animalsList,
      productions: prodList,
      customers: custList,
      sales: salesList,
      payments: payList,
      expenses: expList,
      inventory: invList,
      settings: setList
    };

    res.setHeader('Content-disposition', `attachment; filename=milkmania_backup_${Date.now()}.json`);
    res.setHeader('Content-type', 'application/json');
    return res.send(JSON.stringify(backupData, null, 2));
  } catch (error) {
    console.error('Backup error:', error);
    return res.status(500).json({ message: 'Error generating database backup.' });
  }
});

// POST /api/settings/restore
router.post('/restore', async (req: any, res: Response) => {
  const { backupData } = req.body;

  if (!backupData || typeof backupData !== 'object') {
    return res.status(400).json({ message: 'Valid backup JSON content is required.' });
  }

  try {
    // If it's mock database, we can write directly to JSON files (very clean).
    // If it's Postgres, we will have to truncate/delete and insert.
    // Since we support both, let's write an adapter-level batch write or direct file replacement for mock mode.
    if (db.isMock) {
      const fs = require('fs');
      const path = require('path');
      const DATA_DIR = path.join(__dirname, '../../data');

      if (backupData.users) fs.writeFileSync(path.join(DATA_DIR, 'users.json'), JSON.stringify(backupData.users, null, 2));
      if (backupData.animals) fs.writeFileSync(path.join(DATA_DIR, 'animals.json'), JSON.stringify(backupData.animals, null, 2));
      if (backupData.productions) fs.writeFileSync(path.join(DATA_DIR, 'productions.json'), JSON.stringify(backupData.productions, null, 2));
      if (backupData.customers) fs.writeFileSync(path.join(DATA_DIR, 'customers.json'), JSON.stringify(backupData.customers, null, 2));
      if (backupData.sales) fs.writeFileSync(path.join(DATA_DIR, 'sales.json'), JSON.stringify(backupData.sales, null, 2));
      if (backupData.payments) fs.writeFileSync(path.join(DATA_DIR, 'payments.json'), JSON.stringify(backupData.payments, null, 2));
      if (backupData.expenses) fs.writeFileSync(path.join(DATA_DIR, 'expenses.json'), JSON.stringify(backupData.expenses, null, 2));
      if (backupData.inventory) fs.writeFileSync(path.join(DATA_DIR, 'inventory.json'), JSON.stringify(backupData.inventory, null, 2));
      if (backupData.settings) fs.writeFileSync(path.join(DATA_DIR, 'settings.json'), JSON.stringify(backupData.settings, null, 2));
    } else {
      // In Postgres mode, we iterate and merge or write updates.
      // Let's implement simple updates for each supported entity to avoid breaking DB integrity
      // Users
      if (backupData.users) {
        for (const u of backupData.users) {
          const exists = await db.users.findUnique({ where: { id: u.id } });
          if (!exists) await db.users.create({ data: u });
        }
      }
      // Animals
      if (backupData.animals) {
        for (const a of backupData.animals) {
          const exists = await db.animals.findUnique({ where: { id: a.id } });
          if (!exists) await db.animals.create({ data: a });
        }
      }
      // Customers
      if (backupData.customers) {
        for (const c of backupData.customers) {
          const exists = await db.customers.findUnique({ where: { id: c.id } });
          if (!exists) await db.customers.create({ data: c });
        }
      }
      // Production
      if (backupData.productions) {
        for (const p of backupData.productions) {
          await db.productions.create({ data: p });
        }
      }
      // Sales
      if (backupData.sales) {
        for (const s of backupData.sales) {
          await db.sales.create({ data: s });
        }
      }
      // Payments
      if (backupData.payments) {
        for (const p of backupData.payments) {
          await db.payments.create({ data: p });
        }
      }
      // Expenses
      if (backupData.expenses) {
        for (const e of backupData.expenses) {
          await db.expenses.create({ data: e });
        }
      }
      // Inventory
      if (backupData.inventory) {
        for (const i of backupData.inventory) {
          await db.inventory.create({ data: i });
        }
      }
      // Settings
      if (backupData.settings) {
        for (const s of backupData.settings) {
          const exists = await db.settings.findUnique({ where: { key: s.key } });
          if (!exists) await db.settings.create({ data: s });
        }
      }
    }

    broadcast({ type: 'REFRESH_DATA' });
    return res.json({ message: 'Database restored successfully!' });
  } catch (error) {
    console.error('Restore error:', error);
    return res.status(500).json({ message: 'Error restoring database.' });
  }
});

export default router;
