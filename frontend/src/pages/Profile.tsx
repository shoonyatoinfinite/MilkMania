import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../utils/translations';
import { Save, CheckCircle } from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, updateProfile, language, errorMsg, setErrorMsg } = useApp();
  const { t } = useTranslation(language);

  const [name, setName] = useState(user?.name || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccess(false);

    if (password && password !== confirmPassword) {
      setErrorMsg(t('passwordsMismatchMsg'));
      return;
    }

    setLoading(true);
    const ok = await updateProfile(name, password);
    setLoading(false);

    if (ok) {
      setSuccess(true);
      setPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  return (
    <div className="flex-1 min-h-screen pt-20 lg:pt-8 pb-28 lg:pb-12 lg:pl-72 px-4 sm:px-6 max-w-2xl mx-auto text-left">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-space font-extrabold text-dairy-text">{t('profile')}</h2>
        <p className="text-sm text-dairy-text/60">
          {t('profileSubtitle')}
        </p>
      </div>

      {/* Main glass card */}
      <div className="glass-card rounded-4xl p-6 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-[-30%] right-[-30%] w-60 h-60 bg-dairy-sky/10 rounded-full blur-[70px] pointer-events-none" />

        {/* Messaging */}
        {errorMsg && (
          <div className="mb-5 p-4 rounded-2xl bg-dairy-coral/10 border border-dairy-coral/20 text-xs font-bold text-dairy-coral text-center">
            ⚠️ {errorMsg}
          </div>
        )}

        {success && (
          <div className="mb-5 p-4 rounded-2xl bg-dairy-green/10 border border-dairy-green/20 text-xs font-bold text-dairy-green text-center flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>
              {t('profileSuccessMsg')}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 relative z-10">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-dairy-text/60 px-1">
              {t('usernameLabel')}
            </label>
            <input
              type="text"
              value={user?.username || ''}
              className="w-full px-5 py-3.5 rounded-2xl text-sm font-semibold glass-input bg-white/20 border-white/40 text-dairy-text/50 cursor-not-allowed"
              disabled
            />
            <p className="text-[10px] text-dairy-text/40 px-1">
              {t('usernameImmutableWarning')}
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-dairy-text/60 px-1">
              {t('displayNameLabel')}
            </label>
            <input
              type="text"
              placeholder="e.g. Ramesh Kumar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-5 py-3.5 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
              required
            />
          </div>

          <div className="border-t border-white/30 my-2 pt-4">
            <h4 className="text-xs font-extrabold text-dairy-text/50 uppercase tracking-wider mb-4 px-1">
              {t('changePassword')}
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-dairy-text/60 px-1">{t('newPassword')}</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-5 py-3.5 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-dairy-text/60 px-1">{t('confirmPassword')}</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-5 py-3.5 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
                />
              </div>
            </div>
            <p className="text-[10px] text-dairy-text/40 mt-2 px-1">
              {t('passwordFieldTip')}
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-2 bg-gradient-to-r from-dairy-sky to-dairy-sky/90 text-white font-bold rounded-2xl shadow-lg shadow-dairy-sky/20 hover:shadow-dairy-sky/30 transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            <span>{t('saveChanges')}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
export default Profile;
