import { Router, Response } from 'express';
import { db } from '../db/db';
import { authenticateJWT } from '../middleware/auth';
import { broadcast } from '../utils/websocket';

const router = Router();

router.use(authenticateJWT);

// GET /api/inventory
router.get('/', async (req: any, res: Response) => {
  try {
    const list = await db.inventory.findMany();
    
    // Add a helper boolean "lowStockAlert" dynamically
    const itemsWithStatus = list.map((item: any) => ({
      ...item,
      lowStock: item.quantity <= item.minStockAlert
    }));

    return res.json(itemsWithStatus);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return res.status(500).json({ message: 'Error retrieving inventory.' });
  }
});

// POST /api/inventory
router.post('/', async (req: any, res: Response) => {
  const { itemName, quantity, unit, minStockAlert, notes } = req.body;

  if (!itemName || quantity === undefined || !unit) {
    return res.status(400).json({ message: 'Item name, quantity, and unit are required.' });
  }

  try {
    const item = await db.inventory.create({
      data: {
        itemName,
        quantity: parseFloat(quantity),
        unit,
        minStockAlert: minStockAlert !== undefined ? parseFloat(minStockAlert) : 1,
        notes: notes || '',
      }
    });

    broadcast({ type: 'REFRESH_DATA' });
    return res.status(201).json(item);
  } catch (error) {
    console.error('Error creating inventory item:', error);
    return res.status(500).json({ message: 'Error creating inventory item.' });
  }
});

// PUT /api/inventory/:id
router.put('/:id', async (req: any, res: Response) => {
  const { id } = req.params;
  const { itemName, quantity, unit, minStockAlert, notes } = req.body;

  try {
    const updateData: any = {};
    if (itemName) updateData.itemName = itemName;
    if (quantity !== undefined) updateData.quantity = parseFloat(quantity);
    if (unit) updateData.unit = unit;
    if (minStockAlert !== undefined) updateData.minStockAlert = parseFloat(minStockAlert);
    if (notes !== undefined) updateData.notes = notes;

    const updated = await db.inventory.update({
      where: { id },
      data: updateData
    });

    if (!updated) {
      return res.status(404).json({ message: 'Inventory item not found.' });
    }

    broadcast({ type: 'REFRESH_DATA' });
    return res.json(updated);
  } catch (error) {
    console.error('Error updating inventory item:', error);
    return res.status(500).json({ message: 'Error updating inventory item.' });
  }
});

// DELETE /api/inventory/:id
router.delete('/:id', async (req: any, res: Response) => {
  const { id } = req.params;
  try {
    const deleted = await db.inventory.delete({ where: { id } });
    if (!deleted) {
      return res.status(404).json({ message: 'Inventory item not found.' });
    }
    broadcast({ type: 'REFRESH_DATA' });
    return res.json({ message: 'Inventory item deleted successfully.', item: deleted });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    return res.status(500).json({ message: 'Error deleting inventory item.' });
  }
});

export default router;
