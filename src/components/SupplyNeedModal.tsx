import React, { useState, useEffect } from 'react';
import { RombongId, SupplyNeed, UserRole, ROMBONG_NAMES } from '../types';
import { isSupplyNeedValid } from '../utils/format';
import { PackagePlus, X, Check, Clock, Trash2, Edit3, Eye, Store, AlertCircle } from 'lucide-react';

interface SupplyNeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: UserRole;
  targetRombongId?: RombongId;
  supplyNeeds: SupplyNeed[];
  onSaveNeed: (need: SupplyNeed) => Promise<void>;
  onClearNeed?: (rombongId: string) => Promise<void>;
}

export const SupplyNeedModal: React.FC<SupplyNeedModalProps> = ({
  isOpen,
  onClose,
  userRole,
  targetRombongId = 'rmb1',
  supplyNeeds,
  onSaveNeed,
  onClearNeed,
}) => {
  const isAdmin = userRole === 'admin';

  // Tentukan rombong aktif berdasarkan role atau targetRombongId yang ditekan
  const getInitialRombong = (): RombongId => {
    if (userRole === 'rombong 1') return 'rmb1';
    if (userRole === 'rombong 2') return 'rmb2';
    if (userRole === 'rombong 3') return 'rmb3';
    if (userRole === 'rombong 4') return 'rmb4';
    return targetRombongId || 'rmb1';
  };

  const [activeRombongTab, setActiveRombongTab] = useState<RombongId>(getInitialRombong);
  const [kebutuhanText, setKebutuhanText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Setiap kali modal dibuka atau targetRombongId / userRole berubah, pastikan tab langsung sesuai
  useEffect(() => {
    if (isOpen) {
      const target = getInitialRombong();
      setActiveRombongTab(target);
    }
  }, [isOpen, targetRombongId, userRole]);

  // Sinkronkan input text dengan data kebutuhan yang sudah ada untuk activeRombongTab
  useEffect(() => {
    const existing = supplyNeeds.find((n) => n.rombong === activeRombongTab);
    if (existing && existing.kebutuhan) {
      setKebutuhanText(existing.kebutuhan);
    } else {
      setKebutuhanText('');
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
      }, 1000);
    } catch (err) {
      console.error('Failed to save supply need:', err);
      alert('Gagal menyimpan kebutuhan bahan');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = async (rombongId: string) => {
    if (!onClearNeed) return;
    const rName = ROMBONG_NAMES[rombongId as RombongId]?.toUpperCase() || rombongId;
    if (window.confirm(`Hapus / bersihkan catatan kebutuhan bahan untuk ${rName}?`)) {
      try {
        await onClearNeed(rombongId);
        if (activeRombongTab === rombongId) {
          setKebutuhanText('');
        }
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
    'Cup',
    'Opp',
    'Kresek kecil',
    'Kresek box 6',
    'Kresek box 10',
    'Kresek 35',
    'Kresek merah',
    'Stiker',
    'Kertas minyak',
    'Tissu',
    'Sarung tangan',
    'Kacang ijo',
    'Minyak',
    'Gula',
  ];

  const allRombongs: RombongId[] = ['rmb1', 'rmb2', 'rmb3', 'rmb4'];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in no-print">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-lg w-full overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#236d4e] to-[#1b553d] px-4 py-3 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white/20 rounded-lg">
              <PackagePlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold leading-tight">
                {isAdmin ? 'Kebutuhan Bahan Setiap Rombong (Besok)' : `Input Kebutuhan Bahan - ${ROMBONG_NAMES[activeRombongTab]?.toUpperCase()}`}
              </h3>
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-200">
                <Clock className="w-3 h-3 text-amber-300" />
                <span>Auto-reset setiap pukul 09:00</span>
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
          <div className="bg-stone-100 p-2 border-b border-stone-200 flex items-center gap-1.5 text-xs shrink-0 select-none">
            {allRombongs.map((r, idx) => {
              const rNeed = supplyNeeds.find((n) => n.rombong === r);
              const hasActive = rNeed ? isSupplyNeedValid(rNeed) : false;
              return (
                <button
                  key={r}
                  onClick={() => setActiveRombongTab(r)}
                  className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-center transition-all cursor-pointer relative text-[11px] ${
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
              <span className="font-bold">Info Pasokan Besok:</span>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Rombong mengisi kebutuhan bahan sebelum tutup/malam ini. Admin dapat memantau kapan saja. Catatan kebutuhan ini akan otomatis bersih pada pukul 09:00 pagi berikutnya.
              </p>
            </div>
          </div>

          {/* ADMIN SUMMARY CARD: Rangkuman Kebutuhan Semua Rombong Sekaligus */}
          {isAdmin && (
            <div className="bg-stone-50 border border-stone-300 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between font-bold text-stone-800 border-b border-stone-200 pb-1.5">
                <span className="flex items-center gap-1.5 text-xs">
                  <Store className="w-4 h-4 text-emerald-800" />
                  <span>Daftar Kebutuhan Seluruh Rombong:</span>
                </span>
                <span className="text-[10px] text-stone-500 font-normal">
                  Klik rombong untuk mengedit
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {allRombongs.map((r, idx) => {
                  const rNeed = supplyNeeds.find((n) => n.rombong === r);
                  const isAct = rNeed ? isSupplyNeedValid(rNeed) : false;
                  const isSelected = activeRombongTab === r;

                  return (
                    <div
                      key={r}
                      onClick={() => setActiveRombongTab(r)}
                      className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/60 ring-1 ring-emerald-600 shadow-xs'
                          : 'border-stone-200 bg-white hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-stone-900 text-[11px]">
                          Rombong {idx + 1}
                        </span>
                        {isAct ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            Ada Kebutuhan
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-stone-100 text-stone-500">
                            Kosong
                          </span>
                        )}
                      </div>

                      {isAct && rNeed ? (
                        <div className="space-y-1">
                          <p className="text-[11px] font-semibold text-stone-800 line-clamp-2">
                            {rNeed.kebutuhan}
                          </p>
                          <div className="flex items-center justify-between text-[9px] text-stone-500 pt-1 border-t border-stone-100">
                            <span>Diisi: {new Date(rNeed.updatedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleClear(r);
                              }}
                              className="text-red-600 hover:text-red-800 font-bold hover:underline"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[10px] text-stone-400 italic">
                          Belum ada input kebutuhan bahan.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Form Input / Edit Bahan untuk Rombong yang Dipilih */}
          <div className="bg-white border border-stone-200 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <label className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-emerald-800" />
                <span>
                  {isAdmin
                    ? `Input / Edit untuk ${ROMBONG_NAMES[activeRombongTab]?.toUpperCase()}:`
                    : `Daftar Kebutuhan Bahan (${ROMBONG_NAMES[activeRombongTab]?.toUpperCase()}):`}
                </span>
              </label>
              {isCurrentActive && currentNeed && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-emerald-700 font-medium">
                    Tersimpan ({new Date(currentNeed.updatedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })})
                  </span>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleClear(activeRombongTab)}
                      className="text-[10px] text-red-600 hover:text-red-800 font-bold underline cursor-pointer"
                    >
                      Hapus
                    </button>
                  )}
                </div>
              )}
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <textarea
                  rows={3}
                  value={kebutuhanText}
                  onChange={(e) => setKebutuhanText(e.target.value)}
                  placeholder={`Tuliskan kebutuhan bahan untuk ${ROMBONG_NAMES[activeRombongTab]?.toUpperCase()} di sini...`}
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

              {saveSuccess && (
                <div className="p-2 bg-emerald-100 border border-emerald-400 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-1.5 animate-fade-in">
                  <Check className="w-4 h-4 text-emerald-700" />
                  <span>Kebutuhan bahan {ROMBONG_NAMES[activeRombongTab]?.toUpperCase()} berhasil disimpan!</span>
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
    </div>
  );
};
