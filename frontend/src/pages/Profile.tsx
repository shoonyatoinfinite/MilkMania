import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../utils/translations';
import {
  Save,
  CheckCircle2,
  User,
  Key,
  Lock,
  Eye,
  EyeOff,
  Mail,
  Sparkles,
  Smartphone,
  Shield,
  ShieldCheck,
  Building2,
  Check,
  AlertCircle,
  Clock,
  Fingerprint
} from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, updateProfile, language, errorMsg, setErrorMsg, settings } = useApp();
  const { t } = useTranslation(language);

  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [pin, setPin] = useState(user?.pin || '');
  const [showPin, setShowPin] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setUsername(user.username || '');
      setPhone(user.phone || '');
      setPin(user.pin || '');
    }
  }, [user]);

  const handlePhoneChange = (val: string) => {
    let clean = val.replace(/\D/g, '');
    if (clean.length === 12 && clean.startsWith('91')) {
      clean = clean.slice(2);
    } else if (clean.length === 11 && clean.startsWith('0')) {
      clean = clean.slice(1);
    }
    setPhone(clean.slice(0, 10));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccess(false);

    if (!name.trim()) {
      setErrorMsg(language === 'hi' ? 'कृपया अपना नाम भरें।' : 'Display name is required.');
      return;
    }

    if (!username.trim()) {
      setErrorMsg(language === 'hi' ? 'कृपया यूजरनेम / लॉगिन ईमेल भरें।' : 'Username / Login ID is required.');
      return;
    }

    const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
    if (cleanPhone && cleanPhone.length !== 10) {
      setErrorMsg(language === 'hi' ? 'कृपया मान्य 10-अंकीय मोबाइल नंबर दर्ज करें।' : 'Mobile number must be exactly 10 digits.');
      return;
    }

    const cleanPin = pin ? pin.trim() : '';
    if (cleanPin && !/^\d{6}$/.test(cleanPin)) {
      setErrorMsg(language === 'hi' ? 'सुरक्षा पिन ठीक 6 अंकों का होना चाहिए।' : 'Security PIN must be exactly 6 digits.');
      return;
    }

    if (password) {
      if (password.length < 6) {
        setErrorMsg(language === 'hi' ? 'नया पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।' : 'New password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg(t('passwordsMismatchMsg'));
        return;
      }
    }

    setLoading(true);
    const ok = await updateProfile({
      name: name.trim(),
      username: username.trim(),
      phone: cleanPhone || undefined,
      pin: cleanPin || undefined,
      password: password || undefined,
      currentPassword: currentPassword || undefined
    });
    setLoading(false);

    if (ok) {
      setSuccess(true);
      setCurrentPassword('');
      setPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccess(false), 4000);
    }
  };

  const isAdmin = user?.role === 'ADMIN';
  const farmName = settings?.farm_name || 'Milk Mania Dairy';

  return (
    <div className="flex-1 min-h-screen pt-5 lg:pt-8 pb-28 lg:pb-12 lg:pl-72 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-left">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-space font-extrabold text-dairy-text tracking-tight">
              {t('profile')}
            </h1>
            <span className="p-1.5 rounded-xl bg-sky-100 text-dairy-sky">
              <Sparkles className="w-4 h-4 text-amber-500" />
            </span>
          </div>
          <p className="text-xs sm:text-sm text-dairy-text/60 mt-1">
            {language === 'hi'
              ? 'अपनी व्यक्तिगत जानकारी, मोबाइल नंबर, 6-अंकीय पिन और पासवर्ड प्रबंधित करें।'
              : 'Manage your personal profile, phone login, 6-digit PIN, and access security.'}
          </p>
        </div>

        {/* Live Status Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-bold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{language === 'hi' ? 'सत्र सक्रिय' : 'Session Active'}</span>
          </div>
        </div>
      </div>

      {/* Global Alerts */}
      {errorMsg && (
        <div className="mb-6 p-4 rounded-3xl bg-dairy-coral/10 border border-dairy-coral/25 text-xs sm:text-sm font-bold text-dairy-coral flex items-center gap-2.5 shadow-sm animate-shake">
          <AlertCircle className="w-5 h-5 shrink-0 text-dairy-coral" />
          <span>{errorMsg}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 rounded-3xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm font-bold text-emerald-800 flex items-center gap-2.5 shadow-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>
            {language === 'hi'
              ? 'प्रोफाइल और लॉगिन क्रेडेंशियल्स सफलतापूर्वक सहेजे गए!'
              : 'Profile & login credentials saved successfully!'}
          </span>
        </div>
      )}

      {/* 2-Column Responsive Dashboard Layout */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: User Card & Security Snapshot */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          {/* User Profile Summary Card */}
          <div className="bg-white/85 backdrop-blur-xl rounded-[32px] p-6 border border-white/90 shadow-glass relative overflow-hidden">
            {/* Top decorative gradient ambient */}
            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-sky-400/20 via-dairy-sky/20 to-emerald-400/20 pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center text-center">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-sky-500 via-dairy-sky to-sky-400 text-white font-space font-extrabold text-2xl flex items-center justify-center shadow-lg shadow-sky-500/25 border-4 border-white mb-3 mt-2">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>

              {/* Name & Username */}
              <h2 className="font-space font-extrabold text-lg text-dairy-text">
                {name || user?.name || 'User'}
              </h2>
              <p className="text-xs text-dairy-text/60 font-medium mt-0.5">
                @{username || user?.username || 'user'}
              </p>

              {/* Role Pill */}
              <div className="mt-3">
                <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-extrabold tracking-wide uppercase border shadow-2xs ${
                  isAdmin
                    ? 'bg-amber-50 text-amber-900 border-amber-200'
                    : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                }`}>
                  <span>{isAdmin ? '👑' : '👤'}</span>
                  <span>{isAdmin ? (language === 'hi' ? 'मास्टर एडमिन' : 'Master Admin') : (language === 'hi' ? 'स्टाफ ऑपरेटर' : 'Staff / Operator')}</span>
                </span>
              </div>

              {/* Meta information badges */}
              <div className="w-full mt-6 pt-5 border-t border-sky-100 flex flex-col gap-2.5 text-xs text-left">
                <div className="flex items-center justify-between p-2.5 rounded-2xl bg-sky-50/60 border border-sky-100/80">
                  <div className="flex items-center gap-2 text-dairy-text/70">
                    <Building2 className="w-4 h-4 text-dairy-sky" />
                    <span className="font-semibold">{language === 'hi' ? 'डेयरी फार्म' : 'Dairy Farm'}</span>
                  </div>
                  <span className="font-bold text-dairy-text truncate max-w-[130px]">{farmName}</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-2xl bg-sky-50/60 border border-sky-100/80">
                  <div className="flex items-center gap-2 text-dairy-text/70">
                    <Smartphone className="w-4 h-4 text-dairy-sky" />
                    <span className="font-semibold">{language === 'hi' ? 'मोबाइल' : 'Mobile'}</span>
                  </div>
                  <span className="font-bold text-dairy-text font-mono">
                    {phone ? `+91 ${phone}` : (language === 'hi' ? 'दर्ज नहीं' : 'Not Set')}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-2xl bg-sky-50/60 border border-sky-100/80">
                  <div className="flex items-center gap-2 text-dairy-text/70">
                    <Fingerprint className="w-4 h-4 text-dairy-sky" />
                    <span className="font-semibold">{language === 'hi' ? '6-अंक पिन' : '6-Digit PIN'}</span>
                  </div>
                  <span className="font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md text-[10px]">
                    {pin ? (language === 'hi' ? 'सक्रिय 🔒' : 'Active 🔒') : (language === 'hi' ? 'डिफ़ॉल्ट' : 'Default')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Security Tips Card */}
          <div className="bg-gradient-to-br from-sky-500/10 via-milk-50 to-emerald-500/10 rounded-[32px] p-5 border border-sky-100/80 shadow-xs">
            <div className="flex items-center gap-2 mb-2 text-dairy-sky">
              <ShieldCheck className="w-5 h-5 text-dairy-sky" />
              <h3 className="font-space font-bold text-xs uppercase tracking-wider text-dairy-text">
                {language === 'hi' ? 'सुरक्षा दिशा-निर्देश' : 'Security Best Practices'}
              </h3>
            </div>
            <ul className="text-[11px] text-dairy-text/70 space-y-1.5 pl-1 leading-relaxed">
              <li className="flex items-start gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>{language === 'hi' ? 'अपना 6-अंकीय पिन किसी के साथ साझा न करें।' : 'Keep your 6-digit PIN confidential.'}</span>
              </li>
              <li className="flex items-start gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>{language === 'hi' ? 'मोबाइल नंबर से तुरंत 1-क्लिक लॉगिन उपलब्ध है।' : 'Login instantly with your 10-digit mobile and PIN.'}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column: Edit Forms (Details, PIN, Password) */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Section 1: Basic Identity Information */}
          <div className="bg-white/85 backdrop-blur-xl rounded-[32px] p-6 sm:p-7 border border-white/90 shadow-glass">
            <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-sky-100">
              <div className="p-2.5 rounded-2xl bg-sky-50 text-dairy-sky border border-sky-100">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-space font-bold text-base text-dairy-text">
                  {language === 'hi' ? 'व्यक्तिगत विवरण व लॉगिन आईडी' : 'Personal & Login Identity'}
                </h3>
                <p className="text-xs text-dairy-text/60">
                  {language === 'hi' ? 'अपना नाम व पोर्टल लॉगिन आईडी प्रबंधित करें' : 'Update your display name and login identifier'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Display Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-dairy-text/75 px-1 flex items-center gap-1.5">
                  <span>{t('displayNameLabel')}</span>
                  <span className="text-dairy-coral">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl text-sm font-semibold glass-input text-dairy-text bg-white/70 focus:bg-white"
                  required
                />
              </div>

              {/* Login Username / Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-dairy-text/75 px-1 flex items-center gap-1.5">
                  <span>{t('usernameLabel')}</span>
                  <span className="text-dairy-coral">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. admin@milkmania.com"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl text-sm font-semibold glass-input text-dairy-text bg-white/70 focus:bg-white"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 2: Mobile Number & 6-Digit PIN (Fast Login) */}
          <div className="bg-white/85 backdrop-blur-xl rounded-[32px] p-6 sm:p-7 border border-white/90 shadow-glass">
            <div className="flex items-center justify-between gap-2.5 mb-5 pb-4 border-b border-sky-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-space font-bold text-base text-dairy-text">
                    {language === 'hi' ? 'मोबाइल व 6-अंकीय पिन लॉगिन' : 'Mobile & 6-Digit PIN Access'}
                  </h3>
                  <p className="text-xs text-dairy-text/60">
                    {language === 'hi' ? 'बिना पासवर्ड केवल मोबाइल व पिन से लॉगिन करें' : 'Fast 1-click access using your phone number and 6-digit PIN'}
                  </p>
                </div>
              </div>
              <span className="hidden sm:inline-flex px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-extrabold tracking-wider uppercase">
                {language === 'hi' ? 'त्वरित लॉगिन' : 'Fast Login'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Registered Mobile Number */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-dairy-text/75 px-1">
                  {language === 'hi' ? 'पंजीकृत मोबाइल नंबर (लॉगिन हेतु)' : 'Registered Mobile (For Login)'}
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-xs font-extrabold text-dairy-text/60 border-r border-sky-200 pr-2.5">
                    🇮🇳 +91
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="98765 43210"
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className="w-full pl-20 pr-4 py-3.5 rounded-2xl text-sm font-bold glass-input text-dairy-text bg-white/70 focus:bg-white tracking-wider placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* 6-Digit Security PIN */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between px-1">
                  <label className="text-xs font-bold text-dairy-text/75">
                    {language === 'hi' ? '6-अंकीय सुरक्षा पिन' : '6-Digit Security PIN'}
                  </label>
                  <span className="text-[10px] font-bold text-dairy-sky bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
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
                    className="w-full px-4 py-3.5 rounded-2xl text-center text-base font-space font-extrabold tracking-[0.3em] glass-input text-dairy-text bg-white/70 focus:bg-white placeholder:tracking-normal placeholder:font-normal"
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
            </div>
          </div>

          {/* Section 3: Password Update */}
          <div className="bg-white/85 backdrop-blur-xl rounded-[32px] p-6 sm:p-7 border border-white/90 shadow-glass">
            <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-sky-100">
              <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-space font-bold text-base text-dairy-text">
                  {t('changePassword')}
                </h3>
                <p className="text-xs text-dairy-text/60">
                  {language === 'hi' ? 'पासवर्ड बदलने के लिए नया पासवर्ड भरें (वैकल्पिक)' : 'Update your account password (leave blank to keep unchanged)'}
                </p>
              </div>
            </div>

            {/* Current Password (Optional) */}
            <div className="flex flex-col gap-1.5 mb-5">
              <label className="text-xs font-bold text-dairy-text/75 px-1">
                {language === 'hi' ? 'वर्तमान पासवर्ड' : 'Current Password (if changing password)'}
              </label>
              <div className="relative flex items-center">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl text-sm font-semibold glass-input text-dairy-text bg-white/70 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3.5 text-dairy-text/40 hover:text-dairy-text p-1.5 rounded-xl transition-all"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* New Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-dairy-text/75 px-1">{t('newPassword')}</label>
                <div className="relative flex items-center">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl text-sm font-semibold glass-input text-dairy-text bg-white/70 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 text-dairy-text/40 hover:text-dairy-text p-1.5 rounded-xl transition-all"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-dairy-text/75 px-1">{t('confirmPassword')}</label>
                <div className="relative flex items-center">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl text-sm font-semibold glass-input text-dairy-text bg-white/70 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 text-dairy-text/40 hover:text-dairy-text p-1.5 rounded-xl transition-all"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Action Card */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto min-w-[220px] py-4 px-8 bg-gradient-to-r from-dairy-sky via-sky-500 to-dairy-sky hover:from-sky-500 hover:to-dairy-sky text-white font-space font-bold rounded-2xl shadow-lg shadow-sky-500/25 active:scale-98 transition-all flex items-center justify-center gap-2.5 text-sm disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{language === 'hi' ? 'सहेजा जा रहा है...' : 'Saving Changes...'}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{t('saveChanges')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Profile;
