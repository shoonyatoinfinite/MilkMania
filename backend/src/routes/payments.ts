import { Router, Response } from 'express';
import { db } from '../db/db';
import { authenticateJWT } from '../middleware/auth';
import { broadcast } from '../utils/websocket';

const router = Router();

router.use(authenticateJWT);

// GET /api/payments
router.get('/', async (req: any, res: Response) => {
  const { customerId, startDate, endDate } = req.query;

  try {
    const filter: any = { where: {} };

    if (customerId) {
      filter.where.customerId = customerId as string;
    }

    if (startDate || endDate) {
      filter.where.date = {};
      if (startDate) filter.where.date.gte = new Date(startDate as string).toISOString();
      if (endDate) filter.where.date.lte = new Date(endDate as string).toISOString();
    }

    const list = await db.payments.findMany(filter);
    return res.json(list);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return res.status(500).json({ message: 'Error retrieving payments logs.' });
  }
});

// POST /api/payments
router.post('/', async (req: any, res: Response) => {
  const { customerId, date, amount, paymentMethod, remarks } = req.body;

  if (!customerId || !date || amount === undefined || !paymentMethod) {
    return res.status(400).json({ message: 'Customer, date, amount, and payment method are required.' });
  }

  try {
    // Check if customer exists
    const customer = await db.customers.findUnique({ where: { id: customerId } });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found.' });
    }

    const payment = await db.payments.create({
      data: {
        customerId,
        date: new Date(date).toISOString(),
        amount: parseFloat(amount),
        paymentMethod,
        remarks: remarks || '',
      }
    });

    broadcast({ type: 'REFRESH_DATA' });
    return res.status(201).json(payment);
  } catch (error) {
    console.error('Error recording payment:', error);
    return res.status(500).json({ message: 'Error saving payment log.' });
  }
});

// PUT /api/payments/:id
router.put('/:id', async (req: any, res: Response) => {
  const { id } = req.params;
  const { customerId, date, amount, paymentMethod, remarks } = req.body;

  try {
    const updateData: any = {};
    if (customerId) updateData.customerId = customerId;
    if (date) updateData.date = new Date(date).toISOString();
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (paymentMethod) updateData.paymentMethod = paymentMethod;
    if (remarks !== undefined) updateData.remarks = remarks;

    const updated = await db.payments.update({
      where: { id },
      data: updateData
    });

    if (!updated) {
      return res.status(404).json({ message: 'Payment log not found.' });
    }

    broadcast({ type: 'REFRESH_DATA' });
    return res.json(updated);
  } catch (error) {
    console.error('Error updating payment:', error);
    return res.status(500).json({ message: 'Error updating payment log.' });
  }
});

// DELETE /api/payments/:id
router.delete('/:id', async (req: any, res: Response) => {
  const { id } = req.params;
  try {
    const deleted = await db.payments.delete({ where: { id } });
    if (!deleted) {
      return res.status(404).json({ message: 'Payment log not found.' });
    }
    broadcast({ type: 'REFRESH_DATA' });
    return res.json({ message: 'Payment record deleted successfully.', payment: deleted });
  } catch (error) {
    console.error('Error deleting payment:', error);
    return res.status(500).json({ message: 'Error deleting payment log.' });
  }
});

export default router;
