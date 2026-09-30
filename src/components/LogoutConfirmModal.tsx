import React, { useState } from 'react';
import { Lock, KeyRound, AlertCircle, Eye, EyeOff, LogOut, X } from 'lucide-react';

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSuccess: () => void;
  userRole?: string;
}

export const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirmSuccess,
  userRole = 'admin',
}) => {
  const [code, setCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const targetCode = 'akhmadtaufik84@';
    const trimmedInput = code.trim();

    if (!trimmedInput) {
      setErrorMsg('Masukkan kode verifikasi keluar');
      return;
    }

    setIsVerifying(true);
    setTimeout(() => {
      if (trimmedInput === targetCode) {
        setIsVerifying(false);
        setCode('');
        setErrorMsg('');
        onConfirmSuccess();
      } else {
        setIsVerifying(false);
        setErrorMsg('Kode salah! Masukkan kode otorisasi yang benar.');
      }
    }, 200);
  };

  const handleClose = () => {
    setCode('');
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in no-print">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-sm w-full overflow-hidden">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 px-4 py-3 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white/20 rounded-lg">
              <Lock className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold leading-tight">Konfirmasi Keluar Portal</h3>
              <p className="text-[11px] text-red-100 font-medium capitalize">
                Peran saat ini: {userRole}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-xs text-stone-600 leading-relaxed">
            Untuk mengunci dan keluar ke portal utama, masukkan kode otorisasi khusus keluar:
          </p>

          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1.5">
              Kode Otorisasi Keluar:
            </label>
            <div className="relative">
              <input
                type={showCode ? 'text' : 'password'}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="Masukkan kode..."
                autoFocus
                autoComplete="off"
                className={`w-full px-3 py-2 pr-10 text-sm font-mono font-bold rounded-xl border-2 bg-stone-50 text-stone-900 focus:bg-white focus:outline-none transition-all ${
                  errorMsg
                    ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                    : 'border-stone-300 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowCode((prev) => !prev)}
                tabIndex={-1}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
                title={showCode ? 'Sembunyikan kode' : 'Lihat kode'}
              >
                {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {errorMsg ? (
              <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-red-600 animate-fade-in">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            ) : null}
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
            <button
              type="button"
              onClick={handleClose}
              className="px-3.5 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isVerifying}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isVerifying ? 'Memeriksa...' : 'Keluar Portal'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
