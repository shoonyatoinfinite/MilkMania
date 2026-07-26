import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../utils/translations';
import { Plus, Edit3, Trash2, BookOpen, Phone, MapPin, X } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

export const Customers: React.FC = () => {
  const { customers, createCustomer, updateCustomer, deleteCustomer, createPayment, language, settings, refreshAllData } = useApp();
  const { t } = useTranslation(language);

  useEffect(() => {
    refreshAllData();
  }, []);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);

  // Ledger state
  const [ledgerCustomer, setLedgerCustomer] = useState<any>(null);
  const [ledgerData, setLedgerData] = useState<any>(null);
  const [loadingLedger, setLoadingLedger] = useState(false);
  
  // Date filter for print statement
  const [printStart, setPrintStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [printEnd, setPrintEnd] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Payment quick dialog within ledger
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('UPI');

  // Customer Form state
  const [form, setForm] = useState({
    name: '',
    phone: '',
    village: '',
    address: '',
    pricePerLiter: '',
    customerType: 'INDIVIDUAL',
    status: 'ACTIVE',
    notes: ''
  });

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setForm({
      name: '',
      phone: '',
      village: '',
      address: '',
      pricePerLiter: '',
      customerType: '',
      status: '',
      notes: ''
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (c: any) => {
    setEditingCustomer(c);
    setForm({
      name: c.name,
      phone: c.phone || '',
      village: c.village,
      address: c.address || '',
      pricePerLiter: String(c.pricePerLiter),
      customerType: c.customerType,
      status: c.status,
      notes: c.notes || ''
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.phone && form.phone.length !== 10) {
      alert(language === 'hi' ? 'मोबाइल नंबर बिल्कुल 10 अंकों का होना चाहिए।' : 'Mobile number must be exactly 10 digits.');
      return;
    }

    const data = {
      ...form,
      pricePerLiter: parseFloat(form.pricePerLiter || '0')
    };

    let ok = false;
    if (editingCustomer) {
      ok = await updateCustomer(editingCustomer.id, data);
    } else {
      ok = await createCustomer(data);
    }
    if (ok) {
      setModalOpen(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmMsg = language === 'hi' 
      ? 'क्या आप इस ग्राहक को हटाना चाहते हैं? इसके सारे दूध बिक्री के रिकॉर्ड भी हट जाएंगे।' 
      : 'Are you sure you want to remove this customer? This will wipe out all sales and payments records linked to them.';
    if (window.confirm(confirmMsg)) {
      await deleteCustomer(id);
    }
  };

  // Fetch monthly ledger detail
  const handleOpenLedger = async (customer: any) => {
    setLedgerCustomer(customer);
    setLoadingLedger(true);
    try {
      const res = await axios.get(`${API_BASE}/customers/${customer.id}/ledger`);
      setLedgerData(res.data);
    } catch (e) {
      console.error('Error fetching ledger details:', e);
      alert('Error fetching ledger details.');
    } finally {
      setLoadingLedger(false);
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payAmount || parseFloat(payAmount) <= 0) return;

    try {
      await createPayment({
        customerId: ledgerCustomer.id,
        amount: parseFloat(payAmount),
        paymentMethod: payMethod,
        date: new Date().toISOString(),
        remarks: 'Payment from monthly ledger view'
      });
      setPayAmount('');
      // Reload ledger
      handleOpenLedger(ledgerCustomer);
    } catch (err) {
      console.error('Payment failed', err);
    }
  };

  // Print filtered customer ledger calculations
  const printStatement = useMemo(() => {
    if (!ledgerCustomer || !ledgerData) return { sales: [], payments: [], liters: 0, due: 0, paid: 0, balance: 0, previousBalance: 0, totalOutstanding: 0 };
    
    const getLocalDateStr = (dStr: string) => {
      const d = new Date(dStr);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const startDateStr = printStart;
    const endDateStr = printEnd;

    // Filter sales within date range
    const filteredSales = (ledgerData.allSales || []).filter((s: any) => {
      const dateStr = getLocalDateStr(s.date);
      return dateStr >= startDateStr && dateStr <= endDateStr;
    });

    // Sales prior to start date
    const priorSales = (ledgerData.allSales || []).filter((s: any) => {
      const dateStr = getLocalDateStr(s.date);
      return dateStr < startDateStr;
    });

    // Filter payments within date range
    const filteredPayments = (ledgerData.allPayments || []).filter((p: any) => {
      const dateStr = getLocalDateStr(p.date);
      return dateStr >= startDateStr && dateStr <= endDateStr;
    });

    // Payments prior to start date
    const priorPayments = (ledgerData.allPayments || []).filter((p: any) => {
      const dateStr = getLocalDateStr(p.date);
      return dateStr < startDateStr;
    });

    const totalLiters = filteredSales.reduce((sum: number, s: any) => sum + s.quantity, 0);
    const totalDue = filteredSales.reduce((sum: number, s: any) => sum + s.amount, 0);
    const totalPaid = filteredPayments.reduce((sum: number, p: any) => sum + p.amount, 0);
    
    const previousDue = priorSales.reduce((sum: number, s: any) => sum + s.amount, 0);
    const previousPaid = priorPayments.reduce((sum: number, p: any) => sum + p.amount, 0);
    const previousBalance = previousDue - previousPaid;

    const totalOutstanding = previousBalance + totalDue - totalPaid;

    return {
      sales: filteredSales,
      payments: filteredPayments,
      liters: Math.round(totalLiters * 10) / 10,
      due: Math.round(totalDue * 10) / 10,
      paid: Math.round(totalPaid * 10) / 10,
      previousBalance: Math.round(previousBalance * 10) / 10,
      totalOutstanding: Math.round(totalOutstanding * 10) / 10
    };
  }, [ledgerCustomer, ledgerData, printStart, printEnd]);

  return (
    <div className="flex-1 pb-24 lg:pb-10 lg:pl-72 p-6 max-w-7xl mx-auto text-left print:p-0 print:pl-0 print:max-w-none">
      
      {/* 1. VISUAL PORTAL LAYOUT (HIDDEN ON PRINT) */}
      <div className="print:hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-space font-extrabold text-dairy-text">{t('customers')}</h2>
            <p className="text-sm text-dairy-text/60">
              {language === 'hi' ? 'डेयरी के ग्राहकों की सूची और उनके खाता बही पत्र।' : 'Manage customer accounts, billing details, and ledger books.'}
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-5 py-3 bg-dairy-sky text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-all text-sm"
          >
            <Plus className="w-5 h-5" />
            <span>{t('addCustomer')}</span>
          </button>
        </div>

        {/* Grid of Customers */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customers.length > 0 ? (
            customers.map((c: any) => (
              <div key={c.id} className="glass-card rounded-4xl p-6 flex flex-col justify-between relative overflow-hidden">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-space font-bold text-base text-dairy-text">{c.name}</h3>
                      <span className="text-[10px] bg-dairy-sky/10 text-dairy-sky border border-dairy-sky/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        {c.customerType === 'BULK' ? 'Bulk Milkman' : 'Individual'}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wide uppercase ${
                      c.status === 'ACTIVE' ? 'bg-dairy-green/10 text-dairy-green' : 'bg-dairy-coral/10 text-dairy-coral'
                    }`}>
                      {c.status}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 text-xs text-dairy-text/70 mb-6">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-dairy-sky" />
                      <span>{c.phone || 'No phone'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-dairy-sky" />
                      <span>{c.village}{c.address ? `, ${c.address}` : ''}</span>
                    </div>
                    <div className="mt-1 font-bold text-dairy-text">
                      💰 {t('rate')}: <span className="text-dairy-sky">₹{c.pricePerLiter}/L</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 border-t border-white/20 pt-4 mt-2">
                  <button
                    onClick={() => handleOpenLedger(c)}
                    className="flex-1 py-2.5 bg-dairy-sky/10 hover:bg-dairy-sky/20 text-dairy-sky font-bold rounded-xl text-xs active:scale-95 transition-all flex items-center justify-center gap-1.5"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>{t('ledgerBook')}</span>
                  </button>

                  <button
                    onClick={() => handleOpenEdit(c)}
                    className="p-2.5 bg-white/60 hover:bg-white border border-white/85 text-dairy-text/75 rounded-xl active:scale-95 transition-all"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(c.id)}
                    className="p-2.5 bg-dairy-coral/10 hover:bg-dairy-coral/20 text-dairy-coral rounded-xl active:scale-95 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-16 text-center text-dairy-text/40 font-bold glass-card rounded-4xl">
              {t('noCustomers')}
            </div>
          )}
        </div>
      </div>

      {/* 2. CUSTOMER ADD/EDIT DIALOG (HIDDEN ON PRINT) */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 print:hidden">
          <div className="absolute inset-0" onClick={() => setModalOpen(false)} />

          <div className="relative w-full max-w-md bg-milk-50 rounded-[32px] p-6 shadow-2xl border border-white/80 max-h-[90vh] overflow-y-auto text-left z-10">
            <button 
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white border border-white/80 shadow-sm"
            >
              <X className="w-4 h-4 text-dairy-text/80" />
            </button>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <h3 className="font-space font-extrabold text-lg text-dairy-text">
                {editingCustomer ? t('editDetails') : t('addCustomer')}
              </h3>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-dairy-text/60">{t('fullName')}</label>
                <input
                  type="text"
                  placeholder="e.g. Rampal Singh"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-dairy-text/60">Phone</label>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={form.phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, ''); // keep only numbers
                      if (val.length <= 10) {
                        setForm({ ...form, phone: val });
                      }
                    }}
                    className="w-full px-4 py-3 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-dairy-text/60">Village</label>
                  <input
                    type="text"
                    placeholder="e.g. Bhaini Maharajpur"
                    value={form.village}
                    onChange={(e) => setForm({ ...form, village: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-dairy-text/60">{t('rate')} (₹/L)</label>
                  <input
                    type="number"
                    placeholder="65"
                    value={form.pricePerLiter}
                    onChange={(e) => setForm({ ...form, pricePerLiter: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-dairy-text/60">Customer Type</label>
                  <select
                    value={form.customerType}
                    onChange={(e) => setForm({ ...form, customerType: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
                    required
                  >
                    <option value="" disabled hidden>-- Select Type --</option>
                    <option value="INDIVIDUAL">INDIVIDUAL</option>
                    <option value="BULK">BULK COLLECTOR</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-dairy-text/60">Address</label>
                <input
                  type="text"
                  placeholder="Ward number, landmarks"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-dairy-text/60">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
                    required
                  >
                    <option value="" disabled hidden>-- Select Status --</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-dairy-text/60">{t('remarks')}</label>
                <input
                  type="text"
                  placeholder="Notes about timing, payments"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-dairy-sky text-white font-bold rounded-2xl shadow-lg mt-2 active:scale-95 transition-all text-sm"
              >
                {editingCustomer ? t('saveChanges') : t('addCustomer')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. LEDGER DRAWER DIALOG SLIDE OVERLAY (HIDDEN ON PRINT) */}
      {ledgerCustomer && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-end print:hidden">
          <div className="absolute inset-0" onClick={() => setLedgerCustomer(null)} />

          <div className="relative w-full max-w-2xl bg-milk-50 h-full p-6 shadow-2xl flex flex-col justify-between border-l border-white/60">
            <div>
              {/* Header */}
              <div className="flex justify-between items-center pb-4 border-b border-white/50 mb-6">
                <div>
                  <h3 className="font-space font-extrabold text-xl text-dairy-text">{t('ledgerBook')}</h3>
                  <p className="text-xs text-dairy-text/50">Details for <b>{ledgerCustomer.name}</b></p>
                </div>
                <button
                  onClick={() => setLedgerCustomer(null)}
                  className="p-2 rounded-full bg-white border border-white/80 shadow-sm"
                >
                  <X className="w-5 h-5 text-dairy-text/80" />
                </button>
              </div>

              {loadingLedger ? (
                <div className="py-20 flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-4 border-dairy-sky border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-semibold text-dairy-text/50">Compiling Ledger Book...</p>
                </div>
              ) : ledgerData ? (
                <div className="flex flex-col gap-5 overflow-y-auto max-h-[72vh] pr-2">
                  
                  {/* Ledger Summary Stats */}
                  <div className="grid grid-cols-4 gap-3 bg-white/40 border border-white/70 p-4 rounded-3xl text-center">
                    <div>
                      <p className="text-[8px] font-bold text-dairy-text/50 uppercase leading-none">Total Liters</p>
                      <p className="font-space font-extrabold text-sm text-dairy-text mt-1">{ledgerData.summary.totalLiters} L</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-dairy-text/50 uppercase leading-none">Total Due</p>
                      <p className="font-space font-extrabold text-sm text-dairy-text mt-1">₹{ledgerData.summary.totalAmount}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-dairy-text/50 uppercase leading-none">Total Paid</p>
                      <p className="font-space font-extrabold text-sm text-dairy-green mt-1">₹{ledgerData.summary.totalPaid}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-dairy-text/50 uppercase leading-none">{t('balanceDue')}</p>
                      <p className={`font-space font-extrabold text-sm mt-1 ${ledgerData.summary.pendingBalance > 0 ? 'text-dairy-coral' : 'text-dairy-green'}`}>
                        ₹{ledgerData.summary.pendingBalance}
                      </p>
                    </div>
                  </div>

                  {/* Payment Entry Form Inside Ledger */}
                  <form onSubmit={handleAddPayment} className="bg-white/50 border border-white/80 rounded-3xl p-4 flex flex-col gap-3">
                    <h4 className="text-xs font-extrabold text-dairy-text/60 uppercase tracking-wide">{t('collectDues')}</h4>
                    <div className="grid grid-cols-12 gap-3 items-end">
                      <div className="col-span-5 flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-dairy-text/50">Amount Collected (₹)</label>
                        <input
                          type="number"
                          placeholder="e.g. 500"
                          value={payAmount}
                          onChange={(e) => setPayAmount(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl text-xs font-semibold glass-input text-dairy-text"
                          required
                        />
                      </div>
                      <div className="col-span-4 flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-dairy-text/50">Method</label>
                        <select
                          value={payMethod}
                          onChange={(e) => setPayMethod(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl text-xs font-semibold glass-input text-dairy-text"
                        >
                          <option value="UPI">{t('upi')}</option>
                          <option value="CASH">{t('cash')}</option>
                        </select>
                      </div>
                      <div className="col-span-3">
                        <button
                          type="submit"
                          className="w-full py-2.5 bg-dairy-green hover:bg-dairy-green/90 text-white font-bold rounded-xl text-xs active:scale-95 transition-all flex items-center justify-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Collect</span>
                        </button>
                      </div>
                    </div>
                  </form>

                  {/* DATE RANGE SELECTOR FOR BILL PRINTING (Individual customer print only) */}
                  <div className="bg-white/55 border border-white/85 p-4 rounded-3xl">
                    <h4 className="text-xs font-bold text-dairy-text/70 mb-2.5">
                      {language === 'hi' ? 'बिल प्रिंटिंग तिथि सीमा' : 'Bill Print Date Filter'}
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-dairy-text/50">{t('startDate')}</label>
                        <input
                          type="date"
                          value={printStart}
                          onChange={(e) => setPrintStart(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl glass-input text-dairy-text font-semibold"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-dairy-text/50">{t('endDate')}</label>
                        <input
                          type="date"
                          value={printEnd}
                          onChange={(e) => setPrintEnd(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl glass-input text-dairy-text font-semibold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Monthly breakdown */}
                  <div>
                    <h4 className="text-xs font-bold text-dairy-text/50 uppercase tracking-widest mb-3">Ledger Months</h4>
                    <div className="flex flex-col gap-3">
                      {ledgerData.monthlyLedger.length > 0 ? (
                        ledgerData.monthlyLedger.map((month: any) => (
                          <div key={month.monthKey} className="bg-white/40 border border-white/60 rounded-3xl p-4 text-left">
                            <div className="flex justify-between items-center border-b border-white/30 pb-2 mb-3">
                              <span className="font-space font-bold text-sm text-dairy-text">{month.monthName} {month.year}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                month.pending > 0 ? 'bg-dairy-coral/10 text-dairy-coral' : 'bg-dairy-green/10 text-dairy-green'
                              }`}>
                                {month.pending > 0 ? `₹${month.pending} Pending` : 'Fully Paid'}
                              </span>
                            </div>

                            <div className="grid grid-cols-4 gap-2 text-[10px] text-dairy-text/70 mb-2">
                              <div>Milk Qty: <b>{month.liters} L</b></div>
                              <div>Value: <b>₹{month.amount}</b></div>
                              <div>Paid: <b>₹{month.paid}</b></div>
                              <div>Price: <b>₹{month.sales[0]?.rate || ledgerCustomer.pricePerLiter}</b></div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-dairy-text/40 text-center py-6">No historical entries found for this ledger.</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="pt-4 border-t border-white/30 flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-3.5 bg-white border border-white/80 hover:bg-white text-dairy-text font-bold rounded-2xl text-xs active:scale-95 shadow-sm transition-all text-center"
              >
                Print Ledger Book 🖨️
              </button>
              <button
                onClick={() => setLedgerCustomer(null)}
                className="flex-1 py-3.5 bg-dairy-sky text-white font-bold rounded-2xl text-xs active:scale-95 shadow-md transition-all text-center"
              >
                Done / Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. PRINT-ONLY RECEIPT STATEMENT DIALOG (HIDDEN ON APP VIEW, SHOWN ONLY ON PRINT ACTION) */}
      {ledgerCustomer && (
        <div className="hidden print:block absolute inset-0 bg-white text-black p-8 z-[99999] text-left text-sm font-sans leading-relaxed">
          
          {/* Bill Heading */}
          <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold uppercase tracking-tight">{settings.farm_name || 'Milk Mania Farm'}</h1>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Milk Bill Statement (दूध का बिल)</p>
            </div>
            <div className="text-right">
              <h2 className="text-lg font-bold">{ledgerCustomer.name}</h2>
              <p className="text-xs text-gray-500">Phone: {ledgerCustomer.phone || '-'}</p>
              <p className="text-xs text-gray-500">Village: {ledgerCustomer.village}</p>
            </div>
          </div>

          {/* Range */}
          <div className="mb-6 bg-gray-50 border border-gray-200 p-3 rounded-lg flex justify-between items-center text-xs">
            <p><strong>Billing Period (अवधि):</strong> {new Date(printStart).toLocaleDateString(language === 'en' ? 'en-US' : 'hi-IN')} to {new Date(printEnd).toLocaleDateString(language === 'en' ? 'en-US' : 'hi-IN')}</p>
            <p><strong>Date Generated:</strong> {new Date().toLocaleDateString()}</p>
          </div>

          {/* Sales Logs */}
          <div className="mb-6">
            <h3 className="text-sm font-bold border-b border-gray-400 pb-1 mb-2">1. Purchases Ledger (दूध की खरीद)</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-black text-left font-bold">
                  <th className="py-2">Date</th>
                  <th>Shift</th>
                  <th>Quantity (Liters)</th>
                  <th>Rate (₹/Liter)</th>
                  <th className="text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {printStatement.sales.map((s: any) => (
                  <tr key={s.id} className="border-b border-gray-200">
                    <td className="py-2">{new Date(s.date).toLocaleDateString()}</td>
                    <td>{s.shift === 'MORNING' ? t('morning') : t('evening')}</td>
                    <td>{s.quantity} L</td>
                    <td>₹{s.rate}</td>
                    <td className="text-right font-semibold">₹{s.amount}</td>
                  </tr>
                ))}
                {printStatement.sales.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-gray-400 font-bold">No milk sales logged in this date range.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Payments Logs */}
          <div className="mb-6">
            <h3 className="text-sm font-bold border-b border-gray-400 pb-1 mb-2">2. Payments Deposited (जमा राशि)</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-black text-left font-bold">
                  <th className="py-2">Date</th>
                  <th>Payment Mode</th>
                  <th>Remarks</th>
                  <th className="text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {printStatement.payments.map((p: any) => (
                  <tr key={p.id} className="border-b border-gray-200">
                    <td className="py-2">{new Date(p.date).toLocaleDateString()}</td>
                    <td>{p.paymentMethod === 'UPI' ? t('upi') : t('cash')}</td>
                    <td>{p.remarks || '-'}</td>
                    <td className="text-right font-semibold">₹{p.amount}</td>
                  </tr>
                ))}
                {printStatement.payments.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-gray-400 font-bold">No payments deposited in this date range.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals Summary */}
          <div className="mt-8 border-t-2 border-black pt-4 grid grid-cols-2 text-xs font-bold gap-4">
            <div className="flex flex-col gap-1 leading-relaxed">
              <p>Previous Balance (पिछला बकाया): <span className="font-semibold">₹{printStatement.previousBalance}</span></p>
              <p>Total Liters Purchased (इस अवधि का दूध): <span className="font-semibold">{printStatement.liters} L</span></p>
              <p>Total Milk Value (इस अवधि का मूल्य): <span className="font-semibold">₹{printStatement.due}</span></p>
              <p>Total Deposited (इस अवधि का भुगतान): <span className="font-semibold text-green-700">₹{printStatement.paid}</span></p>
            </div>
            
            <div className="text-right flex flex-col justify-between">
              <div className="text-lg font-extrabold text-red-600">
                Net Balance Dues (कुल बकाया): ₹{printStatement.totalOutstanding}
              </div>
              <p className="text-[9px] text-gray-400 font-normal mt-4">
                This is an autogenerated invoice generated by Milk Mania Portal.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Customers;
