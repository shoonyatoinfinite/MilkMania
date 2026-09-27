import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../utils/translations';
import {
  TrendingUp,
  ShoppingBag,
  Receipt,
  ShoppingCart,
  Sparkles,
  Calendar,
  CheckCircle2,
  Trash2,
  Printer,
  ChevronDown,
  ChevronUp,
  Plus,
  RefreshCw,
  Clock,
  ArrowUpRight,
  Filter
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const getLocalDateStr = (dVal: string | Date = new Date()) => {
  const d = new Date(dVal);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getAutoShift = (): 'MORNING' | 'EVENING' => {
  const currentHour = new Date().getHours();
  return currentHour >= 13 ? 'EVENING' : 'MORNING';
};

export const Dashboard: React.FC = () => {
  const {
    user,
    customers,
    settings,
    dashboardStats,
    language,
    refreshAllData,
    createSale,
    deleteSale,
    createExpense,
    deleteExpense,
    milkBought,
    enableMilkBought,
    createMilkBought,
    deleteMilkBought,
    createCustomer
  } = useApp();

  const { t } = useTranslation(language);

  // State: Direct Milk Sale Feed
  const [saleType, setSaleType] = useState<'INDIVIDUAL' | 'BULK'>('INDIVIDUAL');
  const [saleCustomerId, setSaleCustomerId] = useState('');
  const [saleShift, setSaleShift] = useState<'MORNING' | 'EVENING'>(getAutoShift);
  const [saleQuantity, setSaleQuantity] = useState('');
  const [saleRate, setSaleRate] = useState('');
  const [salePaymentMethod, setSalePaymentMethod] = useState<'CASH' | 'UPI' | 'PENDING'>('PENDING');
  const [saleRemarks, setSaleRemarks] = useState('');
  const [savingSale, setSavingSale] = useState(false);
  const [saleSuccessToast, setSaleSuccessToast] = useState(false);

  // State: Milk Bought Form (Hidden unless enabled in settings)
  const [boughtSupplier, setBoughtSupplier] = useState('');
  const [boughtShift, setBoughtShift] = useState<'MORNING' | 'EVENING'>(getAutoShift);
  const [boughtQuantity, setBoughtQuantity] = useState('');
  const [boughtRate, setBoughtRate] = useState('');
  const [boughtFat, setBoughtFat] = useState('');
  const [boughtSnf, setBoughtSnf] = useState('');
  const [boughtPaymentMethod, setBoughtPaymentMethod] = useState<'CASH' | 'UPI' | 'PENDING'>('PENDING');
  const [boughtNotes, setBoughtNotes] = useState('');
  const [savingBought, setSavingBought] = useState(false);
  const [boughtSuccessToast, setBoughtSuccessToast] = useState(false);
  const [showFatSnfFields, setShowFatSnfFields] = useState(false);

  // State: Expenses Form
  const [expCategory, setExpCategory] = useState('FEED');
  const [expAmount, setExpAmount] = useState('');
  const [expDescription, setExpDescription] = useState('');
  const [expDate, setExpDate] = useState(getLocalDateStr());
  const [savingExp, setSavingExp] = useState(false);
  const [expSuccessToast, setExpSuccessToast] = useState(false);

  // Bottom Analytics Filter & Refresh State
  const [analyticsFilter, setAnalyticsFilter] = useState<'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'ALL_TIME'>('TODAY');
  const [refreshing, setRefreshing] = useState(false);

  // Live Real-Time & Date Clock State (updates every 1 second)
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter customers by selected sale type (Individual vs Bulk)
  const filteredCustomers = useMemo(() => {
    return (customers || []).filter((c: any) => {
      const type = c.customerType || 'INDIVIDUAL';
      return type === saleType;
    });
  }, [customers, saleType]);

  // Set default rate whenever saleType changes or customer changes
  useEffect(() => {
    if (saleCustomerId) {
      const selected = customers.find((c: any) => c.id === saleCustomerId);
      if (selected) {
        setSaleRate(String(selected.pricePerLiter || ''));
        return;
      }
    }
    // Fallback to default rates from settings
    if (saleType === 'INDIVIDUAL') {
      setSaleRate(settings?.default_milk_rate || '65');
    } else {
      setSaleRate(settings?.default_bulk_rate || '58');
    }
  }, [saleType, saleCustomerId, settings]);

  // Auto-fill buy rate default
  useEffect(() => {
    if (!boughtRate) {
      setBoughtRate(settings?.default_bulk_rate || '55');
    }
  }, [settings]);

  // Refresh data on mount or when filter changes
  useEffect(() => {
    handleFilterChange(analyticsFilter);
  }, []);

  const handleFilterChange = (filter: typeof analyticsFilter) => {
    setAnalyticsFilter(filter);
    const today = new Date();
    let start = '';
    let end = getLocalDateStr(today);

    if (filter === 'TODAY') {
      start = getLocalDateStr(today);
    } else if (filter === 'THIS_WEEK') {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - 6);
      start = getLocalDateStr(startOfWeek);
    } else if (filter === 'THIS_MONTH') {
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      start = `${year}-${month}-01`;
    } else if (filter === 'ALL_TIME') {
      start = '2020-01-01';
    }

    refreshAllData(start, end);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await handleFilterChange(analyticsFilter);
    setRefreshing(false);
  };

  // Add Liters Presets for Milk Sale
  const addQuantityPreset = (amount: number) => {
    const current = parseFloat(saleQuantity) || 0;
    const nextVal = Math.round((current + amount) * 10) / 10;
    setSaleQuantity(String(nextVal));
  };

  // Add Liters Presets for Milk Bought
  const addBoughtQuantityPreset = (amount: number) => {
    const current = parseFloat(boughtQuantity) || 0;
    const nextVal = Math.round((current + amount) * 10) / 10;
    setBoughtQuantity(String(nextVal));
  };

  // Calculated Milk Sale Amount
  const computedSaleAmount = useMemo(() => {
    const q = parseFloat(saleQuantity) || 0;
    const r = parseFloat(saleRate) || 0;
    return Math.round(q * r * 10) / 10;
  }, [saleQuantity, saleRate]);

  // Calculated Milk Bought Amount
  const computedBoughtAmount = useMemo(() => {
    const q = parseFloat(boughtQuantity) || 0;
    const r = parseFloat(boughtRate) || 0;
    return Math.round(q * r * 10) / 10;
  }, [boughtQuantity, boughtRate]);

  // 1. Submit Direct Milk Sale
  const handleSaveSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleCustomerId) {
      alert(language === 'hi' ? 'कृपया ग्राहक चुनें!' : 'Please select a customer.');
      return;
    }
    const qty = parseFloat(saleQuantity);
    const rateVal = parseFloat(saleRate);
    if (!qty || qty <= 0) {
      alert(language === 'hi' ? 'कृपया मान्य मात्रा (लीटर) भरें।' : 'Please enter valid quantity (liters).');
      return;
    }
    if (!rateVal || rateVal <= 0) {
      alert(language === 'hi' ? 'कृपया मान्य दर भरें।' : 'Please enter a valid rate.');
      return;
    }

    // Check duplicate sale for customer in this shift today
    const isSameDay = (d1: string | Date, d2: string | Date) => {
      const a = new Date(d1);
      const b = new Date(d2);
      return a.getFullYear() === b.getFullYear() &&
             a.getMonth() === b.getMonth() &&
             a.getDate() === b.getDate();
    };

    const duplicateSale = (sales || []).find((s: any) => 
      s.customerId === saleCustomerId && 
      s.shift === saleShift && 
      isSameDay(s.date, new Date())
    );

    if (duplicateSale) {
      alert(
        language === 'hi'
          ? `इस ग्राहक के लिए आज के ${saleShift === 'MORNING' ? 'सुबह' : 'शाम'} के सत्र में पहले से ही दूध बिक्री का रिकॉर्ड दर्ज है। एक सत्र में केवल एक बार ही रिकॉर्ड भरा जा सकता है।`
          : `Milk record already filled for this customer in ${saleShift === 'MORNING' ? 'Morning' : 'Evening'} shift today. Duplicate entries in the same shift are not allowed.`
      );
      return;
    }

    setSavingSale(true);
    const success = await createSale({
      customerId: saleCustomerId,
      shift: saleShift,
      quantity: qty,
      rate: rateVal,
      amount: computedSaleAmount,
      paymentMethod: salePaymentMethod,
      remarks: saleRemarks,
      date: new Date().toISOString()
    });
    setSavingSale(false);

    if (success) {
      setSaleQuantity('');
      setSaleRemarks('');
      setSalePaymentMethod('PENDING');
      setSaleShift(getAutoShift());
      setSaleSuccessToast(true);
      setTimeout(() => setSaleSuccessToast(false), 3000);
    }
  };

  // 2. Submit Milk Bought
  const handleSaveMilkBought = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boughtSupplier.trim()) {
      alert(language === 'hi' ? 'कृपया सप्लायर का नाम भरें।' : 'Please enter supplier name.');
      return;
    }
    const qty = parseFloat(boughtQuantity);
    const rateVal = parseFloat(boughtRate);
    if (!qty || qty <= 0) {
      alert(language === 'hi' ? 'कृपया मान्य मात्रा भरें।' : 'Please enter valid quantity.');
      return;
    }

    setSavingBought(true);
    const success = await createMilkBought({
      supplierName: boughtSupplier.trim(),
      shift: boughtShift,
      quantity: qty,
      rate: rateVal,
      amount: computedBoughtAmount,
      fat: boughtFat ? parseFloat(boughtFat) : undefined,
      snf: boughtSnf ? parseFloat(boughtSnf) : undefined,
      paymentMethod: boughtPaymentMethod,
      notes: boughtNotes,
      date: new Date().toISOString()
    });
    setSavingBought(false);

    if (success) {
      setBoughtQuantity('');
      setBoughtNotes('');
      setBoughtFat('');
      setBoughtSnf('');
      setBoughtPaymentMethod('PENDING');
      setBoughtShift(getAutoShift());
      setBoughtSuccessToast(true);
      setTimeout(() => setBoughtSuccessToast(false), 3000);
    }
  };

  // 4. Submit Animal Expense
  const handleSaveAnimalExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(expAmount);
    if (!amt || amt <= 0) {
      alert(language === 'hi' ? 'कृपया मान्य खर्चे की राशि भरें।' : 'Please enter a valid expense amount.');
      return;
    }

    setSavingExp(true);
    const success = await createExpense({
      date: new Date(expDate).toISOString(),
      category: expCategory,
      amount: amt,
      description: expDescription
    });
    setSavingExp(false);

    if (success) {
      setExpAmount('');
      setExpDescription('');
      setExpSuccessToast(true);
      setTimeout(() => setExpSuccessToast(false), 3000);
    }
  };

  // Analytics data from backend stats
  const analytics = dashboardStats?.analytics || {
    totalSoldLiters: 0,
    totalRevenue: 0,
    avgSellRate: 0,
    individual: { liters: 0, revenue: 0, count: 0, percentage: 0 },
    bulk: { liters: 0, revenue: 0, count: 0, percentage: 0 },
    shifts: {
      morning: { liters: 0, revenue: 0 },
      evening: { liters: 0, revenue: 0 }
    },
    milkBought: { liters: 0, cost: 0, avgRate: 0, count: 0, morningLiters: 0, eveningLiters: 0 },
    animalExpenses: { total: 0, byCategory: {}, count: 0 },
    netFinancials: { grossRevenue: 0, milkBoughtCost: 0, animalExpenses: 0, netProfit: 0, margin: 0 }
  };

  const chartData = dashboardStats?.weeklyChart || [];
  const recentSalesList = dashboardStats?.recentActivity?.sales || [];
  const recentExpensesList = dashboardStats?.recentActivity?.expenses || [];
  const recentBoughtList = dashboardStats?.recentActivity?.milkBought || [];

  return (
    <div className="flex-1 min-h-screen pt-16 lg:pt-6 pb-24 lg:pb-12 lg:pl-72 px-3 sm:px-6 max-w-6xl mx-auto text-left">

      {/* 1. TOP HEADER & REAL-TIME CLOCK & DATE BAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 bg-gradient-to-r from-white via-sky-50/40 to-white/90 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-sky-100 shadow-sm">
        <div>
          {/* Active Shift & Live Clock / Date Strip */}
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-sky-100 text-sky-800 border border-sky-200/60 shadow-xs">
              {getAutoShift() === 'MORNING' ? `☀️ ${t('morning')}` : `🌙 ${t('evening')}`} {t('activeShift')}
            </span>

            {/* Real-time Live Clock */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-mono tracking-tight font-extrabold">
                {currentTime.toLocaleTimeString(language === 'hi' ? 'hi-IN' : 'en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: true
                })}
              </span>
            </div>

            {/* Real-time Full Date */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 text-gray-700 border border-gray-200 text-xs font-bold shadow-xs">
              <Calendar className="w-3.5 h-3.5 text-sky-600" />
              <span>
                {currentTime.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-space font-extrabold text-dairy-text mt-1 tracking-tight">
            {t('welcome')}, {user?.name?.split(' ')[0] || 'Farmer'}! 👋
          </h1>
          <p className="text-xs text-dairy-text/60 font-medium">
            {t('dashboardSubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-sky-50 rounded-2xl border border-sky-200 text-sky-800 text-xs font-bold shadow-sm active:scale-95 transition-all"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-sky-600' : 'text-sky-600'}`} />
            <span>{language === 'hi' ? 'रीफ्रेश' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* 2. DIRECT MILK SELL ENTRY (TOP - FRONT & CENTER) */}
      <section className="bg-white rounded-3xl border-2 border-sky-200 p-4 sm:p-6 shadow-md mb-8 relative overflow-hidden">
        {/* Soft sky blue top accent line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-sky-400 via-sky-500 to-sky-300" />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-sky-100 text-sky-700 rounded-2xl text-xl shadow-inner">🥛</span>
            <div>
              <h2 className="font-space font-extrabold text-lg sm:text-xl text-dairy-text">
                {t('quickEntry')}
              </h2>
              <p className="text-xs text-dairy-text/60">
                {language === 'hi' ? 'सीधे दूध बिक्री का रिकॉर्ड दर्ज करें' : 'Directly record milk sales for customers'}
              </p>
            </div>
          </div>

          {/* Individual vs Bulk Mode Pills */}
          <div className="flex p-1 bg-sky-50 rounded-2xl border border-sky-200">
            <button
              type="button"
              onClick={() => {
                setSaleType('INDIVIDUAL');
                setSaleCustomerId('');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${saleType === 'INDIVIDUAL'
                  ? 'bg-dairy-sky text-white shadow-sm'
                  : 'text-sky-900 hover:text-sky-600'
                }`}
            >
              👥 {t('individualTag')}
            </button>
            <button
              type="button"
              onClick={() => {
                setSaleType('BULK');
                setSaleCustomerId('');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${saleType === 'BULK'
                  ? 'bg-dairy-sky text-white shadow-sm'
                  : 'text-sky-900 hover:text-sky-600'
                }`}
            >
              🚚 {t('bulkTag')}
            </button>
          </div>
        </div>

        {saleSuccessToast && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-bounce">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{t('milkSaleSavedSuccess')}</span>
          </div>
        )}

        <form onSubmit={handleSaveSale} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4">

            {/* Shift Picker */}
            <div className="sm:col-span-1 lg:col-span-3">
              <label className="block text-xs font-bold text-dairy-text/75 mb-1">
                {t('shift')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSaleShift('MORNING')}
                  className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${saleShift === 'MORNING'
                      ? 'bg-sky-500 text-white border-sky-500 shadow-sm'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-sky-50'
                    }`}
                >
                  ☀️ {t('morning')}
                </button>
                <button
                  type="button"
                  onClick={() => setSaleShift('EVENING')}
                  className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${saleShift === 'EVENING'
                      ? 'bg-sky-500 text-white border-sky-500 shadow-sm'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-sky-50'
                    }`}
                >
                  🌙 {t('evening')}
                </button>
              </div>
            </div>

            {/* Customer Selection */}
            <div className="sm:col-span-1 lg:col-span-5">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-dairy-text/75">
                  {t('selectCustomerOrBuyer')} ({saleType === 'INDIVIDUAL' ? t('individualTag') : t('bulkTag')})
                </label>
              </div>
              <select
                value={saleCustomerId}
                onChange={(e) => setSaleCustomerId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm font-semibold border border-sky-200 bg-sky-50/40 text-dairy-text focus:bg-white focus:border-sky-500 focus:outline-none"
                required
              >
                <option value="">-- {t('selectCustomer')} --</option>
                {filteredCustomers.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ''} - ₹{c.pricePerLiter}/L
                  </option>
                ))}
              </select>

              {/* Inline warning if record already exists for this customer in selected shift today */}
              {saleCustomerId && (sales || []).some((s: any) => {
                const a = new Date(s.date);
                const b = new Date();
                const isToday = a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
                return s.customerId === saleCustomerId && s.shift === saleShift && isToday;
              }) && (
                <div className="mt-1.5 p-2 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold flex items-center gap-1.5">
                  <span className="text-amber-600">⚠️</span>
                  <span>
                    {language === 'hi'
                      ? `इस ग्राहक के लिए आज ${saleShift === 'MORNING' ? 'सुबह' : 'शाम'} का रिकॉर्ड पहले से भरा हुआ है!`
                      : `Milk record already filled for this customer in ${saleShift === 'MORNING' ? 'Morning' : 'Evening'} shift today!`}
                  </span>
                </div>
              )}
            </div>

            {/* Rate Per Liter */}
            <div className="sm:col-span-1 lg:col-span-4">
              <label className="block text-xs font-bold text-dairy-text/75 mb-1">
                {t('rate')}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-gray-400">₹</span>
                <input
                  type="number"
                  step="0.5"
                  value={saleRate}
                  onChange={(e) => setSaleRate(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 rounded-xl text-sm font-bold border border-sky-200 bg-white text-dairy-text focus:border-sky-500 focus:outline-none"
                  placeholder="65"
                  required
                />
              </div>
            </div>

            {/* Quantity (Liters) + Quick Chips */}
            <div className="sm:col-span-1 lg:col-span-6">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-dairy-text/75">
                  {t('quantity')}
                </label>
                <span className="text-[10px] font-extrabold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full">
                  {t('quickPresets')}
                </span>
              </div>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={saleQuantity}
                onChange={(e) => setSaleQuantity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm font-bold border border-sky-200 bg-white text-dairy-text focus:border-sky-500 focus:outline-none"
                placeholder="e.g. 2.0 or 15.0"
                required
              />

              {/* Fast Tap Presets */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[1, 2, 5, 10, 20, 50].map((liters) => (
                  <button
                    key={liters}
                    type="button"
                    onClick={() => addQuantityPreset(liters)}
                    className="px-2.5 py-1 rounded-lg bg-sky-100 hover:bg-sky-200 text-sky-800 text-xs font-bold border border-sky-200 active:scale-95 transition-all"
                  >
                    +{liters}L
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Method */}
            <div className="sm:col-span-1 lg:col-span-6">
              <label className="block text-xs font-bold text-dairy-text/75 mb-1">
                {t('paymentMethod')}
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { key: 'PENDING', label: `⏳ ${t('pending')}` },
                  { key: 'CASH', label: `💵 ${t('cash')}` },
                  { key: 'UPI', label: `📱 ${t('upi')}` }
                ].map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setSalePaymentMethod(m.key as any)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${salePaymentMethod === m.key
                        ? m.key === 'PENDING'
                          ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                          : m.key === 'CASH'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-sky-600 text-white border-sky-600 shadow-sm'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-sky-50'
                      }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Calculated Amount Display Box */}
              <div className="mt-2.5 px-3 py-2 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-between">
                <span className="text-xs font-bold text-sky-800">{t('amount')}:</span>
                <span className="font-space font-extrabold text-base text-sky-700">
                  ₹{computedSaleAmount}
                </span>
              </div>
            </div>

            {/* Optional Remarks */}
            <div className="col-span-1 sm:col-span-2 lg:col-span-12">
              <input
                type="text"
                value={saleRemarks}
                onChange={(e) => setSaleRemarks(e.target.value)}
                placeholder={language === 'hi' ? 'विवरण या टिप्पणी (वैकल्पिक)...' : 'Remarks or note (optional)...'}
                className="w-full px-3 py-2 rounded-xl text-xs border border-gray-200 bg-white text-dairy-text focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={savingSale}
            className="w-full py-3.5 rounded-2xl bg-dairy-sky hover:bg-sky-600 text-white font-space font-extrabold text-sm sm:text-base shadow-lg shadow-sky-500/25 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            {savingSale ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>{t('saveSale')}</span>
                <span className="text-xs font-normal opacity-90">
                  ({computedSaleAmount > 0 ? `₹${computedSaleAmount}` : ''})
                </span>
              </>
            )}
          </button>
        </form>

        {/* Recent Milk Sales Summary Card List */}
        {recentSalesList.length > 0 && (
          <div className="mt-6 pt-5 border-t border-sky-100">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-space font-bold text-xs uppercase tracking-wider text-dairy-text/70">
                {t('recentSales')}
              </h3>
              <span className="text-[10px] text-dairy-text/50 font-semibold">
                {recentSalesList.length} {language === 'hi' ? 'प्रविष्टियां' : 'records'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
              {recentSalesList.slice(0, 6).map((s: any) => (
                <div
                  key={s.id}
                  className="p-2.5 bg-sky-50/50 hover:bg-sky-50 border border-sky-100 rounded-2xl flex justify-between items-center text-xs"
                >
                  <div className="leading-tight">
                    <p className="font-bold text-dairy-text truncate max-w-[130px]">
                      {s.customer?.name || 'Customer'}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {s.shift === 'MORNING' ? '☀️' : '🌙'} {s.quantity}L @ ₹{s.rate || Math.round((s.amount / s.quantity) * 10) / 10}
                    </p>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <div>
                      <p className="font-extrabold text-sky-700 font-space">₹{s.amount}</p>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${s.paymentMethod === 'CASH' ? 'bg-emerald-100 text-emerald-700' :
                          s.paymentMethod === 'UPI' ? 'bg-sky-100 text-sky-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                        {s.paymentMethod}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(t('confirmDeleteMsg'))) deleteSale(s.id);
                      }}
                      className="p-1 text-gray-400 hover:text-red-500 rounded-lg"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 3. MILK BOUGHT SECTION (HIDDEN AT FIRST, VISIBLE ONLY WHEN ENABLED IN SETTINGS) */}
      {enableMilkBought && (
        <section id="milk-bought" className="bg-white rounded-3xl border-2 border-emerald-200 p-4 sm:p-6 shadow-md mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-300" />

          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-emerald-100 text-emerald-700 rounded-2xl text-xl">🛒</span>
              <div>
                <h2 className="font-space font-extrabold text-lg sm:text-xl text-dairy-text">
                  {t('milkBoughtTitle')}
                </h2>
                <p className="text-xs text-dairy-text/60">
                  {t('milkBoughtSubtitle')}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
              {language === 'hi' ? 'सक्रिय' : 'Active'}
            </span>
          </div>

          {boughtSuccessToast && (
            <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{t('milkBoughtSavedSuccess')}</span>
            </div>
          )}

          <form onSubmit={handleSaveMilkBought} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4">

              {/* Supplier Name */}
              <div className="sm:col-span-1 lg:col-span-4">
                <label className="block text-xs font-bold text-dairy-text/75 mb-1">
                  {t('supplierName')}
                </label>
                <input
                  type="text"
                  value={boughtSupplier}
                  onChange={(e) => setBoughtSupplier(e.target.value)}
                  placeholder={t('enterSupplierName')}
                  className="w-full px-3 py-2 rounded-xl text-sm font-semibold border border-emerald-200 bg-emerald-50/20 text-dairy-text focus:bg-white focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>

              {/* Shift */}
              <div className="sm:col-span-1 lg:col-span-3">
                <label className="block text-xs font-bold text-dairy-text/75 mb-1">
                  {t('shift')}
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setBoughtShift('MORNING')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${boughtShift === 'MORNING'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-emerald-50'
                      }`}
                  >
                    ☀️ {t('morning')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setBoughtShift('EVENING')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${boughtShift === 'EVENING'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-emerald-50'
                      }`}
                  >
                    🌙 {t('evening')}
                  </button>
                </div>
              </div>

              {/* Rate Per Liter */}
              <div className="sm:col-span-1 lg:col-span-2">
                <label className="block text-xs font-bold text-dairy-text/75 mb-1">
                  {t('rate')}
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={boughtRate}
                  onChange={(e) => setBoughtRate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm font-bold border border-emerald-200 bg-white text-dairy-text focus:border-emerald-500 focus:outline-none"
                  placeholder="55"
                  required
                />
              </div>

              {/* Quantity + Presets */}
              <div className="sm:col-span-1 lg:col-span-3">
                <label className="block text-xs font-bold text-dairy-text/75 mb-1">
                  {t('quantity')}
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={boughtQuantity}
                  onChange={(e) => setBoughtQuantity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm font-bold border border-emerald-200 bg-white text-dairy-text focus:border-emerald-500 focus:outline-none"
                  placeholder="e.g. 20"
                  required
                />
                <div className="flex gap-1 mt-1.5">
                  {[5, 10, 20, 50].map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => addBoughtQuantityPreset(l)}
                      className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-bold"
                    >
                      +{l}L
                    </button>
                  ))}
                </div>
              </div>

              {/* Total Computed Amount */}
              <div className="sm:col-span-1 lg:col-span-4">
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex justify-between items-center">
                  <span className="text-xs font-bold text-emerald-800">{t('amount')}:</span>
                  <span className="font-space font-extrabold text-base text-emerald-700">₹{computedBoughtAmount}</span>
                </div>
              </div>

              {/* Payment Mode */}
              <div className="sm:col-span-1 lg:col-span-4">
                <div className="grid grid-cols-3 gap-1 pt-1.5">
                  {(['PENDING', 'CASH', 'UPI'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setBoughtPaymentMethod(m)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${boughtPaymentMethod === m
                          ? m === 'PENDING'
                            ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                            : 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-emerald-50'
                        }`}
                    >
                      {m === 'PENDING' ? `⏳ ${t('pending')}` : m === 'CASH' ? `💵 ${t('cash')}` : `📱 ${t('upi')}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional FAT & SNF toggle */}
              <div className="sm:col-span-2 lg:col-span-4 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setShowFatSnfFields(!showFatSnfFields)}
                  className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
                >
                  {showFatSnfFields ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  <span>{showFatSnfFields ? 'Hide FAT/SNF' : '+ Add FAT / SNF'}</span>
                </button>
              </div>

              {/* FAT & SNF Fields */}
              {showFatSnfFields && (
                <div className="col-span-1 sm:col-span-2 lg:col-span-12 grid grid-cols-2 gap-3 p-3 bg-emerald-50/30 rounded-2xl border border-emerald-100">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">{t('fat')}</label>
                    <input
                      type="number"
                      step="0.1"
                      value={boughtFat}
                      onChange={(e) => setBoughtFat(e.target.value)}
                      placeholder="e.g. 6.5"
                      className="w-full px-3 py-1.5 rounded-xl text-xs border border-gray-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">{t('snf')}</label>
                    <input
                      type="number"
                      step="0.1"
                      value={boughtSnf}
                      onChange={(e) => setBoughtSnf(e.target.value)}
                      placeholder="e.g. 9.0"
                      className="w-full px-3 py-1.5 rounded-xl text-xs border border-gray-200 bg-white"
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={savingBought}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-space font-extrabold text-sm shadow-md active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              {savingBought ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>{t('saveMilkBought')}</span>}
            </button>
          </form>

          {/* Recent Bought Records */}
          {recentBoughtList.length > 0 && (
            <div className="mt-5 pt-4 border-t border-emerald-100">
              <h3 className="font-space font-bold text-xs uppercase tracking-wider text-dairy-text/70 mb-2">
                {t('recentMilkBought')}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1">
                {recentBoughtList.slice(0, 6).map((b: any) => (
                  <div key={b.id} className="p-2.5 bg-emerald-50/50 border border-emerald-100 rounded-xl flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-dairy-text">{b.supplierName}</p>
                      <p className="text-[10px] text-gray-500">{b.shift === 'MORNING' ? '☀️' : '🌙'} {b.quantity}L @ ₹{b.rate}</p>
                    </div>
                    <div className="text-right flex items-center gap-1.5">
                      <span className="font-extrabold text-emerald-800 font-space">₹{b.amount}</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(t('confirmDeleteMsg'))) deleteMilkBought(b.id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* 4. ANIMAL EXPENSES SECTION ("At below their should be a option to log and save expenses for animals") */}
      <section className="bg-white rounded-3xl border-2 border-amber-200 p-4 sm:p-6 shadow-md mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300" />

        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-amber-100 text-amber-700 rounded-2xl text-xl">🐾</span>
            <div>
              <h2 className="font-space font-extrabold text-lg sm:text-xl text-dairy-text">
                {t('animalExpensesTitle')}
              </h2>
              <p className="text-xs text-dairy-text/60">
                {t('animalExpensesSubtitle')}
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            {t('totalAnimalExpenses')}: ₹{analytics.animalExpenses?.total || 0}
          </span>
        </div>

        {expSuccessToast && (
          <div className="mb-4 p-3 rounded-2xl bg-amber-50 border border-amber-300 text-amber-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-600" />
            <span>{t('animalExpenseSavedSuccess')}</span>
          </div>
        )}

        <form onSubmit={handleSaveAnimalExpense} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4">

            {/* Category */}
            <div className="sm:col-span-1 lg:col-span-5">
              <label className="block text-xs font-bold text-dairy-text/75 mb-1">
                {t('expenseCategory')}
              </label>
              <select
                value={expCategory}
                onChange={(e) => setExpCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm font-semibold border border-amber-200 bg-amber-50/30 text-dairy-text focus:bg-white focus:border-amber-500 focus:outline-none"
              >
                <option value="FEED">{t('feedCategoryLabel')}</option>
                <option value="VETERINARY">{t('veterinaryCategoryLabel')}</option>
                <option value="MEDICINE">{t('medicineCategoryLabel')}</option>
                <option value="INSEMINATION">{t('inseminationCategoryLabel')}</option>
                <option value="EQUIPMENT">{t('equipmentCategoryLabel')}</option>
                <option value="REPAIRS">{t('repairsCategoryLabel')}</option>
                <option value="MISCELLANEOUS">{t('miscellaneousCategoryLabel')}</option>
              </select>
            </div>

            {/* Expense Amount */}
            <div className="sm:col-span-1 lg:col-span-4">
              <label className="block text-xs font-bold text-dairy-text/75 mb-1">
                {t('expenseAmount')}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-gray-400">₹</span>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full pl-7 pr-3 py-2 rounded-xl text-sm font-bold border border-amber-200 bg-white text-dairy-text focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Date */}
            <div className="sm:col-span-1 lg:col-span-3">
              <label className="block text-xs font-bold text-dairy-text/75 mb-1">
                {t('date')}
              </label>
              <input
                type="date"
                value={expDate}
                onChange={(e) => setExpDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs border border-amber-200 bg-white text-dairy-text focus:border-amber-500 focus:outline-none"
              />
            </div>

            {/* Description */}
            <div className="col-span-1 sm:col-span-2 lg:col-span-12">
              <input
                type="text"
                value={expDescription}
                onChange={(e) => setExpDescription(e.target.value)}
                placeholder={language === 'hi' ? 'खर्चे का विवरण (जैसे: 2 बोरी खल, डॉक्टर दवाई, सीमन आदि)...' : 'Description (e.g. 2 bags cattle feed, doctor checkup)...'}
                className="w-full px-3 py-2 rounded-xl text-xs border border-amber-200 bg-white text-dairy-text focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={savingExp}
            className="w-full py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-space font-extrabold text-sm shadow-md active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            {savingExp ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>{t('saveAnimalExpense')}</span>}
          </button>
        </form>

        {/* Recent Animal Expenses List */}
        {recentExpensesList.length > 0 && (
          <div className="mt-5 pt-4 border-t border-amber-100">
            <h3 className="font-space font-bold text-xs uppercase tracking-wider text-dairy-text/70 mb-2">
              {t('recentAnimalExpenses')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1">
              {recentExpensesList.slice(0, 6).map((e: any) => (
                <div key={e.id} className="p-2.5 bg-amber-50/50 border border-amber-100 rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-dairy-text truncate max-w-[130px]">{e.description || e.category}</p>
                    <p className="text-[10px] text-gray-500">{new Date(e.date).toLocaleDateString()} • {e.category}</p>
                  </div>
                  <div className="text-right flex items-center gap-1.5">
                    <span className="font-extrabold text-amber-800 font-space">₹{e.amount}</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(t('confirmDeleteMsg'))) deleteExpense(e.id);
                      }}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 5. OVERALL FULL DATA ANALYTICS AT BOTTOM ("Their should be a overall full data aalysics available at bottom.") */}
      <section className="bg-white rounded-3xl border-2 border-sky-300 p-4 sm:p-6 shadow-xl relative overflow-hidden">
        {/* Sky blue top accent line */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-sky-400 via-sky-600 to-cyan-400" />

        {/* Analytics Header & Filter Tabs */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-sky-100 text-sky-700 rounded-2xl text-xl">📊</span>
              <div>
                <h2 className="font-space font-extrabold text-lg sm:text-2xl text-dairy-text">
                  {t('overallAnalytics')}
                </h2>
                <p className="text-xs text-dairy-text/60">
                  {t('analyticsOverviewSubtitle')}
                </p>
              </div>
            </div>
          </div>

          {/* Time Filter Pills */}
          <div className="flex flex-wrap gap-1.5 p-1 bg-sky-50 rounded-2xl border border-sky-200">
            {[
              { key: 'TODAY', label: t('todayTab') },
              { key: 'THIS_WEEK', label: t('thisWeekTab') },
              { key: 'THIS_MONTH', label: t('thisMonthTab') },
              { key: 'ALL_TIME', label: t('allTimeTab') }
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleFilterChange(tab.key as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${analyticsFilter === tab.key
                    ? 'bg-dairy-sky text-white shadow-md'
                    : 'text-sky-900 hover:bg-sky-100'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Primary Metric Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Card 1: Total Milk Sold */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-50 to-white border border-sky-200 shadow-sm">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-700">
              🥛 {t('totalSold')}
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl sm:text-3xl font-space font-extrabold text-sky-950">
                {analytics.totalSoldLiters}
              </span>
              <span className="text-xs font-bold text-sky-700">Liters</span>
            </div>
            <p className="text-xs font-semibold text-gray-500 mt-1">
              {t('totalRevenue')}: <span className="font-bold text-sky-700">₹{analytics.totalRevenue}</span>
            </p>
            <p className="text-[10px] text-gray-400">
              {t('avgRate')}: ₹{analytics.avgSellRate}/L
            </p>
          </div>

          {/* Card 2: Individual vs Bulk Sales */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-white border border-indigo-200 shadow-sm">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700">
              👥 {t('individualVsBulk')}
            </span>
            <div className="space-y-1.5 mt-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-600">{t('individualTag')}:</span>
                <span className="font-bold text-indigo-900">{analytics.individual?.liters}L (₹{analytics.individual?.revenue})</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-600">{t('bulkTag')}:</span>
                <span className="font-bold text-indigo-900">{analytics.bulk?.liters}L (₹{analytics.bulk?.revenue})</span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-indigo-100 h-2 rounded-full overflow-hidden flex">
                <div
                  className="bg-indigo-600 h-full"
                  style={{ width: `${analytics.individual?.percentage || 0}%` }}
                  title={`Individual: ${analytics.individual?.percentage}%`}
                />
                <div
                  className="bg-indigo-300 h-full"
                  style={{ width: `${analytics.bulk?.percentage || 0}%` }}
                  title={`Bulk: ${analytics.bulk?.percentage}%`}
                />
              </div>
            </div>
          </div>

          {/* Card 3: Animal Expenses */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-white border border-amber-200 shadow-sm">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700">
              🐾 {t('totalAnimalExpenses')}
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl sm:text-3xl font-space font-extrabold text-amber-950">
                ₹{analytics.animalExpenses?.total}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {analytics.animalExpenses?.count} {language === 'hi' ? 'खर्चे के बिल' : 'logged entries'}
            </p>
            {enableMilkBought && (
              <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                + {t('milkBought')}: ₹{analytics.milkBought?.cost || 0}
              </p>
            )}
          </div>

          {/* Card 4: Net Farm Profit & Margin */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-300 shadow-sm">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
              💰 {t('netFarmProfit')}
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl sm:text-3xl font-space font-extrabold text-emerald-950">
                ₹{analytics.netFinancials?.netProfit}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs mt-1">
              <span className="font-semibold text-gray-500">{t('netMargin')}:</span>
              <span className="font-extrabold text-emerald-700">{analytics.netFinancials?.margin}%</span>
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {t('revenueMinusExpenses')}
            </p>
          </div>
        </div>

        {/* Secondary Row: Shifts & Milk Bought (if enabled) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Shift Comparison */}
          <div className="p-4 bg-sky-50/50 rounded-2xl border border-sky-100 text-xs">
            <h4 className="font-bold text-sky-900 mb-2.5 flex items-center gap-1.5">
              <span>☀️🌙</span>
              <span>{t('shiftComparison')}</span>
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2.5 bg-white rounded-xl border border-sky-100">
                <span className="text-gray-500 font-semibold">☀️ {t('morning')}</span>
                <p className="font-space font-extrabold text-lg text-sky-950 mt-0.5">
                  {analytics.shifts?.morning?.liters} L
                </p>
                <p className="text-[10px] text-sky-700 font-bold">₹{analytics.shifts?.morning?.revenue}</p>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-sky-100">
                <span className="text-gray-500 font-semibold">🌙 {t('evening')}</span>
                <p className="font-space font-extrabold text-lg text-sky-950 mt-0.5">
                  {analytics.shifts?.evening?.liters} L
                </p>
                <p className="text-[10px] text-sky-700 font-bold">₹{analytics.shifts?.evening?.revenue}</p>
              </div>
            </div>
          </div>

          {/* Milk Bought Summary (if enabled) OR Animal Expenses Breakdown */}
          {enableMilkBought ? (
            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 text-xs">
              <h4 className="font-bold text-emerald-900 mb-2.5 flex items-center gap-1.5">
                <span>🛒</span>
                <span>{t('totalMilkBought')}</span>
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 bg-white rounded-xl border border-emerald-100 text-center">
                  <span className="text-[10px] text-gray-500 font-semibold">{t('quantity')}</span>
                  <p className="font-space font-extrabold text-base text-emerald-950 mt-0.5">{analytics.milkBought?.liters} L</p>
                </div>
                <div className="p-2 bg-white rounded-xl border border-emerald-100 text-center">
                  <span className="text-[10px] text-gray-500 font-semibold">{t('amount')}</span>
                  <p className="font-space font-extrabold text-base text-emerald-950 mt-0.5">₹{analytics.milkBought?.cost}</p>
                </div>
                <div className="p-2 bg-white rounded-xl border border-emerald-100 text-center">
                  <span className="text-[10px] text-gray-500 font-semibold">{t('avgBuyRate')}</span>
                  <p className="font-space font-extrabold text-base text-emerald-950 mt-0.5">₹{analytics.milkBought?.avgRate}/L</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100 text-xs">
              <h4 className="font-bold text-amber-900 mb-2.5 flex items-center gap-1.5">
                <span>🌾</span>
                <span>{t('categoryBreakdown')}</span>
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(analytics.animalExpenses?.byCategory || {}).map(([cat, amt]) => (
                  <span key={cat} className="px-2.5 py-1 bg-white border border-amber-200 rounded-xl font-bold text-amber-950 text-[11px]">
                    {cat}: ₹{amt as number}
                  </span>
                ))}
                {Object.keys(analytics.animalExpenses?.byCategory || {}).length === 0 && (
                  <span className="text-gray-400 text-xs italic">{t('noExpensesToday')}</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Visual Trend Chart (Recharts) */}
        {chartData.length > 0 && (
          <div className="mt-4 pt-4 border-t border-sky-100">
            <h3 className="font-space font-bold text-xs uppercase tracking-wider text-dairy-text/75 mb-3 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-sky-600" />
              <span>{t('salesTrendChart')}</span>
            </h3>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0f2fe" />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #bae6fd', fontSize: '11px', boxShadow: '0 8px 24px rgba(2,132,199,0.1)' }}
                  />
                  <Area type="monotone" dataKey="sales" name={language === 'hi' ? 'दूध बिक्री (L)' : 'Sales (L)'} stroke="#0284c7" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
                  <Area type="monotone" dataKey="revenue" name={language === 'hi' ? 'कमाई (₹)' : 'Revenue (₹)'} stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </section>

    </div>
  );
};

export default Dashboard;
