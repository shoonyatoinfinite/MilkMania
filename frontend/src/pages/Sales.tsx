import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../utils/translations';
import { Plus, Trash2, X, Phone, MapPin } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const CustomerSalesTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 rounded-2xl shadow-xl text-left">
        <p className="text-[9px] font-extrabold uppercase mb-1 text-dairy-text/40">{label}</p>
        <div className="flex items-center gap-2 text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-dairy-sky" />
          <span className="text-dairy-text/75">Quantity:</span>
          <span className="font-space font-extrabold text-dairy-text">{payload[0].value} L</span>
        </div>
      </div>
    );
  }
  return null;
};

export const Sales: React.FC = () => {
  const { sales, customers, payments, createSale, deleteSale, language, refreshAllData } = useApp();
  const { t } = useTranslation(language);
  const [modalOpen, setModalOpen] = useState(false);
  const [filterCust, setFilterCust] = useState('');
  const [selectedCustomerForModal, setSelectedCustomerForModal] = useState<any>(null);
  const [modalStartDate, setModalStartDate] = useState('');
  const [modalEndDate, setModalEndDate] = useState('');

  useEffect(() => {
    refreshAllData();
  }, []);

  const paidSalesStatusMap = useMemo(() => {
    const map: { [saleId: string]: { status: string; paidAmount: number } } = {};
    
    // Group payments by customerId
    const paymentsByCust: { [custId: string]: any[] } = {};
    (payments || []).forEach((p: any) => {
      if (!paymentsByCust[p.customerId]) paymentsByCust[p.customerId] = [];
      paymentsByCust[p.customerId].push(p);
    });

    // Group sales by customerId
    const salesByCust: { [custId: string]: any[] } = {};
    sales.forEach((s: any) => {
      if (!salesByCust[s.customerId]) salesByCust[s.customerId] = [];
      salesByCust[s.customerId].push(s);
    });

    // Run FIFO matching for each customer
    Object.keys(salesByCust).forEach((custId) => {
      const custSales = salesByCust[custId];
      const custPayments = paymentsByCust[custId] || [];
      
      // Sort sales chronologically: oldest first
      const sortedSales = [...custSales].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      let totalPayments = custPayments.reduce((sum: number, p: any) => sum + p.amount, 0);

      for (const sale of sortedSales) {
        if (sale.paymentMethod !== 'PENDING') {
          map[sale.id] = { status: sale.paymentMethod, paidAmount: sale.amount };
        } else {
          if (totalPayments >= sale.amount) {
            map[sale.id] = { status: 'PAID', paidAmount: sale.amount };
            totalPayments -= sale.amount;
          } else if (totalPayments > 0) {
            map[sale.id] = { status: 'PARTIAL', paidAmount: totalPayments };
            totalPayments = 0;
          } else {
            map[sale.id] = { status: 'PENDING', paidAmount: 0 };
          }
        }
      }
    });

    return map;
  }, [sales, payments]);

  const getAutoShift = (): 'MORNING' | 'EVENING' => {
    return new Date().getHours() >= 13 ? 'EVENING' : 'MORNING';
  };

  // Form state
  const [form, setForm] = useState({
    customerId: '',
    shift: getAutoShift(),
    quantity: '',
    rate: '',
    paymentMethod: 'PENDING',
    remarks: ''
  });

  const handleOpenAdd = () => {
    setForm({
      customerId: '',
      shift: getAutoShift(),
      quantity: '',
      rate: '',
      paymentMethod: 'PENDING',
      remarks: ''
    });
    setModalOpen(true);
  };

  const handleCustChange = (custId: string) => {
    const cust = customers.find(c => c.id === custId);
    setForm(prev => ({
      ...prev,
      customerId: custId,
      rate: cust ? String(cust.pricePerLiter) : ''
    }));
  };

  const isSameDay = (d1: string | Date, d2: string | Date) => {
    const a = new Date(d1);
    const b = new Date(d2);
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerId || !form.quantity) return;

    // Check duplicate sale for customer in this shift today
    const duplicate = sales.find((s: any) => 
      s.customerId === form.customerId && 
      s.shift === form.shift && 
      isSameDay(s.date, new Date())
    );

    if (duplicate) {
      alert(
        language === 'hi'
          ? `इस ग्राहक के लिए आज के ${form.shift === 'MORNING' ? 'सुबह' : 'शाम'} के सत्र में पहले से ही दूध बिक्री का रिकॉर्ड दर्ज है। एक सत्र में केवल एक बार ही रिकॉर्ड भरा जा सकता है।`
          : `Milk record already filled for this customer in ${form.shift === 'MORNING' ? 'Morning' : 'Evening'} shift today. A customer cannot have more than one record in each shift.`
      );
      return;
    }

    const ok = await createSale({
      ...form,
      date: new Date().toISOString(),
      quantity: parseFloat(form.quantity),
      rate: parseFloat(form.rate),
      amount: parseFloat(form.quantity) * parseFloat(form.rate)
    });
    if (ok) {
      setModalOpen(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmMsg = t('confirmDeleteMsg');
    if (window.confirm(confirmMsg)) {
      await deleteSale(id);
    }
  };

  // Filter sales
  const filteredSales = filterCust 
    ? sales.filter(s => s.customerId === filterCust)
    : sales;

  return (
    <div className="flex-1 min-h-screen pt-5 lg:pt-8 pb-28 lg:pb-12 lg:pl-72 px-4 sm:px-6 max-w-7xl mx-auto text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-space font-extrabold text-dairy-text">{t('sales')}</h2>
          <p className="text-sm text-dairy-text/60">
            {t('salesSubtitle')}
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-5 py-3 bg-dairy-green text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-all text-sm"
        >
          <Plus className="w-5 h-5" />
          <span>{t('recordSale')}</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="mb-6 flex gap-4 bg-white/40 border border-white/60 p-4 rounded-3xl items-center">
        <span className="text-xs font-bold text-dairy-text/60 uppercase">
          {t('selectCustomerFilter')}
        </span>
        <select
          value={filterCust}
          onChange={(e) => setFilterCust(e.target.value)}
          className="px-4 py-2 text-xs font-bold rounded-xl glass-input text-dairy-text"
        >
          <option value="">{t('allCustomersOption')}</option>
          {customers.map(c => (
            <option key={c.id} value={c.id}>{c.name} ({c.village})</option>
          ))}
        </select>
      </div>

      {/* Table list */}
      <div className="glass-card rounded-4xl overflow-hidden border border-white/60 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/50 text-[10px] font-bold text-dairy-text/50 uppercase tracking-widest border-b border-white/45">
                <th className="py-4 px-6">Date</th>
                <th className="py-4 px-6">{t('customer')}</th>
                <th className="py-4 px-6">{t('shift')}</th>
                <th className="py-4 px-6">{t('quantity')}</th>
                <th className="py-4 px-6">{t('rate')}</th>
                <th className="py-4 px-6">{t('amount')}</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="text-xs font-semibold text-dairy-text">
              {filteredSales.length > 0 ? (
                filteredSales.map((sale: any) => {
                  const cust = customers.find(c => c.id === sale.customerId);
                  return (
                    <tr key={sale.id} className="border-b border-white/20 hover:bg-white/20 transition-all">
                      <td className="py-4 px-6">
                        {new Date(sale.date).toLocaleDateString(language === 'en' ? 'en-US' : 'hi-IN', { day: 'numeric', month: 'short' })}
                      </td>
                      <td className="py-4 px-6 font-bold">
                        {cust ? (
                          <span 
                            onClick={() => setSelectedCustomerForModal(cust)}
                            className="cursor-pointer text-dairy-sky hover:text-dairy-sky/80 hover:underline flex items-center gap-1"
                          >
                            {cust.name}
                          </span>
                        ) : (
                          'Unknown Client'
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          sale.shift === 'MORNING' ? 'bg-dairy-sky/10 text-dairy-sky' : 'bg-dairy-green/10 text-dairy-green'
                        }`}>
                          {sale.shift === 'MORNING' ? t('morning') : t('evening')}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-space">{sale.quantity} L</td>
                      <td className="py-4 px-6 font-space">₹{sale.rate}</td>
                      <td className="py-4 px-6 font-space font-bold text-dairy-text">₹{sale.amount}</td>
                      <td className="py-4 px-6">
                        {(() => {
                          const statusInfo = paidSalesStatusMap[sale.id] || { status: sale.paymentMethod, paidAmount: 0 };
                          if (statusInfo.status === 'PAID') {
                            return (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-dairy-green/10 text-dairy-green">
                                ✅ {language === 'hi' ? 'चुकता' : 'PAID'}
                              </span>
                            );
                          } else if (statusInfo.status === 'PARTIAL') {
                            return (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-dairy-gold/10 text-dairy-gold">
                                ⚠️ {language === 'hi' ? `आंशिक (₹${Math.round(statusInfo.paidAmount * 10) / 10} चुकता)` : `PARTIAL (Paid ₹${Math.round(statusInfo.paidAmount * 10) / 10})`}
                              </span>
                            );
                          } else if (statusInfo.status === 'PENDING') {
                            return (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-dairy-coral/10 text-dairy-coral">
                                💸 {language === 'hi' ? 'बकाया' : 'PENDING'}
                              </span>
                            );
                          } else {
                            return (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-dairy-green/10 text-dairy-green">
                                {statusInfo.status === 'UPI' ? '📱 UPI' : '💵 CASH'}
                              </span>
                            );
                          }
                        })()}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleDelete(sale.id)}
                          className="p-2 text-dairy-coral hover:bg-dairy-coral/10 rounded-xl transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-dairy-text/40">
                    {t('noSalesToday')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Entry sheets popup */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-milk-50 border border-white/60 rounded-4xl p-6 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white border border-white/80 shadow-sm"
            >
              <X className="w-5 h-5 text-dairy-text/70" />
            </button>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <h3 className="font-space font-extrabold text-lg text-dairy-text">{t('recordSale')}</h3>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-dairy-text/60">{t('selectCustomer')}</label>
                <select
                  value={form.customerId}
                  onChange={(e) => handleCustChange(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
                  required
                >
                  <option value="" disabled hidden>-- Select Customer --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.village})</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-dairy-text/60">{t('shift')}</label>
                <select
                  value={form.shift}
                  onChange={(e) => setForm({ ...form, shift: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
                  required
                >
                  <option value="" disabled hidden>-- Select Shift --</option>
                  <option value="MORNING">☀️ {t('morning')}</option>
                  <option value="EVENING">🌙 {t('evening')}</option>
                </select>
              </div>

              {form.customerId && sales.some((s: any) => s.customerId === form.customerId && s.shift === form.shift && isSameDay(s.date, new Date())) && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-2xl text-amber-800 text-xs font-bold flex items-center gap-2">
                  <span>⚠️</span>
                  <span>
                    {language === 'hi'
                      ? `इस ग्राहक के लिए आज ${form.shift === 'MORNING' ? 'सुबह' : 'शाम'} का रिकॉर्ड पहले से दर्ज है।`
                      : `A milk record is already recorded for this customer in ${form.shift === 'MORNING' ? 'Morning' : 'Evening'} shift today.`}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-dairy-text/60">{t('quantity')}</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 2.0"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-dairy-text/60">{t('rate')} (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 65"
                    value={form.rate}
                    onChange={(e) => setForm({ ...form, rate: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-dairy-text/60">{t('paymentMethod')}</label>
                <select
                  value={form.paymentMethod}
                  onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
                >
                  <option value="PENDING">💸 {t('pending')}</option>
                  <option value="CASH">💵 {t('cash')}</option>
                  <option value="UPI">📱 {t('upi')}</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-dairy-text/60">{t('remarks')}</label>
                <input
                  type="text"
                  placeholder="Notes about quality or delivery"
                  value={form.remarks}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-dairy-green text-white font-bold rounded-2xl shadow-lg mt-2 active:scale-95 transition-all text-sm"
              >
                {t('saveSale')}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Customer Details Modal */}
      {selectedCustomerForModal && (() => {
        const cust = selectedCustomerForModal;

        const getLocalDateStr = (dStr: string) => {
          const d = new Date(dStr);
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };

        const custSales = sales.filter((s: any) => {
          if (s.customerId !== cust.id) return false;
          const sDate = getLocalDateStr(s.date);
          if (modalStartDate && sDate < modalStartDate) return false;
          if (modalEndDate && sDate > modalEndDate) return false;
          return true;
        });

        const custPayments = (payments || []).filter((p: any) => {
          if (p.customerId !== cust.id) return false;
          const pDate = getLocalDateStr(p.date);
          if (modalStartDate && pDate < modalStartDate) return false;
          if (modalEndDate && pDate > modalEndDate) return false;
          return true;
        });

        const totalLiters = custSales.reduce((sum: number, s: any) => sum + s.quantity, 0);
        const totalBill = custSales.reduce((sum: number, s: any) => sum + s.amount, 0);
        const totalPaid = custPayments.reduce((sum: number, p: any) => sum + p.amount, 0);
        const outstandingDues = totalBill - totalPaid;

        // Group sales for the chart
        const chartData = [...custSales]
          .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .reduce((acc: any[], curr: any) => {
            const dateStr = new Date(curr.date).toLocaleDateString(language === 'en' ? 'en-US' : 'hi-IN', { day: 'numeric', month: 'short' });
            const existing = acc.find(item => item.date === dateStr);
            if (existing) {
              existing.quantity += curr.quantity;
            } else {
              acc.push({ date: dateStr, quantity: curr.quantity });
            }
            return acc;
          }, [])
          .slice(-7); // Last 7 active days

        return (
          <div className="fixed inset-0 z-[100] bg-black/45 backdrop-blur-sm flex items-center justify-center p-4 text-left">
            <div className="bg-milk-50 border border-white/70 rounded-4xl p-6 w-full max-w-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => {
                  setSelectedCustomerForModal(null);
                  setModalStartDate('');
                  setModalEndDate('');
                }}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white border border-white/80 shadow-sm"
              >
                <X className="w-5 h-5 text-dairy-text/70" />
              </button>

              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-dairy-sky/15 flex items-center justify-center text-dairy-sky shrink-0 text-xl font-bold">
                  👤
                </div>
                <div>
                  <h3 className="font-space font-extrabold text-xl text-dairy-text">{cust.name}</h3>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs font-semibold text-dairy-text/60">
                    <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {cust.phone || 'No phone'}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {cust.village || 'No village'}</span>
                    <span className="px-2 py-0.5 rounded-full bg-dairy-sky/10 text-dairy-sky text-[9px] font-bold uppercase">{cust.customerType}</span>
                  </div>
                </div>
              </div>

              {/* Date Filter Range */}
              <div className="flex flex-wrap items-center gap-3 bg-white/40 border border-white/60 p-3.5 rounded-3xl mb-6 text-xs font-bold">
                <span className="text-dairy-text/60 uppercase">Filter Period:</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-dairy-text/50">From</span>
                  <input
                    type="date"
                    value={modalStartDate}
                    onChange={(e) => setModalStartDate(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-white/80 glass-input text-dairy-text text-[11px]"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-dairy-text/50">To</span>
                  <input
                    type="date"
                    value={modalEndDate}
                    onChange={(e) => setModalEndDate(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-white/80 glass-input text-dairy-text text-[11px]"
                  />
                </div>
                {(modalStartDate || modalEndDate) && (
                  <button
                    onClick={() => {
                      setModalStartDate('');
                      setModalEndDate('');
                    }}
                    className="px-3 py-1.5 bg-dairy-coral/10 hover:bg-dairy-coral/20 text-dairy-coral rounded-xl transition-all"
                  >
                    Clear Filter
                  </button>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white/50 border border-white/80 rounded-2xl p-4">
                  <p className="text-[10px] font-bold text-dairy-text/50 uppercase tracking-wider mb-1">Total Milk Bought</p>
                  <p className="text-lg font-space font-extrabold text-dairy-text">{Math.round(totalLiters * 10) / 10} L</p>
                </div>
                <div className="bg-white/50 border border-white/80 rounded-2xl p-4">
                  <p className="text-[10px] font-bold text-dairy-text/50 uppercase tracking-wider mb-1">Total Milk Value</p>
                  <p className="text-lg font-space font-extrabold text-dairy-text">₹{Math.round(totalBill * 10) / 10}</p>
                </div>
                <div className="bg-white/50 border border-white/80 rounded-2xl p-4">
                  <p className="text-[10px] font-bold text-dairy-text/50 uppercase tracking-wider mb-1">Net Outstanding</p>
                  <p className={`text-lg font-space font-extrabold ${outstandingDues > 0 ? 'text-dairy-coral' : 'text-dairy-green'}`}>
                    ₹{Math.round(outstandingDues * 10) / 10}
                  </p>
                </div>
              </div>

              {/* Chart section */}
              <div className="mb-6">
                <h4 className="font-space font-bold text-sm text-dairy-text mb-3">Purchase History Chart (Liters)</h4>
                <div className="w-full h-48 bg-white/20 border border-white/50 rounded-3xl p-3">
                  {chartData.length === 0 ? (
                    <div className="w-full h-full flex items-center justify-center text-xs text-dairy-text/40 font-bold border border-dashed border-white/50 rounded-2xl">
                      No milk purchases logged yet.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <defs>
                          <filter id="shadowCust" x="-10%" y="-10%" width="120%" height="130%">
                            <feDropShadow dx="0" dy="5" stdDeviation="2.5" floodColor="#0EA5E9" floodOpacity="0.2" />
                          </filter>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.04)" />
                        <XAxis dataKey="date" stroke="rgba(0,0,0,0.3)" style={{ fontSize: 9, fontWeight: 'bold' }} tickLine={false} axisLine={false} />
                        <YAxis stroke="rgba(0,0,0,0.3)" style={{ fontSize: 9, fontWeight: 'bold' }} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomerSalesTooltip />} />
                        <Line type="monotone" dataKey="quantity" name="Liters" stroke="#0EA5E9" strokeWidth={3.5} dot={{ r: 3, stroke: '#0EA5E9', strokeWidth: 1.5, fill: '#fff' }} activeDot={{ r: 5 }} filter="url(#shadowCust)" />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Transaction list */}
              <div>
                <h4 className="font-space font-bold text-sm text-dairy-text mb-3">Recent Purchases</h4>
                <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
                  {custSales.length === 0 ? (
                    <p className="text-xs text-dairy-text/40 font-bold py-4 text-center">No purchases recorded.</p>
                  ) : (
                    [...custSales]
                      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0, 5)
                      .map((sale: any) => (
                        <div key={sale.id} className="flex justify-between items-center p-3 rounded-2xl bg-white/60 border border-white shadow-sm text-xs font-semibold text-dairy-text">
                          <div>
                            <p className="font-bold">
                              {new Date(sale.date).toLocaleDateString(language === 'en' ? 'en-US' : 'hi-IN', { day: 'numeric', month: 'short' })}
                              {' '}<span className="text-[10px] text-dairy-text/40">({sale.shift === 'MORNING' ? '☀️ Morning' : '🌙 Evening'})</span>
                            </p>
                            <p className="text-[10px] text-dairy-text/50 mt-0.5">Rate: ₹{sale.rate}/L • Qty: {sale.quantity} L</p>
                          </div>
                          <div className="text-right">
                            <p className="font-space font-extrabold text-sm">₹{sale.amount}</p>
                            {(() => {
                              const statusInfo = paidSalesStatusMap[sale.id] || { status: sale.paymentMethod, paidAmount: 0 };
                              if (statusInfo.status === 'PAID') {
                                return <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-dairy-green/10 text-dairy-green">✅ PAID</span>;
                              } else if (statusInfo.status === 'PARTIAL') {
                                return <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-dairy-gold/10 text-dairy-gold">⚠️ PARTIAL</span>;
                              } else if (statusInfo.status === 'PENDING') {
                                return <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-dairy-coral/10 text-dairy-coral">💸 PENDING</span>;
                              } else {
                                return <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-dairy-green/10 text-dairy-green">{statusInfo.status}</span>;
                              }
                            })()}
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
};
export default Sales;
