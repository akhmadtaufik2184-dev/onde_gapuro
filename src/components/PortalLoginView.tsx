import React, { useState } from 'react';
import { Lock, KeyRound, ArrowRight, ShieldCheck, AlertCircle, Eye, EyeOff, Store, Shield } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { UserRole } from '../types';

interface PortalLoginViewProps {
  onLoginSuccess: (role: UserRole) => void;
}

export const PortalLoginView: React.FC<PortalLoginViewProps> = ({ onLoginSuccess }) => {
  const [accessCode, setAccessCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Normalisasi input: lowercase & hilangkan spasi berlebih
    const rawInput = accessCode.trim().toLowerCase();
    // Mendukung penulisan "rombong 1" maupun "rombong1"
    const normalizedInput = rawInput.replace(/\s+/g, ' ');

    if (!normalizedInput) {
      setErrorMsg('Masukkan kode login');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      if (normalizedInput === 'admin') {
        onLoginSuccess('admin');
      } else if (normalizedInput === 'rombong 1' || normalizedInput === 'rombong1') {
        onLoginSuccess('rombong 1');
      } else if (normalizedInput === 'rombong 2' || normalizedInput === 'rombong2') {
        onLoginSuccess('rombong 2');
      } else if (normalizedInput === 'rombong 3' || normalizedInput === 'rombong3') {
        onLoginSuccess('rombong 3');
      } else if (normalizedInput === 'rombong 4' || normalizedInput === 'rombong4') {
        onLoginSuccess('rombong 4');
      } else {
        setErrorMsg('Kode salah! Gunakan: "admin" atau "rombong 1", "rombong 2", "rombong 3", "rombong 4"');
        setIsSubmitting(false);
      }
    }, 250);
  };

  const handleQuickFill = (code: string) => {
    setAccessCode(code);
    setErrorMsg('');
  };

  return (
    <div className="min-h-[88vh] flex flex-col justify-between p-4 sm:p-6 bg-gradient-to-b from-[#f4f7f5] via-stone-100 to-emerald-50 text-stone-900 select-none">
      {/* Top Header Logo */}
      <div className="pt-3 flex flex-col items-center text-center">
        {/* Logo / Badge */}
        <div className="relative mb-2.5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#236d4e] to-[#164431] flex items-center justify-center shadow-lg border-2 border-emerald-300/40 transform -rotate-1 hover:rotate-0 transition-transform">
            <img
              src="./icon.svg"
              alt="Logo Gapuro"
              className="w-11 h-11 object-contain drop-shadow"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
            <Lock className="w-6 h-6 text-amber-300 absolute -bottom-1 -right-1 bg-stone-900 p-1 rounded-full border border-amber-300 shadow" />
          </div>
        </div>

        <h1 className="text-xl font-extrabold text-stone-900 tracking-tight">
          Portal Onde-Onde Gapuro
        </h1>
        <p className="text-xs font-semibold text-emerald-800">
          Sistem Penjualan & Antrean Rombong Real-Time
        </p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-sm mx-auto my-auto pt-2 pb-3">
        <div className="bg-white rounded-2xl shadow-xl border border-stone-200 p-5 relative overflow-hidden">
          {/* Top Decorative accent */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-600 via-amber-400 to-emerald-600"></div>

          <div className="flex items-center gap-2 mb-3.5 text-stone-800">
            <KeyRound className="w-4 h-4 text-emerald-700" />
            <h2 className="text-xs font-bold tracking-wide uppercase">
              Login Pengguna / Rombong
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Masukkan Kode Akses:
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={accessCode}
                  onChange={(e) => {
                    setAccessCode(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  placeholder="admin atau rombong 1..."
                  autoFocus
                  autoComplete="off"
                  className={`w-full px-3 py-2.5 pr-10 text-sm font-bold font-mono tracking-wider rounded-xl border-2 bg-stone-50 focus:bg-white text-stone-900 focus:outline-none transition-all ${
                    errorMsg
                      ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                      : 'border-stone-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
                  title={showPassword ? 'Sembunyikan kode' : 'Lihat kode'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {errorMsg ? (
                <div className="flex items-start gap-1.5 mt-2 text-xs font-semibold text-red-600 animate-fade-in leading-snug">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-[#236d4e] hover:bg-[#1b553d] active:bg-[#15422f] text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-98"
            >
              <span>{isSubmitting ? 'Memverifikasi...' : 'Masuk Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Access Badges for Ease of Use */}
          <div className="mt-4 pt-3 border-t border-stone-100 space-y-2">
            <span className="text-[11px] font-semibold text-stone-600 block">
              Pilihan Cepat Masuk:
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickFill('admin')}
                className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-md text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <Shield className="w-3 h-3 text-amber-700" />
                <span>admin (Full)</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('rombong 1')}
                className="px-2 py-1 bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-md text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <Store className="w-3 h-3 text-emerald-700" />
                <span>rombong 1</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('rombong 2')}
                className="px-2 py-1 bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-md text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <Store className="w-3 h-3 text-emerald-700" />
                <span>rombong 2</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('rombong 3')}
                className="px-2 py-1 bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-md text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <Store className="w-3 h-3 text-emerald-700" />
                <span>rombong 3</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('rombong 4')}
                className="col-span-2 px-2 py-1 bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-md text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <Store className="w-3 h-3 text-emerald-700" />
                <span>rombong 4</span>
              </button>
            </div>
            <p className="text-[10px] text-stone-400 text-center italic mt-1">
              *Rombong 1–4 hanya dapat melihat pesanan khusus rombongnya.
            </p>
          </div>

          <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-center gap-1.5 text-[11px] text-stone-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Koneksi Real-time Firestore Terproteksi</span>
          </div>
        </div>

        {/* PWA Install Button when not yet installed */}
        <div className="mt-3">
          <PWAInstallButton variant="settings-item" />
        </div>
      </div>

      {/* Footer info */}
      <div className="text-center text-[11px] text-stone-400 pb-1">
        <p>© Onde-Onde Gapuro • Multi-Device Real-time App</p>
      </div>
    </div>
  );
};
