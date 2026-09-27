import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../utils/translations';
import { Plus, Edit3, Trash2, HeartPulse, Sparkles, X } from 'lucide-react';

export const Animals: React.FC = () => {
  const { animals, createAnimal, updateAnimal, deleteAnimal, language, refreshAllData, productions } = useApp();
  const { t } = useTranslation(language);

  useEffect(() => {
    refreshAllData();
  }, []);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState<any>(null);
  const [logsModalAnimal, setLogsModalAnimal] = useState<any>(null);

  // Yield Logs date filter states
  const [logRangeType, setLogRangeType] = useState<'ALL' | 'MONTH' | 'YEAR' | 'CUSTOM'>('ALL');
  const [logStart, setLogStart] = useState('');
  const [logEnd, setLogEnd] = useState('');

  const filteredLogs = useMemo(() => {
    if (!logsModalAnimal) return [];
    const today = new Date();
    let start = 0;
    let end = Infinity;

    if (logRangeType === 'MONTH') {
      const first = new Date(today.getFullYear(), today.getMonth(), 1).getTime();
      const last = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
      start = first;
      end = last;
    } else if (logRangeType === 'YEAR') {
      const first = new Date(today.getFullYear(), 0, 1).getTime();
      const last = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999).getTime();
      start = first;
      end = last;
    } else if (logRangeType === 'CUSTOM') {
      if (logStart) start = new Date(logStart).getTime();
      if (logEnd) end = new Date(logEnd + 'T23:59:59.999').getTime();
    }

    return (productions || [])
      .filter((p: any) => {
        if (p.animalId !== logsModalAnimal.id) return false;
        const t = new Date(p.date).getTime();
        return t >= start && t <= end;
      })
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [logsModalAnimal, logRangeType, logStart, logEnd, productions]);

  const logsTotals = useMemo(() => {
    return filteredLogs.reduce((acc, p) => {
      acc.actual += p.quantity;
      acc.home += (p.homeConsumption || 0);
      acc.usable += (p.quantity - (p.homeConsumption || 0));
      return acc;
    }, { actual: 0, home: 0, usable: 0 });
  }, [filteredLogs]);

  // Form state
  const [form, setForm] = useState({
    name: '',
    breed: '',
    age: '',
    purchaseDate: '',
    status: 'ACTIVE',
    dailyCapacity: '',
    healthNotes: '',
    vaccinationNotes: ''
  });

  const handleOpenAdd = () => {
    setEditingAnimal(null);
    setForm({
      name: '',
      breed: 'Murrah',
      age: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
      dailyCapacity: '',
      healthNotes: '',
      vaccinationNotes: ''
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (animal: any) => {
    setEditingAnimal(animal);
    setForm({
      name: animal.name,
      breed: animal.breed,
      age: String(animal.age),
      purchaseDate: new Date(animal.purchaseDate).toISOString().split('T')[0],
      status: animal.status,
      dailyCapacity: String(animal.dailyCapacity),
      healthNotes: animal.healthNotes || '',
      vaccinationNotes: animal.vaccinationNotes || ''
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...form,
      age: parseInt(form.age || '0'),
      dailyCapacity: parseFloat(form.dailyCapacity || '0')
    };

    if (editingAnimal) {
      await updateAnimal(editingAnimal.id, data);
    } else {
      await createAnimal(data);
    }
    setModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    const confirmMsg = t('confirmDeleteMsg');
    if (window.confirm(confirmMsg)) {
      await deleteAnimal(id);
    }
  };

  return (
    <div className="flex-1 min-h-screen pt-20 lg:pt-8 pb-28 lg:pb-12 lg:pl-72 px-4 sm:px-6 max-w-7xl mx-auto text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-space font-extrabold text-dairy-text">{t('herdRegistry')}</h2>
          <p className="text-sm text-dairy-text/60">
            {language === 'hi' ? 'पशु पंजी का प्रबंधन करें और बीमारी-टीकाकरण सहेजें।' : 'Record breed, age, status, and daily milk yield capacity for your herd.'}
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-5 py-3 bg-dairy-sky text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-all text-sm"
        >
          <Plus className="w-5 h-5" />
          <span>{t('addBuffalo')}</span>
        </button>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {animals.length > 0 ? (
          animals.map((animal: any) => (
            <div key={animal.id} className="glass-card rounded-4xl p-6 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white/20 to-transparent pointer-events-none" />

              <div onClick={() => setLogsModalAnimal(animal)} className="cursor-pointer group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-dairy-sky/10 border border-dairy-sky/20 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                      🐄
                    </div>
                    <div>
                      <h3 className="font-space font-bold text-lg text-dairy-text group-hover:text-dairy-sky transition-colors">{animal.name}</h3>
                      <span className="text-xs text-dairy-text/50 font-semibold">{animal.breed} • {animal.age} Years Old</span>
                    </div>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wide uppercase ${
                    animal.status === 'ACTIVE' 
                      ? 'bg-dairy-green/10 text-dairy-green border border-dairy-green/20' 
                      : animal.status === 'DRY' 
                      ? 'bg-dairy-gold/10 text-dairy-gold border border-dairy-gold/20'
                      : 'bg-dairy-coral/10 text-dairy-coral border border-dairy-coral/20'
                  }`}>
                    {animal.status}
                  </span>
                </div>

                {/* Health & Yield details */}
                <div className="grid grid-cols-3 gap-3 my-5">
                  <div className="bg-white/40 border border-white/60 p-3 rounded-2xl text-center">
                    <p className="text-[9px] font-bold text-dairy-text/50 uppercase leading-none">{t('dailyCapacity')}</p>
                    <p className="font-space font-extrabold text-base text-dairy-text mt-1">{animal.dailyCapacity} L</p>
                  </div>
                  <div className="bg-white/40 border border-white/60 p-3 rounded-2xl text-center hover:bg-white/70 transition-colors">
                    <p className="text-[9px] font-bold text-dairy-text/50 uppercase leading-none">{t('totalYield')}</p>
                    <p className="font-space font-extrabold text-base text-dairy-sky mt-1">{animal.totalYield || 0} L</p>
                  </div>
                  <div className="bg-white/40 border border-white/60 p-3 rounded-2xl text-center flex flex-col justify-center">
                    <p className="text-[9px] font-bold text-dairy-text/50 uppercase leading-none">{t('boughtOn')}</p>
                    <p className="text-[10px] font-bold text-dairy-text/80 mt-1">
                      {new Date(animal.purchaseDate).toLocaleDateString([], { month: 'short', year: '2-digit' })}
                    </p>
                  </div>
                </div>

                {/* Notes log */}
                <div className="flex flex-col gap-2 bg-white/20 border border-white/40 rounded-2xl p-3 text-xs mb-6">
                  <div className="flex gap-2">
                    <HeartPulse className="w-4 h-4 text-dairy-coral shrink-0" />
                    <p className="text-dairy-text/70">
                      <b>Health:</b> {animal.healthNotes || 'No health alerts.'}
                    </p>
                  </div>
                  <div className="flex gap-2 border-t border-white/20 pt-2">
                    <Sparkles className="w-4 h-4 text-dairy-gold shrink-0" />
                    <p className="text-dairy-text/70">
                      <b>Vaccine:</b> {animal.vaccinationNotes || 'No vaccinations listed.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action triggers */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/30 z-10">
                <button
                  onClick={() => handleOpenEdit(animal)}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-white/80 hover:bg-white text-dairy-text/80 rounded-xl shadow-sm text-xs font-bold active:scale-95 transition-all"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>{t('editDetails')}</span>
                </button>
                <button
                  onClick={() => handleDelete(animal.id)}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-dairy-coral/10 hover:bg-dairy-coral/20 text-dairy-coral rounded-xl text-xs font-bold active:scale-95 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{t('remove')}</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="md:col-span-2 glass-card rounded-4xl p-12 text-center flex flex-col items-center gap-4">
            <span className="text-5xl animate-bounce">🐃</span>
            <div>
              <h3 className="font-space font-bold text-lg">No Buffaloes Seeded</h3>
              <p className="text-sm text-dairy-text/50 mt-1">Please register your animals to begin tracking shifts.</p>
            </div>
            <button
              onClick={handleOpenAdd}
              className="px-5 py-3 bg-dairy-sky text-white font-bold rounded-2xl shadow-md text-sm mt-2"
            >
              Add First Animal
            </button>
          </div>
        )}
      </div>

      {/* 4. MODAL DIALOG SHEET */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-milk-50 border border-white/60 rounded-4xl p-6 w-full max-w-md shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white border border-white/80 shadow-sm"
            >
              <X className="w-5 h-5 text-dairy-text/70" />
            </button>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <h3 className="font-space font-extrabold text-lg text-dairy-text">
                {editingAnimal ? t('editDetails') : t('addBuffalo')}
              </h3>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-dairy-text/60">Animal Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ganga"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-dairy-text/60">Breed</label>
                  <input
                    type="text"
                    value={form.breed}
                    onChange={(e) => setForm({ ...form, breed: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-dairy-text/60">Age (Years)</label>
                  <input
                    type="number"
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-dairy-text/60">Capacity (L/Day)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="15"
                    value={form.dailyCapacity}
                    onChange={(e) => setForm({ ...form, dailyCapacity: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-dairy-text/60">Purchase Date</label>
                  <input
                    type="date"
                    value={form.purchaseDate}
                    onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-dairy-text/60">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="DRY">DRY (सूखी)</option>
                  <option value="SICK">SICK (बीमार)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-dairy-text/60">Health Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Health is fine"
                  value={form.healthNotes}
                  onChange={(e) => setForm({ ...form, healthNotes: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-dairy-text/60">Vaccine Status</label>
                <input
                  type="text"
                  placeholder="e.g. FMD vaccination done"
                  value={form.vaccinationNotes}
                  onChange={(e) => setForm({ ...form, vaccinationNotes: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-dairy-sky text-white font-bold rounded-2xl shadow-lg mt-2 active:scale-95 transition-all text-sm"
              >
                {t('saveChanges')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Yield Logs Modal for Specific Animal */}
      {logsModalAnimal && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="absolute inset-0" onClick={() => setLogsModalAnimal(null)} />

          <div className="relative w-full max-w-lg bg-milk-50 border border-white/60 rounded-4xl p-6 shadow-2xl z-10 text-left">
            <button
              onClick={() => setLogsModalAnimal(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white border border-white/80 shadow-sm"
            >
              <X className="w-5 h-5 text-dairy-text/70" />
            </button>

            <h3 className="font-space font-extrabold text-lg text-dairy-text mb-1">
              {logsModalAnimal.name} ({logsModalAnimal.breed})
            </h3>
            <p className="text-xs font-semibold text-dairy-text/50 mb-4">
              Actual Yield Log History (वास्तविक दूध उत्पादन इतिहास)
            </p>

            {/* Same date-period options inside modal */}
            <div className="flex flex-wrap items-center gap-1.5 mb-4 text-[10px] font-bold">
              {(['ALL', 'MONTH', 'YEAR', 'CUSTOM'] as const).map((r) => {
                const labels: { [key: string]: string } = {
                  ALL: language === 'hi' ? 'सभी' : 'All Time',
                  MONTH: language === 'hi' ? 'इस महीने' : 'This Month',
                  YEAR: language === 'hi' ? 'इस साल' : 'This Year',
                  CUSTOM: language === 'hi' ? 'कस्टम' : 'Custom Period'
                };
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setLogRangeType(r)}
                    className={`px-3 py-1.5 rounded-xl border transition-all ${
                      logRangeType === r
                        ? 'bg-dairy-sky text-white border-dairy-sky shadow-sm'
                        : 'bg-white/50 text-dairy-text/75 border-white/80 hover:bg-white'
                    }`}
                  >
                    {labels[r]}
                  </button>
                );
              })}
            </div>

            {logRangeType === 'CUSTOM' && (
              <div className="flex flex-wrap items-center gap-2 mb-4 text-[10px] font-bold bg-white/40 border border-white/60 p-2.5 rounded-2xl">
                <div className="flex items-center gap-1">
                  <span className="text-dairy-text/50">From</span>
                  <input
                    type="date"
                    value={logStart}
                    onChange={(e) => setLogStart(e.target.value)}
                    className="px-2.5 py-1 rounded-lg border border-white/80 glass-input text-dairy-text text-[10px]"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-dairy-text/50">To</span>
                  <input
                    type="date"
                    value={logEnd}
                    onChange={(e) => setLogEnd(e.target.value)}
                    className="px-2.5 py-1 rounded-lg border border-white/80 glass-input text-dairy-text text-[10px]"
                  />
                </div>
              </div>
            )}

            <div className="max-h-80 overflow-y-auto pr-1">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/30 text-dairy-text/50 uppercase font-bold text-[9px] tracking-wider">
                    <th className="py-2.5">Date</th>
                    <th className="py-2.5">Session</th>
                    <th className="py-2.5 text-right">Actual Yield</th>
                    <th className="py-2.5 text-right">For Home</th>
                    <th className="py-2.5 text-right">Usable Yield</th>
                  </tr>
                </thead>
                <tbody className="font-semibold text-dairy-text">
                  {filteredLogs.map((p: any) => (
                    <tr key={p.id} className="border-b border-white/10 hover:bg-white/20 transition-all">
                      <td className="py-3">
                        {new Date(p.date).toLocaleDateString(language === 'en' ? 'en-US' : 'hi-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-bold ${
                          p.shift === 'MORNING' ? 'bg-dairy-sky/10 text-dairy-sky' : 'bg-dairy-green/10 text-dairy-green'
                        }`}>
                          {p.shift === 'MORNING' ? t('morning') : t('evening')}
                        </span>
                      </td>
                      <td className="py-3 text-right font-space font-extrabold text-dairy-text">
                        {p.quantity} L
                      </td>
                      <td className="py-3 text-right font-space text-dairy-coral font-bold">
                        {p.homeConsumption || 0} L
                      </td>
                      <td className="py-3 text-right font-space font-extrabold text-dairy-sky">
                        {Math.round((p.quantity - (p.homeConsumption || 0)) * 10) / 10} L
                      </td>
                    </tr>
                  ))}
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-dairy-text/40">
                        No yield logs found in this date range.
                      </td>
                    </tr>
                  )}
                </tbody>
                {filteredLogs.length > 0 && (
                  <tfoot className="border-t border-white/35 text-xs font-space font-extrabold text-dairy-text">
                    <tr>
                      <td colSpan={2} className="py-3 uppercase text-[9px] tracking-wider text-dairy-text/50 font-bold">Total:</td>
                      <td className="py-3 text-right text-dairy-text">{Math.round(logsTotals.actual * 10) / 10} L</td>
                      <td className="py-3 text-right text-dairy-coral">{Math.round(logsTotals.home * 10) / 10} L</td>
                      <td className="py-3 text-right text-dairy-sky">{Math.round(logsTotals.usable * 10) / 10} L</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Animals;
