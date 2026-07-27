import { Router, Response } from 'express';
import { db } from '../db/db';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);

// GET /api/dashboard
const getLocalDateStr = (dVal: string | Date = new Date()) => {
  const d = new Date(dVal);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

router.get('/', async (req: any, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const todayStr = getLocalDateStr();
    const activeStart = startDate ? new Date(startDate as string) : new Date(todayStr + 'T00:00:00.000');
    const activeEnd = endDate ? new Date(endDate as string + 'T23:59:59.999') : new Date(todayStr + 'T23:59:59.999');

    const startMs = activeStart.getTime();
    const endMs = activeEnd.getTime();

    // Fetch lists
    const productions = await db.productions.findMany();
    const sales = await db.sales.findMany();
    const payments = await db.payments.findMany();
    const expenses = await db.expenses.findMany();
    const inventory = await db.inventory.findMany();
    const customers = await db.customers.findMany();

    // 1. Production Yield Calculations within date range (minus home consumption)
    const rangeProductions = productions.filter((p: any) => {
      const t = new Date(p.date).getTime();
      return t >= startMs && t <= endMs;
    });

    const rangeMorningYield = rangeProductions
      .filter((p: any) => p.shift === 'MORNING')
      .reduce((sum: number, p: any) => sum + (p.quantity - (p.homeConsumption || 0)), 0);

    const rangeEveningYield = rangeProductions
      .filter((p: any) => p.shift === 'EVENING')
      .reduce((sum: number, p: any) => sum + (p.quantity - (p.homeConsumption || 0)), 0);

    const rangeTotalYield = rangeMorningYield + rangeEveningYield;

    // 2. Sales & Revenue Calculations within date range
    const rangeSales = sales.filter((s: any) => {
      const t = new Date(s.date).getTime();
      return t >= startMs && t <= endMs;
    });

    const rangeLitersSold = rangeSales.reduce((sum: number, s: any) => sum + s.quantity, 0);
    const rangeRevenue = rangeSales.reduce((sum: number, s: any) => sum + s.amount, 0);

    // 3. Expenses Calculations within date range
    const rangeExpensesList = expenses.filter((e: any) => {
      const t = new Date(e.date).getTime();
      return t >= startMs && t <= endMs;
    });

    const rangeExpenses = rangeExpensesList.reduce((sum: number, e: any) => sum + e.amount, 0);
    const rangeProfit = rangeRevenue - rangeExpenses;

    // 4. Pending Payments (Overall dues across all customers - remains overall all-time pending)
    let totalPendingPayments = 0;
    customers.forEach((customer: any) => {
      const custSales = sales.filter((s: any) => s.customerId === customer.id);
      const custPayments = payments.filter((p: any) => p.customerId === customer.id);
      
      const salesAmt = custSales.reduce((sum: number, s: any) => sum + s.amount, 0);
      const paidAmt = custPayments.reduce((sum: number, p: any) => sum + p.amount, 0);
      const balance = salesAmt - paidAmt;
      if (balance > 0) {
        totalPendingPayments += balance;
      }
    });

    // 5. Monthly Calculations (Current Calendar Month - used for context card fallback)
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const checkCurrentMonth = (dateStr: string) => {
      const d = new Date(dateStr);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    };

    const monthlySales = sales.filter((s: any) => checkCurrentMonth(s.date));
    const monthlyRevenue = monthlySales.reduce((sum: number, s: any) => sum + s.amount, 0);

    const monthlyExpensesList = expenses.filter((e: any) => checkCurrentMonth(e.date));
    const monthlyExpenses = monthlyExpensesList.reduce((sum: number, e: any) => sum + e.amount, 0);
    const monthlyProfit = monthlyRevenue - monthlyExpenses;

    // 6. Inventory Alerts (Low stock items)
    const lowStockAlerts = inventory
      .filter((item: any) => item.quantity <= item.minStockAlert)
      .map((item: any) => ({
        id: item.id,
        itemName: item.itemName,
        quantity: item.quantity,
        unit: item.unit,
        minStockAlert: item.minStockAlert
      }));

    const recentSales = [...sales]
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
      .map((s: any) => {
        const cust = customers.find((c: any) => c.id === s.customerId);
        return {
          id: s.id,
          type: 'SALE',
          customer: { name: cust ? cust.name : 'Unknown Customer' },
          paymentMethod: s.paymentMethod,
          quantity: s.quantity,
          amount: s.amount,
          date: s.date,
          shift: s.shift
        };
      });

    const recentProductions = [...productions]
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    // 8. Dynamic Chart Metrics based on selected range (defaults to last 7 days if today is selected)
    const chartData = [];
    const diffTime = Math.abs(endMs - startMs);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let chartStart = new Date(activeStart);
    let chartEnd = new Date(activeEnd);
    let chartDiffDays = diffDays;

    if (getLocalDateStr(activeStart) === getLocalDateStr(activeEnd)) {
      chartStart = new Date(activeStart);
      chartStart.setDate(chartStart.getDate() - 6);
      chartStart.setHours(0, 0, 0, 0);
      chartEnd = new Date(activeEnd);
      chartDiffDays = 7;
    }

    if (chartDiffDays <= 35) {
      // Group by Day
      for (let d = new Date(chartStart); d <= chartEnd; d.setDate(d.getDate() + 1)) {
        const dStr = getLocalDateStr(d);
        
        const dayYield = productions
          .filter((p: any) => getLocalDateStr(p.date) === dStr)
          .reduce((sum: number, p: any) => sum + (p.quantity - (p.homeConsumption || 0)), 0);

        const dayTotalYield = productions
          .filter((p: any) => getLocalDateStr(p.date) === dStr)
          .reduce((sum: number, p: any) => sum + p.quantity, 0);

        const daySales = sales
          .filter((s: any) => getLocalDateStr(s.date) === dStr)
          .reduce((sum: number, s: any) => sum + s.quantity, 0);

        const dayRevenue = sales
          .filter((s: any) => getLocalDateStr(s.date) === dStr)
          .reduce((sum: number, s: any) => sum + s.amount, 0);

        const label = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

        chartData.push({
          date: dStr,
          day: label,
          yield: Math.round(dayYield * 10) / 10,
          totalYield: Math.round(dayTotalYield * 10) / 10,
          sales: Math.round(daySales * 10) / 10,
          revenue: Math.round(dayRevenue * 10) / 10
        });
      }
    } else {
      // Group by Month
      const startYear = activeStart.getFullYear();
      const startMonth = activeStart.getMonth();
      const endYear = activeEnd.getFullYear();
      const endMonth = activeEnd.getMonth();

      for (let y = startYear; y <= endYear; y++) {
        const mStart = (y === startYear) ? startMonth : 0;
        const mEnd = (y === endYear) ? endMonth : 11;

        for (let m = mStart; m <= mEnd; m++) {
          const monthYield = productions
            .filter((p: any) => {
              const d = new Date(p.date);
              return d.getFullYear() === y && d.getMonth() === m;
            })
            .reduce((sum: number, p: any) => sum + (p.quantity - (p.homeConsumption || 0)), 0);

          const monthTotalYield = productions
            .filter((p: any) => {
              const d = new Date(p.date);
              return d.getFullYear() === y && d.getMonth() === m;
            })
            .reduce((sum: number, p: any) => sum + p.quantity, 0);

          const monthSales = sales
            .filter((s: any) => {
              const d = new Date(s.date);
              return d.getFullYear() === y && d.getMonth() === m;
            })
            .reduce((sum: number, s: any) => sum + s.quantity, 0);

          const monthRevenue = sales
            .filter((s: any) => {
              const d = new Date(s.date);
              return d.getFullYear() === y && d.getMonth() === m;
            })
            .reduce((sum: number, s: any) => sum + s.amount, 0);

          const monthLabel = new Date(y, m, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

          chartData.push({
            date: `${y}-${String(m+1).padStart(2,'0')}`,
            day: monthLabel,
            yield: Math.round(monthYield * 10) / 10,
            totalYield: Math.round(monthTotalYield * 10) / 10,
            sales: Math.round(monthSales * 10) / 10,
            revenue: Math.round(monthRevenue * 10) / 10
          });
        }
      }
    }

    const sessionAdjustments = await db.sessionAdjustments.findMany();

    return res.json({
      today: {
        totalYield: Math.round(rangeTotalYield * 10) / 10,
        morningYield: Math.round(rangeMorningYield * 10) / 10,
        eveningYield: Math.round(rangeEveningYield * 10) / 10,
        litersSold: Math.round(rangeLitersSold * 10) / 10,
        revenue: Math.round(rangeRevenue * 10) / 10,
        expenses: Math.round(rangeExpenses * 10) / 10,
        profit: Math.round(rangeProfit * 10) / 10
      },
      monthly: {
        revenue: Math.round(monthlyRevenue * 10) / 10,
        expenses: Math.round(monthlyExpenses * 10) / 10,
        profit: Math.round(monthlyProfit * 10) / 10
      },
      pendingPayments: Math.round(totalPendingPayments * 10) / 10,
      lowStockAlerts,
      recentActivity: {
        sales: recentSales,
        productions: recentProductions
      },
      weeklyChart: chartData,
      sessionAdjustments: sessionAdjustments
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({ message: 'Error aggregating dashboard statistics.' });
  }
});

export default router;
