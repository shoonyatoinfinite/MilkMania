import { Router, Response } from 'express';
import { db } from '../db/db';
import { authenticateJWT } from '../middleware/auth';
import { broadcast } from '../utils/websocket';

const router = Router();

router.use(authenticateJWT);

// GET /api/milk-bought
router.get('/', async (req: any, res: Response) => {
  const { startDate, endDate, shift } = req.query;

  try {
    const filter: any = { where: {} };

    if (shift) {
      filter.where.shift = shift as string;
    }

    if (startDate || endDate) {
      filter.where.date = {};
      if (startDate) filter.where.date.gte = new Date(startDate as string).toISOString();
      if (endDate) filter.where.date.lte = new Date(endDate as string).toISOString();
    }

    const list = await db.milkBought.findMany(filter);
    return res.json(list);
  } catch (error) {
    console.error('Error fetching milk bought records:', error);
    return res.status(500).json({ message: 'Error retrieving milk bought records.' });
  }
});

// POST /api/milk-bought
router.post('/', async (req: any, res: Response) => {
  const { supplierName, date, shift, quantity, rate, amount, fat, snf, paymentMethod, notes } = req.body;

  if (!supplierName || !date || quantity === undefined || rate === undefined) {
    return res.status(400).json({ message: 'Supplier name, date, quantity, and rate are required.' });
  }

  const finalQty = parseFloat(quantity);
  const finalRate = parseFloat(rate);
  if (finalQty <= 0 || finalRate < 0) {
    return res.status(400).json({ message: 'Quantity and rate must be valid positive numbers.' });
  }

  const calculatedAmount = amount !== undefined ? parseFloat(amount) : Math.round(finalQty * finalRate * 100) / 100;

  try {
    const record = await db.milkBought.create({
      data: {
        supplierName: String(supplierName).trim(),
        date: new Date(date).toISOString(),
        shift: shift || 'MORNING',
        quantity: finalQty,
        rate: finalRate,
        amount: Math.round(calculatedAmount * 100) / 100,
        fat: fat !== undefined && fat !== '' ? parseFloat(fat) : undefined,
        snf: snf !== undefined && snf !== '' ? parseFloat(snf) : undefined,
        paymentMethod: paymentMethod || 'CASH',
        notes: notes || '',
      }
    });

    broadcast({ type: 'REFRESH_DATA' });
    return res.status(201).json(record);
  } catch (error) {
    console.error('Error recording milk bought:', error);
    return res.status(500).json({ message: 'Error recording milk bought.' });
  }
});

// PUT /api/milk-bought/:id
router.put('/:id', async (req: any, res: Response) => {
  const { id } = req.params;
  const { supplierName, date, shift, quantity, rate, amount, fat, snf, paymentMethod, notes } = req.body;

  try {
    const updateData: any = {};
    if (supplierName) updateData.supplierName = String(supplierName).trim();
    if (date) updateData.date = new Date(date).toISOString();
    if (shift) updateData.shift = shift;
    if (quantity !== undefined) updateData.quantity = parseFloat(quantity);
    if (rate !== undefined) updateData.rate = parseFloat(rate);
    if (amount !== undefined) {
      updateData.amount = parseFloat(amount);
    } else if (quantity !== undefined && rate !== undefined) {
      updateData.amount = Math.round(parseFloat(quantity) * parseFloat(rate) * 100) / 100;
    }
    if (fat !== undefined) updateData.fat = fat !== '' ? parseFloat(fat) : undefined;
    if (snf !== undefined) updateData.snf = snf !== '' ? parseFloat(snf) : undefined;
    if (paymentMethod) updateData.paymentMethod = paymentMethod;
    if (notes !== undefined) updateData.notes = notes;

    const updated = await db.milkBought.update({
      where: { id },
      data: updateData
    });

    if (!updated) {
      return res.status(404).json({ message: 'Milk bought record not found.' });
    }

    broadcast({ type: 'REFRESH_DATA' });
    return res.json(updated);
  } catch (error) {
    console.error('Error updating milk bought record:', error);
    return res.status(500).json({ message: 'Error updating milk bought record.' });
  }
});

// DELETE /api/milk-bought/:id
router.delete('/:id', async (req: any, res: Response) => {
  const { id } = req.params;
  try {
    const deleted = await db.milkBought.delete({ where: { id } });
    if (!deleted) {
      return res.status(404).json({ message: 'Milk bought record not found.' });
    }
    broadcast({ type: 'REFRESH_DATA' });
    return res.json({ message: 'Milk bought record deleted successfully.', record: deleted });
  } catch (error) {
    console.error('Error deleting milk bought record:', error);
    return res.status(500).json({ message: 'Error deleting milk bought record.' });
  }
});

export default router;
