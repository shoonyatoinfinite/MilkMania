import { Router, Response } from 'express';
import { db } from '../db/db';
import { authenticateJWT } from '../middleware/auth';
import { broadcast } from '../utils/websocket';

const router = Router();

router.use(authenticateJWT);

const getLocalDateStr = (dVal: string | Date = new Date()) => {
  const d = new Date(dVal);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// GET /api/production
router.get('/', async (req: any, res: Response) => {
  const { animalId, startDate, endDate } = req.query;

  try {
    const filter: any = { where: {} };

    if (animalId) {
      filter.where.animalId = animalId as string;
    }

    if (startDate || endDate) {
      filter.where.date = {};
      if (startDate) filter.where.date.gte = new Date(startDate as string).toISOString();
      if (endDate) filter.where.date.lte = new Date(endDate as string).toISOString();
    }

    const list = await db.productions.findMany(filter);
    return res.json(list);
  } catch (error) {
    console.error('Error fetching production logs:', error);
    return res.status(500).json({ message: 'Error retrieving milk production logs.' });
  }
});

// POST /api/production
router.post('/', async (req: any, res: Response) => {
  const { animalId, date, shift, quantity, homeConsumption, notes } = req.body;

  if (!animalId || !date || !shift || quantity === undefined) {
    return res.status(400).json({ message: 'Animal, date, shift, and quantity are required.' });
  }

  const parsedQuantity = parseFloat(quantity);
  const parsedHome = parseFloat(homeConsumption || '0');

  if (parsedQuantity <= 0) {
    return res.status(400).json({ message: 'Quantity must be greater than zero.' });
  }

  if (parsedHome < 0) {
    return res.status(400).json({ message: 'Home consumption cannot be negative.' });
  }

  if (parsedHome > parsedQuantity) {
    return res.status(400).json({ message: 'Home consumption cannot exceed quantity produced.' });
  }

  try {
    // Check if animal exists
    const animal = await db.animals.findUnique({ where: { id: animalId } });
    if (!animal) {
      return res.status(404).json({ message: 'Animal not found.' });
    }

    const targetDayStr = getLocalDateStr(date);
    const existingList = await db.productions.findMany();

    const existing = existingList.find((p: any) => 
      p.animalId === animalId &&
      p.shift === shift &&
      getLocalDateStr(p.date) === targetDayStr
    );

    if (existing) {
      return res.status(400).json({
        message: 'Yield record already exists for this animal, session, and date. Please edit the existing record instead.'
      });
    }

    const log = await db.productions.create({
      data: {
        animalId,
        date: new Date(date).toISOString(),
        shift,
        quantity: parsedQuantity,
        homeConsumption: parsedHome,
        notes: notes || '',
      }
    });

    broadcast({ type: 'REFRESH_DATA' });
    return res.status(201).json(log);
  } catch (error) {
    console.error('Error recording production yield:', error);
    return res.status(500).json({ message: 'Error saving milk production log.' });
  }
});

// PUT /api/production/:id
router.put('/:id', async (req: any, res: Response) => {
  const { id } = req.params;
  const { animalId, date, shift, quantity, homeConsumption, notes } = req.body;

  try {
    // Find the record being edited using findMany
    const allRecords = await db.productions.findMany();
    const existingRecord = allRecords.find((p: any) => p.id === id);
    if (!existingRecord) {
      return res.status(404).json({ message: 'Production record not found.' });
    }

    const nextAnimalId = animalId || existingRecord.animalId;
    const nextDate = date ? new Date(date) : new Date(existingRecord.date);
    const nextShift = shift || existingRecord.shift;
    const nextQuantity = quantity !== undefined ? parseFloat(quantity) : existingRecord.quantity;
    const nextHome = homeConsumption !== undefined ? parseFloat(homeConsumption) : (existingRecord.homeConsumption || 0);

    if (nextQuantity <= 0) {
      return res.status(400).json({ message: 'Quantity must be greater than zero.' });
    }

    if (nextHome < 0) {
      return res.status(400).json({ message: 'Home consumption cannot be negative.' });
    }

    if (nextHome > nextQuantity) {
      return res.status(400).json({ message: 'Home consumption cannot exceed quantity produced.' });
    }

    if (animalId || date || shift) {
      const targetDayStr = getLocalDateStr(nextDate);

      const duplicate = allRecords.find((p: any) => {
        if (p.id === id) return false;
        if (p.animalId !== nextAnimalId) return false;
        if (p.shift !== nextShift) return false;
        return getLocalDateStr(p.date) === targetDayStr;
      });

      if (duplicate) {
        return res.status(400).json({
          message: 'Another yield record already exists for this animal, session, and date. Please edit that record instead.'
        });
      }
    }

    const updateData: any = {};
    if (animalId) updateData.animalId = animalId;
    if (date) updateData.date = new Date(date).toISOString();
    if (shift) updateData.shift = shift;
    if (quantity !== undefined) updateData.quantity = nextQuantity;
    if (homeConsumption !== undefined) updateData.homeConsumption = nextHome;
    if (notes !== undefined) updateData.notes = notes;

    const updated = await db.productions.update({
      where: { id },
      data: updateData
    });

    broadcast({ type: 'REFRESH_DATA' });
    return res.json(updated);
  } catch (error) {
    console.error('Error updating production yield:', error);
    return res.status(500).json({ message: 'Error updating production log.' });
  }
});

// DELETE /api/production/:id
router.delete('/:id', async (req: any, res: Response) => {
  const { id } = req.params;
  try {
    const deleted = await db.productions.delete({ where: { id } });
    if (!deleted) {
      return res.status(404).json({ message: 'Production record not found.' });
    }
    broadcast({ type: 'REFRESH_DATA' });
    return res.json({ message: 'Production record deleted successfully.', record: deleted });
  } catch (error) {
    console.error('Error deleting production record:', error);
    return res.status(500).json({ message: 'Error deleting production log.' });
  }
});

export default router;
