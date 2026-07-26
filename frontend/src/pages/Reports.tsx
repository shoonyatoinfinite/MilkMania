import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../utils/translations';
import { Edit3, Trash2, X } from 'lucide-react';

export const Reports: React.FC = () => {
  const { productions, sales, payments, expenses, customers, animals, language, refreshAllData, updateProduction, deleteProduction } = useApp();
  const { t } = useTranslation(language);

  useEffect(() => {
    refreshAllData();
  }, []);

  const [reportType, setReportType] = useState<'PROD' | 'BILLING' | 'EXPENSE'>('BILLING');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Edit Yield states
  const [editingYield, setEditingYield] = useState<any>(null);
  const [yieldForm, setYieldForm] = useState({
    animalId: '',
    date: '',
    shift: 'MORNING',
    quantity: '',
    homeConsumption: '',
    notes: ''
  });

  const handleOpenEditYield = (p: any) => {
    setEditingYield(p);
    setYieldForm({
      animalId: p.animalId,
      date: new Date(p.date).toISOString().split('T')[0],
      shift: p.shift,
      quantity: String(p.quantity),
      homeConsumption: String(p.homeConsumption || 0),
      notes: p.notes || ''
    });
  };

  const handleUpdateYield = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!yieldForm.animalId || !yieldForm.quantity || !yieldForm.date) return;

    const success = await updateProduction(editingYield.id, {
      ...yieldForm,
      quantity: parseFloat(yieldForm.quantity),
      homeConsumption: parseFloat(yieldForm.homeConsumption || '0'),
      date: new Date(yieldForm.date).toISOString()
    });

    if (success) {
      setEditingYield(null);
    }
  };

  const handleDeleteYield = async (id: string) => {
    if (window.confirm(language === 'hi' ? 'क्या आप इस रिकॉर्ड को हटाना चाहते हैं?' : 'Are you sure you want to delete this yield record?')) {
      await deleteProduction(id);
    }
  };

  // Filter raw data inside useMemo to pass directly to table row mapping
  const compiledData = useMemo(() => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate + 'T23:59:59').getTime();

    if (reportType === 'PROD') {
      return productions.filter(p => {
        const t = new Date(p.date).getTime();
        return t >= start && t <= end;
      });
    }

    if (reportType === 'EXPENSE') {
      return expenses.filter(e => {
        const t = new Date(e.date).getTime();
        return t >= start && t <= end;
      });
    }

    // Billing
    return customers.map((c: any) => {
      const cSales = sales.filter(s => {
        const t = new Date(s.date).getTime();
        return s.customerId === c.id && t >= start && t <= end;
      });
      const cPayments = payments.filter(p => {
        const t = new Date(p.date).getTime();
        return p.customerId === c.id && t >= start && t <= end;
      });

      const liters = cSales.reduce((sum, s) => sum + s.quantity, 0);
      const amount = cSales.reduce((sum, s) => sum + s.amount, 0);
      const paid = cPayments.reduce((sum, p) => sum + p.amount, 0);
      const pending = amount - paid;

      return {
        name: c.name,
        type: c.customerType === 'BULK' ? 'Bulk' : 'Individual',
        liters: `${Math.round(liters * 10) / 10} L`,
        amount: `₹${Math.round(amount * 10) / 10}`,
        paid: `₹${Math.round(paid * 10) / 10}`,
        pending: `₹${Math.round(pending * 10) / 10}`
      };
    });

  }, [reportType, startDate, endDate, productions, sales, payments, expenses, customers]);

  // Table header mappings
  const headers = useMemo(() => {
    if (reportType === 'PROD') {
      return ['Date', 'Animal', 'Shift', 'Liters Produced', 'Notes', 'Actions'];
    }
    if (reportType === 'EXPENSE') {
      return ['Date', 'Category', 'Description', 'Amount'];
    }
    return ['Customer Name', 'Client Type', 'Liters Purchased', 'Total Amount', 'Amount Paid', 'Dues Pending'];
  }, [reportType]);

  return (
    <div className="flex-1 pb-24 lg:pb-10 lg:pl-72 p-6 max-w-7xl mx-auto text-left">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-space font-extrabold text-dairy-text">{t('farmReports')}</h2>
        <p className="text-sm text-dairy-text/60">
          {t('reportsSubtitle')}
        </p>
      </div>

      {/* Filter toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white/40 border border-white/60 p-5 rounded-4xl mb-6 items-end">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-dairy-text/60">{t('reportType')}</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as any)}
            className="w-full px-4 py-2.5 rounded-2xl text-xs font-semibold glass-input text-dairy-text"
          >
            <option value="BILLING">📋 Customer Ledger Statements</option>
            <option value="PROD">🥛 Milk Yield History</option>
            <option value="EXPENSE">💸 Operations Expenses</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-dairy-text/60">{t('startDate')}</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-4 py-2.5 rounded-2xl text-xs font-semibold glass-input text-dairy-text"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-dairy-text/60">{t('endDate')}</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-4 py-2.5 rounded-2xl text-xs font-semibold glass-input text-dairy-text"
          />
        </div>

        <div className="bg-dairy-sky/15 text-dairy-sky p-3 rounded-2xl text-[10px] font-extrabold tracking-wide text-center uppercase border border-dairy-sky/20">
          Range: {compiledData.length} records found
        </div>
      </div>

      {/* Printable Report Board */}
      <div className="glass-card rounded-4xl overflow-hidden border border-white/60 shadow-sm print:shadow-none print:border-none">
        <div className="p-6 bg-white/50 border-b border-white/40 flex justify-between items-center print:flex">
          <div className="text-left">
            <h3 className="font-space font-extrabold text-base text-dairy-text">
              {reportType === 'PROD' && 'Buffalo Production Summary'}
              {reportType === 'EXPENSE' && 'Operational Expense Ledger'}
              {reportType === 'BILLING' && 'Villager Ledger Billing Book'}
            </h3>
            <p className="text-[10px] text-dairy-text/50 font-semibold mt-0.5">
              Period: {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}
            </p>
          </div>
          <span className="text-xl">🥛</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/40 text-[9px] font-bold text-dairy-text/50 uppercase tracking-widest border-b border-white/30">
                {headers.map((h, i) => (
                  <th key={i} className="py-4 px-6">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="text-xs font-semibold text-dairy-text">
              {compiledData.length > 0 ? (
                compiledData.map((row: any, rowIdx) => {
                  if (reportType === 'PROD') {
                    const animal = animals.find(a => a.id === row.animalId);
                    return (
                      <tr key={row.id} className="border-b border-white/10 hover:bg-white/20 transition-all">
                        <td className="py-4 px-6">
                          {new Date(row.date).toLocaleDateString(language === 'en' ? 'en-US' : 'hi-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-4 px-6 font-bold">{animal ? animal.name : 'Unknown'}</td>
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                            row.shift === 'MORNING' ? 'bg-dairy-sky/10 text-dairy-sky' : 'bg-dairy-green/10 text-dairy-green'
                          }`}>
                            {row.shift === 'MORNING' ? t('morning') : t('evening')}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-space">{row.quantity} L</td>
                        <td className="py-4 px-6 text-dairy-text/75">{row.notes || '-'}</td>
                        <td className="py-4 px-6 text-right flex gap-1 justify-end">
                          <button
                            onClick={() => handleOpenEditYield(row)}
                            className="p-2 text-dairy-sky hover:bg-dairy-sky/10 rounded-xl transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteYield(row.id)}
                            className="p-2 text-dairy-coral hover:bg-dairy-coral/10 rounded-xl transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  }

                  if (reportType === 'EXPENSE') {
                    const categories: { [key: string]: string } = {
                      FEED: '🌾 Feed Cost',
                      MEDICINE: '🧪 Medicine',
                      VETERINARY: '🩺 Doctor Fees',
                      TRANSPORT: '🚚 Transport',
                      REPAIRS: '🛠️ Repairs',
                      MISCELLANEOUS: '📦 Misc'
                    };
                    return (
                      <tr key={row.id} className="border-b border-white/10 hover:bg-white/20 transition-all">
                        <td className="py-4 px-6">
                          {new Date(row.date).toLocaleDateString(language === 'en' ? 'en-US' : 'hi-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-4 px-6 font-bold">{categories[row.category] || row.category}</td>
                        <td className="py-4 px-6 text-dairy-text/75">{row.description || '-'}</td>
                        <td className="py-4 px-6 font-space font-bold text-dairy-coral">₹{row.amount}</td>
                      </tr>
                    );
                  }

                  // Default: BILLING
                  return (
                    <tr key={rowIdx} className="border-b border-white/10 hover:bg-white/20 transition-all">
                      <td className="py-4 px-6 font-bold">{row.name}</td>
                      <td className="py-4 px-6">
                        <span className="text-[10px] bg-dairy-sky/10 text-dairy-sky border border-dairy-sky/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          {row.type}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-space">{row.liters}</td>
                      <td className="py-4 px-6 font-space">{row.amount}</td>
                      <td className="py-4 px-6 font-space text-dairy-green">{row.paid}</td>
                      <td className={`py-4 px-6 font-space font-bold ${parseFloat(row.pending.replace('₹','')) > 0 ? 'text-dairy-coral' : 'text-dairy-green'}`}>
                        {row.pending}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={headers.length} className="py-12 text-center text-dairy-text/40">
                    No entries found in this date range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Yield Modal */}
      {editingYield && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="absolute inset-0" onClick={() => setEditingYield(null)} />

          <div className="relative w-full max-w-md bg-milk-50 border border-white/60 rounded-4xl p-6 shadow-2xl z-10 text-left">
            <button
              onClick={() => setEditingYield(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white border border-white/80 shadow-sm"
            >
              <X className="w-5 h-5 text-dairy-text/70" />
            </button>

            <form onSubmit={handleUpdateYield} className="flex flex-col gap-4">
              <h3 className="font-space font-extrabold text-lg text-dairy-text">Edit Yield Record</h3>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-dairy-text/60">Animal</label>
                <select
                  value={yieldForm.animalId}
                  onChange={(e) => setYieldForm({ ...yieldForm, animalId: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
                  required
                >
                  {animals.filter((a: any) => a.status === 'ACTIVE' || a.id === yieldForm.animalId).map((a: any) => (
                    <option key={a.id} value={a.id}>{a.name} ({a.breed})</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-dairy-text/60">Date</label>
                <input
                  type="date"
                  value={yieldForm.date}
                  onChange={(e) => setYieldForm({ ...yieldForm, date: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-dairy-text/60">{t('shift')}</label>
                <select
                  value={yieldForm.shift}
                  onChange={(e) => setYieldForm({ ...yieldForm, shift: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
                >
                  <option value="MORNING">☀️ {t('morning')}</option>
                  <option value="EVENING">🌙 {t('evening')}</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-dairy-text/60">Quantity (Liters)</label>
                <input
                  type="number"
                  step="0.1"
                  value={yieldForm.quantity}
                  onChange={(e) => setYieldForm({ ...yieldForm, quantity: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-dairy-text/60">Home Consumption (Liters)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 1.0"
                  value={yieldForm.homeConsumption}
                  onChange={(e) => setYieldForm({ ...yieldForm, homeConsumption: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-dairy-text/60">Notes</label>
                <input
                  type="text"
                  value={yieldForm.notes}
                  onChange={(e) => setYieldForm({ ...yieldForm, notes: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-dairy-sky text-white font-bold rounded-2xl shadow-lg mt-2 active:scale-95 transition-all text-sm"
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Reports;
