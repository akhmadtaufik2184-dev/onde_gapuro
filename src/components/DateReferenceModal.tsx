import React, { useState } from 'react';
import { formatIndoDate, parseDateFromRaw, toInputDateFormat } from '../utils/format';
import { Calendar, Check, X, RotateCcw, Info, Sparkles, SlidersHorizontal } from 'lucide-react';

interface DateReferenceModalProps {
  currentDate: Date;
  currentMode?: 'auto' | 'manual';
  onSave: (newDate: Date, mode: 'auto' | 'manual') => void;
  onClose: () => void;
}

export const DateReferenceModal: React.FC<DateReferenceModalProps> = ({
  currentDate,
  currentMode = 'auto',
  onSave,
  onClose,
}) => {
  const [mode, setMode] = useState<'auto' | 'manual'>(currentMode);
  const [selectedRaw, setSelectedRaw] = useState(toInputDateFormat(currentDate));

  const today = new Date();
  const todayRaw = toInputDateFormat(today);

  // Perhitungan tanggal kemarin & besok untuk opsi cepat
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const quickDates = [
    { label: `Hari Ini (${formatIndoDate(today)})`, value: todayRaw },
    { label: `Kemarin (${formatIndoDate(yesterday)})`, value: toInputDateFormat(yesterday) },
    { label: `Besok (${formatIndoDate(tomorrow)})`, value: toInputDateFormat(tomorrow) },
  ];

  const handleApply = () => {
    if (mode === 'auto') {
      onSave(new Date(), 'auto');
    } else {
      const d = parseDateFromRaw(selectedRaw);
      onSave(d, 'manual');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in no-print">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-4 text-stone-900 border border-stone-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-800">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-stone-900">
                Pengaturan Tanggal Sistem
              </h3>
              <p className="text-[11px] text-stone-500">
                Kontrol tanggal acuan pesanan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3.5 text-xs">
          {/* Pilihan Mode: Otomatis vs Manual */}
          <div className="space-y-2">
            <label className="block font-bold text-stone-700 text-xs">
              Pilih Mode Tanggal:
            </label>

            {/* OPSI 1: OTOMATIS (DIREKOMENDASIKAN) */}
            <div
              onClick={() => setMode('auto')}
              className={`p-3 rounded-xl border-2 transition-all cursor-pointer ${
                mode === 'auto'
                  ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-500 shadow-xs'
                  : 'border-stone-200 bg-white hover:border-emerald-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      mode === 'auto'
                        ? 'border-emerald-700 bg-emerald-700'
                        : 'border-stone-400 bg-white'
                    }`}
                  >
                    {mode === 'auto' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <span className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                    Otomatis Hari Ini (Real-time)
                  </span>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-200 text-emerald-900">
                  Rekomendasi
                </span>
              </div>
              <p className="text-[11px] text-stone-600 mt-1 pl-6 leading-relaxed">
                Tanggal sistem akan <strong>otomatis berganti sendiri setiap hari</strong> mengikuti kalender saat ini ({formatIndoDate(today)}).
              </p>
            </div>

            {/* OPSI 2: MANUAL */}
            <div
              onClick={() => setMode('manual')}
              className={`p-3 rounded-xl border-2 transition-all cursor-pointer ${
                mode === 'manual'
                  ? 'border-amber-600 bg-amber-50/70 ring-1 ring-amber-500 shadow-xs'
                  : 'border-stone-200 bg-white hover:border-amber-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    mode === 'manual'
                      ? 'border-amber-700 bg-amber-700'
                      : 'border-stone-400 bg-white'
                  }`}
                >
                  {mode === 'manual' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <span className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-amber-700" />
                  Manual (Kunci Tanggal Khusus)
                </span>
              </div>
              <p className="text-[11px] text-stone-600 mt-1 pl-6 leading-relaxed">
                Gunakan jika Anda ingin memeriksa arsip pesanan tanggal lain atau mengunci ke tanggal tertentu.
              </p>
            </div>
          </div>

          {/* Form input jika mode MANUAL */}
          {mode === 'manual' && (
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-300 space-y-2.5 animate-fade-in">
              <div>
                <label className="block font-semibold text-stone-800 mb-1">
                  Pilih Tanggal Acuan Manual:
                </label>
                <input
                  type="date"
                  value={selectedRaw}
                  onChange={(e) => setSelectedRaw(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-stone-400 rounded-lg text-xs font-bold focus:outline-emerald-600 bg-white"
                />
                <div className="mt-1 text-[11px] text-emerald-800 font-medium">
                  Terpilih: {formatIndoDate(parseDateFromRaw(selectedRaw))}
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <span className="font-semibold text-stone-600 text-[11px] block">
                  Pilihan Cepat:
                </span>
                {quickDates.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setSelectedRaw(item.value)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg border text-[11px] transition-colors cursor-pointer flex items-center justify-between ${
                      selectedRaw === item.value
                        ? 'bg-amber-100 border-amber-600 font-bold text-amber-950'
                        : 'bg-white border-stone-200 hover:bg-stone-100 text-stone-700'
                    }`}
                  >
                    <span>{item.label}</span>
                    {selectedRaw === item.value && (
                      <Check className="w-3.5 h-3.5 text-amber-700" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Info Card Aturan Display */}
          <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg text-emerald-950 flex items-start gap-2">
            <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <span className="font-bold">Aturan tampilan pesanan:</span>
              <ul className="list-disc list-inside mt-0.5 space-y-0.5 text-emerald-900">
                <li><strong>Hari ini & Mendatang</strong>: Kartu hijau (aktif).</li>
                <li><strong>1 hari kemarin</strong>: Kartu putih abu-abu di bawah.</li>
                <li><strong>≥2 hari yang lalu</strong>: Otomatis bersih/hilang dari daftar.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-stone-200">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 text-xs border border-stone-300 rounded-lg text-stone-600 hover:bg-stone-100 transition-colors font-semibold cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 py-2 text-xs bg-[#236d4e] hover:bg-[#1b553d] active:bg-[#15422f] text-white rounded-lg transition-colors font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Check className="w-4 h-4" />
            <span>Terapkan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
