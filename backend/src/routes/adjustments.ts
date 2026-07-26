import { Router, Response } from 'express';
import { db } from '../db/db';
import { authenticateJWT } from '../middleware/auth';

const router = Router();
router.use(authenticateJWT);

function getNextSession(dateStr: string, shift: string) {
  const d = new Date(dateStr + 'T12:00:00.000Z');
  if (shift === 'MORNING') {
    return {
      dateStr: dateStr,
      shift: 'EVENING'
    };
  } else {
    d.setDate(d.getDate() + 1);
    return {
      dateStr: d.toISOString().split('T')[0],
      shift: 'MORNING'
    };
  }
}

// GET all adjustments
router.get('/', async (req: any, res: Response) => {
  try {
    const { date, shift } = req.query;
    if (!date || !shift) {
      const adjustments = await db.sessionAdjustments.findMany();
      return res.json(adjustments);
    }

    const start = new Date(`${date}T00:00:00.000Z`);
    const end = new Date(`${date}T23:59:59.999Z`);

    const list = await db.sessionAdjustments.findMany({
      where: {
        date: {
          gte: start,
          lte: end
        },
        shift: shift as string
      }
    });

    return res.json(list);
  } catch (error) {
    console.error('Error fetching adjustments:', error);
    return res.status(500).json({ message: 'Error fetching adjustments.' });
  }
});

// POST a new adjustment (EMPTY or ROLLOVER)
router.post('/', async (req: any, res: Response) => {
  try {
    const { date, shift, actionType, quantity } = req.body;
    if (!date || !shift || !actionType || quantity === undefined) {
      return res.status(400).json({ message: 'Missing required adjustment fields.' });
    }

    const parsedQty = parseFloat(quantity);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      return res.status(400).json({ message: 'Quantity must be a positive number.' });
    }

    // Block duplicate adjustments (already emptied or rolled over from)
    const allAdjs = await db.sessionAdjustments.findMany();
    const existing = allAdjs.filter((a: any) => {
      const aDate = new Date(a.date).toISOString().split('T')[0];
      return aDate === date && 
             a.shift === shift && 
             (a.actionType === 'EMPTY' || a.actionType === 'ROLLOVER_FROM');
    });

    if (existing.length > 0) {
      return res.status(400).json({ message: 'This session has already been adjusted (emptied or rolled over).' });
    }

    const dateObj = new Date(`${date}T12:00:00.000Z`);

    if (actionType === 'EMPTY') {
      const adj = await db.sessionAdjustments.create({
        data: {
          date: dateObj,
          shift,
          actionType: 'EMPTY',
          quantity: parsedQty
        }
      });
      return res.json(adj);
    } else if (actionType === 'ROLLOVER') {
      // 1. Create ROLLOVER_FROM for current session
      const fromAdj = await db.sessionAdjustments.create({
        data: {
          date: dateObj,
          shift,
          actionType: 'ROLLOVER_FROM',
          quantity: parsedQty
        }
      });

      // 2. Compute next session and create ROLLOVER_TO
      const nextSess = getNextSession(date, shift);
      const nextDateObj = new Date(`${nextSess.dateStr}T12:00:00.000Z`);

      await db.sessionAdjustments.create({
        data: {
          date: nextDateObj,
          shift: nextSess.shift,
          actionType: 'ROLLOVER_TO',
          quantity: parsedQty
        }
      });

      return res.json(fromAdj);
    } else {
      return res.status(400).json({ message: 'Invalid action type.' });
    }
  } catch (error) {
    console.error('Error creating adjustment:', error);
    return res.status(500).json({ message: 'Error saving session adjustment.' });
  }
});

export default router;
