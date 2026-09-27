import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../utils/translations';
import { Plus, Trash2, AlertTriangle, Minus, X } from 'lucide-react';

export const Inventory: React.FC = () => {
  const { inventory, createInventoryItem, updateInventoryItem, deleteInventoryItem, language } = useApp();
  const { t } = useTranslation(language);
  const [modalOpen, setModalOpen] = useState(false);

  const [form, setForm] = useState({
    itemName: '',
    quantity: '',
    unit: 'Bags',
    minStockAlert: '3',
    notes: ''
  });

  const handleOpenAdd = () => {
    setForm({
      itemName: '',
      quantity: '',
      unit: 'Bags',
      minStockAlert: '3',
      notes: ''
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.itemName || !form.quantity) return;

    await createInventoryItem({
      ...form,
      quantity: parseFloat(form.quantity),
      minStockAlert: parseFloat(form.minStockAlert || '1')
    });
    setModalOpen(false);
  };

  const handleStockAdjust = async (item: any, delta: number) => {
    const nextQty = Math.max(0, item.quantity + delta);
    await updateInventoryItem(item.id, { quantity: nextQty });
  };

  const handleDelete = async (id: string) => {
    const confirmMsg = t('confirmDeleteMsg');
    if (window.confirm(confirmMsg)) {
      await deleteInventoryItem(id);
    }
  };

  return (
    <div className="flex-1 min-h-screen pt-20 lg:pt-8 pb-28 lg:pb-12 lg:pl-72 px-4 sm:px-6 max-w-7xl mx-auto text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-space font-extrabold text-dairy-text">{t('inventory')}</h2>
          <p className="text-sm text-dairy-text/60">
            {t('inventorySubtitle')}
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-5 py-3 bg-dairy-sky text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-all text-sm"
        >
          <Plus className="w-5 h-5" />
          <span>{t('newStockItem')}</span>
        </button>
      </div>

      {/* Grid of Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {inventory.length > 0 ? (
          inventory.map((item: any) => (
            <div key={item.id} className="glass-card rounded-4xl p-6 flex flex-col justify-between relative overflow-hidden">
              {/* Alert indicator overlay */}
              {item.lowStock && (
                <div className="absolute right-0 top-0 bg-dairy-gold/15 border-l border-b border-dairy-gold/30 rounded-bl-3xl px-3 py-1.5 flex items-center gap-1.5 text-[9px] font-extrabold text-dairy-gold tracking-wide uppercase">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{t('lowStockBadge')}</span>
                </div>
              )}

              <div>
                <h3 className="font-space font-bold text-base text-dairy-text pr-14">{item.itemName}</h3>
                <p className="text-xs text-dairy-text/50 mt-1">
                  {`${t('minStockLimitLabel')}: ${item.minStockAlert} ${item.unit}`}
                </p>

                <div className="my-5 flex items-center justify-between bg-white/40 border border-white/60 p-4 rounded-3xl">
                  <div>
                    <span className="text-[10px] font-bold text-dairy-text/45 uppercase tracking-wide">{t('currentLevel')}</span>
                    <p className="font-space font-extrabold text-2xl text-dairy-text mt-1">
                      {item.quantity} <span className="text-sm font-semibold">{item.unit}</span>
                    </p>
                  </div>

                  {/* Stock adjuster controls */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStockAdjust(item, -1)}
                      disabled={item.quantity <= 0}
                      className="w-10 h-10 bg-white border border-white/80 rounded-xl shadow-sm hover:bg-milk-50 flex items-center justify-center text-dairy-text disabled:opacity-40"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleStockAdjust(item, 1)}
                      className="w-10 h-10 bg-white border border-white/80 rounded-xl shadow-sm hover:bg-milk-50 flex items-center justify-center text-dairy-text"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="text-xs text-dairy-text/75 bg-white/20 p-3 rounded-2xl mb-6">
                  <b>Notes:</b> {item.notes || 'No description notes logged.'}
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-white/30">
                <button
                  onClick={() => handleDelete(item.id)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-dairy-coral/10 hover:bg-dairy-coral/20 text-dairy-coral rounded-xl text-xs font-bold active:scale-95 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{t('removeItem')}</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="lg:col-span-3 glass-card rounded-4xl p-12 text-center flex flex-col items-center gap-4">
            <span className="text-5xl">🌾</span>
            <div>
              <h3 className="font-space font-bold text-lg">No Inventory Items</h3>
              <p className="text-sm text-dairy-text/50 mt-1">Add items like Mustard Khal feed bags, supplement tonics, and buckets.</p>
            </div>
            <button
              onClick={handleOpenAdd}
              className="px-5 py-3 bg-dairy-sky text-white font-bold rounded-2xl shadow-md text-sm mt-2"
            >
              Add First Stock Item
            </button>
          </div>
        )}
      </div>

      {/* Add dialog */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-milk-50 border border-white/60 rounded-4xl p-6 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white border border-white/80 shadow-sm"
            >
              <X className="w-5 h-5 text-dairy-text/70" />
            </button>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <h3 className="font-space font-extrabold text-lg text-dairy-text">{t('newStockItem')}</h3>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-dairy-text/60">{t('itemName')}</label>
                <input
                  type="text"
                  placeholder="e.g. Khal (Cooperative)"
                  value={form.itemName}
                  onChange={(e) => setForm({ ...form, itemName: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-dairy-text/60">{t('currentLevel')}</label>
                  <input
                    type="number"
                    placeholder="e.g. 10"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-dairy-text/60">Unit</label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
                  >
                    <option value="Bags">Bags</option>
                    <option value="Bottles">Bottles</option>
                    <option value="Pieces">Pieces</option>
                    <option value="Liters">Liters</option>
                    <option value="KG">KG</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-dairy-text/60">{t('alertStock')}</label>
                <input
                  type="number"
                  placeholder="e.g. 3"
                  value={form.minStockAlert}
                  onChange={(e) => setForm({ ...form, minStockAlert: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-dairy-text/60">Storage Notes</label>
                <input
                  type="text"
                  placeholder="Shelf details or supplier contacts"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl text-sm font-semibold glass-input text-dairy-text"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-dairy-sky text-white font-bold rounded-2xl shadow-lg mt-2 active:scale-95 transition-all text-sm"
              >
                {t('newStockItem')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Inventory;
