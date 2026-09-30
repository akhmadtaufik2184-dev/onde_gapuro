import React, { useState, useEffect } from 'react';
import { RombongId, SupplyNeed, UserRole, ROMBONG_NAMES } from '../types';
import { isSupplyNeedValid } from '../utils/format';
import { PackagePlus, X, Check, Clock, AlertCircle, Trash2, Calendar, Sparkles } from 'lucide-react';

interface SupplyNeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: UserRole;
  currentRombongId?: RombongId;
  supplyNeeds: SupplyNeed[];
  onSaveNeed: (need: SupplyNeed) => Promise<void>;
  onClearNeed?: (rombongId: string) => Promise<void>;
}

export const SupplyNeedModal: React.FC<SupplyNeedModalProps> = ({
  isOpen,
  onClose,
  userRole,
  currentRombongId = 'rmb1',
  supplyNeeds,
  onSaveNeed,
  onClearNeed,
}) => {
  const isAdmin = userRole === 'admin';

  // For rombong user, they only edit their own rombong.
  // For admin, they can pick which rombong or view all.
  const initialRombong: RombongId = isAdmin ? currentRombongId : (
    userRole === 'rombong 1' ? 'rmb1' :
    userRole === 'rombong 2' ? 'rmb2' :
    userRole === 'rombong 3' ? 'rmb3' :
    userRole === 'rombong 4' ? 'rmb4' : currentRombongId
  );

  const [activeRombongTab, setActiveRombongTab] = useState<RombongId>(initialRombong);
  const [kebutuhanText, setKebutuhanText] = useState('');
  const [catatanText, setCatatanText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync text input with existing need when tab changes
  useEffect(() => {
    const existing = supplyNeeds.find((n) => n.rombong === activeRombongTab);
    if (existing && isSupplyNeedValid(existing)) {
      setKebutuhanText(existing.kebutuhan || '');
      setCatatanText(existing.catatan || '');
    } else {
      setKebutuhanText('');
      setCatatanText('');
    }
  }, [activeRombongTab, supplyNeeds]);

  if (!isOpen) return null;

  const currentNeed = supplyNeeds.find((n) => n.rombong === activeRombongTab);
  const isCurrentActive = currentNeed ? isSupplyNeedValid(currentNeed) : false;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kebutuhanText.trim()) {
      alert('Silakan tuliskan daftar kebutuhan bahan!');
      return;
    }

    try {
      setIsSaving(true);
      const rombongName = ROMBONG_NAMES[activeRombongTab] || activeRombongTab;
      
      const newNeed: SupplyNeed = {
        id: activeRombongTab,
        rombong: activeRombongTab,
        rombongName: rombongName.toUpperCase(),
        kebutuhan: kebutuhanText.trim(),
        catatan: catatanText.trim(),
        updatedAt: Date.now(),
        updatedBy: isAdmin ? 'Admin' : rombongName,
        targetDate: new Date().toISOString().split('T')[0],
      };

      await onSaveNeed(newNeed);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        if (!isAdmin) {
          onClose();
        }
      }, 1200);
    } catch (err) {
      console.error('Failed to save supply need:', err);
      alert('Gagal menyimpan kebutuhan bahan');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = async (rombongId: string) => {
    if (!onClearNeed) return;
    if (window.confirm(`Hapus catatan kebutuhan bahan untuk ${rombongId.toUpperCase()}?`)) {
      try {
        await onClearNeed(rombongId);
        setKebutuhanText('');
        setCatatanText('');
      } catch (err) {
        console.error('Failed to clear need:', err);
      }
    }
  };

  // Quick suggestion chips for common onde-onde bakery supplies
  const addQuickItem = (item: string) => {
    setKebutuhanText((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return item;
      return `${trimmed}, ${item}`;
    });
  };

  const quickItems = [
    'Wijen Putih 2kg',
    'Kacang Hijau Kupas 5kg',
    'Tepung Ketan 5 pack',
    'Gula Pasir 5kg',
    'Minyak Goreng 2 jerigen',
    'Kotak Box 10 (100 pcs)',
    'Kotak Box 6 (50 pcs)',
    'Mika Hantaran',
    'Gas Elpiji 3kg',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in no-print">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-md w-full overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#236d4e] to-[#1b553d] px-4 py-3 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white/20 rounded-lg">
              <PackagePlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold leading-tight">
                {isAdmin ? 'Kebutuhan Bahan Rombong (Besok)' : `Input Kebutuhan Bahan - ${ROMBONG_NAMES[activeRombongTab]?.toUpperCase()}`}
              </h3>
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-200">
                <Clock className="w-3 h-3 text-amber-300" />
                <span>Otomatis direset setiap pukul 09:00</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch for Admin to inspect each rombong */}
        {isAdmin && (
          <div className="bg-stone-100 p-2 border-b border-stone-200 flex items-center gap-1 text-xs shrink-0 select-none">
            {(['rmb1', 'rmb2', 'rmb3', 'rmb4'] as RombongId[]).map((r, idx) => {
              const rNeed = supplyNeeds.find((n) => n.rombong === r);
              const hasActive = rNeed ? isSupplyNeedValid(rNeed) : false;
              return (
                <button
                  key={r}
                  onClick={() => setActiveRombongTab(r)}
                  className={`flex-1 py-1.5 px-1 rounded-lg font-bold text-center transition-all cursor-pointer relative text-[11px] ${
                    activeRombongTab === r
                      ? 'bg-[#236d4e] text-white shadow-xs'
                      : 'text-stone-700 bg-white hover:bg-stone-200 border border-stone-300'
                  }`}
                >
                  <span>Rombong {idx + 1}</span>
                  {hasActive && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border border-white"></span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Body Container (Scrollable) */}
        <div className="p-4 overflow-y-auto space-y-3.5 text-xs flex-1">
          {/* Status info banner */}
          <div className="bg-amber-50 border border-amber-300 rounded-lg p-2.5 text-amber-900 flex items-start gap-2">
            <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold">Info Bahan untuk Besok:</span>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Rombong mengisi kebutuhan bahan sebelum tutup/malam ini. Admin dapat memantau kapan saja. Catatan kebutuhan ini akan <strong>otomatis bersih/hilang pada pukul 09:00 pagi berikutnya</strong>.
              </p>
            </div>
          </div>

          {/* Current Saved Status if any */}
          {isCurrentActive && currentNeed && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-3 space-y-1 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-950 flex items-center gap-1 text-[11px]">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Catatan Aktif (Disimpan {new Date(currentNeed.updatedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })})</span>
                </span>
                {isAdmin && (
                  <button
                    onClick={() => handleClear(activeRombongTab)}
                    className="text-[10px] text-red-600 hover:text-red-800 underline font-semibold cursor-pointer flex items-center gap-0.5"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Hapus/Reset Sekarang</span>
                  </button>
                )}
              </div>
              <div className="text-stone-900 font-medium text-xs bg-white/80 p-2 rounded border border-emerald-200">
                {currentNeed.kebutuhan}
              </div>
              {currentNeed.catatan && (
                <div className="text-[11px] text-stone-600 italic">
                  Catatan: {currentNeed.catatan}
                </div>
              )}
            </div>
          )}

          {/* Form Input */}
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-stone-800 flex items-center gap-1">
                  <span>Daftar Kebutuhan Bahan ({ROMBONG_NAMES[activeRombongTab]?.toUpperCase()}):</span>
                </label>
                <span className="text-[10px] text-stone-500">contoh: Wijen 2kg, Tepung 5 pack</span>
              </div>
              <textarea
                rows={3}
                value={kebutuhanText}
                onChange={(e) => setKebutuhanText(e.target.value)}
                placeholder="Tuliskan kebutuhan bahan untuk besok di sini..."
                className="w-full text-xs p-2.5 border border-stone-400 rounded-lg bg-stone-50 focus:bg-white focus:outline-emerald-600 font-medium text-stone-900 shadow-2xs leading-relaxed"
                required
              />
            </div>

            {/* Quick chips buttons */}
            <div>
              <span className="text-[11px] font-semibold text-stone-600 mb-1.5 block">
                + Tambah Cepat (Klik untuk menyisipkan):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {quickItems.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => addQuickItem(item)}
                    className="px-2 py-1 bg-stone-100 hover:bg-emerald-100 hover:text-emerald-900 hover:border-emerald-300 border border-stone-200 text-stone-700 rounded-md text-[10px] font-medium transition-colors cursor-pointer"
                  >
                    + {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Catatan Tambahan */}
            <div>
              <label className="block font-semibold text-stone-700 mb-1 text-[11px]">
                Catatan Tambahan (Opsional):
              </label>
              <input
                type="text"
                value={catatanText}
                onChange={(e) => setCatatanText(e.target.value)}
                placeholder="e.g. Tolong diantar sebelum jam 10 pagi"
                className="w-full text-xs px-2.5 py-1.5 border border-stone-300 rounded-lg bg-white text-stone-800 focus:outline-emerald-600"
              />
            </div>

            {saveSuccess && (
              <div className="p-2 bg-emerald-100 border border-emerald-400 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-1.5 animate-fade-in">
                <Check className="w-4 h-4 text-emerald-700" />
                <span>Kebutuhan bahan berhasil disimpan ke Admin!</span>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 flex items-center justify-between border-t border-stone-200">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 text-stone-600 hover:bg-stone-100 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
              >
                Tutup
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 bg-[#236d4e] hover:bg-[#1b553d] active:bg-[#15422f] text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Menyimpan...' : 'Simpan Kebutuhan Bahan'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
