import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../utils/translations';
import { Plus, Trash2, X } from 'lucide-react';

export const Expenses: React.FC = () => {
  const { expenses, createExpense, deleteExpense, language, refreshAllData } = useApp();
  const { t } = useTranslation(language);
  const [modalOpen, setModalOpen] = useState(false);
  const [filterCat, setFilterCat] = useState('');

  useEffect(() => {
    refreshAllData();
  }, []);

  const [form, setForm] = useState({
    category: 'FEED',
    amount: '',
    description: ''
  });

  const handleOpenAdd = () => {
    setForm({
      category: 'FEED',
      amount: '',
      description: ''
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount) return;

    await createExpense({
      ...form,
      date: new Date().toISOString(),
      amount: parseFloat(form.amount)
    });
    setModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    const confirmMsg = t('confirmDeleteMsg');
    if (window.confirm(confirmMsg)) {
      await deleteExpense(id);
    }
  };

  const filteredExpenses = filterCat 
    ? expenses.filter(e => e.category === filterCat)
    : expenses;

  const totalAmount = filteredExpenses.reduce((sum, item) => sum + item.amount, 0);

  const categories = [
    { value: 'FEED', label: t('feedCategoryLabel') },
    { value: 'MEDICINE', label: t('medicineCategoryLabel') },
    { value: 'VETERINARY', label: t('veterinaryCategoryLabel') },
    { value: 'TRANSPORT', label: t('transportCategoryLabel') },
    { value: 'ELECTRICITY', label: t('electricityCategoryLabel') },
    { value: 'WATER', label: t('waterCategoryLabel') },
    { value: 'REPAIRS', label: t('repairsCategoryLabel') },
    { value: 'EQUIPMENT', label: t('equipmentCategoryLabel') },
    { value: 'MISCELLANEOUS', label: t('miscellaneousCategoryLabel') }
  ];

  return (
    <div className="flex-1 min-h-screen pt-5 lg:pt-8 pb-28 lg:pb-12 lg:pl-72 px-4 sm:px-6 max-w-7xl mx-auto text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-space font-extrabold text-dairy-text">{t('expenses')}</h2>
          <p className="text-sm text-dairy-text/60">
            {language === 'hi' ? 'पशु चारा, दवाइयों, डॉक्टर फीस और ढुलाई के खर्चों का विवरण रखें।' : 'Record cattle feed, medicine, veterinary fees, and transport expenses here.'}
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-5 py-3 bg-dairy-coral text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-all text-sm"
        >
          <Plus className="w-5 h-5" />
          <span>{t('logExpense')}</span>
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 bg-white/40 border border-white/60 p-4 rounded-3xl items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-dairy-text/60 uppercase">
            {language === 'hi' ? 'श्रेणी चुनें:' : 'Category Filter:'}
          </span>
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="px-4 py-2 text-xs font-bold rounded-xl glass-input text-dairy-text"
          >
            <option value="">{language === 'hi' ? 'सभी श्रेणियां' : 'All Categories'}</option>
            {categories.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div className="bg-dairy-coral/10 text-dairy-coral px-4 py-2 rounded-2xl text-xs font-extrabold border border-dairy-coral/20">
          {language === 'hi' ? 'श्रेणी कुल मूल्य' : 'Total Amount'}: ₹{Math.round(totalAmount * 10) / 10}
        </div>
      </div>

      {/* Expenses Table */}
      <div className="glass-card rounded-4xl overflow-hidden border border-white/60 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/50 text-[10px] font-bold text-dairy-text/50 uppercase tracking-widest border-b border-white/45">
                <th className="py-4 px-6">Date</th>
                <th className="py-4 px-6">Category</th>
                <th className="py-4 px-6">Description</th>
                <th className="py-4 px-6">Amount</th>
                <th className="py-4 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="text-xs font-semibold text-dairy-text">
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map((exp: any) => (
                  <tr key={exp.id} className="border-b border-white/20 hover:bg-white/20 transition-all">
                    <td className="py-4 px-6">
                      {new Date(exp.date).toLocaleDateString(language === 'en' ? 'en-US' : 'hi-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-4 px-6 font-bold text-dairy-coral">
                      {categories.find(c => c.value === exp.category)?.label.split(' ')[1] || exp.category}
                    </td>
                    <td className="py-4 px-6 text-dairy-text/75">{exp.description || 'No description'}</td>
                    <td className="py-4 px-6 font-space font-bold">₹{exp.amount}</td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleDelete(exp.id)}
                        className="p-2 text-dairy-coral hover:bg-dairy-coral/10 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-dairy-text/40">
                    No expenses recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Dialog */}
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
              <h3 className="font-space font-extrabold text-lg text-dairy-text">{t('logExpense')}</h3>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-dairy-text/60">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
                >
                  {categories.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-dairy-text/60">Amount (INR ₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 2400"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-dairy-text/60">Description / Details</label>
                <input
                  type="text"
                  placeholder="e.g. Purchased 2 bags Binola feed"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-dairy-coral text-white font-bold rounded-2xl shadow-lg mt-2 active:scale-95 transition-all text-sm"
              >
                {t('logExpense')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Expenses;
