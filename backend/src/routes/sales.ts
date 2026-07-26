import { Router, Response } from 'express';
import { db } from '../db/db';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);

// GET /api/sales
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

    const list = await db.sales.findMany(filter);
    return res.json(list);
  } catch (error) {
    console.error('Error fetching sales:', error);
    return res.status(500).json({ message: 'Error retrieving sales entries.' });
  }
});

// POST /api/sales
router.post('/', async (req: any, res: Response) => {
  const { customerId, date, shift, quantity, rate, amount, paymentMethod, remarks } = req.body;

  if (!customerId || !date || !shift || quantity === undefined) {
    return res.status(400).json({ message: 'Customer, date, shift, and quantity are required.' });
  }

  const finalQty = parseFloat(quantity);
  if (finalQty <= 0) {
    return res.status(400).json({ message: 'Quantity must be greater than zero.' });
  }

  try {
    // Look up customer to get their price if rate is not supplied
    const customer = await db.customers.findUnique({ where: { id: customerId } });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found.' });
    }

    // 1. Calculate available stock for this shift and date
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const productions = await db.productions.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });
    const shiftProds = productions.filter((p: any) => p.shift === shift);
    const totalRemainingYield = shiftProds.reduce((sum: number, p: any) => sum + (p.quantity - (p.homeConsumption || 0)), 0);

    const allSales = await db.sales.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });
    const shiftSales = allSales.filter((s: any) => s.shift === shift);
    const totalSold = shiftSales.reduce((sum: number, s: any) => sum + s.quantity, 0);

    // Get adjustments
    const adjustments = await db.sessionAdjustments.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });
    const shiftAdjustments = adjustments.filter((a: any) => a.shift === shift);
    const rolloverTo = shiftAdjustments
      .filter((a: any) => a.actionType === 'ROLLOVER_TO')
      .reduce((sum: number, a: any) => sum + a.quantity, 0);
    const reductions = shiftAdjustments
      .filter((a: any) => a.actionType === 'ROLLOVER_FROM' || a.actionType === 'EMPTY')
      .reduce((sum: number, a: any) => sum + a.quantity, 0);

    const available = (totalRemainingYield + rolloverTo - reductions) - totalSold;

    if (finalQty > available) {
      return res.status(400).json({
        message: `Insufficient milk stock for ${shift === 'MORNING' ? 'Morning' : 'Evening'} shift. Available: ${Math.round(available * 10) / 10} L, requested: ${finalQty} L.`
      });
    }

    const finalRate = rate !== undefined ? parseFloat(rate) : customer.pricePerLiter;
    const finalAmount = amount !== undefined ? parseFloat(amount) : finalRate * finalQty;

    const sale = await db.sales.create({
      data: {
        customerId,
        date: new Date(date).toISOString(),
        shift,
        quantity: finalQty,
        rate: finalRate,
        amount: Math.round(finalAmount * 100) / 100,
        paymentMethod: paymentMethod || 'PENDING',
        remarks: remarks || '',
      }
    });

    return res.status(201).json(sale);
  } catch (error) {
    console.error('Error recording sale:', error);
    return res.status(500).json({ message: 'Error recording milk sale.' });
  }
});

// PUT /api/sales/:id
router.put('/:id', async (req: any, res: Response) => {
  const { id } = req.params;
  const { customerId, date, shift, quantity, rate, amount, paymentMethod, remarks } = req.body;

  try {
    const existing = await db.sales.findMany();
    const currentSale = existing.find((s: any) => s.id === id);
    if (!currentSale) {
      return res.status(404).json({ message: 'Sale record not found.' });
    }

    const nextCustomerId = customerId || currentSale.customerId;
    const nextDate = date ? new Date(date) : new Date(currentSale.date);
    const nextShift = shift || currentSale.shift;
    const nextQty = quantity !== undefined ? parseFloat(quantity) : currentSale.quantity;
    const nextRate = rate !== undefined ? parseFloat(rate) : currentSale.rate;

    if (nextQty <= 0) {
      return res.status(400).json({ message: 'Quantity must be greater than zero.' });
    }

    // Check stock for target date/shift (excluding this sale's original quantity)
    const startOfDay = new Date(nextDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(nextDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const productions = await db.productions.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });
    const shiftProds = productions.filter((p: any) => p.shift === nextShift);
    const totalRemainingYield = shiftProds.reduce((sum: number, p: any) => sum + (p.quantity - (p.homeConsumption || 0)), 0);

    const allSales = await db.sales.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });
    // Exclude current sale from calculations
    const shiftSales = allSales.filter((s: any) => s.shift === nextShift && s.id !== id);
    const totalSold = shiftSales.reduce((sum: number, s: any) => sum + s.quantity, 0);

    // Get adjustments
    const adjustments = await db.sessionAdjustments.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });
    const shiftAdjustments = adjustments.filter((a: any) => a.shift === nextShift);
    const rolloverTo = shiftAdjustments
      .filter((a: any) => a.actionType === 'ROLLOVER_TO')
      .reduce((sum: number, a: any) => sum + a.quantity, 0);
    const reductions = shiftAdjustments
      .filter((a: any) => a.actionType === 'ROLLOVER_FROM' || a.actionType === 'EMPTY')
      .reduce((sum: number, a: any) => sum + a.quantity, 0);

    const available = (totalRemainingYield + rolloverTo - reductions) - totalSold;

    if (nextQty > available) {
      return res.status(400).json({
        message: `Insufficient milk stock for ${nextShift === 'MORNING' ? 'Morning' : 'Evening'} shift. Available: ${Math.round(available * 10) / 10} L, requested: ${nextQty} L.`
      });
    }

    const updateData: any = {};
    if (customerId) updateData.customerId = customerId;
    if (date) updateData.date = new Date(date).toISOString();
    if (shift) updateData.shift = shift;
    updateData.quantity = nextQty;
    updateData.rate = nextRate;

    if (amount !== undefined) {
      updateData.amount = parseFloat(amount);
    } else {
      updateData.amount = Math.round(nextQty * nextRate * 100) / 100;
    }

    if (paymentMethod) updateData.paymentMethod = paymentMethod;
    if (remarks !== undefined) updateData.remarks = remarks;

    const updated = await db.sales.update({
      where: { id },
      data: updateData
    });

    return res.json(updated);
  } catch (error) {
    console.error('Error updating sale:', error);
    return res.status(500).json({ message: 'Error updating milk sale.' });
  }
});

// DELETE /api/sales/:id
router.delete('/:id', async (req: any, res: Response) => {
  const { id } = req.params;
  try {
    const deleted = await db.sales.delete({ where: { id } });
    if (!deleted) {
      return res.status(404).json({ message: 'Sale record not found.' });
    }
    return res.json({ message: 'Sale record deleted successfully.', sale: deleted });
  } catch (error) {
    console.error('Error deleting sale:', error);
    return res.status(500).json({ message: 'Error deleting milk sale.' });
  }
});

export default router;
