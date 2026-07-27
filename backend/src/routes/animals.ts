import { Router, Response } from 'express';
import { db } from '../db/db';
import { authenticateJWT } from '../middleware/auth';
import { broadcast } from '../utils/websocket';

const router = Router();

// Apply auth middleware to all routes
router.use(authenticateJWT);

// GET /api/animals
router.get('/', async (req: any, res: Response) => {
  try {
    const list = await db.animals.findMany();
    // For each animal, let's add their total milk produced
    const productions = await db.productions.findMany();
    
    const animalsWithStats = list.map((animal: any) => {
      const animalProds = productions.filter((p: any) => p.animalId === animal.id);
      const totalYield = animalProds.reduce((sum: number, p: any) => sum + p.quantity, 0);
      return {
        ...animal,
        totalYield: Math.round(totalYield * 10) / 10,
        yieldCount: animalProds.length
      };
    });

    return res.json(animalsWithStats);
  } catch (error) {
    console.error('Error fetching animals:', error);
    return res.status(500).json({ message: 'Error retrieving animal list.' });
  }
});

// POST /api/animals
router.post('/', async (req: any, res: Response) => {
  const { name, breed, age, purchaseDate, status, dailyCapacity, healthNotes, vaccinationNotes } = req.body;

  if (!name || !breed || !age) {
    return res.status(400).json({ message: 'Name, breed, and age are required.' });
  }

  try {
    const newAnimal = await db.animals.create({
      data: {
        name,
        breed,
        age: parseInt(age),
        purchaseDate: purchaseDate ? new Date(purchaseDate).toISOString() : new Date().toISOString(),
        status: status || 'ACTIVE',
        dailyCapacity: parseFloat(dailyCapacity || 0),
        photoUrl: '',
        healthNotes: healthNotes || '',
        vaccinationNotes: vaccinationNotes || '',
      }
    });

    broadcast({ type: 'REFRESH_DATA' });
    return res.status(201).json(newAnimal);
  } catch (error) {
    console.error('Error creating animal:', error);
    return res.status(500).json({ message: 'Error creating animal entry.' });
  }
});

// PUT /api/animals/:id
router.put('/:id', async (req: any, res: Response) => {
  const { id } = req.params;
  const { name, breed, age, purchaseDate, status, dailyCapacity, healthNotes, vaccinationNotes } = req.body;

  try {
    const updateData: any = {};
    if (name) updateData.name = name;
    if (breed) updateData.breed = breed;
    if (age !== undefined) updateData.age = parseInt(age);
    if (purchaseDate) updateData.purchaseDate = new Date(purchaseDate).toISOString();
    if (status) updateData.status = status;
    if (dailyCapacity !== undefined) updateData.dailyCapacity = parseFloat(dailyCapacity);
    if (healthNotes !== undefined) updateData.healthNotes = healthNotes;
    if (vaccinationNotes !== undefined) updateData.vaccinationNotes = vaccinationNotes;

    const updated = await db.animals.update({
      where: { id },
      data: updateData
    });

    if (!updated) {
      return res.status(404).json({ message: 'Animal not found.' });
    }

    broadcast({ type: 'REFRESH_DATA' });
    return res.json(updated);
  } catch (error) {
    console.error('Error updating animal:', error);
    return res.status(500).json({ message: 'Error updating animal entry.' });
  }
});

// DELETE /api/animals/:id
router.delete('/:id', async (req: any, res: Response) => {
  const { id } = req.params;
  try {
    const deleted = await db.animals.delete({ where: { id } });
    if (!deleted) {
      return res.status(404).json({ message: 'Animal not found.' });
    }
    broadcast({ type: 'REFRESH_DATA' });
    return res.json({ message: 'Animal entry deleted successfully.', animal: deleted });
  } catch (error) {
    console.error('Error deleting animal:', error);
    return res.status(500).json({ message: 'Error deleting animal entry.' });
  }
});

export default router;
