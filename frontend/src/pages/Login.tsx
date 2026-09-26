import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../utils/translations';
import { motion } from 'framer-motion';

export const Login: React.FC = () => {
  const { login, forgotPassword, token, errorMsg, setErrorMsg, language, setLanguage } = useApp();
  const { t } = useTranslation(language);
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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

    if (!username.trim() || !password.trim()) {
      setErrorMsg(t('loginRequiredFieldsMsg'));
      return;
    }

    setLoadingSubmit(true);
    const success = await login(username, password, rememberMe);
    setLoadingSubmit(false);
    
    if (success) {
      navigate('/');
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
    <div className="relative min-h-screen bg-milk-50 transition-colors duration-500 overflow-hidden flex items-center justify-center p-6 text-left">
      {/* Decorative ambient bubble lights */}
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-dairy-sky/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-dairy-green/5 rounded-full blur-[90px] pointer-events-none" />

      {/* Main Glass Card container */}
      <motion.div
        className="w-full max-w-md bg-white/50 backdrop-blur-2xl border border-white/80 rounded-4xl p-8 shadow-glass relative z-10"
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
                className={`px-2 py-1 text-[10px] font-bold rounded-lg border transition-all ${
                  language === lang
                    ? 'bg-dairy-sky text-white border-dairy-sky'
                    : 'bg-white border-white/85 text-dairy-text/70 hover:bg-milk-50'
                }`}
              >
                {lang === 'en' && 'EN'}
                {lang === 'hi' && 'HI'}
              </button>
            ))}
          </div>
        </div>

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center gap-2 mb-6 mt-4">
          <span className="text-4xl animate-bounce">🥛</span>
          <h2 className="font-space font-extrabold text-2xl text-dairy-text">
            {isForgotPassword ? t('forgotPasswordTitle') : t('loginTitle')}
          </h2>
          <p className="text-xs text-dairy-text/50">
            {isForgotPassword ? t('forgotPasswordDesc') : t('loginSubtitle')}
          </p>
        </div>

        {/* Portal Switcher Tabs */}
        {!isForgotPassword && (
          <div className="flex bg-sky-50/70 p-1 rounded-2xl border border-sky-100 shadow-xs mb-6">
            <button
              type="button"
              className="flex-1 py-2 rounded-xl text-xs font-bold bg-white text-dairy-sky shadow-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <span>{language === 'hi' ? 'डेयरी संचालक' : 'Admin / Staff'}</span>
            </button>
            <Link
              to="/customer-login"
              className="flex-1 py-2 rounded-xl text-xs font-bold text-dairy-text/60 hover:text-dairy-text flex items-center justify-center gap-1.5 transition-all"
            >
              <span>{language === 'hi' ? 'ग्राहक लॉगिन' : 'Customer Portal'}</span>
            </Link>
          </div>
        )}

        {/* Error messaging */}
        {errorMsg && (
          <div className="mb-5 p-4 rounded-2xl bg-dairy-coral/10 border border-dairy-coral/20 text-xs font-bold text-dairy-coral text-center">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Success messaging */}
        {successMsg && (
          <div className="mb-5 p-4 rounded-2xl bg-dairy-green/10 border border-dairy-green/20 text-xs font-bold text-dairy-green text-center">
            ✅ {successMsg}
          </div>
        )}

        {isForgotPassword ? (
          /* Forgot Password Form */
          <form onSubmit={handleResetPassword} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold tracking-wider text-dairy-text/60 uppercase px-1">
                {t('username')}
              </label>
              <input
                type="text"
                placeholder="admin@milkmania.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-5 py-3.5 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
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
                className="w-full px-5 py-3.5 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
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
                className="w-full px-5 py-3.5 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
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
                className="w-full px-5 py-3.5 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loadingSubmit}
              className="w-full py-4 mt-2 bg-gradient-to-r from-dairy-sky to-dairy-sky/90 text-white font-bold rounded-2xl shadow-lg shadow-dairy-sky/20 hover:shadow-dairy-sky/30 transition-all flex items-center justify-center gap-2 text-sm"
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
        ) : (
          /* Login Input Form */
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold tracking-wider text-dairy-text/60 uppercase px-1">
                {t('username')}
              </label>
              <input
                type="text"
                placeholder="admin@milkmania.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-5 py-3.5 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold tracking-wider text-dairy-text/60 uppercase px-1">
                {t('password')}
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-3.5 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
                required
              />
            </div>

            {/* Remember me option */}
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
              className="w-full py-4 mt-2 bg-gradient-to-r from-dairy-sky to-dairy-sky/90 text-white font-bold rounded-2xl shadow-lg shadow-dairy-sky/20 hover:shadow-dairy-sky/30 transition-all flex items-center justify-center gap-2 text-sm"
            >
              {loadingSubmit ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                t('loginBtnText')
              )}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default Login;
