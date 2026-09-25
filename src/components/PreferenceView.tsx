import React, { useState } from 'react';
import { AppPreferences, ItemKey } from '../types';
import { formatRupiah, parseNumber } from '../utils/format';
import { Check, RotateCcw, ArrowLeft, Phone, Tag } from 'lucide-react';
import { DEFAULT_PREFERENCES } from '../utils/storage';
import { PWAInstallButton } from './PWAInstallButton';

interface PreferenceViewProps {
  preferences: AppPreferences;
  onSavePreferences: (prefs: AppPreferences) => void;
  onBack: () => void;
}

export const PreferenceView: React.FC<PreferenceViewProps> = ({
  preferences,
  onSavePreferences,
  onBack,
}) => {
  const [telp, setTelp] = useState(preferences.telp || '');
  const [prices, setPrices] = useState({ ...preferences.prices });
  const [savedAlert, setSavedAlert] = useState(false);

  const handlePriceChange = (key: ItemKey, valueStr: string) => {
    const num = parseNumber(valueStr);
    setPrices((prev) => ({
      ...prev,
      [key]: num,
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSavePreferences({
      telp: telp.trim() || DEFAULT_PREFERENCES.telp,
      prices,
    });
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 3000);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Kembalikan harga dan info telp ke standar awal?')) {
      setTelp(DEFAULT_PREFERENCES.telp);
      setPrices({ ...DEFAULT_PREFERENCES.prices });
      onSavePreferences(DEFAULT_PREFERENCES);
      setSavedAlert(true);
      setTimeout(() => setSavedAlert(false), 2000);
    }
  };

  const priceItems: { key: ItemKey; label: string; placeholder: string }[] = [
    { key: 'bijian', label: 'bijian', placeholder: '2500' },
    { key: 'box6', label: 'box 6', placeholder: '15000' },
    { key: 'box10', label: 'box 10', placeholder: '25000' },
    { key: 'box20', label: 'box 20', placeholder: '50000' },
    { key: 'hantr15', label: 'hantaran 15', placeholder: '45000' },
    { key: 'hantr24', label: 'hantaran 24', placeholder: '70000' },
  ];

  return (
    <div className="p-3 pb-8 max-w-md mx-auto space-y-3">
      {savedAlert && (
        <div className="p-3 bg-emerald-100 border border-emerald-400 text-emerald-800 rounded-lg flex items-center gap-2 text-xs font-semibold animate-fade-in shadow-xs">
          <Check className="w-4 h-4 text-emerald-700" />
          <span>Pengaturan preferensi berhasil disimpan!</span>
        </div>
      )}

      {/* PWA Install Card inside Settings: Automatically hidden when installed */}
      <PWAInstallButton variant="settings-item" />

      {/* Box layout matching Gambar 2 */}
      <div className="bg-white border-2 border-stone-800 rounded-md shadow-xs p-4">
        <form onSubmit={handleSave} className="space-y-4">
          {/* Telp Info/pemesanan */}
          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-700" />
              <span>Telp. Info/pemesanan</span>
            </label>
            <input
              type="text"
              value={telp}
              onChange={(e) => setTelp(e.target.value)}
              placeholder="081998765433"
              className="w-full text-sm font-semibold px-3 py-2 border-2 border-stone-700 rounded bg-white text-stone-900 focus:outline-emerald-600 font-mono"
              required
            />
            <p className="text-[11px] text-stone-500 mt-1">
              Nomor ini akan tercetak di header nota transaksi.
            </p>
          </div>

          <div className="border-t border-stone-300 pt-3">
            <div className="text-xs font-bold text-stone-800 mb-2 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-emerald-700" />
              <span>Harga :</span>
            </div>

            <div className="space-y-2.5">
              {priceItems.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between gap-3 p-1.5 bg-stone-50 rounded border border-stone-200"
                >
                  <span className="text-xs font-medium text-stone-700 min-w-24">
                    {item.label}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-stone-400">Rp</span>
                    <input
                      type="text"
                      value={formatRupiah(prices[item.key] || 0)}
                      onChange={(e) => handlePriceChange(item.key, e.target.value)}
                      placeholder={item.placeholder}
                      className="w-28 text-right text-xs font-bold font-mono px-2 py-1 border border-stone-400 rounded bg-white text-stone-900 focus:outline-emerald-600"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 py-2 bg-[#236d4e] hover:bg-[#1b553d] active:bg-[#15422f] text-white font-bold text-xs rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Simpan Perubahan</span>
            </button>

            <button
              type="button"
              onClick={handleResetDefaults}
              title="Reset ke harga default"
              className="px-3 py-2 border border-stone-300 hover:bg-stone-100 text-stone-600 text-xs rounded transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </form>
      </div>

      {/* Back button */}
      <button
        onClick={onBack}
        className="w-full py-2.5 px-3 rounded-lg border-2 border-[#236d4e] text-[#236d4e] font-bold text-xs bg-white hover:bg-emerald-50 active:bg-emerald-100 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali ke Menu Utama</span>
      </button>
    </div>
  );
};
