import React, { useState } from 'react';
import { formatIndoDate, parseDateFromRaw, toInputDateFormat } from '../utils/format';
import { Calendar, Check, X, RotateCcw, Info } from 'lucide-react';

interface DateReferenceModalProps {
  currentDate: Date;
  onSave: (newDate: Date) => void;
  onClose: () => void;
}

export const DateReferenceModal: React.FC<DateReferenceModalProps> = ({
  currentDate,
  onSave,
  onClose,
}) => {
  const [selectedRaw, setSelectedRaw] = useState(toInputDateFormat(currentDate));

  const quickDates = [
    { label: '28 Sept 2026 (Sesuai Contoh Gambar)', value: '2026-09-28' },
    { label: '29 Sept 2026', value: '2026-09-29' },
    { label: '30 Sept 2026', value: '2026-09-30' },
    { label: '1 Okt 2026', value: '2026-10-01' },
    { label: 'Gunakan Hari Ini (Real-time)', value: toInputDateFormat(new Date()) },
  ];

  const handleApply = () => {
    const d = parseDateFromRaw(selectedRaw);
    onSave(d);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-4 text-stone-900 border border-stone-200">
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-700" />
            <h3 className="font-bold text-sm text-stone-800">
              Atur Tanggal Acuan Sistem
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg text-emerald-950 flex items-start gap-2">
            <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Aturan sistem sesuai bagan mockup:
              <br />• <strong>Hari ini / Mendatang</strong>: Tampil di atas (kartu hijau).
              <br />• <strong>1 hari kemarin</strong>: Tampil di bawah (kartu putih, teks abu-abu).
              <br />• <strong>≥2 hari yang lalu</strong>: Otomatis hilang dari daftar.
            </p>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Pilih Tanggal Acuan:
            </label>
            <input
              type="date"
              value={selectedRaw}
              onChange={(e) => setSelectedRaw(e.target.value)}
              className="w-full px-3 py-2 border-2 border-stone-400 rounded-lg text-xs font-semibold focus:outline-emerald-600 bg-white"
            />
            <div className="mt-1 text-[11px] text-stone-500 font-medium">
              Terpilih: {formatIndoDate(parseDateFromRaw(selectedRaw))}
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <span className="font-semibold text-stone-600 text-[11px] block">
              Pilihan Cepat untuk Pengujian:
            </span>
            {quickDates.map((item) => (
              <button
                key={item.value}
                onClick={() => setSelectedRaw(item.value)}
                className={`w-full text-left px-2.5 py-1.5 rounded border text-[11px] transition-colors cursor-pointer flex items-center justify-between ${
                  selectedRaw === item.value
                    ? 'bg-emerald-100 border-emerald-600 font-bold text-emerald-900'
                    : 'bg-stone-50 border-stone-200 hover:bg-stone-100 text-stone-700'
                }`}
              >
                <span>{item.label}</span>
                {selectedRaw === item.value && (
                  <Check className="w-3.5 h-3.5 text-emerald-700" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-stone-200">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-xs border border-stone-300 rounded-lg text-stone-600 hover:bg-stone-100 transition-colors font-semibold cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={handleApply}
            className="flex-1 py-2 text-xs bg-[#236d4e] hover:bg-[#1b553d] text-white rounded-lg transition-colors font-bold flex items-center justify-center gap-1 cursor-pointer shadow-xs"
          >
            <Check className="w-4 h-4" />
            <span>Terapkan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
