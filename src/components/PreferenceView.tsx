import React, { useState } from 'react';
import { AppPreferences, ItemKey, RombongConfig, RombongId, DEFAULT_ROMBONG_SETTINGS } from '../types';
import { formatRupiah, parseNumber } from '../utils/format';
import { Check, RotateCcw, ArrowLeft, Phone, Tag, LogOut, Shield, Store, Award } from 'lucide-react';
import { DEFAULT_PREFERENCES } from '../utils/storage';
import { PWAInstallButton } from './PWAInstallButton';

interface PreferenceViewProps {
  preferences: AppPreferences;
  onSavePreferences: (prefs: AppPreferences) => void;
  onBack: () => void;
  onLogout?: () => void;
}

export const PreferenceView: React.FC<PreferenceViewProps> = ({
  preferences,
  onSavePreferences,
  onBack,
  onLogout,
}) => {
  const [telp, setTelp] = useState(preferences.telp || '');
  const [prices, setPrices] = useState({ ...preferences.prices });
  const [rombongSettings, setRombongSettings] = useState<Record<RombongId, RombongConfig>>(() => ({
    ...DEFAULT_ROMBONG_SETTINGS,
    ...(preferences.rombongSettings || {}),
  }));
  const [savedAlert, setSavedAlert] = useState(false);

  const handlePriceChange = (key: ItemKey, valueStr: string) => {
    const num = parseNumber(valueStr);
    setPrices((prev) => ({
      ...prev,
      [key]: num,
    }));
  };

  const handleRombongConfigChange = (
    rId: RombongId,
    field: keyof RombongConfig,
    valueStr: string
  ) => {
    const num = parseNumber(valueStr);
    setRombongSettings((prev) => ({
      ...prev,
      [rId]: {
        ...(prev[rId] || DEFAULT_ROMBONG_SETTINGS[rId]),
        [field]: num,
      },
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSavePreferences({
      telp: telp.trim() || DEFAULT_PREFERENCES.telp,
      prices,
      rombongSettings,
    });
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 3000);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Kembalikan harga, target rombong, dan info telp ke standar awal?')) {
      setTelp(DEFAULT_PREFERENCES.telp);
      setPrices({ ...DEFAULT_PREFERENCES.prices });
      setRombongSettings({ ...DEFAULT_ROMBONG_SETTINGS });
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

      {/* Box layout matching Gambar 2 + Variable Rombong */}
      <div className="bg-white border-2 border-stone-800 rounded-md shadow-xs p-4">
        <form onSubmit={handleSave} className="space-y-4">
          {/* Telp Info/pemesanan */}
          <div>
            <label className="text-xs font-bold text-stone-800 mb-1 flex items-center gap-1.5">
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

          {/* Daftar Harga Produk */}
          <div className="border-t border-stone-300 pt-3">
            <div className="text-xs font-bold text-stone-800 mb-2 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-emerald-700" />
              <span>Harga Produk (Nota & Kasir):</span>
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

          {/* Variabel HARGA & TARGET Tiap Rombong (Sesuai Catatan Laporan Penjualan) */}
          <div className="border-t border-stone-300 pt-3">
            <div className="text-xs font-bold text-stone-800 mb-1 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-emerald-700" />
              <span>Harga & Target Laporan Penjualan Tiap Rombong:</span>
            </div>
            <p className="text-[11px] text-stone-500 mb-2.5 leading-relaxed">
              Variabel ini digunakan otomatis pada perhitungan Laporan Penjualan Harian, Gaji Pokok, dan Bonus Pegawai.
            </p>

            <div className="space-y-2.5">
              {(['rmb1', 'rmb2', 'rmb3', 'rmb4'] as RombongId[]).map((r, idx) => {
                const conf = rombongSettings[r] || DEFAULT_ROMBONG_SETTINGS[r];
                return (
                  <div
                    key={r}
                    className="p-2.5 bg-stone-50 rounded-lg border border-stone-200 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-stone-800 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                        <span>Rombong {idx + 1}</span>
                      </span>
                      <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-100/70 px-2 py-0.5 rounded border border-emerald-300">
                        Target: {conf.target} butir • Rp {formatRupiah(conf.harga)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] font-semibold text-stone-600 block mb-0.5">
                          HARGA (Rp/butir):
                        </label>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-stone-400">Rp</span>
                          <input
                            type="text"
                            value={formatRupiah(conf.harga)}
                            onChange={(e) => handleRombongConfigChange(r, 'harga', e.target.value)}
                            placeholder="2500"
                            className="w-full text-right text-xs font-bold font-mono px-2 py-1 border border-stone-400 rounded bg-white text-stone-900 focus:outline-emerald-600"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-semibold text-stone-600 block mb-0.5">
                          TARGET (butir):
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={conf.target}
                            onChange={(e) => handleRombongConfigChange(r, 'target', e.target.value)}
                            placeholder={r === 'rmb1' ? '140' : '70'}
                            className="w-full text-right text-xs font-bold font-mono px-2 py-1 border border-stone-400 rounded bg-white text-stone-900 focus:outline-emerald-600"
                          />
                          <span className="text-[10px] text-stone-500">butir</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
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
              title="Reset ke harga & target default"
              className="px-3 py-2 border border-stone-300 hover:bg-stone-100 text-stone-600 text-xs rounded transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </form>
      </div>

      {/* Sesi Portal / Logout */}
      {onLogout && (
        <div className="bg-stone-50 border border-stone-200 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-700" />
            <div>
              <div className="text-xs font-bold text-stone-800">Sesi Portal Masuk</div>
              <div className="text-[11px] text-stone-500">Masuk sebagai Pengelola (admin)</div>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar</span>
          </button>
        </div>
      )}

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
