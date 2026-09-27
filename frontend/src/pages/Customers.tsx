import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../utils/translations';
import { Plus, Edit3, Trash2, BookOpen, Phone, MapPin, X, Key } from 'lucide-react';

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
    pin: '123456',
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
      pin: '123456',
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
      pin: c.pin || '123456',
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
    const trimmedPhone = form.phone ? form.phone.trim() : '';
    if (trimmedPhone && trimmedPhone.length !== 10) {
      alert(language === 'hi' ? 'मोबाइल नंबर बिल्कुल 10 अंकों का होना चाहिए।' : 'Mobile number must be exactly 10 digits.');
      return;
    }

    if (trimmedPhone) {
      const duplicate = customers.find((c: any) => 
        c.phone && c.phone.trim() === trimmedPhone && (!editingCustomer || c.id !== editingCustomer.id)
      );
      if (duplicate) {
        alert(
          language === 'hi'
            ? `यह फोन नंबर (${trimmedPhone}) पहले से ही ग्राहक "${duplicate.name}" के पास दर्ज है। डुप्लिकेट फोन नंबर की अनुमति नहीं है।`
            : `Phone number ${trimmedPhone} is already registered to customer "${duplicate.name}". Duplicate phone numbers are not allowed.`
        );
        return;
      }
    }

    if (form.pin && !/^\d{6}$/.test(form.pin)) {
      alert(language === 'hi' ? 'पिन ठीक 6 अंकों का होना चाहिए।' : 'PIN must be exactly 6 digits.');
      return;
    }

    const data = {
      ...form,
      phone: trimmedPhone,
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

  const sessionTotals = useMemo(() => {
    let morningLiters = 0;
    let eveningLiters = 0;
    let totalLiters = 0;
    let totalAmount = 0;

    (printStatement?.sales || []).forEach((s: any) => {
      if (s.shift === 'MORNING') {
        morningLiters += s.quantity;
      } else if (s.shift === 'EVENING') {
        eveningLiters += s.quantity;
      }
      totalLiters += s.quantity;
      totalAmount += s.amount;
    });

    return {
      morningLiters: Math.round(morningLiters * 10) / 10,
      eveningLiters: Math.round(eveningLiters * 10) / 10,
      totalLiters: Math.round(totalLiters * 10) / 10,
      totalAmount: Math.round(totalAmount * 10) / 10
    };
  }, [printStatement?.sales]);

  return (
    <div className="flex-1 min-h-screen pt-20 lg:pt-8 pb-28 lg:pb-12 lg:pl-72 px-4 sm:px-6 max-w-7xl mx-auto text-left print:p-0 print:pl-0 print:max-w-none">

      {/* 1. VISUAL PORTAL LAYOUT (HIDDEN ON PRINT) */}
      <div className="print:hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
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
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wide uppercase ${c.status === 'ACTIVE' ? 'bg-dairy-green/10 text-dairy-green' : 'bg-dairy-coral/10 text-dairy-coral'
                      }`}>
                      {c.status}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 text-xs text-dairy-text/70 mb-4">
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

                    {/* Customer Portal PIN display */}
                    <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-sky-50/70 border border-sky-100 text-[11px] font-bold text-dairy-sky mt-1">
                      <span className="flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-dairy-sky" />
                        <span>{language === 'hi' ? 'लॉगिन पिन:' : 'Portal PIN:'} <span className="font-space font-extrabold tracking-widest text-dairy-text">{c.pin || '123456'}</span></span>
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(c.pin || '123456');
                          alert(language === 'hi' ? `पिन ${c.pin || '123456'} कॉपी हो गया!` : `PIN ${c.pin || '123456'} copied!`);
                        }}
                        className="px-2 py-0.5 rounded-lg bg-white border border-sky-200 text-[10px] text-dairy-sky hover:bg-sky-50 shadow-2xs active:scale-95 transition-all"
                        title="Copy PIN"
                      >
                        {language === 'hi' ? 'कॉपी' : 'Copy'}
                      </button>
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
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-dairy-text/60">{language === 'hi' ? 'लॉगिन पिन' : 'Login PIN'}</label>
                    <span className="text-[10px] text-dairy-sky font-bold">6 Digits</span>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="123456"
                    value={form.pin}
                    onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                    className="w-full px-4 py-3 rounded-2xl text-sm font-space font-bold tracking-widest glass-input text-dairy-text"
                    required
                  />
                </div>
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
                      <p className="text-[8px] font-bold text-dairy-text/50 uppercase leading-none">
                        {ledgerData.summary.pendingBalance < 0 ? t('advance') : t('balanceDue')}
                      </p>
                      <p className={`font-space font-extrabold text-sm mt-1 ${ledgerData.summary.pendingBalance > 0 ? 'text-dairy-coral' : 'text-dairy-green'}`}>
                        ₹{Math.abs(ledgerData.summary.pendingBalance)}
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
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${month.pending > 0 ? 'bg-dairy-coral/10 text-dairy-coral' : 'bg-dairy-green/10 text-dairy-green'
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
        <div className="hidden print:block absolute inset-0 print-receipt-container text-slate-800 z-[99999] text-left text-sm font-sans leading-relaxed min-h-screen">

          {/* Milk spill SVG curves */}
          <svg className="absolute top-0 left-0 right-0 w-full h-24 text-sky-100 fill-current opacity-70 pointer-events-none" viewBox="0 0 1440 320" preserveAspectRatio="none">
            <path d="M0,192C120,202.7,240,224,360,213.3C480,203,600,160,720,154.7C840,149,960,181,1080,186.7C1200,192,1320,171,1380,160L1420,154.7L1420,0L1380,0C1320,0,1200,0,1080,0C960,0,840,0,720,0C600,0,480,0,360,0C240,0,120,0,0,0Z"></path>
          </svg>

          {/* Background milk spots */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 10% 20%, #0EA5E9 25%, transparent 25%), radial-gradient(circle at 80% 70%, #0EA5E9 20%, transparent 20%), radial-gradient(circle at 50% 40%, #0EA5E9 15%, transparent 15%)' }} />

          {/* Bill Heading */}
          <div className="print-receipt-header flex justify-between items-center relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">🥛</span>
                <h1 className="text-2xl font-space font-extrabold uppercase tracking-tight">{settings.farm_name || 'Milk Mania Farm'}</h1>
              </div>
              <p className="text-xs opacity-90 font-bold uppercase tracking-wider">Milk Bill Statement • दूध का बिल</p>
            </div>
            <div className="text-right">
              <h2 className="text-lg font-space font-extrabold">{ledgerCustomer.name}</h2>
              <p className="text-xs opacity-80 font-semibold">Phone: {ledgerCustomer.phone || '-'}</p>
              <p className="text-xs opacity-80 font-semibold">Village: {ledgerCustomer.village}</p>
            </div>
          </div>

          {/* Range */}
          <div className="mb-6 bg-white/80 border border-sky-100 p-4 rounded-2xl flex justify-between items-center text-xs shadow-sm relative z-10">
            <p className="font-semibold"><strong className="text-sky-700">{language === 'hi' ? 'बिलिंग अवधि:' : 'Billing Period:'}</strong> {new Date(printStart).toLocaleDateString(language === 'en' ? 'en-US' : 'hi-IN')} {language === 'hi' ? 'से' : 'to'} {new Date(printEnd).toLocaleDateString(language === 'en' ? 'en-US' : 'hi-IN')}</p>
            <p className="font-semibold"><strong className="text-sky-700">{language === 'hi' ? 'दिनांक:' : 'Date Generated:'}</strong> {new Date().toLocaleDateString()}</p>
          </div>

          {/* Sales Logs */}
          <div className="mb-6 relative z-10">
            <h3 className="text-sm font-space font-bold border-b-2 border-sky-100 pb-2 mb-3 text-sky-800">
              {language === 'hi' ? '1. दूध खरीद का विवरण' : '1. Milk Purchase Summary'}
            </h3>
            <div className="grid grid-cols-4 gap-4 bg-white/70 border border-sky-100 p-5 rounded-2xl shadow-sm text-center">
              <div className="bg-sky-50/50 p-4 rounded-xl border border-sky-100/50">
                <p className="text-[10px] font-bold text-sky-700 uppercase tracking-wider mb-1">
                  {language === 'hi' ? 'सुबह का कुल' : 'Morning Total'}
                </p>
                <p className="font-space font-extrabold text-lg text-sky-950">{sessionTotals.morningLiters} L</p>
              </div>
              <div className="bg-sky-50/50 p-4 rounded-xl border border-sky-100/50">
                <p className="text-[10px] font-bold text-sky-700 uppercase tracking-wider mb-1">
                  {language === 'hi' ? 'शाम का कुल' : 'Evening Total'}
                </p>
                <p className="font-space font-extrabold text-lg text-sky-950">{sessionTotals.eveningLiters} L</p>
              </div>
              <div className="bg-sky-600 p-4 rounded-xl text-white shadow-md flex flex-col justify-center">
                <p className="text-[10px] font-bold opacity-90 uppercase tracking-wider mb-0.5">
                  {language === 'hi' ? 'कुल दूध' : 'Grand Total Milk'}
                </p>
                <p className="font-space font-extrabold text-lg">{sessionTotals.totalLiters} L</p>
              </div>
              <div className="bg-emerald-600 p-4 rounded-xl text-white shadow-md flex flex-col justify-center">
                <p className="text-[10px] font-bold opacity-90 uppercase tracking-wider mb-0.5">
                  {language === 'hi' ? 'कुल मूल्य' : 'Total Bill'}
                </p>
                <p className="font-space font-extrabold text-lg">₹{sessionTotals.totalAmount}</p>
              </div>
            </div>
          </div>

          {/* Payments Logs */}
          <div className="mb-6 relative z-10">
            <h3 className="text-sm font-space font-bold border-b-2 border-sky-100 pb-2 mb-3 text-sky-800">
              {language === 'hi' ? '2. जमा राशि (भुगतान)' : '2. Payments Deposited'}
            </h3>
            <table className="w-full text-xs print-receipt-table rounded-2xl overflow-hidden shadow-sm">
              <thead>
                <tr className="text-left font-bold">
                  <th className="py-2.5 px-4">{language === 'hi' ? 'तारीख' : 'Date'}</th>
                  <th className="px-4">{language === 'hi' ? 'भुगतान माध्यम' : 'Payment Mode'}</th>
                  <th className="px-4">{language === 'hi' ? 'विवरण' : 'Remarks'}</th>
                  <th className="text-right px-4">{language === 'hi' ? 'राशि (₹)' : 'Amount (₹)'}</th>
                </tr>
              </thead>
              <tbody className="bg-white/60">
                {printStatement.payments.map((p: any) => (
                  <tr key={p.id}>
                    <td className="py-2.5 px-4 font-semibold">{new Date(p.date).toLocaleDateString()}</td>
                    <td className="px-4">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[9px]">
                        {p.paymentMethod === 'UPI' ? t('upi') : t('cash')}
                      </span>
                    </td>
                    <td className="px-4 text-gray-600 font-semibold">{p.remarks || '-'}</td>
                    <td className="text-right font-space font-bold text-emerald-600 px-4">₹{p.amount}</td>
                  </tr>
                ))}
                {printStatement.payments.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-gray-400 font-bold">
                      {language === 'hi' ? 'इस अवधि में कोई भुगतान दर्ज नहीं है।' : 'No payments deposited in this date range.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals Summary */}
          <div className="print-receipt-summary grid grid-cols-2 text-xs font-bold gap-4 relative z-10">
            <div className="flex flex-col gap-1.5 leading-relaxed text-slate-700">
              <p>{language === 'hi' ? 'दूध की दर:' : 'Milk Rate:'} <span className="font-space font-bold">₹{ledgerCustomer.pricePerLiter} / L</span></p>
              <p>{language === 'hi' ? 'पिछला बकाया:' : 'Previous Balance:'} <span className="font-space font-bold">₹{printStatement.previousBalance}</span></p>
              <p>{language === 'hi' ? 'कुल खरीदा दूध:' : 'Total Liters Purchased:'} <span className="font-space font-bold text-sky-700">{printStatement.liters} L</span></p>
              <p>{language === 'hi' ? 'इस अवधि का कुल मूल्य:' : 'Total Milk Value:'} <span className="font-space font-bold">₹{printStatement.due}</span></p>
              <p>{language === 'hi' ? 'कुल जमा राशि:' : 'Total Deposited:'} <span className="font-space font-bold text-emerald-600">₹{printStatement.paid}</span></p>
            </div>

            <div className="text-right flex flex-col justify-between items-end">
              {printStatement.totalOutstanding < 0 ? (
                <div className="text-sm font-space font-extrabold text-white bg-emerald-600 px-4 py-2.5 rounded-xl inline-block shadow-sm">
                  {language === 'hi' ? 'अग्रिम राशि:' : 'Advance Balance:'} ₹{Math.abs(printStatement.totalOutstanding)}
                </div>
              ) : (
                <div className="text-sm font-space font-extrabold text-white bg-sky-600 px-4 py-2.5 rounded-xl inline-block shadow-sm">
                  {language === 'hi' ? 'कुल बकाया:' : 'Net Balance Dues:'} ₹{printStatement.totalOutstanding}
                </div>
              )}
              <p className="text-[9px] text-slate-400 font-normal mt-4">
                {language === 'hi' ? 'यह बिल मिल्क मेनिया पोर्टल द्वारा स्वतः उत्पन्न किया गया है।' : 'This is an autogenerated invoice generated by Milk Mania Portal.'}
              </p>
            </div>
          </div>

          <svg className="absolute bottom-0 left-0 right-0 w-full h-24 text-sky-50 fill-current opacity-60 pointer-events-none" viewBox="0 0 1440 320" preserveAspectRatio="none">
            <path d="M0,96L80,117.3C160,139,320,181,480,197.3C640,213,800,203,960,181.3C1120,160,1280,128,1360,112L1440,96L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"></path>
          </svg>
        </div>
      )}
    </div>
  );
};
export default Customers;
