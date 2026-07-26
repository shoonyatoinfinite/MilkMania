import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { LiquidProgress } from '../components/LiquidProgress';
import { useTranslation } from '../utils/translations';
import { 
  TrendingUp, 
  Sparkles, 
  ShoppingBag, 
  Receipt, 
  Wallet, 
  ArrowUpRight, 
  AlertTriangle,
  Plus,
  RefreshCw,
  X
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const isMidnight = document.documentElement.getAttribute('data-theme') === 'midnight';
    return (
      <div className="glass-card p-4 rounded-3xl shadow-xl text-left">
        <p className={`text-[10px] font-extrabold uppercase mb-2 ${isMidnight ? 'text-white/40' : 'text-dairy-text/40'}`}>{label}</p>
        {payload.map((pld: any, index: number) => (
          <div key={index} className="flex items-center gap-2 mt-1 text-xs font-bold">
            <span 
              className="w-2.5 h-2.5 rounded-full" 
              style={{ backgroundColor: pld.color || pld.stroke }} 
            />
            <span className={isMidnight ? 'text-white/75' : 'text-dairy-text/75'}>{pld.name}:</span>
            <span className={`font-space font-extrabold ${isMidnight ? 'text-white' : 'text-dairy-text'}`}>{pld.value} L</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const Dashboard: React.FC = () => {
  const { 
    user, 
    theme, 
    dashboardStats, 
    animals, 
    customers, 
    language,
    refreshAllData,
    createProduction,
    createSale,
    createExpense,
    createPayment,
    productions,
    sales,
    createAdjustment
  } = useApp();

  const { t } = useTranslation(language);
  const [refreshing, setRefreshing] = useState(false);

  // Quick Action Modal States
  const [modalType, setModalType] = useState<'PROD' | 'EXP' | 'PAY' | null>(null);

  // Form states
  const [prodForm, setProdForm] = useState({ animalId: '', shift: '', quantity: '', homeConsumption: '', notes: '' });
  const [expForm, setExpForm] = useState({ category: 'FEED', amount: '', description: '' });
  const [payForm, setPayForm] = useState({ customerId: '', amount: '', paymentMethod: 'UPI', remarks: '' });

  // Direct Milk Sales Form (Embedded directly on Homepage)
  const [directSale, setDirectSale] = useState({
    customerId: '',
    shift: '',
    quantity: '',
    rate: '',
    paymentMethod: 'PENDING',
    remarks: ''
  });

  const [savingSale, setSavingSale] = useState(false);

  // Load fresh dashboard metrics on mount
  useEffect(() => {
    refreshAllData();
  }, []);

  // Update handleCustomerChange to support empty select states
  const handleCustomerChange = (custId: string) => {
    const selected = customers.find(c => c.id === custId);
    setDirectSale(prev => ({
      ...prev,
      customerId: custId,
      rate: selected ? String(selected.pricePerLiter) : ''
    }));
  };

  // Date Range View states
  const [filterRange, setFilterRange] = useState<'TODAY' | 'THIS_MONTH' | 'THIS_YEAR' | 'ALL_TIME' | 'CUSTOM'>('TODAY');
  const [dashStart, setDashStart] = useState('');
  const [dashEnd, setDashEnd] = useState('');
  const [dashboardSingleDate, setDashboardSingleDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Session adjustments states
  const [adjModalOpen, setAdjModalOpen] = useState(false);
  const [adjForm, setAdjForm] = useState({
    date: new Date().toISOString().split('T')[0],
    shift: 'MORNING',
    actionType: 'EMPTY',
    quantity: ''
  });

  const remainingForAdj = useMemo(() => {
    if (!adjForm.date || !adjForm.shift) return 0;
    const dateStr = adjForm.date;
    const shift = adjForm.shift;

    const prodSum = (productions || [])
      .filter((p: any) => new Date(p.date).toISOString().split('T')[0] === dateStr && p.shift === shift)
      .reduce((sum: number, p: any) => sum + (p.quantity - (p.homeConsumption || 0)), 0);

    const salesSum = (sales || [])
      .filter((s: any) => new Date(s.date).toISOString().split('T')[0] === dateStr && s.shift === shift)
      .reduce((sum: number, s: any) => sum + s.quantity, 0);

    const baseRem = prodSum - salesSum;
    return Math.max(0, Math.round(baseRem * 10) / 10);
  }, [adjForm.date, adjForm.shift, productions, sales]);

  const isSessionAlreadyAdjusted = useMemo(() => {
    if (!adjForm.date || !adjForm.shift) return false;
    const adjs = dashboardStats?.sessionAdjustments || [];
    return adjs.some((a: any) => {
      const aDate = new Date(a.date).toISOString().split('T')[0];
      return aDate === adjForm.date && 
             a.shift === adjForm.shift && 
             (a.actionType === 'EMPTY' || a.actionType === 'ROLLOVER_FROM');
    });
  }, [adjForm.date, adjForm.shift, dashboardStats?.sessionAdjustments]);

  useEffect(() => {
    setAdjForm(prev => ({ ...prev, quantity: String(remainingForAdj) }));
  }, [remainingForAdj]);

  const handleCreateAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjForm.date || !adjForm.shift || !adjForm.quantity) return;

    const success = await createAdjustment({
      date: adjForm.date,
      shift: adjForm.shift,
      actionType: adjForm.actionType,
      quantity: parseFloat(adjForm.quantity)
    });

    if (success) {
      alert(language === 'hi' ? 'सत्र स्टॉक समायोजन सफलतापूर्वक सहेजा गया!' : 'Session stock adjustment saved successfully!');
      setAdjModalOpen(false);
    }
  };

  const handleSingleDateChange = (dateVal: string) => {
    setDashboardSingleDate(dateVal);
    setFilterRange('CUSTOM');
    setDashStart(dateVal);
    setDashEnd(dateVal);
    refreshAllData(dateVal, dateVal);
  };

  const triggerRefresh = (range: string, start?: string, end?: string) => {
    const today = new Date();
    let computedStart = '';
    let computedEnd = '';

    if (range === 'TODAY') {
      const todayStr = today.toISOString().split('T')[0];
      computedStart = todayStr;
      computedEnd = todayStr;
    } else if (range === 'THIS_MONTH') {
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      computedStart = `${year}-${month}-01`;
      
      const lastDay = new Date(year, today.getMonth() + 1, 0).getDate();
      computedEnd = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
    } else if (range === 'THIS_YEAR') {
      const year = today.getFullYear();
      computedStart = `${year}-01-01`;
      computedEnd = `${year}-12-31`;
    } else if (range === 'ALL_TIME') {
      computedStart = '2020-01-01';
      computedEnd = today.toISOString().split('T')[0];
    } else if (range === 'CUSTOM') {
      computedStart = start || '';
      computedEnd = end || '';
    }

    if (range !== 'CUSTOM' || (start && end)) {
      refreshAllData(computedStart, computedEnd);
    }
  };

  const handleRangeChange = (val: typeof filterRange) => {
    setFilterRange(val);
    if (val !== 'CUSTOM') {
      triggerRefresh(val);
    }
  };

  const handleCustomDateSubmit = () => {
    if (dashStart && dashEnd) {
      triggerRefresh('CUSTOM', dashStart, dashEnd);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (filterRange === 'CUSTOM') {
      await refreshAllData(dashStart, dashEnd);
    } else {
      triggerRefresh(filterRange);
    }
    setRefreshing(false);
  };

  // Submit direct sale from the dashboard
  const handleSaveDirectSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directSale.customerId || !directSale.quantity || !directSale.rate) {
      alert('Please fill in customer, quantity, and rate.');
      return;
    }
    setSavingSale(true);
    const amount = Number(directSale.quantity) * Number(directSale.rate);
    const success = await createSale({
      customerId: directSale.customerId,
      shift: directSale.shift,
      quantity: Number(directSale.quantity),
      rate: Number(directSale.rate),
      amount: Math.round(amount * 10) / 10,
      paymentMethod: directSale.paymentMethod,
      remarks: directSale.remarks,
      date: new Date().toISOString(),
    });
    setSavingSale(false);
    if (success) {
      // Reset all direct sale inputs to empty
      setDirectSale({
        customerId: '',
        shift: '',
        quantity: '',
        rate: '',
        paymentMethod: 'PENDING',
        remarks: ''
      });
    }
  };

  const handleCreateProd = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await createProduction({
      ...prodForm,
      quantity: Number(prodForm.quantity),
      homeConsumption: Number(prodForm.homeConsumption || 0),
      date: new Date().toISOString(),
    });
    if (success) {
      setProdForm({ animalId: '', shift: '', quantity: '', homeConsumption: '', notes: '' });
      setModalType(null);
    }
  };

  const handleCreateExp = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await createExpense({
      ...expForm,
      amount: Number(expForm.amount),
      date: new Date().toISOString(),
    });
    if (success) {
      setExpForm({ category: 'FEED', amount: '', description: '' });
      setModalType(null);
    }
  };

  const handleCreatePay = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await createPayment({
      ...payForm,
      amount: Number(payForm.amount),
      date: new Date().toISOString(),
    });
    if (success) {
      setPayForm({ customerId: '', amount: '', paymentMethod: 'UPI', remarks: '' });
      setModalType(null);
    }
  };

  const currentHour = new Date().getHours();
  const realTimeShift = currentHour >= 13 ? 'EVENING' : 'MORNING';

  const todayData = dashboardStats?.today || {
    totalYield: 0,
    morningYield: 0,
    eveningYield: 0,
    litersSold: 0,
    revenue: 0,
    expenses: 0,
    profit: 0
  };

  const monthlyData = dashboardStats?.monthly || {
    revenue: 0,
    expenses: 0,
    profit: 0
  };

  const pendingPayments = dashboardStats?.pendingPayments || 0;
  const lowStockAlerts = dashboardStats?.lowStockAlerts || [];
  const recentActivity = dashboardStats?.recentActivity || { sales: [], productions: [] };
  const weeklyChart = dashboardStats?.weeklyChart || [];

  return (
    <div className="flex-1 pb-24 lg:pb-10 lg:pl-72 p-6 max-w-7xl mx-auto text-left">
      
      {/* 1. TOP Welcome Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <span className="text-sm font-bold text-dairy-sky uppercase tracking-widest">
            {realTimeShift === 'MORNING' ? `☀️ ${t('morning')} ${t('activeShift')}` : `🌙 ${t('evening')} ${t('activeShift')}`}
          </span>
          <h2 className="text-3xl font-space font-extrabold text-dairy-text mt-1">
            {t('welcome')}, {user?.name?.split(' ')[0] || 'Farmer'}! 👋
          </h2>
          <p className="text-sm text-dairy-text/60">
            {t('dashboardSubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="p-3 bg-white/60 hover:bg-white rounded-2xl border border-white/80 shadow-sm active:scale-95 transition-all text-dairy-text/70"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <div className="relative bg-white/80 backdrop-blur-md px-4 py-1.5 rounded-2xl border border-white text-xs font-bold text-dairy-text/70 shadow-sm flex items-center gap-1.5 cursor-pointer">
            <span>📆 Select Date:</span>
            <input
              type="date"
              value={dashboardSingleDate}
              onChange={(e) => handleSingleDateChange(e.target.value)}
              className="bg-transparent border-none text-xs font-extrabold text-dairy-sky focus:outline-none cursor-pointer p-0"
            />
          </div>
        </div>
      </div>

      {/* Date Range Selection Filter Panel */}
      <div className="bg-white/40 border border-white/60 p-4 rounded-3xl mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
          <span className="text-dairy-text/60 mr-2 uppercase tracking-wider">Dashboard View:</span>
          {(['TODAY', 'THIS_MONTH', 'THIS_YEAR', 'ALL_TIME', 'CUSTOM'] as const).map((r) => {
            const labels: { [key: string]: string } = {
              TODAY: language === 'hi' ? 'आज' : 'Today',
              THIS_MONTH: language === 'hi' ? 'इस महीने' : 'This Month',
              THIS_YEAR: language === 'hi' ? 'इस साल' : 'This Year',
              ALL_TIME: language === 'hi' ? 'सब कुछ (ऑल टाइम)' : 'All Time / Everything',
              CUSTOM: language === 'hi' ? 'कस्टम रेंज' : 'Custom Period'
            };
            return (
              <button
                key={r}
                type="button"
                onClick={() => handleRangeChange(r)}
                className={`px-4 py-2 rounded-2xl border transition-all ${
                  filterRange === r
                    ? 'bg-dairy-sky text-white border-dairy-sky shadow-sm'
                    : 'bg-white/50 text-dairy-text/75 border-white/80 hover:bg-white'
                }`}
              >
                {labels[r]}
              </button>
            );
          })}
        </div>

        {filterRange === 'CUSTOM' && (
          <div className="flex flex-wrap items-center gap-2.5 text-xs font-bold">
            <div className="flex items-center gap-1">
              <span className="text-dairy-text/50">From</span>
              <input
                type="date"
                value={dashStart}
                onChange={(e) => setDashStart(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-white/80 glass-input text-dairy-text text-[11px]"
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-dairy-text/50">To</span>
              <input
                type="date"
                value={dashEnd}
                onChange={(e) => setDashEnd(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-white/80 glass-input text-dairy-text text-[11px]"
              />
            </div>
            <button
              type="button"
              onClick={handleCustomDateSubmit}
              className="px-4 py-2 bg-dairy-green text-white rounded-2xl shadow-sm hover:bg-dairy-green/95 transition-all"
            >
              Apply Filter
            </button>
          </div>
        )}
      </div>

      {/* 2. LIQUID STATS PROGRESS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <LiquidProgress 
          percentage={todayData.totalYield > 0 ? (todayData.litersSold / todayData.totalYield) * 100 : 0} 
          color="bg-dairy-sky/30"
          label={t('todayYieldSold')}
          sublabel={`${todayData.litersSold} / ${todayData.totalYield} L`}
          onClick={() => {
            setAdjForm(prev => ({
              ...prev,
              date: dashboardSingleDate,
              shift: realTimeShift
            }));
            setAdjModalOpen(true);
          }}
        />
        <LiquidProgress 
          percentage={todayData.revenue > 0 ? (todayData.profit / todayData.revenue) * 100 : 0} 
          color="bg-dairy-green/30"
          label={t('todayNetProfit')}
          sublabel={`₹${todayData.profit}`}
        />
        <LiquidProgress 
          percentage={monthlyData.revenue > 0 ? (monthlyData.profit / monthlyData.revenue) * 100 : 0} 
          color="bg-dairy-gold/30"
          label={t('monthlyNetProfit')}
          sublabel={`₹${monthlyData.profit}`}
        />
        <LiquidProgress 
          percentage={pendingPayments > 0 ? 75 : 0} 
          color="bg-dairy-coral/25"
          label={t('totalPendingDues')}
          sublabel={`₹${pendingPayments}`}
        />
      </div>

      {/* Low Stock Warning */}
      {lowStockAlerts.length > 0 && (
        <div className="mb-8 p-4 rounded-3xl bg-dairy-gold/15 border border-dairy-gold/20 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-dairy-gold shrink-0 animate-bounce" />
          <div className="text-xs">
            <span className="font-bold text-dairy-text">{t('alertStock')}:</span>{' '}
            {lowStockAlerts.map((item: any) => `${item.itemName} (${item.quantity} ${item.unit} remaining)`).join(', ')}
            .
          </div>
        </div>
      )}

      {/* 3. CORE INTERACTIVE GRID: DIRECT SALES FORM + QUICK ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        
        {/* Direct Sales Input Form (Left 7-columns) */}
        <div className="lg:col-span-7 bg-white/50 backdrop-blur-md border border-white/80 rounded-4xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-space font-extrabold text-lg text-dairy-text">{t('quickEntry')}</h3>
              <p className="text-xs text-dairy-text/50">
                {language === 'hi' ? 'आज की तारीख के लिए सीधे दूध बिक्री दर्ज करें।' : 'Quickly record milk sales for today.'}
              </p>
            </div>
            <span className="text-2xl">🥛</span>
          </div>

          <form onSubmit={handleSaveDirectSale} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Shift Toggles */}
              <div className="flex flex-col gap-1.5 col-span-2">
                <label className="text-xs font-bold text-dairy-text/60">{t('shift')}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDirectSale(prev => ({ ...prev, shift: 'MORNING' }))}
                    className={`py-3 rounded-2xl text-xs font-bold transition-all border ${
                      directSale.shift === 'MORNING'
                        ? 'bg-dairy-sky text-white border-dairy-sky shadow-sm'
                        : 'bg-white/40 text-dairy-text border-white/70 hover:bg-white'
                    }`}
                  >
                    ☀️ {t('morning')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirectSale(prev => ({ ...prev, shift: 'EVENING' }))}
                    className={`py-3 rounded-2xl text-xs font-bold transition-all border ${
                      directSale.shift === 'EVENING'
                        ? 'bg-dairy-sky text-white border-dairy-sky shadow-sm'
                        : 'bg-white/40 text-dairy-text border-white/70 hover:bg-white'
                    }`}
                  >
                    🌙 {t('evening')}
                  </button>
                </div>
              </div>

              {/* Customer select */}
              <div className="flex flex-col gap-1.5 col-span-2">
                <label className="text-xs font-bold text-dairy-text/60">{t('customer')}</label>
                <select
                  value={directSale.customerId}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
                  required
                >
                  <option value="">-- {t('selectCustomer')} --</option>
                  {customers.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.customerType === 'BULK' ? 'Bulk' : 'Individual'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-dairy-text/60">{t('quantity')}</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 2.5"
                  value={directSale.quantity}
                  onChange={(e) => setDirectSale(prev => ({ ...prev, quantity: e.target.value }))}
                  className="w-full px-4 py-3 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
                  required
                />
              </div>

              {/* Rate per liter */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-dairy-text/60">{t('rate')}</label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="65"
                  value={directSale.rate}
                  onChange={(e) => setDirectSale(prev => ({ ...prev, rate: e.target.value }))}
                  className="w-full px-4 py-3 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
                  required
                />
              </div>

              {/* Calculated Amount */}
              <div className="col-span-2 bg-dairy-sky/5 border border-dairy-sky/10 rounded-2xl px-4 py-3 flex justify-between items-center">
                <span className="text-xs font-bold text-dairy-text/60">{t('amount')}</span>
                <span className="text-lg font-space font-extrabold text-dairy-sky">
                  ₹{Math.round((Number(directSale.quantity || 0) * Number(directSale.rate || 0)) * 10) / 10}
                </span>
              </div>

              {/* Payment Toggles */}
              <div className="flex flex-col gap-1.5 col-span-2">
                <label className="text-xs font-bold text-dairy-text/60">{t('paymentMethod')}</label>
                <div className="grid grid-cols-3 gap-2">
                  {['PENDING', 'CASH', 'UPI'].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setDirectSale(prev => ({ ...prev, paymentMethod: mode }))}
                      className={`py-2.5 rounded-xl text-xs font-bold transition-all border ${
                        directSale.paymentMethod === mode
                          ? 'bg-dairy-green text-white border-dairy-green shadow-sm'
                          : 'bg-white/40 text-dairy-text border-white/70 hover:bg-white'
                      }`}
                    >
                      {mode === 'PENDING' ? t('pending') : mode === 'CASH' ? t('cash') : t('upi')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Remarks */}
              <div className="flex flex-col gap-1.5 col-span-2">
                <label className="text-xs font-bold text-dairy-text/60">{t('remarks')}</label>
                <input
                  type="text"
                  placeholder="e.g. Regular milk purchase"
                  value={directSale.remarks}
                  onChange={(e) => setDirectSale(prev => ({ ...prev, remarks: e.target.value }))}
                  className="w-full px-4 py-3 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingSale}
              className="w-full py-4 bg-gradient-to-r from-dairy-sky to-dairy-sky/90 text-white font-bold rounded-2xl shadow-md active:scale-95 transition-all mt-2 flex items-center justify-center gap-2"
            >
              {savingSale ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                t('saveSale')
              )}
            </button>
          </form>
        </div>

        {/* Other Operations Quick Launch (Right 5-columns) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <div className="bg-white/50 backdrop-blur-md border border-white/80 rounded-4xl p-6 shadow-sm flex-1 flex flex-col justify-between">
            <div>
              <h3 className="font-space font-extrabold text-lg text-dairy-text mb-1">{t('quickActions')}</h3>
              <p className="text-xs text-dairy-text/50 mb-6">
                {language === 'hi' ? 'अन्य डेयरी कार्यों को यहाँ सहेजें।' : 'Perform other operations and daily tasks.'}
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <button
                onClick={() => setModalType('PROD')}
                className="w-full p-4 bg-white/60 hover:bg-white border border-white/80 rounded-3xl shadow-sm hover:shadow-md transition-all active:scale-95 flex items-center gap-4 text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-dairy-sky/15 flex items-center justify-center text-dairy-sky shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-sm text-dairy-text">{t('addYield')}</p>
                  <p className="text-[10px] text-dairy-text/50">Log individual buffalo yields</p>
                </div>
              </button>

              <button
                onClick={() => setModalType('EXP')}
                className="w-full p-4 bg-white/60 hover:bg-white border border-white/80 rounded-3xl shadow-sm hover:shadow-md transition-all active:scale-95 flex items-center gap-4 text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-dairy-coral/15 flex items-center justify-center text-dairy-coral shrink-0">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-sm text-dairy-text">{t('logExpense')}</p>
                  <p className="text-[10px] text-dairy-text/50">Record feeds or vet medicines costs</p>
                </div>
              </button>

              <button
                onClick={() => setModalType('PAY')}
                className="w-full p-4 bg-white/60 hover:bg-white border border-white/80 rounded-3xl shadow-sm hover:shadow-md transition-all active:scale-95 flex items-center gap-4 text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-dairy-gold/15 flex items-center justify-center text-dairy-gold shrink-0">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-sm text-dairy-text">{t('collectDues')}</p>
                  <p className="text-[10px] text-dairy-text/50">Settle pending villager dues</p>
                </div>
              </button>
            </div>
          </div>

          {/* Today's Stats details */}
          <div className="bg-white/40 border border-white/60 rounded-4xl p-5 shadow-sm text-xs flex flex-col gap-2.5">
            <h4 className="font-bold text-dairy-text">{t('shiftProduction')}</h4>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-white/50 p-2 rounded-xl border border-white">
                <span className="text-[10px] text-dairy-text/50 uppercase font-bold">☀️ Morning</span>
                <p className="text-sm font-space font-extrabold text-dairy-text">{todayData.morningYield} L</p>
              </div>
              <div className="bg-white/50 p-2 rounded-xl border border-white">
                <span className="text-[10px] text-dairy-text/50 uppercase font-bold">🌙 Evening</span>
                <p className="text-sm font-space font-extrabold text-dairy-text">{todayData.eveningYield} L</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. PERFORMANCE CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        
        {/* Yield vs Sales Area Chart */}
        <div className="lg:col-span-8 glass-card rounded-4xl p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-space font-bold text-lg text-dairy-text">{t('weeklyFlow')}</h3>
              <p className="text-xs text-dairy-text/50">Milk Yield vs Sales volume (Liters)</p>
            </div>
          </div>

          <div className="w-full h-64">
            {weeklyChart.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-xs text-dairy-text/40 font-bold bg-white/20 rounded-2xl border border-dashed border-white/50">
                {language === 'hi' ? 'डेटा दर्ज करने के बाद साप्ताहिक चार्ट दिखाई देगा।' : 'Weekly chart will appear once yield and sales data is logged.'}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyChart} margin={{ top: 20, right: 10, left: -20, bottom: 10 }}>
                  <defs>
                    <filter id="shadowYield" x="-10%" y="-10%" width="120%" height="130%">
                      <feDropShadow dx="0" dy="6" stdDeviation="3" floodColor="#0EA5E9" floodOpacity="0.25" />
                    </filter>
                    <filter id="shadowSales" x="-10%" y="-10%" width="120%" height="130%">
                      <feDropShadow dx="0" dy="6" stdDeviation="3" floodColor="#10B981" floodOpacity="0.25" />
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={document.documentElement.getAttribute('data-theme') === 'midnight' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'} />
                  <XAxis 
                    dataKey="day" 
                    stroke={document.documentElement.getAttribute('data-theme') === 'midnight' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)'} 
                    tickLine={false}
                    axisLine={false}
                    style={{ fontSize: 10, fontWeight: 'bold' }} 
                  />
                  <YAxis 
                    stroke={document.documentElement.getAttribute('data-theme') === 'midnight' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)'} 
                    tickLine={false}
                    axisLine={false}
                    style={{ fontSize: 10, fontWeight: 'bold' }} 
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 11, fontWeight: 'bold', paddingBottom: 15 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="yield" 
                    name="Milk Yield"
                    stroke="#0EA5E9" 
                    strokeWidth={4} 
                    dot={{ r: 4, strokeWidth: 2, stroke: '#0EA5E9', fill: '#fff' }} 
                    activeDot={{ r: 7, strokeWidth: 0 }} 
                    filter="url(#shadowYield)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="sales" 
                    name="Milk Sales"
                    stroke="#10B981" 
                    strokeWidth={4} 
                    dot={{ r: 4, strokeWidth: 2, stroke: '#10B981', fill: '#fff' }} 
                    activeDot={{ r: 7, strokeWidth: 0 }} 
                    filter="url(#shadowSales)"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recent Sales Today (Right 4-columns) */}
        <div className="lg:col-span-4 glass-card rounded-4xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-space font-bold text-lg text-dairy-text mb-4">{t('recentSales')}</h3>
            <div className="flex flex-col gap-3 max-h-60 overflow-y-auto pr-1">
              {recentActivity.sales.length === 0 ? (
                <p className="text-xs text-dairy-text/40 font-bold py-6 text-center">
                  {t('noSalesToday')}
                </p>
              ) : (
                recentActivity.sales.map((sale: any) => (
                  <div key={sale.id} className="flex justify-between items-center p-3 rounded-2xl bg-white/50 border border-white shadow-sm">
                    <div className="text-left">
                      <p className="text-xs font-bold text-dairy-text">{sale.customer?.name || 'Customer'}</p>
                      <p className="text-[9px] text-dairy-text/50 uppercase font-semibold">
                        {sale.shift === 'MORNING' ? '☀️ Morning' : '🌙 Evening'} • {sale.quantity} L
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-space font-extrabold text-dairy-text">₹{sale.amount}</p>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${
                        sale.paymentMethod === 'PENDING'
                          ? 'bg-dairy-coral/10 text-dairy-coral'
                          : 'bg-dairy-green/10 text-dairy-green'
                      }`}>
                        {sale.paymentMethod === 'PENDING' ? t('pending') : sale.paymentMethod === 'CASH' ? t('cash') : t('upi')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/20 flex justify-between items-center text-xs font-bold text-dairy-sky hover:underline cursor-pointer" onClick={() => handleRefresh()}>
            <span>{language === 'hi' ? 'डेटा रीलोड करें' : 'Refresh Metrics'}</span>
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 5. MODAL OVERLAYS (PROD, EXP, PAY) */}
      {modalType && (
        <div className="fixed inset-0 z-[100] bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
          {/* Backdrop Click Dismiss */}
          <div className="absolute inset-0" onClick={() => setModalType(null)} />

          <div className="relative w-full max-w-md bg-milk-50 rounded-[32px] p-6 shadow-2xl border border-white/80 max-h-[90vh] overflow-y-auto z-10 text-left">
            <button 
              onClick={() => setModalType(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white border border-white/80 shadow-sm"
            >
              <X className="w-4 h-4 text-dairy-text/80" />
            </button>

            {modalType === 'PROD' && (
              <form onSubmit={handleCreateProd} className="flex flex-col gap-4">
                <h3 className="font-space font-extrabold text-lg text-dairy-text">{t('addYield')}</h3>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-dairy-text/60">{t('animals')}</label>
                  <select
                    value={prodForm.animalId}
                    onChange={(e) => setProdForm({ ...prodForm, animalId: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
                    required
                  >
                    <option value="" disabled hidden>-- Select Animal --</option>
                    {animals.filter((a: any) => a.status === 'ACTIVE').map((a: any) => (
                      <option key={a.id} value={a.id}>{a.name} ({a.breed})</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-dairy-text/60">{t('shift')}</label>
                  <select
                    value={prodForm.shift}
                    onChange={(e) => setProdForm({ ...prodForm, shift: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
                    required
                  >
                    <option value="" disabled hidden>-- Select Shift --</option>
                    <option value="MORNING">☀️ {t('morning')}</option>
                    <option value="EVENING">🌙 {t('evening')}</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-dairy-text/60">{t('quantity')}</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 7.5"
                    value={prodForm.quantity}
                    onChange={(e) => setProdForm({ ...prodForm, quantity: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-dairy-text/60">Home Consumption (Liters)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 1.0 (defaults to 0)"
                    value={prodForm.homeConsumption}
                    onChange={(e) => setProdForm({ ...prodForm, homeConsumption: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-dairy-text/60">{t('remarks')}</label>
                  <input
                    type="text"
                    placeholder="e.g. Health is good"
                    value={prodForm.notes}
                    onChange={(e) => setProdForm({ ...prodForm, notes: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-dairy-sky text-white font-bold rounded-2xl shadow-lg mt-2 active:scale-95 transition-all"
                >
                  {language === 'hi' ? 'सहेजें (Save Yield)' : 'Save Yield'}
                </button>
              </form>
            )}

            {modalType === 'EXP' && (
              <form onSubmit={handleCreateExp} className="flex flex-col gap-4">
                <h3 className="font-space font-extrabold text-lg text-dairy-text">{t('logExpense')}</h3>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-dairy-text/60">Category</label>
                  <select
                    value={expForm.category}
                    onChange={(e) => setExpForm({ ...expForm, category: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
                  >
                    <option value="FEED">🌾 Cattle Feed (Khal/Binola)</option>
                    <option value="MEDICINE">🧪 Medicine & Tonic</option>
                    <option value="VETERINARY">🩺 Vet Doctor Visit</option>
                    <option value="TRANSPORT">🚚 Transport & Logistics</option>
                    <option value="REPAIRS">🛠️ Equipment Repairs</option>
                    <option value="MISCELLANEOUS">📦 Miscellaneous Cost</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-dairy-text/60">Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 1200"
                    value={expForm.amount}
                    onChange={(e) => setExpForm({ ...expForm, amount: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-dairy-text/60">Description</label>
                  <input
                    type="text"
                    placeholder="e.g. Bought cottonseed feed bag"
                    value={expForm.description}
                    onChange={(e) => setExpForm({ ...expForm, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-dairy-coral text-white font-bold rounded-2xl shadow-lg mt-2 active:scale-95 transition-all"
                >
                  {t('logExpense')}
                </button>
              </form>
            )}

            {modalType === 'PAY' && (
              <form onSubmit={handleCreatePay} className="flex flex-col gap-4">
                <h3 className="font-space font-extrabold text-lg text-dairy-text">{t('collectDues')}</h3>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-dairy-text/60">{t('customer')}</label>
                  <select
                    value={payForm.customerId}
                    onChange={(e) => setPayForm({ ...payForm, customerId: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
                    required
                  >
                    <option value="" disabled hidden>-- Select Customer --</option>
                    {customers.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name} (Pending: ₹{c.pendingBalance})</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-dairy-text/60">Amount Collected (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 500"
                    value={payForm.amount}
                    onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-dairy-text/60">{t('paymentMethod')}</label>
                  <select
                    value={payForm.paymentMethod}
                    onChange={(e) => setPayForm({ ...payForm, paymentMethod: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
                  >
                    <option value="UPI">📱 UPI / QR Code</option>
                    <option value="CASH">💵 Cash payment</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-dairy-text/60">{t('remarks')}</label>
                  <input
                    type="text"
                    placeholder="e.g. Part payment clear"
                    value={payForm.remarks}
                    onChange={(e) => setPayForm({ ...payForm, remarks: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-dairy-gold text-white font-bold rounded-2xl shadow-lg mt-2 active:scale-95 transition-all"
                >
                  {t('collectDues')}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 5. SESSION ADJUSTMENT MODAL */}
      {adjModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="absolute inset-0" onClick={() => setAdjModalOpen(false)} />

          <div className="relative w-full max-w-md bg-milk-50 border border-white/60 rounded-4xl p-6 shadow-2xl z-10 text-left">
            <button
              onClick={() => setAdjModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white border border-white/80 shadow-sm"
            >
              <X className="w-5 h-5 text-dairy-text/70" />
            </button>

            <form onSubmit={handleCreateAdjustment} className="flex flex-col gap-4">
              <h3 className="font-space font-extrabold text-lg text-dairy-text">
                Session Stock Adjustment (स्टॉक समायोजन)
              </h3>
              <p className="text-xs text-dairy-text/50">
                Adjust or carry over remaining milk stock for a specific shift session.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-dairy-text/60">Select Date</label>
                  <input
                    type="date"
                    value={adjForm.date}
                    onChange={(e) => setAdjForm({ ...adjForm, date: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-dairy-text/60">Select Shift</label>
                  <select
                    value={adjForm.shift}
                    onChange={(e) => setAdjForm({ ...adjForm, shift: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
                    required
                  >
                    <option value="MORNING">☀️ {t('morning')}</option>
                    <option value="EVENING">🌙 {t('evening')}</option>
                  </select>
                </div>
              </div>

              <div className="bg-white/40 border border-white/60 p-3 rounded-2xl text-xs font-semibold text-dairy-text/70 flex justify-between items-center">
                <span>Calculated Remaining Milk:</span>
                <span className="font-space font-extrabold text-sm text-dairy-sky">{remainingForAdj} L</span>
              </div>

              {isSessionAlreadyAdjusted && (
                <div className="bg-dairy-coral/10 border border-dairy-coral/20 p-3.5 rounded-2xl text-xs font-bold text-dairy-coral text-center">
                  ⚠️ {language === 'hi' ? 'इस सत्र के स्टॉक को पहले ही स्थानांतरित या खाली कर दिया गया है!' : 'This session has already been emptied or rolled over!'}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-dairy-text/60">Adjustment Action</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjForm({ ...adjForm, actionType: 'EMPTY' })}
                    className={`py-3 rounded-xl border text-xs font-bold transition-all ${
                      adjForm.actionType === 'EMPTY'
                        ? 'bg-dairy-coral/10 text-dairy-coral border-dairy-coral'
                        : 'bg-white/50 text-dairy-text/60 border-white/80 hover:bg-white'
                    }`}
                  >
                    🗑️ Make Session Empty
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjForm({ ...adjForm, actionType: 'ROLLOVER' })}
                    className={`py-3 rounded-xl border text-xs font-bold transition-all ${
                      adjForm.actionType === 'ROLLOVER'
                        ? 'bg-dairy-sky/10 text-dairy-sky border-dairy-sky'
                        : 'bg-white/50 text-dairy-text/60 border-white/80 hover:bg-white'
                    }`}
                  >
                    🔄 Roll Over to Next Session
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-dairy-text/60">Quantity to Adjust (Liters)</label>
                <input
                  type="number"
                  step="0.1"
                  disabled={isSessionAlreadyAdjusted}
                  value={adjForm.quantity}
                  onChange={(e) => setAdjForm({ ...adjForm, quantity: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl text-sm font-semibold glass-input text-dairy-text disabled:opacity-50"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSessionAlreadyAdjusted}
                className="w-full py-3.5 bg-dairy-sky text-white font-bold rounded-2xl shadow-lg mt-2 active:scale-95 transition-all text-sm disabled:bg-dairy-text/25 disabled:shadow-none disabled:pointer-events-none"
              >
                Save Adjustment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Dashboard;
