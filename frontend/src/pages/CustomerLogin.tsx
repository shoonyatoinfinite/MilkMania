import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../utils/translations';
import { Smartphone, Lock, Eye, EyeOff, ShieldCheck, ArrowRight, Milk, Sparkles, Building2 } from 'lucide-react';

export const CustomerLogin: React.FC = () => {
  const { customerLogin, errorMsg, setErrorMsg } = useCustomerAuth();
  const { language, setLanguage } = useApp();
  const { t } = useTranslation(language);
  const navigate = useNavigate();

  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMsg(language === 'hi' ? 'कृपया मान्य 10-अंकीय मोबाइल नंबर दर्ज करें।' : 'Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      setErrorMsg(language === 'hi' ? 'कृपया अपना 6-अंकीय सुरक्षा पिन दर्ज करें।' : 'Please enter your 6-digit security PIN.');
      return;
    }

    setSubmitting(true);
    const ok = await customerLogin(cleanPhone, pin);
    setSubmitting(false);

    if (ok) {
      navigate('/customer/dashboard');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-sky-50 via-milk-50 to-sky-100/60 relative overflow-hidden select-none">
      {/* Decorative background glow circles */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-dairy-sky/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-dairy-sky/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Language Switcher in top right corner */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
          className="px-3.5 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-sky-100 shadow-sm text-xs font-bold text-dairy-sky hover:bg-white active:scale-95 transition-all flex items-center gap-1.5"
        >
          <span>{language === 'en' ? '🇮🇳 हिन्दी' : '🇬🇧 English'}</span>
        </button>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Portal Switcher Tabs */}
        <div className="flex bg-white/60 p-1.5 rounded-3xl border border-sky-100 shadow-sm mb-5 backdrop-blur-md">
          <button
            type="button"
            className="flex-1 py-2.5 rounded-2xl text-xs font-bold bg-white text-dairy-sky shadow-md flex items-center justify-center gap-1.5 transition-all"
          >
            <Smartphone className="w-4 h-4" />
            <span>{language === 'hi' ? 'ग्राहक लॉगिन' : 'Customer Login'}</span>
          </button>
          <Link
            to="/login"
            className="flex-1 py-2.5 rounded-2xl text-xs font-bold text-dairy-text/60 hover:text-dairy-text flex items-center justify-center gap-1.5 transition-all"
          >
            <Building2 className="w-4 h-4" />
            <span>{language === 'hi' ? 'डेयरी संचालक' : 'Admin Login'}</span>
          </Link>
        </div>

        {/* Main Glass Card */}
        <div className="bg-white/85 backdrop-blur-xl rounded-[36px] p-6 sm:p-8 shadow-2xl shadow-sky-900/10 border border-white/90">
          {/* Logo and Greeting */}
          <div className="text-center mb-6">
            <div className="inline-flex p-3.5 rounded-3xl bg-gradient-to-tr from-sky-400 to-dairy-sky text-white shadow-lg shadow-sky-500/25 mb-3">
              <Milk className="w-8 h-8" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-space font-extrabold text-dairy-text tracking-tight flex items-center justify-center gap-2">
              <span>{t('customerLogin')}</span>
              <Sparkles className="w-5 h-5 text-amber-400 fill-amber-400 animate-pulse" />
            </h1>
            <p className="text-xs sm:text-sm text-dairy-text/60 mt-1.5 max-w-xs mx-auto">
              {t('customerLoginSubtitle')}
            </p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-2xl bg-dairy-coral/10 border border-dairy-coral/20 text-xs font-bold text-dairy-coral text-center flex items-center justify-center gap-2 animate-shake">
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Mobile Number */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-dairy-text/75 px-1 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-dairy-sky" />
                <span>{t('enterMobile')}</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-xs font-extrabold text-dairy-text/50 border-r border-sky-200 pr-2.5">
                  🇮🇳 +91
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={10}
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-20 pr-4 py-3.5 rounded-2xl text-sm font-bold glass-input text-dairy-text bg-white/70 tracking-wider placeholder:text-gray-400"
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* 6-Digit PIN */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-bold text-dairy-text/75 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-dairy-sky" />
                  <span>{t('enterPin')}</span>
                </label>
                <span className="text-[10px] font-bold text-dairy-sky bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
                  {language === 'hi' ? '6 अंक' : '6 Digits'}
                </span>
              </div>
              <div className="relative flex items-center">
                <input
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="••••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-4 py-3.5 rounded-2xl text-center text-lg font-space font-extrabold tracking-[0.35em] glass-input text-dairy-text bg-white/70 placeholder:tracking-normal placeholder:text-sm placeholder:font-normal placeholder:text-gray-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3.5 text-dairy-text/40 hover:text-dairy-text p-1.5 rounded-xl transition-all"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 mt-2 bg-gradient-to-r from-dairy-sky to-sky-500 hover:from-sky-500 hover:to-dairy-sky text-white font-space font-bold rounded-2xl shadow-lg shadow-sky-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              <span>{submitting ? (language === 'hi' ? 'खाता खोला जा रहा है...' : 'Opening Account...') : t('customerLoginBtn')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Help note */}
          <div className="mt-6 pt-5 border-t border-sky-100 text-center">
            <div className="inline-flex items-center gap-1.5 text-[11px] text-dairy-text/60 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{t('contactDairyAdmin')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerLogin;
