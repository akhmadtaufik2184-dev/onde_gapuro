import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X, CheckCircle, Share } from 'lucide-react';

interface PWAInstallButtonProps {
  variant?: 'banner' | 'header-button' | 'settings-item';
  onInstalledSuccess?: () => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'header-button',
  onInstalledSuccess,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // CRITICAL REQUIREMENT: "kalau sudah ter instal menu itu hilang"
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      setIsInstalling(true);
      const success = await install();
      setIsInstalling(false);
      if (success && onInstalledSuccess) {
        onInstalledSuccess();
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      // General prompt for browsers when event hasn't fired yet
      setShowIOSModal(true);
    }
  };

  return (
    <>
      {/* 1. Header / Icon Button Style */}
      {variant === 'header-button' && (
        <button
          onClick={handleInstallClick}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold text-xs shadow-sm transition-all transform active:scale-95 cursor-pointer animate-bounce"
          title="Instal Aplikasi ke HP"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">Instal ke HP</span>
          <span className="xs:hidden">Instal</span>
        </button>
      )}

      {/* 2. Top Alert Banner Style */}
      {variant === 'banner' && (
        <div className="bg-amber-500 text-stone-950 px-3 py-2 flex items-center justify-between text-xs font-medium shadow-xs">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 shrink-0" />
            <span>
              <strong>Pasang Aplikasi Gapuro</strong> di layar utama HP Anda agar lebih cepat & tanpa browser bar!
            </span>
          </div>
          <button
            onClick={handleInstallClick}
            disabled={isInstalling}
            className="ml-2 px-3 py-1 bg-stone-900 text-white hover:bg-black rounded font-bold text-[11px] whitespace-nowrap transition-colors cursor-pointer shadow-xs"
          >
            {isInstalling ? 'Memproses...' : 'Instal Sekarang'}
          </button>
        </div>
      )}

      {/* 3. Settings Menu Item Style */}
      {variant === 'settings-item' && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 text-stone-900 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center text-amber-900">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold">Instal Aplikasi di HP</div>
              <div className="text-[11px] text-stone-600">
                Gunakan seperti aplikasi Android/iPhone langsung dari menu HP
              </div>
            </div>
          </div>
          <button
            onClick={handleInstallClick}
            className="px-3 py-1.5 bg-[#236d4e] hover:bg-[#1b553d] text-white text-xs font-bold rounded shadow-xs cursor-pointer"
          >
            Instal
          </button>
        </div>
      )}

      {/* Guide Modal for iOS & General Mobile Browser */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in text-stone-900">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-4 border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-sm text-stone-800">
                  Cara Pasang ke Layar Utama HP
                </h3>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-stone-700">
              {isIOS ? (
                <>
                  <div className="flex items-start gap-2 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 text-emerald-950">
                    <Share className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <strong>Untuk Pengguna iPhone / iPad (Safari):</strong>
                      <ol className="list-decimal ml-4 mt-1 space-y-1">
                        <li>Ketuk tombol <strong>Share / Bagikan</strong> (ikon kotak tanda panah ke atas) di menu bawah Safari.</li>
                        <li>Gulir ke bawah dan pilih <strong>"Add to Home Screen"</strong> (Tambah ke Layar Utama).</li>
                        <li>Ketuk <strong>"Add"</strong> di pojok kanan atas.</li>
                      </ol>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-2 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 text-emerald-950">
                    <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <strong>Untuk Pengguna Android (Chrome / Browser):</strong>
                      <ol className="list-decimal ml-4 mt-1 space-y-1">
                        <li>Ketuk tombol titik tiga (<strong>⋮</strong>) di pojok kanan atas Chrome.</li>
                        <li>Pilih menu <strong>"Instal aplikasi"</strong> atau <strong>"Tambahkan ke Layar Utama"</strong>.</li>
                        <li>Konfirmasi <strong>Instal</strong>. Aplikasi akan muncul di menu HP Anda!</li>
                      </ol>
                    </div>
                  </div>
                </>
              )}
              <p className="text-[11px] text-stone-500 italic">
                Setelah terpasang di HP, tombol dan menu instalasi ini akan otomatis hilang dengan sendirinya.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-200">
              <button
                onClick={() => setShowIOSModal(false)}
                className="w-full py-2 text-xs bg-[#236d4e] hover:bg-[#1b553d] text-white rounded-lg transition-colors font-bold cursor-pointer"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
