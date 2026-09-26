import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../utils/translations';
import {
  Milk,
  LogOut,
  Sun,
  Moon,
  Calendar,
  CreditCard,
  Receipt,
  Settings,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Printer,
  ChevronRight,
  TrendingDown,
  Sparkles,
  Phone,
  MapPin,
  Tag,
  ShieldCheck,
  Eye,
  EyeOff,
  Copy,
  Check,
  Share2,
  X
} from 'lucide-react';

export const CustomerDashboard: React.FC = () => {
  const { customer, stats, purchases, payments, loading, customerLogout, changePin } = useCustomerAuth();
  const { language, setLanguage, settings } = useApp();
  const { t } = useTranslation(language);
  const navigate = useNavigate();

  // Active view tab: 'PURCHASES' | 'PAYMENTS' | 'STATEMENT'
  const [activeTab, setActiveTab] = useState<'PURCHASES' | 'PAYMENTS' | 'STATEMENT'>('PURCHASES');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Purchase filter: 'ALL' | 'THIS_MONTH' | 'MORNING' | 'EVENING'
  const [filterShift, setFilterShift] = useState<'ALL' | 'THIS_MONTH' | 'MORNING' | 'EVENING'>('ALL');

  // Statement date range: 'THIS_MONTH' | 'LAST_MONTH' | 'ALL' | 'CUSTOM'
  const [statementRange, setStatementRange] = useState<'THIS_MONTH' | 'LAST_MONTH' | 'ALL' | 'CUSTOM'>('THIS_MONTH');
  const [customStartDate, setCustomStartDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [customEndDate, setCustomEndDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Change PIN state
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPinInput, setShowPinInput] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [pinMsg, setPinMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleLogout = () => {
    customerLogout();
    navigate('/customer-login');
  };

  const handlePinChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinMsg(null);

    if (newPin.length !== 6 || !/^\d{6}$/.test(newPin)) {
      setPinMsg({ type: 'error', text: t('invalidPin') });
      return;
    }

    if (newPin !== confirmPin) {
      setPinMsg({ type: 'error', text: t('pinMismatch') });
      return;
    }

    setPinLoading(true);
    const result = await changePin(currentPin, newPin);
    setPinLoading(false);

    if (result.success) {
      setPinMsg({ type: 'success', text: result.message || t('pinChangedSuccess') });
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
    } else {
      setPinMsg({ type: 'error', text: result.message });
    }
  };

  // Filtered Purchases
  const filteredPurchases = useMemo(() => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return purchases.filter((p) => {
      if (filterShift === 'THIS_MONTH') {
        return new Date(p.date).getTime() >= firstDayOfMonth;
      }
      if (filterShift === 'MORNING') {
        return p.shift === 'MORNING';
      }
      if (filterShift === 'EVENING') {
        return p.shift === 'EVENING';
      }
      return true;
    });
  }, [purchases, filterShift]);

  // Statement filtered list & totals
  const statementData = useMemo(() => {
    const now = new Date();
    // Default fallback is 1 Jan 2026 (never 1970/1960)
    let startDate = new Date(2026, 0, 1, 0, 0, 0);
    let endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    if (statementRange === 'THIS_MONTH') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    } else if (statementRange === 'LAST_MONTH') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    } else if (statementRange === 'ALL') {
      // By default the previous data should be 1 Jan 2026
      startDate = new Date(2026, 0, 1, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    } else if (statementRange === 'CUSTOM') {
      startDate = customStartDate ? new Date(`${customStartDate}T00:00:00`) : new Date(2026, 0, 1, 0, 0, 0);
      endDate = customEndDate ? new Date(`${customEndDate}T23:59:59`) : new Date();
    }

    const filteredP = purchases.filter((p) => {
      const d = new Date(p.date).getTime();
      return d >= startDate.getTime() && d <= endDate.getTime();
    });

    const filteredPay = payments.filter((pay) => {
      const d = new Date(pay.date).getTime();
      return d >= startDate.getTime() && d <= endDate.getTime();
    });

    const morningPurchases = filteredP.filter((p) => p.shift === 'MORNING');
    const eveningPurchases = filteredP.filter((p) => p.shift === 'EVENING');

    const morningCount = morningPurchases.length;
    const eveningCount = eveningPurchases.length;
    const morningL = morningPurchases.reduce((acc, p) => acc + p.quantity, 0);
    const eveningL = eveningPurchases.reduce((acc, p) => acc + p.quantity, 0);
    const morningCost = morningPurchases.reduce((acc, p) => acc + p.amount, 0);
    const eveningCost = eveningPurchases.reduce((acc, p) => acc + p.amount, 0);

    const totalCount = morningCount + eveningCount;
    const totalL = filteredP.reduce((acc, p) => acc + p.quantity, 0);
    const totalCost = filteredP.reduce((acc, p) => acc + p.amount, 0);
    const totalDeposited = filteredPay.reduce((acc, pay) => acc + pay.amount, 0);

    return {
      purchases: filteredP,
      payments: filteredPay,
      morningCount,
      eveningCount,
      totalCount,
      morningL: Math.round(morningL * 10) / 10,
      eveningL: Math.round(eveningL * 10) / 10,
      totalL: Math.round(totalL * 10) / 10,
      morningCost: Math.round(morningCost * 10) / 10,
      eveningCost: Math.round(eveningCost * 10) / 10,
      totalCost: Math.round(totalCost * 10) / 10,
      totalDeposited: Math.round(totalDeposited * 10) / 10,
      startDate,
      endDate
    };
  }, [purchases, payments, statementRange, customStartDate, customEndDate]);

  const isDuesPending = (stats?.pendingBalance || 0) > 0;
  const duesAmount = Math.abs(stats?.pendingBalance || 0);

  const handleCopySummary = () => {
    if (!customer) return;
    const startStr = statementData.startDate.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', { day: 'numeric', month: 'short' });
    const endStr = statementData.endDate.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    const farm = settings?.farm_name || 'Milk Mania Dairy';
    
    const text = `🥛 *${farm} - ${language === 'hi' ? 'दूध खरीद हिसाब पर्ची' : 'Milk Bill Statement'}*
👤 ${language === 'hi' ? 'ग्राहक' : 'Customer'}: ${customer.name} (${customer.phone || customer.village})
📅 ${language === 'hi' ? 'अवधि' : 'Period'}: ${startStr} - ${endStr}
---------------------------------
☀️ ${language === 'hi' ? 'सुबह का दूध' : 'Morning Milk'}: ${statementData.morningL} L
🌙 ${language === 'hi' ? 'शाम का दूध' : 'Evening Milk'}: ${statementData.eveningL} L
🥛 *${language === 'hi' ? 'कुल दूध' : 'Total Milk'}*: ${statementData.totalL} L
💰 ${language === 'hi' ? 'दूध दर' : 'Milk Rate'}: ₹${customer.pricePerLiter}/L
💵 *${language === 'hi' ? 'कुल दूध मूल्य' : 'Total Amount'}*: ₹${statementData.totalCost}
💳 ${language === 'hi' ? 'जमा भुगतान' : 'Total Deposited'}: ₹${statementData.totalDeposited}
---------------------------------
${isDuesPending 
  ? `⚠️ *${language === 'hi' ? 'कुल बकाया राशि' : 'Total Dues Pending'}*: ₹${duesAmount}` 
  : `✅ *${language === 'hi' ? 'अग्रिम जमा राशि' : 'Advance Credit'}*: ₹${duesAmount}`}
---------------------------------
✨ ${language === 'hi' ? 'मिल्क मेनिया डेयरी पोर्टल' : 'Milk Mania Dairy Portal'}`;

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  if (loading && !customer) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-sky-50 to-milk-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-dairy-sky/30 border-t-dairy-sky rounded-full animate-spin" />
          <p className="text-xs font-bold text-dairy-sky">
            {language === 'hi' ? 'ग्राहक खाता लोड हो रहा है...' : 'Loading Customer Portal...'}
          </p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-6 bg-milk-50">
        <div className="bg-white p-6 rounded-3xl text-center max-w-sm border border-sky-100 shadow-xl">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h2 className="text-base font-bold text-gray-800">
            {language === 'hi' ? 'सत्र समाप्त हो गया' : 'Session Expired'}
          </h2>
          <p className="text-xs text-gray-500 mt-1 mb-4">
            {language === 'hi' ? 'कृपया अपने मोबाइल नंबर और पिन से दोबारा लॉगिन करें।' : 'Please log in again with your mobile number and 6-digit PIN.'}
          </p>
          <button
            onClick={() => navigate('/customer-login')}
            className="w-full py-3 bg-dairy-sky text-white rounded-2xl text-xs font-bold shadow-md"
          >
            {t('customerLogin')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-gradient-to-b from-sky-50/70 via-milk-50 to-sky-100/40 pb-20 text-left print:bg-white print:p-0 print:m-0 print:overflow-visible">
      {/* 1. TOP NAVBAR (Hidden on print) */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-sky-100/80 px-3 sm:px-8 py-2 sm:py-3 flex justify-between items-center shadow-xs print:hidden w-full max-w-full overflow-hidden">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 mr-2">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-sky-400 to-dairy-sky text-white flex items-center justify-center shadow-md shadow-sky-500/20 shrink-0">
            <Milk className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <h1 className="font-space font-extrabold text-xs sm:text-base text-dairy-text truncate">
                {language === 'hi' ? 'नमस्ते' : 'Namaste'}, {customer.name}
              </h1>
              <Sparkles className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
            </div>
            <p className="text-[9px] sm:text-[10px] text-dairy-text/60 font-medium flex items-center gap-1 truncate">
              <MapPin className="w-2.5 h-2.5 text-dairy-sky shrink-0" />
              <span className="truncate">{customer.village}</span>
              <span>•</span>
              <span className="font-semibold text-dairy-sky shrink-0">
                {customer.customerType === 'BULK' ? (language === 'hi' ? 'थोक' : 'Bulk') : (language === 'hi' ? 'व्यक्तिगत' : 'Individual')}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Language Switch */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
            className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-sky-50 border border-sky-200/80 text-[10px] sm:text-[11px] font-bold text-dairy-sky hover:bg-sky-100 transition-all flex items-center gap-1"
            title="Switch Language"
          >
            <span>{language === 'en' ? '🇮🇳 हिन्दी' : '🇬🇧 EN'}</span>
          </button>

          {/* PIN & Settings Icon Button */}
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="p-1.5 sm:p-2 rounded-full bg-white border border-sky-100 text-dairy-sky hover:bg-sky-50 transition-all shadow-xs"
            title={language === 'hi' ? 'पिन व सेटिंग्स' : 'PIN & Settings'}
          >
            <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="p-1.5 sm:p-2 rounded-full bg-white border border-sky-100 text-dairy-coral hover:bg-red-50 transition-all shadow-xs"
            title={t('logout')}
          >
            <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </header>

      {/* 2. MAIN CONTENT CONTAINER */}
      <main className="max-w-3xl mx-auto p-3 sm:p-6 flex flex-col gap-3.5 sm:gap-5 print:max-w-none print:p-0 print:m-0 print:block w-full max-w-full overflow-hidden">
        
        {/* HERO STATUS CARD (Dues Alert or All-Clear) - Hidden on print */}
        <div className={`p-4 sm:p-5 rounded-2xl sm:rounded-[28px] border shadow-md sm:shadow-lg relative overflow-hidden transition-all print:hidden ${
          isDuesPending
            ? 'bg-gradient-to-br from-amber-500/10 via-rose-500/5 to-white border-amber-200/80 text-dairy-text'
            : 'bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-white border-emerald-200/80 text-dairy-text'
        }`}>
          <div className="flex justify-between items-start gap-2">
            <div className="flex flex-col gap-0.5 sm:gap-1 min-w-0">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider w-fit ${
                isDuesPending ? 'bg-amber-500/15 text-amber-700' : 'bg-emerald-500/15 text-emerald-700'
              }`}>
                {isDuesPending ? (
                  <>
                    <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                    <span>{t('pendingDues')}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>{t('advanceBalance')}</span>
                  </>
                )}
              </span>
              <div className="flex items-baseline gap-1.5 sm:gap-2 mt-1">
                <span className="text-2xl sm:text-4xl font-space font-black tracking-tight text-dairy-text">
                  ₹{duesAmount}
                </span>
                <span className="text-[11px] sm:text-xs font-bold text-dairy-text/60">
                  {isDuesPending 
                    ? (language === 'hi' ? 'देना बाकी' : 'Balance to Pay') 
                    : (language === 'hi' ? 'अग्रिम जमा' : 'In Advance Credit')}
                </span>
              </div>
            </div>

            <div className="p-2 sm:p-3 bg-white/80 backdrop-blur-md rounded-xl sm:rounded-2xl border border-white shadow-sm flex flex-col items-end shrink-0">
              <span className="text-[9px] sm:text-[10px] font-bold text-dairy-text/50 uppercase">{t('currentRate')}</span>
              <span className="text-sm sm:text-lg font-space font-extrabold text-dairy-sky">
                ₹{customer.pricePerLiter} <span className="text-[10px] sm:text-[11px] font-medium text-dairy-text/60">/L</span>
              </span>
            </div>
          </div>

          <p className="text-[10px] sm:text-[11px] font-medium text-dairy-text/70 mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-sky-100/60 leading-relaxed">
            {isDuesPending
              ? (language === 'hi' 
                  ? '💡 हिसाब चुकता करने के लिए आप सीधे डेयरी केंद्र पर नकद या UPI द्वारा जमा कर सकते हैं।' 
                  : '💡 You can clear your pending balance at the dairy center via Cash or UPI.')
              : (language === 'hi' 
                  ? '✨ आपका खाता बिल्कुल चुकता है! धन्यवाद।' 
                  : '✨ Your account is completely settled and up to date! Thank you.')}
          </p>
        </div>

        {/* 3. FOUR KPI STATS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 print:hidden">
          {/* Total Liters Bought */}
          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/80 border border-sky-100/80 shadow-xs flex flex-col justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-dairy-text/60 flex items-center gap-1">
              <Milk className="w-3 h-3 text-dairy-sky shrink-0" />
              <span className="truncate">{t('totalMilkBought')}</span>
            </span>
            <div className="mt-1.5 sm:mt-2">
              <span className="text-lg sm:text-2xl font-space font-extrabold text-dairy-text">
                {stats?.totalLiters || 0}
              </span>
              <span className="text-[11px] sm:text-xs font-bold text-dairy-sky ml-1">L</span>
            </div>
            <span className="text-[8px] sm:text-[9px] text-dairy-text/50 mt-1 truncate">
              {language === 'hi' ? `इस माह: ${stats?.thisMonthLiters || 0} L` : `This Mo: ${stats?.thisMonthLiters || 0} L`}
            </span>
          </div>

          {/* Total Billed */}
          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/80 border border-sky-100/80 shadow-xs flex flex-col justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-dairy-text/60 flex items-center gap-1">
              <Receipt className="w-3 h-3 text-amber-500 shrink-0" />
              <span className="truncate">{t('totalBilled')}</span>
            </span>
            <div className="mt-1.5 sm:mt-2">
              <span className="text-lg sm:text-2xl font-space font-extrabold text-dairy-text">
                ₹{stats?.totalAmount || 0}
              </span>
            </div>
            <span className="text-[8px] sm:text-[9px] text-dairy-text/50 mt-1 truncate">
              {language === 'hi' ? `इस माह: ₹${stats?.thisMonthAmount || 0}` : `This Mo: ₹${stats?.thisMonthAmount || 0}`}
            </span>
          </div>

          {/* Total Deposited */}
          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/80 border border-sky-100/80 shadow-xs flex flex-col justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-dairy-text/60 flex items-center gap-1">
              <CreditCard className="w-3 h-3 text-emerald-600 shrink-0" />
              <span className="truncate">{t('totalPaidAmount')}</span>
            </span>
            <div className="mt-1.5 sm:mt-2">
              <span className="text-lg sm:text-2xl font-space font-extrabold text-emerald-600">
                ₹{stats?.totalPaid || 0}
              </span>
            </div>
            <span className="text-[8px] sm:text-[9px] text-dairy-text/50 mt-1 truncate">
              {language === 'hi' ? `इस माह: ₹${stats?.thisMonthPaid || 0}` : `This Mo: ₹${stats?.thisMonthPaid || 0}`}
            </span>
          </div>

          {/* Registered Rate */}
          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/80 border border-sky-100/80 shadow-xs flex flex-col justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-dairy-text/60 flex items-center gap-1">
              <Tag className="w-3 h-3 text-dairy-sky shrink-0" />
              <span className="truncate">{t('currentRate')}</span>
            </span>
            <div className="mt-1.5 sm:mt-2">
              <span className="text-lg sm:text-2xl font-space font-extrabold text-dairy-sky">
                ₹{customer.pricePerLiter}
              </span>
              <span className="text-[9px] sm:text-[10px] text-dairy-text/60 font-normal"> / L</span>
            </div>
            <span className="text-[8px] sm:text-[9px] text-dairy-text/50 mt-1 truncate">
              {customer.customerType}
            </span>
          </div>
        </div>

        {/* 4. NAVIGATION TABS (Fluid & Responsive without horizontal scroll) */}
        <div className="grid grid-cols-3 bg-white/80 p-1 sm:p-1.5 rounded-2xl border border-sky-100 shadow-sm backdrop-blur-md gap-1 print:hidden w-full">
          <button
            onClick={() => setActiveTab('PURCHASES')}
            className={`py-2 px-1 sm:px-3 rounded-xl text-[10px] sm:text-xs font-bold flex items-center justify-center gap-1 sm:gap-1.5 transition-all ${
              activeTab === 'PURCHASES'
                ? 'bg-dairy-sky text-white shadow-md'
                : 'text-dairy-text/60 hover:text-dairy-text hover:bg-sky-50'
            }`}
          >
            <Milk className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            <span className="truncate">{language === 'hi' ? 'दूध खरीद' : 'Purchases'}</span>
          </button>

          <button
            onClick={() => setActiveTab('PAYMENTS')}
            className={`py-2 px-1 sm:px-3 rounded-xl text-[10px] sm:text-xs font-bold flex items-center justify-center gap-1 sm:gap-1.5 transition-all ${
              activeTab === 'PAYMENTS'
                ? 'bg-dairy-sky text-white shadow-md'
                : 'text-dairy-text/60 hover:text-dairy-text hover:bg-sky-50'
            }`}
          >
            <CreditCard className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            <span className="truncate">{language === 'hi' ? 'भुगतान' : 'Payments'}</span>
          </button>

          <button
            onClick={() => setActiveTab('STATEMENT')}
            className={`py-2 px-1 sm:px-3 rounded-xl text-[10px] sm:text-xs font-bold flex items-center justify-center gap-1 sm:gap-1.5 transition-all ${
              activeTab === 'STATEMENT'
                ? 'bg-dairy-sky text-white shadow-md'
                : 'text-dairy-text/60 hover:text-dairy-text hover:bg-sky-50'
            }`}
          >
            <Receipt className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            <span className="truncate">{language === 'hi' ? 'हिसाब पर्ची' : 'Statement'}</span>
          </button>
        </div>

        {/* 5. TAB PANELS */}

        {/* TAB 1: DAILY MILK PURCHASES */}
        {activeTab === 'PURCHASES' && (
          <div className="flex flex-col gap-3">
            {/* Filter Pills - Responsive Grid on Mobile, Flex on Desktop (NO horizontal scroll) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="grid grid-cols-4 sm:flex items-center gap-1 sm:gap-1.5 w-full sm:w-auto">
                {(['ALL', 'THIS_MONTH', 'MORNING', 'EVENING'] as const).map((shiftKey) => (
                  <button
                    key={shiftKey}
                    onClick={() => setFilterShift(shiftKey)}
                    className={`py-1.5 px-1 sm:px-3 rounded-xl text-[10px] sm:text-xs font-bold transition-all text-center truncate ${
                      filterShift === shiftKey
                        ? 'bg-dairy-sky text-white shadow-xs'
                        : 'bg-white/80 text-dairy-text/70 border border-sky-100 hover:bg-white'
                    }`}
                  >
                    {shiftKey === 'ALL' && (language === 'hi' ? 'सभी' : 'All')}
                    {shiftKey === 'THIS_MONTH' && (language === 'hi' ? 'इस माह' : 'This Mo')}
                    {shiftKey === 'MORNING' && (language === 'hi' ? '☀️ सुबह' : '☀️ Morn')}
                    {shiftKey === 'EVENING' && (language === 'hi' ? '🌙 शाम' : '🌙 Eve')}
                  </button>
                ))}
              </div>
              <span className="text-[10px] sm:text-[11px] font-bold text-dairy-text/50 text-right sm:text-left">
                {filteredPurchases.length} {language === 'hi' ? 'रिकॉर्ड' : 'entries'}
              </span>
            </div>

            {/* Purchases Feed */}
            {filteredPurchases.length > 0 ? (
              <div className="flex flex-col gap-2 sm:gap-2.5">
                {filteredPurchases.map((p) => {
                  const dateObj = new Date(p.date);
                  const isMorning = p.shift === 'MORNING';

                  return (
                    <div
                      key={p.id}
                      className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/90 hover:bg-white border border-sky-100/90 shadow-xs transition-all flex items-center justify-between gap-2 sm:gap-3"
                    >
                      {/* Left: Date Block */}
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-sky-50 border border-sky-100 flex flex-col items-center justify-center text-dairy-sky shrink-0">
                          <span className="text-xs font-space font-extrabold leading-tight">
                            {dateObj.getDate()}
                          </span>
                          <span className="text-[8px] sm:text-[9px] font-bold uppercase leading-tight text-dairy-sky/75">
                            {dateObj.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', { month: 'short' })}
                          </span>
                        </div>

                        {/* Middle: Shift, Liters & Rate */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <span className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-extrabold shrink-0 ${
                              isMorning ? 'bg-amber-50 text-amber-700 border border-amber-200/50' : 'bg-indigo-50 text-indigo-700 border border-indigo-200/50'
                            }`}>
                              {isMorning ? <Sun className="w-2.5 h-2.5 shrink-0" /> : <Moon className="w-2.5 h-2.5 shrink-0" />}
                              <span>{isMorning ? (language === 'hi' ? 'सुबह' : 'Morning') : (language === 'hi' ? 'शाम' : 'Evening')}</span>
                            </span>

                            <span className="text-xs font-extrabold text-dairy-text">
                              {p.quantity} <span className="text-[10px] font-normal text-dairy-text/60">L</span>
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] sm:text-[11px] text-dairy-text/60 truncate">
                            <span>₹{p.rate}/L</span>
                            {p.remarks && (
                              <>
                                <span>•</span>
                                <span className="truncate max-w-[100px] sm:max-w-[140px] text-gray-500 italic">{p.remarks}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Total Amount and Status */}
                      <div className="text-right shrink-0">
                        <div className="text-xs sm:text-base font-space font-black text-dairy-text">
                          ₹{p.amount}
                        </div>
                        <span className={`inline-block text-[8px] sm:text-[9px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-md mt-0.5 ${
                          p.paymentMethod === 'PENDING'
                            ? 'bg-rose-50 text-rose-600 border border-rose-200/50'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                        }`}>
                          {p.paymentMethod === 'PENDING' 
                            ? (language === 'hi' ? 'उधार' : 'Due') 
                            : (language === 'hi' ? 'चुकता' : 'Paid')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 sm:p-10 rounded-2xl sm:rounded-3xl bg-white/60 border border-sky-100 text-center text-dairy-text/50">
                <Milk className="w-8 h-8 mx-auto mb-2 text-sky-300" />
                <p className="text-xs font-bold">{t('noPurchasesFound')}</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PAYMENTS DEPOSITED */}
        {activeTab === 'PAYMENTS' && (
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-xs font-bold text-dairy-text/75 uppercase tracking-wider">
                {t('myPayments')}
              </h3>
              <span className="text-[10px] sm:text-[11px] font-bold text-dairy-sky">
                {payments.length} {language === 'hi' ? 'जमा भुगतान' : 'payments'}
              </span>
            </div>

            {payments.length > 0 ? (
              <div className="flex flex-col gap-2 sm:gap-2.5">
                {payments.map((pay) => {
                  const dateObj = new Date(pay.date);
                  return (
                    <div
                      key={pay.id}
                      className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/90 hover:bg-white border border-emerald-100 shadow-xs transition-all flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200/60 font-space font-extrabold text-xs sm:text-sm">
                          ₹
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <span className="text-xs font-bold text-dairy-text truncate">
                              {dateObj.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                            <span className="px-1.5 sm:px-2 py-0.5 rounded text-[8px] sm:text-[9px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                              {pay.paymentMethod === 'UPI' ? 'UPI' : (language === 'hi' ? 'नकद' : 'Cash')}
                            </span>
                          </div>
                          {pay.remarks && (
                            <p className="text-[10px] sm:text-[11px] text-dairy-text/60 mt-0.5 italic truncate">
                              {pay.remarks}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-sm sm:text-lg font-space font-extrabold text-emerald-600">
                          + ₹{pay.amount}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 sm:p-10 rounded-2xl sm:rounded-3xl bg-white/60 border border-sky-100 text-center text-dairy-text/50">
                <CreditCard className="w-8 h-8 mx-auto mb-2 text-sky-300" />
                <p className="text-xs font-bold">{t('noPaymentsFound')}</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: STATEMENT & PRINT SLIP */}
        {activeTab === 'STATEMENT' && (
          <div className="flex flex-col gap-3.5 sm:gap-4 w-full max-w-full overflow-hidden">
            {/* Statement Screen Controls (Hidden on print) */}
            <div className="flex flex-col gap-2.5 sm:gap-3 bg-white/90 p-3 sm:p-4 rounded-2xl border border-sky-100 shadow-xs print:hidden w-full max-w-full overflow-hidden">
              {/* Quick Presets */}
              <div className="grid grid-cols-3 gap-1.5 sm:flex sm:items-center">
                {(['THIS_MONTH', 'LAST_MONTH', 'ALL'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => {
                      setStatementRange(range);
                      const now = new Date();
                      if (range === 'THIS_MONTH') {
                        setCustomStartDate(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`);
                        setCustomEndDate(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`);
                      } else if (range === 'LAST_MONTH') {
                        const lastM = new Date(now.getFullYear(), now.getMonth(), 0);
                        const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                        setCustomStartDate(`${prevStart.getFullYear()}-${String(prevStart.getMonth() + 1).padStart(2, '0')}-01`);
                        setCustomEndDate(`${lastM.getFullYear()}-${String(lastM.getMonth() + 1).padStart(2, '0')}-${String(lastM.getDate()).padStart(2, '0')}`);
                      } else if (range === 'ALL') {
                        setCustomStartDate('2026-01-01');
                        setCustomEndDate(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`);
                      }
                    }}
                    className={`py-2 px-1 sm:px-3.5 rounded-xl text-[10px] sm:text-xs font-bold transition-all text-center truncate ${
                      statementRange === range
                        ? 'bg-dairy-sky text-white shadow-xs'
                        : 'bg-sky-50 text-dairy-sky hover:bg-sky-100'
                    }`}
                  >
                    {range === 'THIS_MONTH' && (language === 'hi' ? '📅 इस माह' : '📅 This Mo')}
                    {range === 'LAST_MONTH' && (language === 'hi' ? '⏮️ पिछला' : '⏮️ Last Mo')}
                    {range === 'ALL' && (language === 'hi' ? '📜 1 जन 2026' : '📜 1 Jan 2026')}
                  </button>
                ))}
              </div>

              {/* Date Calendar Picker Row */}
              <div className="pt-2 border-t border-sky-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
                <span className="font-bold text-dairy-text/70 flex items-center gap-1.5 text-[10px] sm:text-xs">
                  <Calendar className="w-3.5 h-3.5 text-dairy-sky shrink-0" />
                  <span>{language === 'hi' ? 'कैलेंडर से अवधि:' : 'Custom Date Range:'}</span>
                </span>

                <div className="grid grid-cols-2 gap-1.5 w-full sm:w-auto">
                  <div className="flex items-center gap-1 bg-white px-2 py-1.5 rounded-xl border border-sky-200 min-w-0">
                    <span className="text-[9px] text-dairy-text/50 font-bold uppercase shrink-0">{language === 'hi' ? 'से' : 'From'}</span>
                    <input
                      type="date"
                      min="2026-01-01"
                      value={customStartDate}
                      onChange={(e) => {
                        setCustomStartDate(e.target.value);
                        setStatementRange('CUSTOM');
                      }}
                      className="text-[11px] sm:text-xs font-bold text-dairy-text bg-transparent focus:outline-none w-full min-w-0"
                    />
                  </div>

                  <div className="flex items-center gap-1 bg-white px-2 py-1.5 rounded-xl border border-sky-200 min-w-0">
                    <span className="text-[9px] text-dairy-text/50 font-bold uppercase shrink-0">{language === 'hi' ? 'तक' : 'To'}</span>
                    <input
                      type="date"
                      min="2026-01-01"
                      value={customEndDate}
                      onChange={(e) => {
                        setCustomEndDate(e.target.value);
                        setStatementRange('CUSTOM');
                      }}
                      className="text-[11px] sm:text-xs font-bold text-dairy-text bg-transparent focus:outline-none w-full min-w-0"
                    />
                  </div>
                </div>
              </div>

              {/* Print & Share Buttons */}
              <div className="grid grid-cols-2 gap-1.5 sm:gap-2 pt-2 border-t border-sky-100/80">
                <button
                  onClick={handleCopySummary}
                  className="w-full py-2 sm:py-2.5 px-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/80 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95"
                  title="Copy WhatsApp Summary"
                >
                  {copiedSummary ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{language === 'hi' ? 'कॉपी हो गया!' : 'Copied!'}</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5 shrink-0" />
                      <span>{language === 'hi' ? 'WhatsApp समरी' : 'Share Summary'}</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => window.print()}
                  className="w-full py-2 sm:py-2.5 px-2 bg-gradient-to-r from-dairy-sky to-sky-600 hover:from-sky-600 hover:to-dairy-sky text-white rounded-xl text-[11px] sm:text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Printer className="w-3.5 h-3.5 shrink-0" />
                  <span>{language === 'hi' ? 'पर्ची प्रिंट / PDF' : 'Print Slip'}</span>
                </button>
              </div>
            </div>

            {/* Printable Statement Slip Card */}
            <div className="printable-slip bg-white p-3 sm:p-8 rounded-2xl sm:rounded-[32px] border border-sky-100 shadow-xl print:shadow-none print:border-none print:m-0 print:p-0 text-left w-full max-w-full overflow-hidden">
              
              {/* Slip Header */}
              <div className="border-b-2 border-sky-600/30 pb-3 sm:pb-4 mb-3.5 sm:mb-5 flex flex-col sm:flex-row justify-between items-start gap-2.5 sm:gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl sm:text-2xl">🥛</span>
                    <h2 className="text-base sm:text-2xl font-space font-black text-dairy-text tracking-tight">
                      {settings?.farm_name || 'Milk Mania Dairy'}
                    </h2>
                  </div>
                  <p className="text-[10px] sm:text-xs font-bold text-dairy-sky mt-0.5">
                    {language === 'hi' 
                      ? 'दूध खरीद एवं बहीखाता विवरण पत्र (बिल / रसीद)' 
                      : 'Customer Milk Purchase Ledger & Billing Statement'}
                  </p>
                  {(settings?.address || settings?.contact_email) && (
                    <p className="text-[9px] sm:text-[11px] text-dairy-text/60 mt-0.5 truncate">
                      {[settings.address, settings.contact_email].filter(Boolean).join(' • ')}
                    </p>
                  )}
                </div>

                <div className="sm:text-right w-full sm:w-auto flex sm:flex-col justify-between items-baseline sm:items-end">
                  <span className="inline-block text-[9px] sm:text-[11px] font-extrabold text-dairy-sky bg-sky-50 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border border-sky-200">
                    {customer.customerType === 'BULK' 
                      ? (language === 'hi' ? 'थोक ग्राहक (Bulk)' : 'Bulk Customer') 
                      : (language === 'hi' ? 'व्यक्तिगत ग्राहक' : 'Individual Customer')}
                  </span>
                  <div>
                    <p className="text-[9px] sm:text-[11px] font-mono text-dairy-text/70 mt-1 font-semibold truncate max-w-[200px] sm:max-w-none">
                      {language === 'hi' ? 'बिल क्र.' : 'Ref'}: MM-CUST-{customer.id.slice(0, 8).toUpperCase()}-{new Date().getFullYear()}{String(new Date().getMonth()+1).padStart(2, '0')}
                    </p>
                    <p className="text-[8px] sm:text-[10px] text-dairy-text/50">
                      {language === 'hi' ? 'दिनांक' : 'Date'}: {new Date().toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Customer Information & Statement Period Banner */}
              <div className="bg-sky-50/60 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-sky-100 mb-3.5 sm:mb-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-xs">
                  <div>
                    <span className="text-[9px] sm:text-[10px] text-dairy-text/50 font-bold uppercase block">{language === 'hi' ? 'ग्राहक का नाम' : 'Customer Name'}</span>
                    <span className="font-extrabold text-dairy-text text-xs sm:text-sm truncate block">{customer.name}</span>
                  </div>
                  <div>
                    <span className="text-[9px] sm:text-[10px] text-dairy-text/50 font-bold uppercase block">{language === 'hi' ? 'मोबाइल नंबर' : 'Phone'}</span>
                    <span className="font-mono font-bold text-dairy-text text-xs">{customer.phone || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] sm:text-[10px] text-dairy-text/50 font-bold uppercase block">{language === 'hi' ? 'गाँव / पता' : 'Village / Address'}</span>
                    <span className="font-medium text-dairy-text text-xs truncate block">{customer.village || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] sm:text-[10px] text-dairy-text/50 font-bold uppercase block">{language === 'hi' ? 'मान्यता प्राप्त दर' : 'Approved Rate'}</span>
                    <span className="font-space font-extrabold text-dairy-sky text-xs sm:text-sm">₹{customer.pricePerLiter} <span className="text-[9px] font-normal text-dairy-text/60">/ L</span></span>
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-sky-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px] sm:text-xs">
                  <span className="text-dairy-text/60 font-semibold flex items-center gap-1">
                    <span>📅</span>
                    <span>{language === 'hi' ? 'हिसाब की अवधि:' : 'Statement Period:'}</span>
                  </span>
                  <span className="font-bold text-dairy-text font-space truncate">
                    {statementRange === 'ALL'
                      ? (language === 'hi' ? '1 जन 2026 से अब तक' : 'From 1 Jan 2026 to Present')
                      : `${statementData.startDate.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}  ➔  ${statementData.endDate.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`
                    }
                  </span>
                </div>
              </div>

              {/* 4 Quick Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-3 text-center mb-3.5 sm:mb-5">
                <div className="p-2 sm:p-3 rounded-xl bg-amber-50/70 border border-amber-200/60">
                  <p className="text-[8px] sm:text-[10px] font-bold text-amber-700 uppercase">☀️ {t('morningShift')}</p>
                  <p className="text-sm sm:text-lg font-space font-extrabold text-dairy-text mt-0.5">{statementData.morningL} L</p>
                  <p className="text-[8px] sm:text-[9px] text-amber-700/70 mt-0.5">{statementData.morningCount} {language === 'hi' ? 'बार' : 'entries'}</p>
                </div>
                <div className="p-2 sm:p-3 rounded-xl bg-indigo-50/70 border border-indigo-200/60">
                  <p className="text-[8px] sm:text-[10px] font-bold text-indigo-700 uppercase">🌙 {t('eveningShift')}</p>
                  <p className="text-sm sm:text-lg font-space font-extrabold text-dairy-text mt-0.5">{statementData.eveningL} L</p>
                  <p className="text-[8px] sm:text-[9px] text-indigo-700/70 mt-0.5">{statementData.eveningCount} {language === 'hi' ? 'बार' : 'entries'}</p>
                </div>
                <div className="p-2 sm:p-3 rounded-xl bg-sky-50 border border-sky-200/80">
                  <p className="text-[8px] sm:text-[10px] font-bold text-sky-700 uppercase">🥛 {t('totalMilkBought')}</p>
                  <p className="text-sm sm:text-lg font-space font-black text-dairy-sky mt-0.5">{statementData.totalL} L</p>
                  <p className="text-[8px] sm:text-[9px] text-sky-700/70 mt-0.5">{statementData.totalCount} {language === 'hi' ? 'बार' : 'entries'}</p>
                </div>
                <div className="p-2 sm:p-3 rounded-xl bg-emerald-50/80 border border-emerald-200/70">
                  <p className="text-[8px] sm:text-[10px] font-bold text-emerald-700 uppercase">💵 {language === 'hi' ? 'कुल बिल' : 'Total Billed'}</p>
                  <p className="text-sm sm:text-lg font-space font-black text-emerald-700 mt-0.5">₹{statementData.totalCost}</p>
                  <p className="text-[8px] sm:text-[9px] text-emerald-700/70 mt-0.5">₹{customer.pricePerLiter}/L</p>
                </div>
              </div>

              {/* Shift Totals Summary Section */}
              <div className="mb-4 sm:mb-5">
                <h3 className="text-xs font-bold text-dairy-text/80 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Milk className="w-3.5 h-3.5 text-dairy-sky shrink-0" />
                  <span>{language === 'hi' ? 'दूध आपूर्ति सारांश (सुबह व शाम कुल)' : 'Milk Supply Shift Summary (Morning & Evening Totals)'}</span>
                </h3>

                {/* Mobile View: Responsive Cards (NO horizontal scroll) */}
                <div className="sm:hidden print:hidden flex flex-col gap-2">
                  {/* Morning Shift Card */}
                  <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">☀️</span>
                      <div>
                        <span className="text-xs font-bold text-dairy-text block">
                          {language === 'hi' ? 'सुबह का दूध' : 'Morning Shift'}
                        </span>
                        <span className="text-[10px] text-dairy-text/60">
                          {statementData.morningCount} {language === 'hi' ? 'दिन / बार' : 'entries'} • ₹{customer.pricePerLiter}/L
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-space font-black text-dairy-text block">
                        {statementData.morningL} L
                      </span>
                      <span className="text-xs font-space font-extrabold text-amber-700">
                        ₹{statementData.morningCost}
                      </span>
                    </div>
                  </div>

                  {/* Evening Shift Card */}
                  <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200/80 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">🌙</span>
                      <div>
                        <span className="text-xs font-bold text-dairy-text block">
                          {language === 'hi' ? 'शाम का दूध' : 'Evening Shift'}
                        </span>
                        <span className="text-[10px] text-dairy-text/60">
                          {statementData.eveningCount} {language === 'hi' ? 'दिन / बार' : 'entries'} • ₹{customer.pricePerLiter}/L
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-space font-black text-dairy-text block">
                        {statementData.eveningL} L
                      </span>
                      <span className="text-xs font-space font-extrabold text-indigo-700">
                        ₹{statementData.eveningCost}
                      </span>
                    </div>
                  </div>

                  {/* Grand Total Card */}
                  <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-dairy-sky block">
                        {language === 'hi' ? 'कुल योग (Grand Total)' : 'Grand Total'}
                      </span>
                      <span className="text-[10px] text-dairy-text/60">
                        {statementData.totalCount} {language === 'hi' ? 'दिन / कुल आपूर्ति' : 'total deliveries'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-space font-black text-dairy-sky block">
                        {statementData.totalL} L
                      </span>
                      <span className="text-xs font-space font-black text-emerald-700">
                        ₹{statementData.totalCost}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Desktop & Print View: Formal Table */}
                <div className="hidden sm:block print:block overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full print-table text-xs text-left">
                    <thead>
                      <tr className="bg-sky-50/80 text-dairy-text font-bold border-b border-gray-200">
                        <th className="py-2.5 px-3">{language === 'hi' ? 'शिफ्ट (समय)' : 'Shift'}</th>
                        <th className="py-2.5 px-3 text-center">{language === 'hi' ? 'कुल आपूर्ति (दिन)' : 'Deliveries'}</th>
                        <th className="py-2.5 px-3 text-right">{language === 'hi' ? 'कुल मात्रा (Liters)' : 'Total Quantity (L)'}</th>
                        <th className="py-2.5 px-3 text-right">{language === 'hi' ? 'मान्य दर' : 'Rate'}</th>
                        <th className="py-2.5 px-3 text-right">{language === 'hi' ? 'कुल राशि (₹)' : 'Total Amount (₹)'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {/* Morning Total */}
                      <tr className="hover:bg-amber-50/20">
                        <td className="py-2.5 px-3 font-bold text-dairy-text flex items-center gap-1.5">
                          <span className="text-amber-500">☀️</span>
                          <span>{language === 'hi' ? 'सुबह का दूध (Morning Shift)' : 'Morning Shift Total'}</span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-semibold text-dairy-text/80">
                          {statementData.morningCount} {language === 'hi' ? 'दिन / बार' : 'Days'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-space font-extrabold text-dairy-text">
                          {statementData.morningL} L
                        </td>
                        <td className="py-2.5 px-3 text-right font-space text-dairy-text/70">
                          ₹{customer.pricePerLiter}/L
                        </td>
                        <td className="py-2.5 px-3 text-right font-space font-extrabold text-dairy-text">
                          ₹{statementData.morningCost}
                        </td>
                      </tr>

                      {/* Evening Total */}
                      <tr className="hover:bg-indigo-50/20">
                        <td className="py-2.5 px-3 font-bold text-dairy-text flex items-center gap-1.5">
                          <span className="text-indigo-500">🌙</span>
                          <span>{language === 'hi' ? 'शाम का दूध (Evening Shift)' : 'Evening Shift Total'}</span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-semibold text-dairy-text/80">
                          {statementData.eveningCount} {language === 'hi' ? 'दिन / बार' : 'Days'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-space font-extrabold text-dairy-text">
                          {statementData.eveningL} L
                        </td>
                        <td className="py-2.5 px-3 text-right font-space text-dairy-text/70">
                          ₹{customer.pricePerLiter}/L
                        </td>
                        <td className="py-2.5 px-3 text-right font-space font-extrabold text-dairy-text">
                          ₹{statementData.eveningCost}
                        </td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr className="bg-sky-50 font-extrabold text-dairy-text border-t-2 border-gray-300">
                        <td className="py-2.5 px-3 text-dairy-sky font-bold">
                          {language === 'hi' ? 'कुल योग (Grand Total):' : 'Grand Total:'}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold">
                          {statementData.totalCount} {language === 'hi' ? 'दिन / बार' : 'Days'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-space text-dairy-sky text-sm">
                          {statementData.totalL} L
                        </td>
                        <td className="py-2.5 px-3 text-right font-space text-dairy-text/60">
                          -
                        </td>
                        <td className="py-2.5 px-3 text-right font-space text-emerald-700 text-sm">
                          ₹{statementData.totalCost}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Payments Deposited in Period (if any) */}
              {statementData.payments.length > 0 && (
                <div className="mb-4 sm:mb-5">
                  <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{language === 'hi' ? 'इस अवधि में जमा किए गए भुगतान' : 'Payments Deposited in Period'} ({statementData.payments.length})</span>
                  </h3>

                  {/* Mobile View: Payment Cards (NO horizontal scroll) */}
                  <div className="sm:hidden print:hidden flex flex-col gap-2">
                    {statementData.payments.map((pay) => {
                      const payDate = new Date(pay.paymentDate);
                      return (
                        <div key={pay.id} className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/70 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                              {pay.paymentMethod === 'UPI' ? 'UPI' : (language === 'hi' ? 'नकद' : 'Cash')}
                            </span>
                            <div>
                              <span className="font-bold text-dairy-text block text-[11px]">
                                {payDate.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                              {pay.remarks && <span className="text-[10px] text-dairy-text/60 italic">{pay.remarks}</span>}
                            </div>
                          </div>
                          <span className="font-space font-black text-emerald-700 text-sm">
                            + ₹{pay.amount}
                          </span>
                        </div>
                      );
                    })}
                    <div className="p-2.5 rounded-xl bg-emerald-100/70 text-right text-xs font-bold text-emerald-900">
                      {language === 'hi' ? 'कुल जमा:' : 'Total Deposited:'} + ₹{statementData.totalDeposited}
                    </div>
                  </div>

                  {/* Desktop & Print View: Formal Table */}
                  <div className="hidden sm:block print:block overflow-x-auto rounded-xl border border-gray-200">
                    <table className="w-full print-table text-xs text-left">
                      <thead>
                        <tr className="bg-emerald-50/70 text-dairy-text font-bold border-b border-gray-200">
                          <th className="py-2 px-3 text-center w-10">#</th>
                          <th className="py-2 px-3">{language === 'hi' ? 'जमा दिनांक' : 'Payment Date'}</th>
                          <th className="py-2 px-3">{language === 'hi' ? 'माध्यम' : 'Method'}</th>
                          <th className="py-2 px-3">{language === 'hi' ? 'विवरण' : 'Remarks'}</th>
                          <th className="py-2 px-3 text-right">{language === 'hi' ? 'जमा राशि (₹)' : 'Deposited Amount (₹)'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {statementData.payments.map((pay, idx) => {
                          const payDate = new Date(pay.paymentDate);
                          return (
                            <tr key={pay.id}>
                              <td className="py-1.5 px-3 text-center text-dairy-text/50 font-mono text-[11px]">{idx + 1}</td>
                              <td className="py-1.5 px-3 font-medium text-dairy-text">
                                {payDate.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </td>
                              <td className="py-1.5 px-3">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  {pay.paymentMethod === 'UPI' ? 'UPI' : (language === 'hi' ? 'नकद (Cash)' : 'Cash')}
                                </span>
                              </td>
                              <td className="py-1.5 px-3 text-dairy-text/70 italic text-[11px]">
                                {pay.remarks || '-'}
                              </td>
                              <td className="py-1.5 px-3 text-right font-space font-extrabold text-emerald-600">
                                + ₹{pay.amount}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="bg-emerald-50 font-extrabold text-emerald-900 border-t-2 border-gray-300">
                          <td colSpan={4} className="py-2.5 px-3 text-right">
                            {language === 'hi' ? 'कुल जमा भुगतान (Total Deposited):' : 'Total Deposited:'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-space text-sm">
                            + ₹{statementData.totalDeposited}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* Financial Settlement Card */}
              <div className="border border-sky-200 bg-sky-50/40 rounded-2xl p-4 mb-6">
                <h4 className="text-xs font-bold text-dairy-text uppercase tracking-wider mb-2.5 pb-1 border-b border-sky-200/80">
                  💰 {language === 'hi' ? 'खाता हिसाब सारांश (Financial Settlement)' : 'Account Settlement Summary'}
                </h4>
                <div className="flex flex-col gap-1.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-gray-200/60">
                    <span className="text-dairy-text/70">{language === 'hi' ? 'इस अवधि का कुल दूध मूल्य' : 'Total Milk Cost'}:</span>
                    <span className="font-space font-bold text-dairy-text">₹{statementData.totalCost}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200/60 text-emerald-700">
                    <span>{language === 'hi' ? 'इस अवधि में प्राप्त कुल जमा' : 'Total Payments Received'}:</span>
                    <span className="font-space font-bold">+ ₹{statementData.totalDeposited}</span>
                  </div>
                  <div className="flex justify-between items-center py-2.5 px-3 bg-white rounded-xl border border-sky-200 mt-1 shadow-xs">
                    <div>
                      <span className="text-xs font-black text-dairy-text block">
                        {isDuesPending 
                          ? (language === 'hi' ? '⚠️ कुल अंतिम बकाया राशि (Net Due to Dairy):' : '⚠️ Net Balance Due to Dairy:')
                          : (language === 'hi' ? '✅ कुल अंतिम अग्रिम राशि (Advance Credit):' : '✅ Advance Credit Balance:')}
                      </span>
                      <span className="text-[10px] text-dairy-text/50 font-medium">
                        {isDuesPending 
                          ? (language === 'hi' ? 'डेयरी केंद्र पर तुरंत जमा कराएं' : 'Please clear at dairy center')
                          : (language === 'hi' ? 'अगले दूध उठान में समायोजित होगी' : 'Will adjust in future supply')}
                      </span>
                    </div>
                    <span className={`text-xl font-space font-black ${isDuesPending ? 'text-rose-600' : 'text-emerald-600'}`}>
                      ₹{duesAmount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Signatures & Stamp (avoid-break) */}
              <div className="avoid-break pt-6 sm:pt-8 mt-5 sm:mt-6 border-t border-gray-300 grid grid-cols-2 gap-3 sm:gap-8 text-center text-xs">
                <div>
                  <div className="h-10 sm:h-14 border-b border-dashed border-gray-400 mx-auto w-full max-w-[120px] sm:max-w-[176px]" />
                  <p className="font-bold text-dairy-text mt-2 text-[11px] sm:text-xs">
                    {language === 'hi' ? 'ग्राहक के हस्ताक्षर' : 'Customer Signature'}
                  </p>
                  <p className="text-[9px] sm:text-[10px] text-dairy-text/50">({customer.name})</p>
                </div>

                <div>
                  <div className="h-10 sm:h-14 border-b border-dashed border-gray-400 mx-auto w-full max-w-[120px] sm:max-w-[176px]" />
                  <p className="font-bold text-dairy-text mt-2 text-[11px] sm:text-xs">
                    {language === 'hi' ? 'अधिकृत हस्ताक्षर व मोहर' : 'Authorized Signatory & Seal'}
                  </p>
                  <p className="text-[9px] sm:text-[10px] text-dairy-text/50">({settings?.farm_name || 'Milk Mania Dairy'})</p>
                </div>
              </div>

              <div className="text-center mt-5 sm:mt-6 pt-2.5 sm:pt-3 border-t border-gray-200 text-[9px] sm:text-[10px] text-dairy-text/50">
                {language === 'hi' 
                  ? 'यह एक कंप्यूटर जनरेटेड पर्ची है। किसी भी विसंगति हेतु 7 कार्यदिवस में डेयरी केंद्र से संपर्क करें।' 
                  : 'This is a computer generated ledger statement. Please report any discrepancies within 7 working days.'}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* 6. SETTINGS & PIN MODAL (Triggered from header icon) */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] sm:rounded-[32px] border border-sky-100 shadow-2xl max-w-md w-full max-h-[92vh] overflow-y-auto p-4 sm:p-6 text-left flex flex-col gap-4 sm:gap-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-sky-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-dairy-sky/10 text-dairy-sky rounded-xl">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-space font-extrabold text-dairy-text">
                    {language === 'hi' ? 'पिन व खाता सेटिंग्स' : 'PIN & Account Settings'}
                  </h3>
                  <p className="text-[10px] text-dairy-text/60">
                    {language === 'hi' ? 'खाता सुरक्षा एवं प्राथमिक विवरण' : 'Account security & profile details'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Overview Card */}
            <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-100">
              <h4 className="text-[10px] font-bold text-dairy-text/60 uppercase tracking-wider mb-2">
                {language === 'hi' ? 'ग्राहक प्रोफ़ाइल विवरण' : 'Customer Profile Details'}
              </h4>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-dairy-text/50 block">{language === 'hi' ? 'ग्राहक का नाम' : 'Full Name'}</span>
                  <span className="font-extrabold text-dairy-text">{customer.name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-dairy-text/50 block">{language === 'hi' ? 'मोबाइल नंबर' : 'Phone'}</span>
                  <span className="font-mono font-bold text-dairy-text">{customer.phone || '-'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-dairy-text/50 block">{language === 'hi' ? 'गाँव' : 'Village'}</span>
                  <span className="font-medium text-dairy-text">{customer.village}</span>
                </div>
                <div>
                  <span className="text-[10px] text-dairy-text/50 block">{language === 'hi' ? 'दूध दर' : 'Milk Rate'}</span>
                  <span className="font-space font-extrabold text-dairy-sky">₹{customer.pricePerLiter}/L</span>
                </div>
              </div>
            </div>

            {/* Change 6-Digit PIN Form */}
            <div className="p-4 rounded-2xl bg-white border border-sky-100 shadow-xs flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-dairy-text">
                    {t('changePin')}
                  </h4>
                  <p className="text-[10px] text-dairy-text/50">
                    {language === 'hi' ? '6-अंकीय नया लॉगिन पिन दर्ज करें' : 'Enter 6-digit numeric login PIN'}
                  </p>
                </div>
              </div>

              {/* Pin Toast Message */}
              {pinMsg && (
                <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  pinMsg.type === 'success' 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {pinMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                  <span>{pinMsg.text}</span>
                </div>
              )}

              <form onSubmit={handlePinChangeSubmit} className="flex flex-col gap-3">
                {/* Current PIN */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-dairy-text/70 px-1">
                    {t('currentPin')}
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showPinInput ? 'text' : 'password'}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      placeholder="••••••"
                      value={currentPin}
                      onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs font-space font-bold tracking-widest glass-input bg-sky-50/40 text-dairy-text"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPinInput(!showPinInput)}
                      className="absolute right-3 text-dairy-text/40 hover:text-dairy-text"
                    >
                      {showPinInput ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* New PIN */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-dairy-text/70 px-1">
                    {t('newPin')}
                  </label>
                  <input
                    type={showPinInput ? 'text' : 'password'}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="••••••"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs font-space font-bold tracking-widest glass-input bg-sky-50/40 text-dairy-text"
                    required
                  />
                </div>

                {/* Confirm PIN */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-dairy-text/70 px-1">
                    {t('confirmNewPin')}
                  </label>
                  <input
                    type={showPinInput ? 'text' : 'password'}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="••••••"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs font-space font-bold tracking-widest glass-input bg-sky-50/40 text-dairy-text"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={pinLoading}
                  className="w-full py-2.5 mt-1 bg-dairy-sky hover:bg-sky-500 text-white font-space font-bold rounded-xl text-xs shadow-md active:scale-98 transition-all disabled:opacity-50"
                >
                  {pinLoading ? (language === 'hi' ? 'पिन बदला जा रहा है...' : 'Updating PIN...') : t('changePin')}
                </button>
              </form>
            </div>

            {/* Language Selection inside Modal */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-sky-50/60 border border-sky-100 text-xs">
              <span className="font-bold text-dairy-text">{language === 'hi' ? 'भाषा (Language)' : 'Language'}</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setLanguage('hi')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    language === 'hi' ? 'bg-dairy-sky text-white shadow-xs' : 'bg-white text-dairy-text/70 border border-sky-100'
                  }`}
                >
                  हिन्दी
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    language === 'en' ? 'bg-dairy-sky text-white shadow-xs' : 'bg-white text-dairy-text/70 border border-sky-100'
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-2xl text-xs transition-all flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span>{t('logout')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;
