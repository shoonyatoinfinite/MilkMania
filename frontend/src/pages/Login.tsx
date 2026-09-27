import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../utils/translations';
import { motion } from 'framer-motion';
import { Smartphone, Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowRight, Sparkles, Building2 } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, forgotPassword, token, errorMsg, setErrorMsg, language, setLanguage } = useApp();
  const { t } = useTranslation(language);
  const navigate = useNavigate();

  // Login Mode: 'PIN' (Phone + 6-digit PIN) vs 'PASSWORD' (Email + Password)
  const [loginMethod, setLoginMethod] = useState<'PIN' | 'PASSWORD'>('PIN');

  // Phone + PIN States
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);

  // Email + Password States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [loadingSubmit, setLoadingSubmit] = useState(false);

  // Forgot Password States
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [lastPassword, setLastPassword] = useState('');
  const [masterPassword, setMasterPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Auto-redirect if already logged in
  useEffect(() => {
    if (token) {
      navigate('/');
    }
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (loginMethod === 'PIN') {
      const cleanPhone = phone.replace(/\D/g, '');
      if (!cleanPhone || cleanPhone.length < 10) {
        setErrorMsg(language === 'hi' ? 'कृपया मान्य 10-अंकीय मोबाइल नंबर दर्ज करें।' : 'Please enter a valid 10-digit mobile number.');
        return;
      }
      if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
        setErrorMsg(language === 'hi' ? 'कृपया अपना 6-अंकीय सुरक्षा पिन दर्ज करें।' : 'Please enter your 6-digit security PIN.');
        return;
      }

      setLoadingSubmit(true);
      const success = await login({ phone: cleanPhone, pin, loginType: 'PIN', rememberMe });
      setLoadingSubmit(false);

      if (success) {
        navigate('/');
      }
    } else {
      if (!username.trim() || !password.trim()) {
        setErrorMsg(t('loginRequiredFieldsMsg'));
        return;
      }

      setLoadingSubmit(true);
      const success = await login({ username: username.trim(), password, loginType: 'PASSWORD', rememberMe });
      setLoadingSubmit(false);

      if (success) {
        navigate('/');
      }
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!username.trim() || !lastPassword.trim() || !masterPassword.trim() || !newPassword.trim()) {
      setErrorMsg(language === 'hi' ? 'कृपया सभी फ़ील्ड भरें।' : 'Please fill in all fields.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg(language === 'hi' ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।' : 'Password must be at least 6 characters.');
      return;
    }

    setLoadingSubmit(true);
    const success = await forgotPassword(username, lastPassword, masterPassword, newPassword);
    setLoadingSubmit(false);

    if (success) {
      setSuccessMsg(t('passwordResetSuccess'));
      setUsername('');
      setLastPassword('');
      setMasterPassword('');
      setNewPassword('');
      setTimeout(() => {
        setIsForgotPassword(false);
        setSuccessMsg(null);
      }, 3000);
    }
  };

  return (
    <div className="relative min-h-screen bg-milk-50 transition-colors duration-500 overflow-hidden flex items-center justify-center p-4 sm:p-6 text-left">
      {/* Decorative ambient bubble lights */}
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-dairy-sky/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-dairy-green/5 rounded-full blur-[90px] pointer-events-none" />

      {/* Main Glass Card container */}
      <motion.div
        className="w-full max-w-md bg-white/75 backdrop-blur-2xl border border-white/90 rounded-4xl p-6 sm:p-8 shadow-glass relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Language selector in top-right */}
        <div className="absolute top-6 right-6 flex items-center gap-2 z-20">
          <div className="flex gap-1">
            {(['en', 'hi'] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => {
                  setLanguage(lang);
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-xl border transition-all ${
                  language === lang
                    ? 'bg-dairy-sky text-white border-dairy-sky shadow-xs'
                    : 'bg-white/80 border-sky-100 text-dairy-text/70 hover:bg-milk-50'
                }`}
              >
                {lang === 'en' && 'EN'}
                {lang === 'hi' && 'HI'}
              </button>
            ))}
          </div>
        </div>

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center gap-2 mb-5 mt-2">
          <span className="text-4xl animate-bounce">🥛</span>
          <h2 className="font-space font-extrabold text-2xl text-dairy-text flex items-center gap-2">
            <span>{isForgotPassword ? t('forgotPasswordTitle') : t('loginTitle')}</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </h2>
          <p className="text-xs text-dairy-text/60">
            {isForgotPassword
              ? t('forgotPasswordDesc')
              : (language === 'hi' ? 'डेयरी संचालक व स्टाफ पोर्टल एक्सेस' : 'Admin & Staff Dairy Management Portal')}
          </p>
        </div>

        {/* Portal Switcher Tabs (Admin vs Customer) */}
        {!isForgotPassword && (
          <div className="flex bg-sky-50/80 p-1.5 rounded-2xl border border-sky-100 shadow-xs mb-5">
            <button
              type="button"
              className="flex-1 py-2 rounded-xl text-xs font-bold bg-white text-dairy-sky shadow-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'डेयरी संचालक' : 'Admin / Staff'}</span>
            </button>
            <Link
              to="/customer-login"
              className="flex-1 py-2 rounded-xl text-xs font-bold text-dairy-text/60 hover:text-dairy-text flex items-center justify-center gap-1.5 transition-all"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'ग्राहक पोर्टल' : 'Customer Portal'}</span>
            </Link>
          </div>
        )}

        {/* Login Method Sub-Tabs: Phone & PIN vs Email & Password */}
        {!isForgotPassword && (
          <div className="flex bg-gray-100/80 p-1 rounded-xl mb-5 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setLoginMethod('PIN');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                loginMethod === 'PIN'
                  ? 'bg-white text-dairy-sky shadow-xs'
                  : 'text-dairy-text/60 hover:text-dairy-text'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? '📱 मोबाइल व पिन' : '📱 Phone & PIN'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginMethod('PASSWORD');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                loginMethod === 'PASSWORD'
                  ? 'bg-white text-dairy-sky shadow-xs'
                  : 'text-dairy-text/60 hover:text-dairy-text'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? '✉️ ईमेल व पासवर्ड' : '✉️ Email / Password'}</span>
            </button>
          </div>
        )}

        {/* Error messaging */}
        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-2xl bg-dairy-coral/10 border border-dairy-coral/20 text-xs font-bold text-dairy-coral text-center flex items-center justify-center gap-2">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success messaging */}
        {successMsg && (
          <div className="mb-4 p-3.5 rounded-2xl bg-dairy-green/10 border border-dairy-green/20 text-xs font-bold text-dairy-green text-center flex items-center justify-center gap-2">
            <span>✅</span>
            <span>{successMsg}</span>
          </div>
        )}

        {isForgotPassword ? (
          /* Forgot Password Form */
          <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold tracking-wider text-dairy-text/60 uppercase px-1">
                {t('username')}
              </label>
              <input
                type="text"
                placeholder="admin@milkmania.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl text-sm font-semibold glass-input text-dairy-text bg-white/70"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold tracking-wider text-dairy-text/60 uppercase px-1">
                {t('lastPasswordLabel')}
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={lastPassword}
                onChange={(e) => setLastPassword(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl text-sm font-semibold glass-input text-dairy-text bg-white/70"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold tracking-wider text-dairy-text/60 uppercase px-1">
                {t('masterPasswordLabel')}
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={masterPassword}
                onChange={(e) => setMasterPassword(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl text-sm font-semibold glass-input text-dairy-text bg-white/70"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold tracking-wider text-dairy-text/60 uppercase px-1">
                {t('newPasswordLabel')}
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl text-sm font-semibold glass-input text-dairy-text bg-white/70"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loadingSubmit}
              className="w-full py-4 mt-2 bg-gradient-to-r from-dairy-sky to-sky-500 text-white font-bold rounded-2xl shadow-lg shadow-sky-500/25 hover:shadow-sky-500/35 transition-all flex items-center justify-center gap-2 text-sm"
            >
              {loadingSubmit ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                t('resetPasswordBtn')
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsForgotPassword(false);
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className="text-center text-xs text-dairy-sky hover:underline font-bold mt-2"
            >
              {t('backToLoginLink')}
            </button>
          </form>
        ) : loginMethod === 'PIN' ? (
          /* Phone & 6-Digit PIN Form */
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

            {/* Remember Me */}
            <div className="flex items-center justify-between px-1 text-xs">
              <label className="flex items-center gap-2 font-semibold text-dairy-text/70 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4.5 h-4.5 rounded-md border-dairy-sky text-dairy-sky focus:ring-dairy-sky"
                />
                {t('rememberMeLabel')}
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loadingSubmit}
              className="w-full py-4 mt-2 bg-gradient-to-r from-dairy-sky to-sky-500 hover:from-sky-500 hover:to-dairy-sky text-white font-space font-bold rounded-2xl shadow-lg shadow-sky-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {loadingSubmit ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{t('loginBtnText')}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* Email & Password Form */
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold tracking-wider text-dairy-text/60 uppercase px-1">
                {t('username')}
              </label>
              <input
                type="text"
                placeholder="admin@milkmania.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl text-sm font-semibold glass-input text-dairy-text bg-white/70"
                required
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold tracking-wider text-dairy-text/60 uppercase px-1">
                {t('password')}
              </label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl text-sm font-semibold glass-input text-dairy-text bg-white/70"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-dairy-text/40 hover:text-dairy-text p-1.5 rounded-xl transition-all"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember me and Forgot Password */}
            <div className="flex items-center justify-between px-1 text-xs">
              <label className="flex items-center gap-2 font-semibold text-dairy-text/70 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4.5 h-4.5 rounded-md border-dairy-sky text-dairy-sky focus:ring-dairy-sky"
                />
                {t('rememberMeLabel')}
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(true);
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="text-dairy-sky hover:underline font-bold"
              >
                {t('forgotPasswordLink')}
              </button>
            </div>

            {/* Login Action Submit */}
            <button
              type="submit"
              disabled={loadingSubmit}
              className="w-full py-4 mt-2 bg-gradient-to-r from-dairy-sky to-sky-500 hover:from-sky-500 hover:to-dairy-sky text-white font-space font-bold rounded-2xl shadow-lg shadow-sky-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {loadingSubmit ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{t('loginBtnText')}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Security / Help Footer note */}
        <div className="mt-6 pt-4 border-t border-sky-100/80 text-center">
          <div className="inline-flex items-center gap-1.5 text-[11px] text-dairy-text/60 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {language === 'hi'
                ? 'सुरक्षित व एन्क्रिप्टेड डेयरी मैनेजमेंट सिस्टम'
                : 'Secure & Encrypted Dairy Management System'}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
