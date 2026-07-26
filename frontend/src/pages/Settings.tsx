import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../utils/translations';
import { Save } from 'lucide-react';

export const Settings: React.FC = () => {
  const { 
    settings, 
    updateSettingsList, 
    theme, 
    toggleTheme, 
    language, 
    setLanguage,
    portalUsers,
    createPortalUser
  } = useApp();

  const { t } = useTranslation(language);

  const [rate, setRate] = useState('65');
  const [bulkRate, setBulkRate] = useState('58');
  const [farmName, setFarmName] = useState('Milk Mania Farm');

  const [success, setSuccess] = useState(false);

  // Portal Users forms
  const [newUserForm, setNewUserForm] = useState({ username: '', name: '', password: '' });
  const [addingUser, setAddingUser] = useState(false);
  const [userSuccess, setUserSuccess] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);

  // Sync state with settings object
  useEffect(() => {
    if (settings.default_milk_rate) setRate(settings.default_milk_rate);
    if (settings.default_bulk_rate) setBulkRate(settings.default_bulk_rate);
    if (settings.farm_name) setFarmName(settings.farm_name);
  }, [settings]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);

    const settingsArray = [
      { key: 'default_milk_rate', value: String(rate), description: 'Default price per liter of milk for individual customers' },
      { key: 'default_bulk_rate', value: String(bulkRate), description: 'Default price per liter of milk for bulk milk collectors' },
      { key: 'farm_name', value: String(farmName), description: 'Name of the farm shown on ledgers and bills' },
    ];

    await updateSettingsList(settingsArray);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserError(null);
    setUserSuccess(false);

    if (newUserForm.password.length < 6) {
      setUserError('Password must be at least 6 characters.');
      return;
    }

    setAddingUser(true);
    const ok = await createPortalUser({
      username: newUserForm.username,
      name: newUserForm.name,
      password: newUserForm.password
    });
    setAddingUser(false);

    if (ok) {
      setUserSuccess(true);
      setNewUserForm({ username: '', name: '', password: '' });
      setTimeout(() => setUserSuccess(false), 3000);
    } else {
      setUserError('Username already taken or error creating user.');
    }
  };

  return (
    <div className="flex-1 pb-24 lg:pb-10 lg:pl-72 p-6 max-w-3xl mx-auto text-left">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-space font-extrabold text-dairy-text">{t('settings')}</h2>
        <p className="text-sm text-dairy-text/60">
          {t('settingsSubtitle')}
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Settings Form */}
        <div className="glass-card rounded-4xl p-6 relative">
          <h3 className="font-space font-bold text-lg text-dairy-text mb-4">
            {t('settingsRatesTitle')}
          </h3>

          {success && (
            <div className="mb-4 p-3 rounded-xl bg-dairy-green/10 border border-dairy-green/20 text-xs font-bold text-dairy-green text-center">
              ⚙️ {t('saveChanges')}!
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-dairy-text/60">{t('farmName')}</label>
              <input
                type="text"
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl text-xs font-semibold glass-input text-dairy-text"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-dairy-text/60">
                  {t('rateIndividualLabel')}
                </label>
                <input
                  type="number"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl text-xs font-semibold glass-input text-dairy-text"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-dairy-text/60">
                  {t('rateBulkLabel')}
                </label>
                <input
                  type="number"
                  value={bulkRate}
                  onChange={(e) => setBulkRate(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl text-xs font-semibold glass-input text-dairy-text"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="mt-2 py-3.5 bg-dairy-sky text-white font-bold rounded-2xl text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{t('saveChanges')}</span>
            </button>
          </form>
        </div>

        {/* UI Theme & Language Options */}
        <div className="glass-card rounded-4xl p-6">
          <h3 className="font-space font-bold text-lg text-dairy-text mb-4">{t('visualTheme')} & {t('language')}</h3>

          <div className="flex flex-col gap-5">
            {/* Theme switcher */}
            <div className="flex items-center justify-between p-4 bg-white/40 border border-white/60 rounded-3xl">
              <div>
                <p className="text-xs font-bold text-dairy-text">{t('visualTheme')}</p>
                <p className="text-[10px] text-dairy-text/55">Toggle morning cream vs evening cyan modes.</p>
              </div>
              <button
                onClick={toggleTheme}
                className="px-4 py-2 bg-white border border-white/80 hover:bg-milk-50 text-xs font-bold text-dairy-text rounded-2xl shadow-sm"
              >
                {theme === 'morning' ? `🌙 ${t('evening')}` : `☀️ ${t('morning')}`}
              </button>
            </div>

            {/* Language Selection */}
            <div className="flex items-center justify-between p-4 bg-white/40 border border-white/60 rounded-3xl">
              <div>
                <p className="text-xs font-bold text-dairy-text">{t('language')}</p>
                <p className="text-[10px] text-dairy-text/55">Select default dialect for dairy reports.</p>
              </div>
              <div className="flex gap-2">
                {(['en', 'hi'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                      language === lang
                        ? 'bg-dairy-sky text-white border-dairy-sky shadow-sm'
                        : 'bg-white border-white/80 hover:bg-milk-50 text-dairy-text/70'
                    }`}
                  >
                    {lang === 'en' && 'English'}
                    {lang === 'hi' && 'हिन्दी'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Portal Access Users Section (No backup/restores local options) */}
        <div className="glass-card rounded-4xl p-6">
          <h3 className="font-space font-bold text-lg text-dairy-text mb-4">{t('portalUsers')}</h3>

          {userError && (
            <div className="mb-4 p-3 rounded-xl bg-dairy-coral/10 border border-dairy-coral/20 text-xs font-bold text-dairy-coral text-center">
              ⚠️ {userError}
            </div>
          )}

          {userSuccess && (
            <div className="mb-4 p-3 rounded-xl bg-dairy-green/10 border border-dairy-green/20 text-xs font-bold text-dairy-green text-center">
              ✅ User registered successfully!
            </div>
          )}

          {/* List of portal users */}
          <div className="flex flex-col gap-2.5 mb-6 max-h-48 overflow-y-auto pr-1">
            {portalUsers.map((u: any) => (
              <div key={u.id} className="flex justify-between items-center p-3 bg-white/40 border border-white/60 rounded-2xl text-xs">
                <div>
                  <p className="font-bold text-dairy-text">{u.name}</p>
                  <p className="text-[10px] text-dairy-text/60">{u.username}</p>
                </div>
                <span className="px-2.5 py-1 bg-dairy-sky/10 text-dairy-sky rounded-lg font-bold uppercase tracking-wider text-[8px]">
                  {u.role}
                </span>
              </div>
            ))}
          </div>

          {/* Form to Add User */}
          <form onSubmit={handleAddUser} className="flex flex-col gap-4 border-t border-white/20 pt-5">
            <h4 className="text-xs font-bold text-dairy-text/75 uppercase tracking-wider">{t('addUser')}</h4>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-dairy-text/60">{t('fullName')}</label>
              <input
                type="text"
                placeholder="e.g. Ramesh Kumar"
                value={newUserForm.name}
                onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl text-xs font-semibold glass-input text-dairy-text"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-dairy-text/60">{t('username')}</label>
                <input
                  type="text"
                  placeholder="ramesh@milkmania.com"
                  value={newUserForm.username}
                  onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl text-xs font-semibold glass-input text-dairy-text"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-dairy-text/60">{t('password')}</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl text-xs font-semibold glass-input text-dairy-text"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={addingUser}
              className="w-full py-3.5 bg-dairy-green text-white font-bold rounded-2xl text-xs shadow-md active:scale-95 transition-all mt-2 flex items-center justify-center"
            >
              <span>{t('saveUser')}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
export default Settings;
