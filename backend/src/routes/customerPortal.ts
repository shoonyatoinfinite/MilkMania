import { Router, Response, Request } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db/db';
import { broadcast } from '../utils/websocket';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'milkmania_super_secret_liquid_fluid_key_2026';

// Customer Authentication Middleware
export const authenticateCustomerJWT = (req: any, res: Response, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required for customer portal.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.role !== 'CUSTOMER' || !decoded.customerId) {
      return res.status(403).json({ message: 'Invalid customer token.' });
    }
    req.customer = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Session expired. Please log in again.' });
  }
};

// POST /api/customer-portal/login
router.post('/login', async (req: Request, res: Response) => {
  const { phone, pin } = req.body;

  if (!phone || !pin) {
    return res.status(400).json({ message: 'Mobile number and 6-digit PIN are required.' });
  }

  const cleanPhone = phone.toString().replace(/\D/g, '');
  const cleanPin = pin.toString().trim();

  if (!/^\d{6}$/.test(cleanPin)) {
    return res.status(400).json({ message: 'PIN must be exactly 6 digits.' });
  }

  try {
    const allCustomers = await db.customers.findMany();
    
    // Find customer by phone (handles +91, 0, or plain 10 digits)
    const customer = allCustomers.find((c: any) => {
      const p = (c.phone || '').replace(/\D/g, '');
      if (!p) return false;
      return p === cleanPhone || p.endsWith(cleanPhone) || cleanPhone.endsWith(p);
    });

    if (!customer) {
      return res.status(404).json({ message: 'No registered customer found with this mobile number.' });
    }

    if (customer.status !== 'ACTIVE') {
      return res.status(403).json({ message: 'Customer account is currently inactive. Please contact dairy admin.' });
    }

    // Verify 6-digit PIN (default to '123456' if not yet explicitly saved)
    const storedPin = customer.pin || '123456';
    if (storedPin !== cleanPin) {
      return res.status(401).json({ message: 'Incorrect 6-digit PIN. Please try again or ask admin to reset.' });
    }

    const token = jwt.sign(
      {
        id: customer.id,
        customerId: customer.id,
        name: customer.name,
        phone: customer.phone,
        role: 'CUSTOMER'
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.json({
      token,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        village: customer.village,
        address: customer.address,
        pricePerLiter: customer.pricePerLiter,
        customerType: customer.customerType,
        status: customer.status,
      }
    });
  } catch (error) {
    console.error('Customer login error:', error);
    return res.status(500).json({ message: 'Error logging into customer portal.' });
  }
});

// GET /api/customer-portal/me
router.get('/me', authenticateCustomerJWT, async (req: any, res: Response) => {
  const customerId = req.customer.customerId;

  try {
    const customer = await db.customers.findUnique({ where: { id: customerId } });
    if (!customer) {
      return res.status(404).json({ message: 'Customer record not found.' });
    }

    const sales = await db.sales.findMany({ where: { customerId } });
    const payments = await db.payments.findMany({ where: { customerId } });

    // Aggregate totals
    const totalLiters = sales.reduce((sum: number, s: any) => sum + s.quantity, 0);
    const totalAmount = sales.reduce((sum: number, s: any) => sum + s.amount, 0);
    const totalPaid = payments.reduce((sum: number, p: any) => sum + p.amount, 0);
    const pendingBalance = totalAmount - totalPaid;

    // This month metrics
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    const thisMonthSales = sales.filter((s: any) => new Date(s.date).getTime() >= firstDayOfMonth);
    const thisMonthPayments = payments.filter((p: any) => new Date(p.date).getTime() >= firstDayOfMonth);

    const thisMonthLiters = thisMonthSales.reduce((sum: number, s: any) => sum + s.quantity, 0);
    const thisMonthAmount = thisMonthSales.reduce((sum: number, s: any) => sum + s.amount, 0);
    const thisMonthPaid = thisMonthPayments.reduce((sum: number, p: any) => sum + p.amount, 0);

    // Latest dates
    const sortedSales = [...sales].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const sortedPayments = [...payments].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return res.json({
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        village: customer.village,
        address: customer.address,
        pricePerLiter: customer.pricePerLiter,
        customerType: customer.customerType,
        status: customer.status,
      },
      stats: {
        totalLiters: Math.round(totalLiters * 10) / 10,
        totalAmount: Math.round(totalAmount * 10) / 10,
        totalPaid: Math.round(totalPaid * 10) / 10,
        pendingBalance: Math.round(pendingBalance * 10) / 10,
        thisMonthLiters: Math.round(thisMonthLiters * 10) / 10,
        thisMonthAmount: Math.round(thisMonthAmount * 10) / 10,
        thisMonthPaid: Math.round(thisMonthPaid * 10) / 10,
        lastPurchaseDate: sortedSales.length > 0 ? sortedSales[0].date : null,
        lastPaymentDate: sortedPayments.length > 0 ? sortedPayments[0].date : null,
      }
    });
  } catch (error) {
    console.error('Error fetching customer profile:', error);
    return res.status(500).json({ message: 'Error loading customer dashboard.' });
  }
});

// GET /api/customer-portal/purchases (Milk bought records)
router.get('/purchases', authenticateCustomerJWT, async (req: any, res: Response) => {
  const customerId = req.customer.customerId;

  try {
    const sales = await db.sales.findMany({ where: { customerId } });
    const sorted = [...sales].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const formatted = sorted.map((s: any) => ({
      id: s.id,
      date: s.date,
      shift: s.shift,
      quantity: s.quantity,
      rate: s.rate,
      amount: s.amount,
      paymentMethod: s.paymentMethod,
      remarks: s.remarks
    }));

    return res.json(formatted);
  } catch (error) {
    console.error('Error fetching customer purchases:', error);
    return res.status(500).json({ message: 'Error retrieving milk purchase history.' });
  }
});

// GET /api/customer-portal/payments (Payments deposited)
router.get('/payments', authenticateCustomerJWT, async (req: any, res: Response) => {
  const customerId = req.customer.customerId;

  try {
    const payments = await db.payments.findMany({ where: { customerId } });
    const sorted = [...payments].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const formatted = sorted.map((p: any) => ({
      id: p.id,
      date: p.date,
      amount: p.amount,
      paymentMethod: p.paymentMethod,
      remarks: p.remarks
    }));

    return res.json(formatted);
  } catch (error) {
    console.error('Error fetching customer payments:', error);
    return res.status(500).json({ message: 'Error retrieving payments history.' });
  }
});

// PUT /api/customer-portal/change-pin
router.put('/change-pin', authenticateCustomerJWT, async (req: any, res: Response) => {
  const customerId = req.customer.customerId;
  const { currentPin, newPin } = req.body;

  if (!currentPin || !newPin) {
    return res.status(400).json({ message: 'Both current PIN and new 6-digit PIN are required.' });
  }

  const cleanCurrentPin = currentPin.toString().trim();
  const cleanNewPin = newPin.toString().trim();

  if (!/^\d{6}$/.test(cleanNewPin)) {
    return res.status(400).json({ message: 'New PIN must be exactly 6 numeric digits.' });
  }

  try {
    const customer = await db.customers.findUnique({ where: { id: customerId } });
    if (!customer) {
      return res.status(404).json({ message: 'Customer record not found.' });
    }

    const storedPin = customer.pin || '123456';
    if (storedPin !== cleanCurrentPin) {
      return res.status(400).json({ message: 'Incorrect current PIN. Please check and try again.' });
    }

    await db.customers.update({
      where: { id: customerId },
      data: { pin: cleanNewPin }
    });

    broadcast({ type: 'REFRESH_DATA' });
    return res.json({ message: 'PIN updated successfully! You can now use your new PIN to log in.' });
  } catch (error) {
    console.error('Error changing PIN:', error);
    return res.status(500).json({ message: 'Failed to update PIN.' });
  }
});

export default router;
