import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../utils/translations';
import { Plus, Trash2, X } from 'lucide-react';

export const Payments: React.FC = () => {
  const { payments, customers, createPayment, deletePayment, language, refreshAllData } = useApp();
  const { t } = useTranslation(language);
  const [modalOpen, setModalOpen] = useState(false);
  const [filterCust, setFilterCust] = useState('');

  useEffect(() => {
    refreshAllData();
  }, []);

  const [form, setForm] = useState({
    customerId: '',
    amount: '',
    paymentMethod: 'UPI',
    remarks: ''
  });

  const handleOpenAdd = () => {
    setForm({
      customerId: '',
      amount: '',
      paymentMethod: 'UPI',
      remarks: ''
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerId || !form.amount) return;

    await createPayment({
      ...form,
      date: new Date().toISOString(),
      amount: parseFloat(form.amount)
    });
    setModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    const confirmMsg = t('confirmDeleteMsg');
    if (window.confirm(confirmMsg)) {
      await deletePayment(id);
    }
  };

  const filteredPayments = filterCust 
    ? payments.filter(p => p.customerId === filterCust)
    : payments;

  return (
    <div className="flex-1 min-h-screen pt-20 lg:pt-8 pb-28 lg:pb-12 lg:pl-72 px-4 sm:px-6 max-w-7xl mx-auto text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-space font-extrabold text-dairy-text">
            {t('paymentsTitle')}
          </h2>
          <p className="text-sm text-dairy-text/60">
            {t('paymentsSubtitle')}
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-5 py-3 bg-dairy-gold text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-all text-sm"
        >
          <Plus className="w-5 h-5" />
          <span>{t('collectDues')}</span>
        </button>
      </div>

      {/* Filter toolbar */}
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

      {/* Payments Table */}
      <div className="glass-card rounded-4xl overflow-hidden border border-white/60 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/50 text-[10px] font-bold text-dairy-text/50 uppercase tracking-widest border-b border-white/45">
                <th className="py-4 px-6">Date</th>
                <th className="py-4 px-6">{t('customer')}</th>
                <th className="py-4 px-6">Payment Mode</th>
                <th className="py-4 px-6">{t('remarks')}</th>
                <th className="py-4 px-6">Amount Paid</th>
                <th className="py-4 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="text-xs font-semibold text-dairy-text">
              {filteredPayments.length > 0 ? (
                filteredPayments.map((p: any) => {
                  const cust = customers.find(c => c.id === p.customerId);
                  return (
                    <tr key={p.id} className="border-b border-white/20 hover:bg-white/20 transition-all">
                      <td className="py-4 px-6">
                        {new Date(p.date).toLocaleDateString(language === 'en' ? 'en-US' : 'hi-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-4 px-6 font-bold">{cust ? cust.name : 'Unknown Client'}</td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                          p.paymentMethod === 'UPI' ? 'bg-dairy-sky/10 text-dairy-sky' : 'bg-dairy-gold/10 text-dairy-gold'
                        }`}>
                          {p.paymentMethod === 'UPI' ? t('upi') : t('cash')}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-dairy-text/70">{p.remarks || 'No remarks'}</td>
                      <td className="py-4 px-6 font-space font-bold text-dairy-green">₹{p.amount}</td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleDelete(p.id)}
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
                  <td colSpan={6} className="py-12 text-center text-dairy-text/40">
                    No payment logs recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add popup */}
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
              <h3 className="font-space font-extrabold text-lg text-dairy-text">{t('collectDues')}</h3>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-dairy-text/60">{t('selectCustomer')}</label>
                <select
                  value={form.customerId}
                  onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
                  required
                >
                  <option value="" disabled hidden>-- Select Customer --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.pendingBalance < 0 ? `${t('advance')}: ₹${Math.abs(c.pendingBalance)}` : `Due: ₹${c.pendingBalance}`})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-dairy-text/60">Amount Received (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 1000"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-dairy-text/60">Payment Mode</label>
                <select
                  value={form.paymentMethod}
                  onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
                >
                  <option value="UPI">📱 {t('upi')}</option>
                  <option value="CASH">💵 {t('cash')}</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-dairy-text/60">{t('remarks')}</label>
                <input
                  type="text"
                  placeholder="e.g. Ledger clearance"
                  value={form.remarks}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-dairy-gold text-white font-bold rounded-2xl shadow-lg mt-2 active:scale-95 transition-all text-sm"
              >
                {t('collectDues')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Payments;
