import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../utils/translations';
import { Trash2 } from 'lucide-react';

export const Reports: React.FC = () => {
  const { sales, payments, expenses, customers, milkBought, deleteMilkBought, language, refreshAllData } = useApp();
  const { t } = useTranslation(language);

  useEffect(() => {
    refreshAllData();
  }, []);

  const [reportType, setReportType] = useState<'BILLING' | 'BOUGHT' | 'EXPENSE'>('BILLING');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Filter raw data inside useMemo to pass directly to table row mapping
  const compiledData = useMemo(() => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate + 'T23:59:59').getTime();

    if (reportType === 'BOUGHT') {
      return (milkBought || []).filter(b => {
        const t = new Date(b.date).getTime();
        return t >= start && t <= end;
      });
    }

    if (reportType === 'EXPENSE') {
      return (expenses || []).filter(e => {
        const t = new Date(e.date).getTime();
        return t >= start && t <= end;
      });
    }

    // Billing
    return (customers || []).map((c: any) => {
      const cSales = (sales || []).filter(s => {
        const t = new Date(s.date).getTime();
        return s.customerId === c.id && t >= start && t <= end;
      });
      const cPayments = (payments || []).filter(p => {
        const t = new Date(p.date).getTime();
        return p.customerId === c.id && t >= start && t <= end;
      });

      const liters = cSales.reduce((sum, s) => sum + s.quantity, 0);
      const amount = cSales.reduce((sum, s) => sum + s.amount, 0);
      const paid = cPayments.reduce((sum, p) => sum + p.amount, 0);
      const pending = amount - paid;

      return {
        name: c.name,
        type: c.customerType === 'BULK' ? (language === 'hi' ? 'थोक' : 'Bulk') : (language === 'hi' ? 'व्यक्तिगत' : 'Individual'),
        liters: `${Math.round(liters * 10) / 10} L`,
        amount: `₹${Math.round(amount * 10) / 10}`,
        paid: `₹${Math.round(paid * 10) / 10}`,
        pending: `₹${Math.round(pending * 10) / 10}`
      };
    });

  }, [reportType, startDate, endDate, milkBought, sales, payments, expenses, customers, language]);

  // Table header mappings
  const headers = useMemo(() => {
    if (reportType === 'BOUGHT') {
      return [
        language === 'hi' ? 'तारीख' : 'Date',
        language === 'hi' ? 'सप्लायर' : 'Supplier',
        language === 'hi' ? 'शिफ्ट' : 'Shift',
        language === 'hi' ? 'मात्रा (L)' : 'Quantity (L)',
        language === 'hi' ? 'दर (₹/L)' : 'Rate (₹/L)',
        language === 'hi' ? 'कुल राशि' : 'Total Amount',
        language === 'hi' ? 'हटाएं' : 'Action'
      ];
    }
    if (reportType === 'EXPENSE') {
      return [
        language === 'hi' ? 'तारीख' : 'Date',
        language === 'hi' ? 'श्रेणी' : 'Category',
        language === 'hi' ? 'विवरण' : 'Description',
        language === 'hi' ? 'राशि' : 'Amount'
      ];
    }
    return [
      language === 'hi' ? 'ग्राहक का नाम' : 'Customer Name',
      language === 'hi' ? 'प्रकार' : 'Client Type',
      language === 'hi' ? 'बिक्री मात्रा' : 'Liters Purchased',
      language === 'hi' ? 'कुल बिल' : 'Total Amount',
      language === 'hi' ? 'भुगतान हुआ' : 'Amount Paid',
      language === 'hi' ? 'बकाया' : 'Dues Pending'
    ];
  }, [reportType, language]);

  return (
    <div className="flex-1 pb-24 lg:pb-10 lg:pl-72 p-6 max-w-7xl mx-auto text-left">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-space font-extrabold text-dairy-text">{t('farmReports')}</h2>
        <p className="text-sm text-dairy-text/60">
          {language === 'hi' ? 'बिक्री, खरीद और खर्चों की विस्तृत रिपोर्ट' : 'Comprehensive sales, procurement, and expenditure statements'}
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
            <option value="BILLING">📋 {language === 'hi' ? 'ग्राहक खाता विवरण (बिक्री)' : 'Customer Sales & Ledger'}</option>
            <option value="BOUGHT">🛒 {language === 'hi' ? 'दूध खरीद विवरण' : 'Milk Purchase Ledger'}</option>
            <option value="EXPENSE">💸 {language === 'hi' ? 'खर्चा विवरण' : 'Operations Expenses'}</option>
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
          {compiledData.length} {language === 'hi' ? 'रिकॉर्ड मिले' : 'records found'}
        </div>
      </div>

      {/* Printable Report Board */}
      <div className="glass-card rounded-4xl overflow-hidden border border-white/60 shadow-sm print:shadow-none print:border-none">
        <div className="p-6 bg-white/50 border-b border-white/40 flex justify-between items-center print:flex">
          <div className="text-left">
            <h3 className="font-space font-extrabold text-base text-dairy-text">
              {reportType === 'BOUGHT' && (language === 'hi' ? 'दूध खरीद लेजर' : 'Milk Purchase Procurement Summary')}
              {reportType === 'EXPENSE' && (language === 'hi' ? 'परिचालन व्यय लेजर' : 'Operational Expense Ledger')}
              {reportType === 'BILLING' && (language === 'hi' ? 'ग्राहक बिक्री एवं बिलिंग बहीखाता' : 'Customer Ledger Billing Book')}
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
                  if (reportType === 'BOUGHT') {
                    return (
                      <tr key={row.id || rowIdx} className="border-b border-white/10 hover:bg-white/20 transition-all">
                        <td className="py-4 px-6">
                          {new Date(row.date).toLocaleDateString(language === 'en' ? 'en-US' : 'hi-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-4 px-6 font-bold">{row.supplierName}</td>
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                            row.shift === 'MORNING' ? 'bg-dairy-sky/10 text-dairy-sky' : 'bg-dairy-green/10 text-dairy-green'
                          }`}>
                            {row.shift === 'MORNING' ? t('morning') : t('evening')}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-space">{row.quantity} L</td>
                        <td className="py-4 px-6 font-space">₹{row.rate}</td>
                        <td className="py-4 px-6 font-bold font-space text-emerald-700">₹{row.amount}</td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={async () => {
                              if (window.confirm(language === 'hi' ? 'क्या आप इस खरीद रिकॉर्ड को हटाना चाहते हैं?' : 'Delete this purchase entry?')) {
                                await deleteMilkBought(row.id);
                              }
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  }

                  if (reportType === 'EXPENSE') {
                    const categories: { [key: string]: string } = {
                      FEED: language === 'hi' ? '🌾 चारा' : '🌾 Feed Cost',
                      MEDICINE: language === 'hi' ? '🧪 दवाई' : '🧪 Medicine',
                      VETERINARY: language === 'hi' ? '🩺 डॉक्टर' : '🩺 Doctor Fees',
                      TRANSPORT: language === 'hi' ? '🚚 परिवहन' : '🚚 Transport',
                      REPAIRS: language === 'hi' ? '🛠️ मरम्मत' : '🛠️ Repairs',
                      EQUIPMENT: language === 'hi' ? '⚙️ उपकरण' : '⚙️ Equipment',
                      MISCELLANEOUS: language === 'hi' ? '📦 अन्य' : '📦 Misc'
                    };
                    return (
                      <tr key={row.id || rowIdx} className="border-b border-white/10 hover:bg-white/20 transition-all">
                        <td className="py-4 px-6">
                          {new Date(row.date).toLocaleDateString(language === 'en' ? 'en-US' : 'hi-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-4 px-6 font-bold">
                          {categories[row.category] || row.category}
                        </td>
                        <td className="py-4 px-6 text-dairy-text/70">{row.description || '-'}</td>
                        <td className="py-4 px-6 font-bold font-space text-red-600">₹{row.amount}</td>
                      </tr>
                    );
                  }

                  // BILLING
                  return (
                    <tr key={row.name + rowIdx} className="border-b border-white/10 hover:bg-white/20 transition-all">
                      <td className="py-4 px-6 font-bold">{row.name}</td>
                      <td className="py-4 px-6">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {row.type}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-space">{row.liters}</td>
                      <td className="py-4 px-6 font-space font-bold">{row.amount}</td>
                      <td className="py-4 px-6 font-space text-dairy-green">{row.paid}</td>
                      <td className="py-4 px-6 font-space text-red-600 font-bold">{row.pending}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={headers.length} className="text-center py-12 text-dairy-text/40">
                    {language === 'hi' ? 'चयनित अवधि के लिए कोई रिकॉर्ड उपलब्ध नहीं है।' : 'No entries available for selected period.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
