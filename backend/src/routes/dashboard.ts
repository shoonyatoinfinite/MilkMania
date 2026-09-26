import { Router, Response } from 'express';
import { db } from '../db/db';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);

const getLocalDateStr = (dVal: string | Date = new Date()) => {
  const d = new Date(dVal);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// GET /api/dashboard
router.get('/', async (req: any, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const todayStr = getLocalDateStr();
    const activeStart = startDate ? new Date(startDate as string) : new Date(todayStr + 'T00:00:00.000');
    const activeEnd = endDate ? new Date(endDate as string + 'T23:59:59.999') : new Date(todayStr + 'T23:59:59.999');

    const startMs = activeStart.getTime();
    const endMs = activeEnd.getTime();

    // Fetch lists
    const sales = await db.sales.findMany();
    const payments = await db.payments.findMany();
    const expenses = await db.expenses.findMany();
    const inventory = await db.inventory.findMany();
    const customers = await db.customers.findMany();
    const milkBought = await db.milkBought.findMany();

    // 1. Sales & Revenue Calculations within date range
    const rangeSales = sales.filter((s: any) => {
      const t = new Date(s.date).getTime();
      return t >= startMs && t <= endMs;
    });

    const rangeLitersSold = rangeSales.reduce((sum: number, s: any) => sum + s.quantity, 0);
    const rangeRevenue = rangeSales.reduce((sum: number, s: any) => sum + s.amount, 0);
    const avgSellRate = rangeLitersSold > 0 ? rangeRevenue / rangeLitersSold : 0;

    // Sales Breakdown: Individual vs Bulk
    const customerMap = new Map<string, any>(customers.map((c: any) => [c.id, c]));
    let individualLiters = 0;
    let individualRevenue = 0;
    let individualCount = 0;
    let bulkLiters = 0;
    let bulkRevenue = 0;
    let bulkCount = 0;
    let morningSalesLiters = 0;
    let morningSalesRevenue = 0;
    let eveningSalesLiters = 0;
    let eveningSalesRevenue = 0;

    rangeSales.forEach((s: any) => {
      const cust = customerMap.get(s.customerId);
      const isBulk = cust?.customerType === 'BULK';
      if (isBulk) {
        bulkLiters += s.quantity;
        bulkRevenue += s.amount;
        bulkCount += 1;
      } else {
        individualLiters += s.quantity;
        individualRevenue += s.amount;
        individualCount += 1;
      }

      if (s.shift === 'MORNING') {
        morningSalesLiters += s.quantity;
        morningSalesRevenue += s.amount;
      } else {
        eveningSalesLiters += s.quantity;
        eveningSalesRevenue += s.amount;
      }
    });

    // 3. Milk Bought Calculations within date range
    const rangeMilkBought = milkBought.filter((b: any) => {
      const t = new Date(b.date).getTime();
      return t >= startMs && t <= endMs;
    });

    const rangeLitersBought = rangeMilkBought.reduce((sum: number, b: any) => sum + b.quantity, 0);
    const rangeCostBought = rangeMilkBought.reduce((sum: number, b: any) => sum + b.amount, 0);
    const avgBuyRate = rangeLitersBought > 0 ? rangeCostBought / rangeLitersBought : 0;
    const morningBoughtLiters = rangeMilkBought.filter((b: any) => b.shift === 'MORNING').reduce((sum: number, b: any) => sum + b.quantity, 0);
    const eveningBoughtLiters = rangeMilkBought.filter((b: any) => b.shift === 'EVENING').reduce((sum: number, b: any) => sum + b.quantity, 0);

    // 4. Expenses Calculations within date range (focus on animal care)
    const rangeExpensesList = expenses.filter((e: any) => {
      const t = new Date(e.date).getTime();
      return t >= startMs && t <= endMs;
    });

    const rangeExpenses = rangeExpensesList.reduce((sum: number, e: any) => sum + e.amount, 0);

    const animalExpensesByCategory: Record<string, number> = {};
    rangeExpensesList.forEach((e: any) => {
      const cat = e.category || 'MISCELLANEOUS';
      animalExpensesByCategory[cat] = (animalExpensesByCategory[cat] || 0) + e.amount;
    });

    // Net Profit: Milk Sales Revenue - (Animal Expenses + Milk Bought Cost)
    const rangeProfit = rangeRevenue - (rangeExpenses + rangeCostBought);
    const profitMargin = rangeRevenue > 0 ? Math.round((rangeProfit / rangeRevenue) * 1000) / 10 : 0;

    // 5. Pending Payments
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

    // 6. Monthly Calculations
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

    const monthlyBoughtList = milkBought.filter((b: any) => checkCurrentMonth(b.date));
    const monthlyCostBought = monthlyBoughtList.reduce((sum: number, b: any) => sum + b.amount, 0);

    const monthlyProfit = monthlyRevenue - (monthlyExpenses + monthlyCostBought);

    // 7. Inventory Alerts
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
      .slice(0, 10)
      .map((s: any) => {
        const cust = customerMap.get(s.customerId);
        return {
          id: s.id,
          type: 'SALE',
          customer: { name: cust ? cust.name : 'Unknown Customer', customerType: cust ? cust.customerType : 'INDIVIDUAL' },
          paymentMethod: s.paymentMethod,
          quantity: s.quantity,
          rate: s.rate,
          amount: s.amount,
          date: s.date,
          shift: s.shift,
          remarks: s.remarks
        };
      });

    const recentMilkBought = [...milkBought]
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    const recentExpenses = [...expenses]
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    // 8. Dynamic Chart Metrics
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

    if (chartDiffDays <= 31) {
      for (let i = 0; i < chartDiffDays; i++) {
        const cur = new Date(chartStart);
        cur.setDate(cur.getDate() + i);
        const dayStr = getLocalDateStr(cur);

        const daySales = sales
          .filter((s: any) => getLocalDateStr(s.date) === dayStr)
          .reduce((sum: number, s: any) => sum + s.quantity, 0);

        const dayRevenue = sales
          .filter((s: any) => getLocalDateStr(s.date) === dayStr)
          .reduce((sum: number, s: any) => sum + s.amount, 0);

        const dayBought = milkBought
          .filter((b: any) => getLocalDateStr(b.date) === dayStr)
          .reduce((sum: number, b: any) => sum + b.quantity, 0);

        const dayExpenses = expenses
          .filter((e: any) => getLocalDateStr(e.date) === dayStr)
          .reduce((sum: number, e: any) => sum + e.amount, 0);

        const dayLabel = cur.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });

        chartData.push({
          date: dayStr,
          day: dayLabel,
          sales: Math.round(daySales * 10) / 10,
          revenue: Math.round(dayRevenue * 10) / 10,
          bought: Math.round(dayBought * 10) / 10,
          expenses: Math.round(dayExpenses * 10) / 10
        });
      }
    } else {
      const startYear = chartStart.getFullYear();
      const endYear = chartEnd.getFullYear();

      for (let y = startYear; y <= endYear; y++) {
        const sM = y === startYear ? chartStart.getMonth() : 0;
        const eM = y === endYear ? chartEnd.getMonth() : 11;

        for (let m = sM; m <= eM; m++) {
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

          const monthBought = milkBought
            .filter((b: any) => {
              const d = new Date(b.date);
              return d.getFullYear() === y && d.getMonth() === m;
            })
            .reduce((sum: number, b: any) => sum + b.quantity, 0);

          const monthExpenses = expenses
            .filter((e: any) => {
              const d = new Date(e.date);
              return d.getFullYear() === y && d.getMonth() === m;
            })
            .reduce((sum: number, e: any) => sum + e.amount, 0);

          const monthLabel = new Date(y, m, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

          chartData.push({
            date: `${y}-${String(m+1).padStart(2,'0')}`,
            day: monthLabel,
            sales: Math.round(monthSales * 10) / 10,
            revenue: Math.round(monthRevenue * 10) / 10,
            bought: Math.round(monthBought * 10) / 10,
            expenses: Math.round(monthExpenses * 10) / 10
          });
        }
      }
    }

    const sessionAdjustments = await db.sessionAdjustments.findMany();

    return res.json({
      today: {
        litersSold: Math.round(rangeLitersSold * 10) / 10,
        revenue: Math.round(rangeRevenue * 10) / 10,
        litersBought: Math.round(rangeLitersBought * 10) / 10,
        costBought: Math.round(rangeCostBought * 10) / 10,
        expenses: Math.round(rangeExpenses * 10) / 10,
        profit: Math.round(rangeProfit * 10) / 10
      },
      monthly: {
        revenue: Math.round(monthlyRevenue * 10) / 10,
        expenses: Math.round(monthlyExpenses * 10) / 10,
        costBought: Math.round(monthlyCostBought * 10) / 10,
        profit: Math.round(monthlyProfit * 10) / 10
      },
      pendingPayments: Math.round(totalPendingPayments * 10) / 10,
      lowStockAlerts,
      recentActivity: {
        sales: recentSales,
        milkBought: recentMilkBought,
        expenses: recentExpenses
      },
      weeklyChart: chartData,
      sessionAdjustments: sessionAdjustments,

      // Overall Full Data Analytics at bottom
      analytics: {
        totalSoldLiters: Math.round(rangeLitersSold * 10) / 10,
        totalRevenue: Math.round(rangeRevenue * 10) / 10,
        avgSellRate: Math.round(avgSellRate * 10) / 10,
        individual: {
          liters: Math.round(individualLiters * 10) / 10,
          revenue: Math.round(individualRevenue * 10) / 10,
          count: individualCount,
          percentage: rangeLitersSold > 0 ? Math.round((individualLiters / rangeLitersSold) * 100) : 0
        },
        bulk: {
          liters: Math.round(bulkLiters * 10) / 10,
          revenue: Math.round(bulkRevenue * 10) / 10,
          count: bulkCount,
          percentage: rangeLitersSold > 0 ? Math.round((bulkLiters / rangeLitersSold) * 100) : 0
        },
        shifts: {
          morning: {
            liters: Math.round(morningSalesLiters * 10) / 10,
            revenue: Math.round(morningSalesRevenue * 10) / 10
          },
          evening: {
            liters: Math.round(eveningSalesLiters * 10) / 10,
            revenue: Math.round(eveningSalesRevenue * 10) / 10
          }
        },
        milkBought: {
          liters: Math.round(rangeLitersBought * 10) / 10,
          cost: Math.round(rangeCostBought * 10) / 10,
          avgRate: Math.round(avgBuyRate * 10) / 10,
          count: rangeMilkBought.length,
          morningLiters: Math.round(morningBoughtLiters * 10) / 10,
          eveningLiters: Math.round(eveningBoughtLiters * 10) / 10
        },
        animalExpenses: {
          total: Math.round(rangeExpenses * 10) / 10,
          byCategory: animalExpensesByCategory,
          count: rangeExpensesList.length
        },
        netFinancials: {
          grossRevenue: Math.round(rangeRevenue * 10) / 10,
          milkBoughtCost: Math.round(rangeCostBought * 10) / 10,
          animalExpenses: Math.round(rangeExpenses * 10) / 10,
          netProfit: Math.round(rangeProfit * 10) / 10,
          margin: profitMargin
        }
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({ message: 'Error aggregating dashboard statistics.' });
  }
});

export default router;
