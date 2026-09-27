import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../utils/translations';
import { Save } from 'lucide-react';

export const Settings: React.FC = () => {
  const { 
    settings, 
    updateSettingsList, 
    language, 
    setLanguage,
    enableMilkBought,
    toggleMilkBoughtSetting,
    portalUsers,
    createPortalUser,
    deletePortalUser,
    updatePortalUser,
    isInstallable,
    isStandalone,
    handleInstallPrompt,
    user
  } = useApp();

  const [editingUser, setEditingUser] = useState<any | null>(null);

  const { t } = useTranslation(language);

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const isAppInstalled = 
    isStandalone || 
    localStorage.getItem('milkmania_pwa_installed') === 'true' || 
    (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches);
  const showPWASection = !isAppInstalled;

  const [rate, setRate] = useState('65');
  const [bulkRate, setBulkRate] = useState('58');
  const [farmName, setFarmName] = useState('Milk Mania Farm');

  const [success, setSuccess] = useState(false);

  // Staff / Portal Users form state
  const [newUserForm, setNewUserForm] = useState({ username: '', name: '', password: '', phone: '', pin: '123456' });
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

    if (!editingUser && newUserForm.password.length < 6) {
      setUserError(language === 'hi' ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।' : 'Password must be at least 6 characters.');
      return;
    }
    if (editingUser && newUserForm.password && newUserForm.password.length < 6) {
      setUserError(language === 'hi' ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।' : 'Password must be at least 6 characters.');
      return;
    }

    const cleanPhone = newUserForm.phone ? newUserForm.phone.replace(/\D/g, '') : '';
    if (cleanPhone && cleanPhone.length !== 10) {
      setUserError(language === 'hi' ? 'कृपया मान्य 10-अंकीय मोबाइल नंबर दर्ज करें।' : 'Mobile number must be exactly 10 digits.');
      return;
    }

    const cleanPin = newUserForm.pin ? newUserForm.pin.trim() : '123456';
    if (cleanPin && !/^\d{6}$/.test(cleanPin)) {
      setUserError(language === 'hi' ? 'सुरक्षा पिन 6 अंकों का होना चाहिए।' : 'Security PIN must be exactly 6 digits.');
      return;
    }

    setAddingUser(true);
    let ok = false;
    const payload = {
      username: newUserForm.username.trim(),
      name: newUserForm.name.trim(),
      password: newUserForm.password || undefined,
      phone: cleanPhone || undefined,
      pin: cleanPin
    };

    if (editingUser) {
      ok = await updatePortalUser(editingUser.id, payload);
    } else {
      ok = await createPortalUser(payload);
    }
    setAddingUser(false);

    if (ok) {
      setUserSuccess(true);
      setNewUserForm({ username: '', name: '', password: '', phone: '', pin: '123456' });
      setEditingUser(null);
      setTimeout(() => setUserSuccess(false), 3000);
    } else {
      setUserError(editingUser 
        ? (language === 'hi' ? 'यूज़रनेम/फोन पहले से मौजूद है या अपडेट विफल रहा।' : 'Username/phone already registered or error updating staff.') 
        : (language === 'hi' ? 'यूज़रनेम/फोन पहले से मौजूद है या स्टाफ बनाना विफल रहा।' : 'Username/phone already registered or error creating staff user.'));
    }
  };

  return (
    <div className="flex-1 min-h-screen pt-5 lg:pt-8 pb-28 lg:pb-12 lg:pl-72 px-4 sm:px-6 max-w-3xl mx-auto text-left">
      {/* Header */}
      <div className="mb-6">
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

        {/* Milk Bought Records Toggle (Hidden by default, enable here) */}
        <div className="glass-card rounded-4xl p-6 border-2 border-dairy-sky/20">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">🛒</span>
                <h3 className="font-space font-bold text-base text-dairy-text">{t('enableMilkBoughtSetting')}</h3>
                {enableMilkBought && (
                  <span className="text-[10px] font-extrabold uppercase bg-dairy-green/10 text-dairy-green px-2 py-0.5 rounded-full">
                    {language === 'hi' ? 'सक्रिय' : 'Active'}
                  </span>
                )}
              </div>
              <p className="text-xs text-dairy-text/60">
                {t('enableMilkBoughtDesc')}
              </p>
            </div>

            <button
              type="button"
              onClick={() => toggleMilkBoughtSetting(!enableMilkBought)}
              className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                enableMilkBought ? 'bg-dairy-sky' : 'bg-gray-300'
              }`}
              role="switch"
              aria-checked={enableMilkBought}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  enableMilkBought ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Language Options */}
        <div className="glass-card rounded-4xl p-6">
          <h3 className="font-space font-bold text-lg text-dairy-text mb-4">{t('language')}</h3>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-sky-50/60 border border-sky-100 rounded-3xl gap-3">
              <div>
                <p className="text-xs font-bold text-dairy-text">{t('language')}</p>
                <p className="text-[10px] text-dairy-text/60">
                  {language === 'hi' ? 'पूरी ऐप के लिए भाषा चुनें (English / हिन्दी)' : 'Select language for the entire application'}
                </p>
              </div>
              <div className="flex gap-2">
                {(['en', 'hi'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={`px-4 py-2 text-xs font-bold rounded-2xl border transition-all ${
                      language === lang
                        ? 'bg-dairy-sky text-white border-dairy-sky shadow-md'
                        : 'bg-white border-sky-200 hover:bg-sky-50 text-dairy-text/70'
                    }`}
                  >
                    {lang === 'en' && '🇬🇧 English'}
                    {lang === 'hi' && '🇮🇳 हिन्दी'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Staff & Portal Access Users Management */}
        <div className="glass-card rounded-4xl p-6">
          <div className="mb-4">
            <h3 className="font-space font-bold text-lg text-dairy-text flex items-center gap-2">
              <span>👥</span>
              <span>{language === 'hi' ? 'स्टाफ और ऑपरेटर प्रबंधन' : 'Staff & Operator Management'}</span>
            </h3>
            <p className="text-xs text-dairy-text/60">
              {language === 'hi' 
                ? 'डेयरी कर्मचारियों और ऑपरेटरों के लिए लॉगिन क्रेडेंशियल्स प्रबंधित करें' 
                : 'Manage staff and operator login credentials for system access'}
            </p>
          </div>

          {userError && (
            <div className="mb-4 p-3 rounded-xl bg-dairy-coral/10 border border-dairy-coral/20 text-xs font-bold text-dairy-coral text-center">
              ⚠️ {userError}
            </div>
          )}

          {userSuccess && (
            <div className="mb-4 p-3 rounded-xl bg-dairy-green/10 border border-dairy-green/20 text-xs font-bold text-dairy-green text-center">
              ✅ {language === 'hi' ? 'स्टाफ क्रेडेंशियल्स सफलतापूर्वक सहेजे गए!' : 'Staff credentials saved successfully!'}
            </div>
          )}

          {/* List of staff / portal users */}
          <div className="flex flex-col gap-2.5 mb-6 max-h-56 overflow-y-auto pr-1">
            {portalUsers.map((u: any) => (
              <div key={u.id} className="flex justify-between items-center p-3 bg-white/40 border border-white/60 rounded-2xl text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-dairy-text">{u.name}</p>
                    {u.phone && (
                      <span className="text-[10px] font-semibold text-dairy-sky bg-sky-50 px-1.5 py-0.5 rounded-md">
                        📱 +91 {u.phone}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-dairy-text/60">
                    @{u.username} • {language === 'hi' ? 'पिन:' : 'PIN:'} <span className="font-mono font-bold text-dairy-text/80">{u.pin || '123456'}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-dairy-sky/10 text-dairy-sky rounded-lg font-bold uppercase tracking-wider text-[8px]">
                    {u.role || 'STAFF'}
                  </span>
                  {user?.role === 'ADMIN' && u.id !== user?.id && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingUser(u);
                          setNewUserForm({
                            username: u.username,
                            name: u.name,
                            password: '',
                            phone: u.phone || '',
                            pin: u.pin || '123456'
                          });
                        }}
                        className="p-1.5 text-dairy-sky hover:bg-dairy-sky/10 rounded-xl transition-all"
                        title="Edit staff credentials"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-edit-2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (window.confirm(`Are you sure you want to delete staff access for ${u.name}?`)) {
                            await deletePortalUser(u.id);
                          }
                        }}
                        className="p-1.5 text-dairy-coral hover:bg-dairy-coral/10 rounded-xl transition-all"
                        title="Delete staff access"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Form to Add / Edit Staff */}
          <form onSubmit={handleAddUser} className="flex flex-col gap-4 border-t border-white/20 pt-5">
            <h4 className="text-xs font-bold text-dairy-text/75 uppercase tracking-wider">
              {editingUser ? (language === 'hi' ? 'स्टाफ क्रेडेंशियल्स बदलें' : 'Edit Staff Credentials') : (language === 'hi' ? '+ नया स्टाफ / ऑपरेटर जोड़ें' : '+ Add New Staff / Operator')}
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-dairy-text/60">{language === 'hi' ? 'स्टाफ का पूरा नाम' : 'Staff Full Name'}</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl text-xs font-semibold glass-input text-dairy-text"
                  required
                />
              </div>

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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-dairy-text/60">{language === 'hi' ? 'मोबाइल नंबर (लॉगिन)' : 'Mobile (Login)'}</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="9876543210"
                  value={newUserForm.phone}
                  onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value.replace(/\D/g, '') })}
                  className="w-full px-4 py-3 rounded-2xl text-xs font-semibold glass-input text-dairy-text"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-dairy-text/60">{language === 'hi' ? '6-अंकीय पिन' : '6-Digit PIN'}</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="••••••"
                  value={newUserForm.pin}
                  onChange={(e) => setNewUserForm({ ...newUserForm, pin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                  className="w-full px-4 py-3 rounded-2xl text-xs font-mono font-bold tracking-widest text-center glass-input text-dairy-text"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-dairy-text/60">
                  {t('password')} {editingUser && (language === 'hi' ? '(वैकल्पिक)' : '(Optional)')}
                </label>
                <input
                  type="password"
                  placeholder={editingUser ? (language === 'hi' ? 'यथावत रखने हेतु खाली' : 'Leave blank') : '••••••••'}
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl text-xs font-semibold glass-input text-dairy-text"
                  required={!editingUser}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-2">
              {editingUser && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingUser(null);
                    setNewUserForm({ username: '', name: '', password: '', phone: '', pin: '123456' });
                  }}
                  className="flex-1 py-3.5 bg-gray-400 hover:bg-gray-500 text-white font-bold rounded-2xl text-xs shadow-md active:scale-95 transition-all flex items-center justify-center"
                >
                  {t('cancel')}
                </button>
              )}
              <button
                type="submit"
                disabled={addingUser}
                className="flex-1 py-3.5 bg-dairy-green text-white font-bold rounded-2xl text-xs shadow-md active:scale-95 transition-all flex items-center justify-center"
              >
                <span>{editingUser ? (language === 'hi' ? 'क्रेडेंशियल्स अपडेट करें' : 'Update Credentials') : (language === 'hi' ? 'स्टाफ जोड़ें' : 'Save Staff')}</span>
              </button>
            </div>
          </form>
        </div>

        {/* PWA App Installation Section */}
        {showPWASection && (
          <div className="glass-card rounded-4xl p-6 md:col-span-2">
            <h3 className="font-space font-bold text-lg text-dairy-text mb-2">
              {language === 'hi' ? '📱 PWA ऐप इंस्टॉल करें' : '📱 PWA Application Access'}
            </h3>
            <p className="text-xs text-dairy-text/60 mb-5">
              {language === 'hi' 
                ? 'त्वरित ऑफलाइन एक्सेस और अलर्ट के लिए मिल्क मेनिया को सीधे अपनी होम स्क्रीन पर इंस्टॉल करें।' 
                : 'Install Milk Mania directly on your home screen for quick offline access and real-time alerts.'}
            </p>
            
            <button
              type="button"
              onClick={async () => {
                if (isInstallable && handleInstallPrompt) {
                  await handleInstallPrompt();
                } else {
                  alert(language === 'hi'
                    ? "अपने मोबाइल डिवाइस पर इंस्टॉल करने के लिए:\n\n• Apple iOS (iPhone/iPad): Safari में शेयर बटन (⎙) दबाएं और 'Add to Home Screen' चुनें।\n• Google Android / Chrome: तीन बिंदु (मेनू) दबाएं और 'Install app' या 'Add to Home screen' चुनें।"
                    : "To install on your mobile device:\n\n• Apple iOS (iPhone/iPad): Tap the Share button (⎙) in Safari and select 'Add to Home Screen'.\n• Google Android / Chrome: Tap the three dots (menu) and select 'Install app' or 'Add to Home screen'.");
                }
              }}
              className="w-full py-4 text-white font-extrabold rounded-2xl text-xs shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 bg-dairy-sky hover:bg-dairy-sky/90"
            >
              <span>
                {language === 'hi' ? '📥 मिल्क मेनिया ऐप इंस्टॉल करें' : '📥 Install Milk Mania App'}
              </span>
            </button>

            {/* Instant Hide / Already Installed toggle */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-sky-100">
              <span className="text-[11px] text-gray-500">
                {language === 'hi' ? 'पहले से इंस्टॉल कर लिया है?' : 'Already installed?'}
              </span>
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem('milkmania_pwa_installed', 'true');
                  window.dispatchEvent(new Event('appinstalled'));
                }}
                className="text-xs font-bold text-sky-600 hover:underline"
              >
                {language === 'hi' ? 'हाँ, यह विकल्प छुपाएं' : 'Hide this section'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default Settings;
