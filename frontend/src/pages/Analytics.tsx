import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../utils/translations';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';

export const Analytics: React.FC = () => {
  const { productions, sales, expenses, customers, animals, language } = useApp();
  const { t } = useTranslation(language);

  // Compute monthly production vs sales comparison
  const monthlyFlowData = useMemo(() => {
    const monthlyMap: { [key: string]: { month: string; yield: number; sales: number } } = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    productions.forEach(p => {
      const d = new Date(p.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyMap[key]) {
        monthlyMap[key] = { month: `${months[d.getMonth()]} ${d.getFullYear().toString().substring(2)}`, yield: 0, sales: 0 };
      }
      monthlyMap[key].yield += p.quantity;
    });

    sales.forEach(s => {
      const d = new Date(s.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyMap[key]) {
        monthlyMap[key] = { month: `${months[d.getMonth()]} ${d.getFullYear().toString().substring(2)}`, yield: 0, sales: 0 };
      }
      monthlyMap[key].sales += s.quantity;
    });

    return Object.entries(monthlyMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([_, val]) => ({
        ...val,
        yield: Math.round(val.yield * 10) / 10,
        sales: Math.round(val.sales * 10) / 10
      }))
      .slice(-6);
  }, [productions, sales]);

  // Financial performance (Revenue vs Expenses)
  const financialData = useMemo(() => {
    const financeMap: { [key: string]: { month: string; revenue: number; expenses: number } } = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    sales.forEach(s => {
      const d = new Date(s.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!financeMap[key]) {
        financeMap[key] = { month: `${months[d.getMonth()]} ${d.getFullYear().toString().substring(2)}`, revenue: 0, expenses: 0 };
      }
      financeMap[key].revenue += s.amount;
    });

    expenses.forEach(e => {
      const d = new Date(e.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!financeMap[key]) {
        financeMap[key] = { month: `${months[d.getMonth()]} ${d.getFullYear().toString().substring(2)}`, revenue: 0, expenses: 0 };
      }
      financeMap[key].expenses += e.amount;
    });

    return Object.entries(financeMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([_, val]) => ({
        ...val,
        revenue: Math.round(val.revenue * 10) / 10,
        expenses: Math.round(val.expenses * 10) / 10,
        profit: Math.round((val.revenue - val.expenses) * 10) / 10
      }))
      .slice(-6);
  }, [sales, expenses]);

  // Expense category distributions
  const expensePieData = useMemo(() => {
    const catMap: { [key: string]: number } = {};
    expenses.forEach(e => {
      catMap[e.category] = (catMap[e.category] || 0) + e.amount;
    });

    const categoryLabels: { [key: string]: string } = {
      FEED: language === 'hi' ? '🌾 पशु चारा' : '🌾 Cattle Feed',
      MEDICINE: language === 'hi' ? '🧪 दवाई' : '🧪 Medicine & Tonic',
      VETERINARY: language === 'hi' ? '🩺 डॉक्टर की फीस' : '🩺 Doctor Fees',
      TRANSPORT: language === 'hi' ? '🚚 किराया और तेल' : '🚚 Transport/Fuel',
      REPAIRS: language === 'hi' ? '🛠️ मरम्मत' : '🛠️ Repairs/Maint',
      MISCELLANEOUS: language === 'hi' ? '📦 अन्य खर्चे' : '📦 Other Costs'
    };

    return Object.entries(catMap).map(([key, val]) => ({
      name: categoryLabels[key] || key,
      value: Math.round(val * 10) / 10
    }));
  }, [expenses, language]);

  // Animal-wise Yield Share
  const animalYieldData = useMemo(() => {
    const yieldMap: { [key: string]: number } = {};
    productions.forEach(p => {
      const animal = animals.find(a => a.id === p.animalId);
      const name = animal ? animal.name : 'Unknown';
      yieldMap[name] = (yieldMap[name] || 0) + p.quantity;
    });

    return Object.entries(yieldMap).map(([name, val]) => ({
      name,
      value: Math.round(val * 10) / 10
    }));
  }, [productions, animals]);

  const PIE_COLORS = ['#38BDF8', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  return (
    <div className="flex-1 pb-24 lg:pb-10 lg:pl-72 p-6 max-w-7xl mx-auto text-left">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-space font-extrabold text-dairy-text">{t('analytics')}</h2>
        <p className="text-sm text-dairy-text/60">
          {t('analyticsSubtitle')}
        </p>
      </div>

      {/* Grid Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Yield vs Sales Volume */}
        <div className="glass-card rounded-4xl p-6">
          <div>
            <h3 className="font-space font-bold text-lg text-dairy-text">
              {language === 'hi' ? 'दूध मात्रा चार्ट' : 'Milk Volume Chart'}
            </h3>
            <p className="text-xs text-dairy-text/50 mb-6">
              {language === 'hi' ? 'दूध उत्पादन बनाम बिक्री मात्रा (लीटर)' : 'Produced vs Sold Volume (Liters)'}
            </p>
          </div>

          <div className="h-64 w-full text-xs font-semibold">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyFlowData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={document.documentElement.getAttribute('data-theme') === 'midnight' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)'} />
                <XAxis dataKey="month" stroke={document.documentElement.getAttribute('data-theme') === 'midnight' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)'} />
                <YAxis stroke={document.documentElement.getAttribute('data-theme') === 'midnight' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)'} />
                <Tooltip />
                <Legend />
                <Area type="monotone" name={language === 'hi' ? 'उत्पादन (L)' : 'Produced (L)'} dataKey="yield" stroke="#38BDF8" strokeWidth={3} fill="rgba(56,189,248,0.1)" />
                <Area type="monotone" name={language === 'hi' ? 'बिक्री (L)' : 'Sold (L)'} dataKey="sales" stroke="#10B981" strokeWidth={3} fill="rgba(16,185,129,0.1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Finance breakdown (Revenue vs Expense) */}
        <div className="glass-card rounded-4xl p-6">
          <div>
            <h3 className="font-space font-bold text-lg text-dairy-text">
              {language === 'hi' ? 'वित्तीय विश्लेषण' : 'Financial Analysis'}
            </h3>
            <p className="text-xs text-dairy-text/50 mb-6">
              {language === 'hi' ? 'राजस्व बनाम व्यय (INR ₹)' : 'Revenue vs Expenses (INR ₹)'}
            </p>
          </div>

          <div className="h-64 w-full text-xs font-semibold">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={document.documentElement.getAttribute('data-theme') === 'midnight' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)'} />
                <XAxis dataKey="month" stroke={document.documentElement.getAttribute('data-theme') === 'midnight' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)'} />
                <YAxis stroke={document.documentElement.getAttribute('data-theme') === 'midnight' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)'} />
                <Tooltip />
                <Legend />
                <Bar name={language === 'hi' ? 'कुल आय' : 'Revenue'} dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar name={language === 'hi' ? 'कुल खर्चे' : 'Expenses'} dataKey="expenses" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expenses Distribution */}
        <div className="glass-card rounded-4xl p-6">
          <div>
            <h3 className="font-space font-bold text-lg text-dairy-text">
              {language === 'hi' ? 'व्यय विवरण' : 'Expense Breakdown'}
            </h3>
            <p className="text-xs text-dairy-text/50 mb-4">
              {language === 'hi' ? 'श्रेणी वार खर्चों का प्रतिशत विवरण' : 'Percentage Share of Expenses by Category'}
            </p>
          </div>

          {expensePieData.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="h-48 w-48 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expensePieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {expensePieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `₹${value}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legends list */}
              <div className="flex flex-col gap-2.5 text-xs text-left w-full">
                {expensePieData.map((item, index) => (
                  <div key={item.name} className="flex justify-between items-center bg-white/30 px-3 py-1.5 rounded-xl border border-white/50">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                      <span className="font-semibold text-dairy-text/80">{item.name}</span>
                    </span>
                    <span className="font-bold font-space text-dairy-text">₹{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-dairy-text/40 text-center py-12">No expense entries found to display.</p>
          )}
        </div>

        {/* Yield distribution among cows */}
        <div className="glass-card rounded-4xl p-6">
          <div>
            <h3 className="font-space font-bold text-lg text-dairy-text">
              {language === 'hi' ? 'दूध उत्पादन प्रतिशत' : 'Milk Yield Share'}
            </h3>
            <p className="text-xs text-dairy-text/50 mb-4">
              {language === 'hi' ? 'कुल उत्पादित दूध में भैंसों का प्रतिशत हिस्सा' : 'Percentage Share of Yield by Animal'}
            </p>
          </div>

          {animalYieldData.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="h-48 w-48 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={animalYieldData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {animalYieldData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[(index + 2) % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value} Liters`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legends list */}
              <div className="flex flex-col gap-2.5 text-xs text-left w-full">
                {animalYieldData.map((item, index) => (
                  <div key={item.name} className="flex justify-between items-center bg-white/30 px-3 py-1.5 rounded-xl border border-white/50">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[(index + 2) % PIE_COLORS.length] }} />
                      <span className="font-semibold text-dairy-text/80">{item.name}</span>
                    </span>
                    <span className="font-bold font-space text-dairy-text">{item.value} Liters</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-dairy-text/40 text-center py-12">No milk yields logged to display.</p>
          )}
        </div>
      </div>
    </div>
  );
};
export default Analytics;
