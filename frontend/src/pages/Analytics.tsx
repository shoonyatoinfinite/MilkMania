import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../utils/translations';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';

export const Analytics: React.FC = () => {
  const { sales, milkBought, expenses, customers, language } = useApp();
  const { t } = useTranslation(language);

  // Compute monthly milk sold vs milk bought comparison
  const monthlyFlowData = useMemo(() => {
    const monthlyMap: { [key: string]: { month: string; sold: number; bought: number } } = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    (sales || []).forEach(s => {
      const d = new Date(s.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyMap[key]) {
        monthlyMap[key] = { month: `${months[d.getMonth()]} ${d.getFullYear().toString().substring(2)}`, sold: 0, bought: 0 };
      }
      monthlyMap[key].sold += s.quantity;
    });

    (milkBought || []).forEach(b => {
      const d = new Date(b.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyMap[key]) {
        monthlyMap[key] = { month: `${months[d.getMonth()]} ${d.getFullYear().toString().substring(2)}`, sold: 0, bought: 0 };
      }
      monthlyMap[key].bought += b.quantity;
    });

    return Object.entries(monthlyMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([_, val]) => ({
        ...val,
        sold: Math.round(val.sold * 10) / 10,
        bought: Math.round(val.bought * 10) / 10
      }))
      .slice(-6);
  }, [sales, milkBought]);

  // Financial performance (Revenue vs Expenses & Milk Bought)
  const financialData = useMemo(() => {
    const financeMap: { [key: string]: { month: string; revenue: number; expenses: number } } = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    (sales || []).forEach(s => {
      const d = new Date(s.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!financeMap[key]) {
        financeMap[key] = { month: `${months[d.getMonth()]} ${d.getFullYear().toString().substring(2)}`, revenue: 0, expenses: 0 };
      }
      financeMap[key].revenue += s.amount;
    });

    (expenses || []).forEach(e => {
      const d = new Date(e.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!financeMap[key]) {
        financeMap[key] = { month: `${months[d.getMonth()]} ${d.getFullYear().toString().substring(2)}`, revenue: 0, expenses: 0 };
      }
      financeMap[key].expenses += e.amount;
    });

    (milkBought || []).forEach(b => {
      const d = new Date(b.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!financeMap[key]) {
        financeMap[key] = { month: `${months[d.getMonth()]} ${d.getFullYear().toString().substring(2)}`, revenue: 0, expenses: 0 };
      }
      financeMap[key].expenses += b.amount;
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
  }, [sales, expenses, milkBought]);

  // Expense category distributions
  const expensePieData = useMemo(() => {
    const catMap: { [key: string]: number } = {};
    (expenses || []).forEach(e => {
      catMap[e.category] = (catMap[e.category] || 0) + e.amount;
    });

    const categoryLabels: { [key: string]: string } = {
      FEED: language === 'hi' ? '🌾 पशु चारा' : '🌾 Cattle Feed',
      MEDICINE: language === 'hi' ? '🧪 दवाई' : '🧪 Medicine & Tonic',
      VETERINARY: language === 'hi' ? '🩺 डॉक्टर की फीस' : '🩺 Doctor Fees',
      TRANSPORT: language === 'hi' ? '🚚 किराया और तेल' : '🚚 Transport/Fuel',
      REPAIRS: language === 'hi' ? '🛠️ मरम्मत' : '🛠️ Repairs/Maint',
      EQUIPMENT: language === 'hi' ? '⚙️ उपकरण' : '⚙️ Equipment',
      MISCELLANEOUS: language === 'hi' ? '📦 अन्य खर्चे' : '📦 Other Costs'
    };

    return Object.entries(catMap).map(([key, val]) => ({
      name: categoryLabels[key] || key,
      value: Math.round(val * 10) / 10
    }));
  }, [expenses, language]);

  // Customer Sales Volume Share
  const customerShareData = useMemo(() => {
    const custMap: { [key: string]: number } = {};
    const customerLookup = new Map<string, any>((customers || []).map((c: any) => [c.id, c]));

    (sales || []).forEach(s => {
      const cust = customerLookup.get(s.customerId);
      const name = cust ? cust.name : (language === 'hi' ? 'अज्ञात ग्राहक' : 'Unknown');
      custMap[name] = (custMap[name] || 0) + s.quantity;
    });

    return Object.entries(custMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, val]) => ({
        name,
        value: Math.round(val * 10) / 10
      }));
  }, [sales, customers, language]);

  const PIE_COLORS = ['#0284C7', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  return (
    <div className="flex-1 min-h-screen pt-5 lg:pt-8 pb-28 lg:pb-12 lg:pl-72 px-4 sm:px-6 max-w-7xl mx-auto text-left">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-space font-extrabold text-dairy-text">{t('analytics')}</h2>
        <p className="text-sm text-dairy-text/60">
          {language === 'hi' ? 'दूध बिक्री, खरीद और आय-व्यय का पूर्ण विश्लेषण' : 'Comprehensive sales, purchases, and profit analysis'}
        </p>
      </div>

      {/* Grid Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Sales vs Bought Volume */}
        <div className="glass-card rounded-4xl p-6">
          <div>
            <h3 className="font-space font-bold text-lg text-dairy-text">
              {language === 'hi' ? 'दूध बिक्री बनाम खरीद (L)' : 'Milk Sold vs Bought (L)'}
            </h3>
            <p className="text-xs text-dairy-text/50 mb-6">
              {language === 'hi' ? 'महीनेवार दूध बिक्री और खरीद की तुलना (लीटर)' : 'Monthly comparison of milk sales and purchase volumes'}
            </p>
          </div>

          <div className="h-64 w-full text-xs font-semibold">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyFlowData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
                <XAxis dataKey="month" stroke="rgba(0,0,0,0.3)" />
                <YAxis stroke="rgba(0,0,0,0.3)" />
                <Tooltip />
                <Legend />
                <Area type="monotone" name={language === 'hi' ? 'बिक्री (L)' : 'Sold (L)'} dataKey="sold" stroke="#0284C7" strokeWidth={3} fill="rgba(2,132,199,0.12)" />
                <Area type="monotone" name={language === 'hi' ? 'खरीद (L)' : 'Bought (L)'} dataKey="bought" stroke="#10B981" strokeWidth={3} fill="rgba(16,185,129,0.12)" />
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
              {language === 'hi' ? 'राजस्व बनाम कुल लागत (INR ₹)' : 'Revenue vs Total Costs (INR ₹)'}
            </p>
          </div>

          <div className="h-64 w-full text-xs font-semibold">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
                <XAxis dataKey="month" stroke="rgba(0,0,0,0.3)" />
                <YAxis stroke="rgba(0,0,0,0.3)" />
                <Tooltip />
                <Legend />
                <Bar name={language === 'hi' ? 'कुल आय' : 'Revenue'} dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar name={language === 'hi' ? 'कुल लागत' : 'Total Cost'} dataKey="expenses" fill="#EF4444" radius={[4, 4, 0, 0]} />
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
            <p className="text-xs text-dairy-text/40 text-center py-12">
              {language === 'hi' ? 'प्रदर्शित करने के लिए कोई खर्चा नहीं मिला।' : 'No expense entries found to display.'}
            </p>
          )}
        </div>

        {/* Customer Volume Share */}
        <div className="glass-card rounded-4xl p-6">
          <div>
            <h3 className="font-space font-bold text-lg text-dairy-text">
              {language === 'hi' ? 'शीर्ष ग्राहक बिक्री शेयर' : 'Top Customer Sales Share'}
            </h3>
            <p className="text-xs text-dairy-text/50 mb-4">
              {language === 'hi' ? 'प्रमुख ग्राहकों का दूध खरीद हिस्सा (लीटर)' : 'Percentage Share of Milk Volume by Top Customers'}
            </p>
          </div>

          {customerShareData.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="h-48 w-48 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={customerShareData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {customerShareData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[(index + 2) % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value} Liters`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legends list */}
              <div className="flex flex-col gap-2.5 text-xs text-left w-full">
                {customerShareData.map((item, index) => (
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
            <p className="text-xs text-dairy-text/40 text-center py-12">
              {language === 'hi' ? 'प्रदर्शित करने के लिए कोई बिक्री दर्ज नहीं है।' : 'No milk sales logged to display.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
