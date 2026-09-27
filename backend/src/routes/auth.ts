import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/db';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth';
import { broadcast } from '../utils/websocket';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'milkmania_super_secret_liquid_fluid_key_2026';

// POST /api/auth/login
router.post('/login', async (req: any, res: Response) => {
  const { username, password, rememberMe } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  try {
    const user = await db.users.findUnique({
      where: { username: username.toLowerCase().trim() }
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    // Determine JWT duration
    const expiresIn = rememberMe ? '30d' : '24h';

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error during login.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated.' });
  }

  try {
    const user = await db.users.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    return res.json({
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role
    });
  } catch (e) {
    return res.status(500).json({ message: 'Error retrieving profile.' });
  }
});

// PUT /api/auth/profile
router.put('/profile', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated.' });
  }

  const { name, password } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Name is required.' });
  }

  try {
    const updateData: any = { name };

    if (password && password.trim() !== '') {
      if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters.' });
      }
      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(password, salt);
    }

    const updatedUser = await db.users.update({
      where: { id: req.user.id },
      data: updateData
    });

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    broadcast({ type: 'REFRESH_DATA' });
    return res.json({
      message: 'Profile updated successfully!',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        name: updatedUser.name,
        role: updatedUser.role
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ message: 'Internal server error updating profile.' });
  }
});

// GET /api/auth/users
router.get('/users', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated.' });
  }
  try {
    const list = await db.users.findMany();
    const safeList = list.map((u: any) => ({
      id: u.id,
      username: u.username,
      name: u.name,
      role: u.role,
      createdAt: u.createdAt
    }));
    return res.json(safeList);
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ message: 'Error retrieving portal users.' });
  }
});

// POST /api/auth/users
router.post('/users', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated.' });
  }
  const { username, name, password } = req.body;
  if (!username || !name || !password) {
    return res.status(400).json({ message: 'All fields (username, name, password) are required.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters.' });
  }

  try {
    const existing = await db.users.findUnique({ where: { username: username.toLowerCase().trim() } });
    if (existing) {
      return res.status(400).json({ message: 'Username is already taken.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await db.users.create({
      data: {
        username: username.toLowerCase().trim(),
        name: name.trim(),
        passwordHash,
        masterPasswordHash: passwordHash, // Default master password to initial password for new users
        lastPasswordHash: null,
        role: 'STAFF'
      }
    });

    broadcast({ type: 'REFRESH_DATA' });
    return res.status(201).json({
      message: 'User created successfully!',
      user: {
        id: newUser.id,
        username: newUser.username,
        name: newUser.name,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    return res.status(500).json({ message: 'Error creating portal user.' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req: any, res: Response) => {
  const { username, lastPassword, masterPassword, newPassword } = req.body;

  if (!username || !lastPassword || !masterPassword || !newPassword) {
    return res.status(400).json({ message: 'Username, Last Remembered Password, Master Password, and New Password are required.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'New Password must be at least 6 characters.' });
  }

  try {
    const user = await db.users.findUnique({
      where: { username: username.toLowerCase().trim() }
    });

    if (!user) {
      return res.status(400).json({ message: 'User verification failed. Incorrect Username or credentials.' });
    }

    // Verify master password
    const isMasterPasswordValid = await bcrypt.compare(masterPassword, user.masterPasswordHash);
    if (!isMasterPasswordValid) {
      return res.status(400).json({ message: 'User verification failed. Incorrect master password.' });
    }

    // Verify last remembered password matches either current password or previous password
    const matchesCurrent = await bcrypt.compare(lastPassword, user.passwordHash);
    const matchesPrevious = user.lastPasswordHash
      ? await bcrypt.compare(lastPassword, user.lastPasswordHash)
      : false;

    if (!matchesCurrent && !matchesPrevious) {
      return res.status(400).json({ message: 'User verification failed. Incorrect last remembered password.' });
    }

    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    await db.users.update({
      where: { id: user.id },
      data: {
        lastPasswordHash: user.passwordHash, // Keep track of the previous password
        passwordHash: newPasswordHash
      }
    });

    broadcast({ type: 'REFRESH_DATA' });
    return res.json({ message: 'Password reset successful!' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ message: 'Internal server error resetting password.' });
  }
});

// PUT /api/auth/users/:id
router.put('/users/:id', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated.' });
  }
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Only Master Admin can modify users.' });
  }

  const { id } = req.params;
  const { username, name, password, role } = req.body;

  try {
    const userToEdit = await db.users.findUnique({ where: { id } });
    if (!userToEdit) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // If username is changing, ensure it's not taken
    if (username && username !== userToEdit.username) {
      const existing = await db.users.findUnique({ where: { username } });
      if (existing) {
        return res.status(400).json({ message: 'Username is already in use.' });
      }
    }

    const updateData: any = {};
    if (username) updateData.username = username;
    if (name) updateData.name = name;
    if (role) updateData.role = role;

    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(password, salt);
    }

    await db.users.update({
      where: { id },
      data: updateData
    });

    broadcast({ type: 'REFRESH_DATA' });
    return res.json({ message: 'User updated successfully.' });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ message: 'Internal server error updating user.' });
  }
});

// DELETE /api/auth/users/:id
router.delete('/users/:id', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated.' });
  }
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Only Master Admin can delete users.' });
  }

  const { id } = req.params;
  if (req.user.id === id) {
    return res.status(400).json({ message: 'You cannot delete your own admin account.' });
  }

  try {
    const user = await db.users.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    await db.users.delete({ where: { id } });
    broadcast({ type: 'REFRESH_DATA' });

    return res.json({ message: 'User access deleted successfully.' });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ message: 'Error deleting user access.' });
  }
});

export default router;
