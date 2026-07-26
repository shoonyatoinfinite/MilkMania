import { Router, Response } from 'express';
import { db } from '../db/db';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);

// GET /api/customers
router.get('/', async (req: any, res: Response) => {
  try {
    const list = await db.customers.findMany();
    
    // Add ledger aggregates to each customer dynamically
    const sales = await db.sales.findMany();
    const payments = await db.payments.findMany();

    const customersWithBalances = list.map((customer: any) => {
      const customerSales = sales.filter((s: any) => s.customerId === customer.id);
      const customerPayments = payments.filter((p: any) => p.customerId === customer.id);

      const totalLiters = customerSales.reduce((sum: number, s: any) => sum + s.quantity, 0);
      const totalAmount = customerSales.reduce((sum: number, s: any) => sum + s.amount, 0);
      const totalPaid = customerPayments.reduce((sum: number, p: any) => sum + p.amount, 0);
      const pendingBalance = totalAmount - totalPaid;

      // Find last payment date
      let lastPaymentDate = null;
      if (customerPayments.length > 0) {
        // Sort descending
        const sorted = [...customerPayments].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
        lastPaymentDate = sorted[0].date;
      }

      return {
        ...customer,
        totalLiters: Math.round(totalLiters * 10) / 10,
        totalAmount: Math.round(totalAmount * 10) / 10,
        totalPaid: Math.round(totalPaid * 10) / 10,
        pendingBalance: Math.round(pendingBalance * 10) / 10,
        lastPaymentDate
      };
    });

    return res.json(customersWithBalances);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return res.status(500).json({ message: 'Error retrieving customer list.' });
  }
});

// GET /api/customers/:id/ledger
router.get('/:id/ledger', async (req: any, res: Response) => {
  const { id } = req.params;

  try {
    const customer = await db.customers.findUnique({ where: { id } });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found.' });
    }

    const sales = await db.sales.findMany({ where: { customerId: id } });
    const payments = await db.payments.findMany({ where: { customerId: id } });

    // Calculate overall aggregates
    const totalLiters = sales.reduce((sum: number, s: any) => sum + s.quantity, 0);
    const totalAmount = sales.reduce((sum: number, s: any) => sum + s.amount, 0);
    const totalPaid = payments.reduce((sum: number, p: any) => sum + p.amount, 0);
    const pendingBalance = totalAmount - totalPaid;

    // Group sales and payments by Month-Year (e.g. "2026-07")
    const monthlyLedger: { [key: string]: { monthName: string; year: number; liters: number; amount: number; paid: number; pending: number; sales: any[]; payments: any[] } } = {};

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Helper to get group key
    const getGroupKey = (dateStr: string) => {
      const d = new Date(dateStr);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    };

    // Initialize groupings based on sales dates
    sales.forEach((s: any) => {
      const key = getGroupKey(s.date);
      if (!monthlyLedger[key]) {
        const d = new Date(s.date);
        monthlyLedger[key] = {
          monthName: monthNames[d.getMonth()],
          year: d.getFullYear(),
          liters: 0,
          amount: 0,
          paid: 0,
          pending: 0,
          sales: [],
          payments: []
        };
      }
      monthlyLedger[key].liters += s.quantity;
      monthlyLedger[key].amount += s.amount;
      monthlyLedger[key].sales.push(s);
    });

    // Process payments into months
    payments.forEach((p: any) => {
      const key = getGroupKey(p.date);
      if (!monthlyLedger[key]) {
        const d = new Date(p.date);
        monthlyLedger[key] = {
          monthName: monthNames[d.getMonth()],
          year: d.getFullYear(),
          liters: 0,
          amount: 0,
          paid: 0,
          pending: 0,
          sales: [],
          payments: []
        };
      }
      monthlyLedger[key].paid += p.amount;
      monthlyLedger[key].payments.push(p);
    });

    // Calculate pending for each month and format numbers
    Object.keys(monthlyLedger).forEach((key) => {
      const item = monthlyLedger[key];
      item.liters = Math.round(item.liters * 10) / 10;
      item.amount = Math.round(item.amount * 10) / 10;
      item.paid = Math.round(item.paid * 10) / 10;
      item.pending = Math.round((item.amount - item.paid) * 10) / 10;
      
      // Sort lists by date descending
      item.sales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      item.payments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });

    // Convert to sorted array (latest months first)
    const ledgerHistory = Object.entries(monthlyLedger)
      .map(([monthKey, details]) => ({ monthKey, ...details }))
      .sort((a, b) => b.monthKey.localeCompare(a.monthKey));

    return res.json({
      customer,
      summary: {
        totalLiters: Math.round(totalLiters * 10) / 10,
        totalAmount: Math.round(totalAmount * 10) / 10,
        totalPaid: Math.round(totalPaid * 10) / 10,
        pendingBalance: Math.round(pendingBalance * 10) / 10,
      },
      monthlyLedger: ledgerHistory,
      allSales: sales.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      allPayments: payments.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
    });
  } catch (error) {
    console.error('Error generating ledger:', error);
    return res.status(500).json({ message: 'Error compiling ledger details.' });
  }
});

// POST /api/customers
router.post('/', async (req: any, res: Response) => {
  const { name, phone, village, address, pricePerLiter, customerType, status, notes } = req.body;

  if (!name || !village || pricePerLiter === undefined) {
    return res.status(400).json({ message: 'Name, village, and price per liter are required.' });
  }

  try {
    const newCustomer = await db.customers.create({
      data: {
        name,
        phone: phone || '',
        village,
        address: address || '',
        pricePerLiter: parseFloat(pricePerLiter),
        customerType: customerType || 'INDIVIDUAL',
        status: status || 'ACTIVE',
        notes: notes || '',
      }
    });

    return res.status(201).json(newCustomer);
  } catch (error) {
    console.error('Error creating customer:', error);
    return res.status(500).json({ message: 'Error adding customer.' });
  }
});

// PUT /api/customers/:id
router.put('/:id', async (req: any, res: Response) => {
  const { id } = req.params;
  const { name, phone, village, address, pricePerLiter, customerType, status, notes } = req.body;

  try {
    const updateData: any = {};
    if (name) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (village) updateData.village = village;
    if (address !== undefined) updateData.address = address;
    if (pricePerLiter !== undefined) updateData.pricePerLiter = parseFloat(pricePerLiter);
    if (customerType) updateData.customerType = customerType;
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const updated = await db.customers.update({
      where: { id },
      data: updateData
    });

    if (!updated) {
      return res.status(404).json({ message: 'Customer not found.' });
    }

    return res.json(updated);
  } catch (error) {
    console.error('Error updating customer:', error);
    return res.status(500).json({ message: 'Error updating customer.' });
  }
});

// DELETE /api/customers/:id
router.delete('/:id', async (req: any, res: Response) => {
  const { id } = req.params;
  try {
    const deleted = await db.customers.delete({ where: { id } });
    if (!deleted) {
      return res.status(404).json({ message: 'Customer not found.' });
    }
    return res.json({ message: 'Customer deleted successfully.', customer: deleted });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return res.status(500).json({ message: 'Error deleting customer.' });
  }
});

export default router;
