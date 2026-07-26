import { Router, Response } from 'express';
import { db } from '../db/db';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);

// GET /api/expenses
router.get('/', async (req: any, res: Response) => {
  const { startDate, endDate } = req.query;

  try {
    const filter: any = { where: {} };

    if (startDate || endDate) {
      filter.where.date = {};
      if (startDate) filter.where.date.gte = new Date(startDate as string).toISOString();
      if (endDate) filter.where.date.lte = new Date(endDate as string).toISOString();
    }

    const list = await db.expenses.findMany(filter);
    return res.json(list);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return res.status(500).json({ message: 'Error retrieving expenses.' });
  }
});

// POST /api/expenses
router.post('/', async (req: any, res: Response) => {
  const { date, category, amount, description } = req.body;

  if (!date || !category || amount === undefined) {
    return res.status(400).json({ message: 'Date, category, and amount are required.' });
  }

  try {
    const expense = await db.expenses.create({
      data: {
        date: new Date(date).toISOString(),
        category,
        amount: parseFloat(amount),
        description: description || '',
      }
    });

    return res.status(201).json(expense);
  } catch (error) {
    console.error('Error creating expense:', error);
    return res.status(500).json({ message: 'Error recording expense.' });
  }
});

// PUT /api/expenses/:id
router.put('/:id', async (req: any, res: Response) => {
  const { id } = req.params;
  const { date, category, amount, description } = req.body;

  try {
    const updateData: any = {};
    if (date) updateData.date = new Date(date).toISOString();
    if (category) updateData.category = category;
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (description !== undefined) updateData.description = description;

    const updated = await db.expenses.update({
      where: { id },
      data: updateData
    });

    if (!updated) {
      return res.status(404).json({ message: 'Expense record not found.' });
    }

    return res.json(updated);
  } catch (error) {
    console.error('Error updating expense:', error);
    return res.status(500).json({ message: 'Error updating expense.' });
  }
});

// DELETE /api/expenses/:id
router.delete('/:id', async (req: any, res: Response) => {
  const { id } = req.params;
  try {
    const deleted = await db.expenses.delete({ where: { id } });
    if (!deleted) {
      return res.status(404).json({ message: 'Expense record not found.' });
    }
    return res.json({ message: 'Expense record deleted successfully.', expense: deleted });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return res.status(500).json({ message: 'Error deleting expense.' });
  }
});

export default router;
