import React from 'react';
import { ActiveScreen, UserRole } from '../types';
import { ArrowLeft, Home, Calendar, LogOut, PackagePlus } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  activeScreen: ActiveScreen;
  onNavigate: (screen: ActiveScreen) => void;
  titleOverride?: string;
  referenceDateDisplay?: string;
  dateMode?: 'auto' | 'manual';
  onChangeDateClick?: () => void;
  onLogout?: () => void;
  onOpenSupplyNeed?: () => void;
  activeSupplyCount?: number;
  userRole?: UserRole;
  isSyncing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeScreen,
  onNavigate,
  titleOverride,
  referenceDateDisplay,
  dateMode = 'auto',
  onChangeDateClick,
  onLogout,
  onOpenSupplyNeed,
  activeSupplyCount = 0,
  userRole = 'admin',
  isSyncing = false,
}) => {
  const isMainScreen = activeScreen === 'input';
  const isRombongRole = userRole.startsWith('rombong');

  const getScreenTitle = () => {
    if (titleOverride) return titleOverride;
    switch (activeScreen) {
      case 'input':
        return 'Aplikasi Pesanan\nOnde-onde Gapuro';
      case 'preference':
        return 'Preference';
      case 'data_pesanan':
        return 'Data Pesanan';
      case 'edit':
        return 'edit';
      case 'cetak_nota':
        return 'Preview Nota';
      case 'rombong1':
      case 'rombong 1':
        return 'Rombong 1';
      case 'rombong2':
      case 'rombong 2':
        return 'Rombong 2';
      case 'rombong3':
      case 'rombong 3':
        return 'Rombong 3';
      case 'rombong4':
      case 'rombong 4':
        return 'Rombong 4';
      default:
        return 'Aplikasi Pesanan\nOnde-onde Gapuro';
    }
  };

  return (
    <header className="bg-[#236d4e] text-white shadow-md select-none sticky top-0 z-30">
      <div className="px-3.5 py-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Back button: Hanya untuk admin saat tidak di main screen */}
          {!isMainScreen && !isRombongRole && (
            <button
              onClick={() => onNavigate('input')}
              aria-label="Kembali ke Beranda"
              className="p-1.5 -ml-1 rounded-full hover:bg-white/15 active:bg-white/25 transition-colors cursor-pointer text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div>
            {isMainScreen ? (
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-base font-bold leading-tight tracking-wide text-white drop-shadow-xs">
                    Aplikasi Pesanan
                  </h1>
                  <span
                    className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
                      isSyncing
                        ? 'bg-amber-400 text-amber-950 animate-pulse'
                        : 'bg-emerald-400/25 text-emerald-200 border border-emerald-300/30'
                    }`}
                    title={isSyncing ? 'Menyinkronkan data...' : 'Realtime Sync Aktif'}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping"></span>
                    <span>Realtime</span>
                  </span>
                </div>
                <p className="text-sm font-semibold text-emerald-100 tracking-wide">
                  Onde-onde Gapuro
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-lg font-bold tracking-wide capitalize text-white">
                    {getScreenTitle()}
                  </h1>
                  <span
                    className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
                      isSyncing
                        ? 'bg-amber-400 text-amber-950 animate-pulse'
                        : 'bg-emerald-400/25 text-emerald-200 border border-emerald-300/30'
                    }`}
                    title={isSyncing ? 'Menyinkronkan data...' : 'Realtime Sync Aktif'}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping"></span>
                    <span>Realtime</span>
                  </span>
                </div>
                {isRombongRole && (
                  <p className="text-[11px] font-medium text-emerald-200">
                    Akses Khusus: {userRole.toUpperCase()}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Action buttons */}
        <div className="flex items-center gap-1.5">
          {/* PWA Install Button: Automatically hides when app is installed */}
          <PWAInstallButton variant="header-button" />

          {/* Home button only for admin */}
          {!isMainScreen && !isRombongRole && (
            <button
              onClick={() => onNavigate('input')}
              title="Menu Utama"
              className="p-1.5 rounded-lg hover:bg-white/15 active:bg-white/25 transition-colors cursor-pointer text-white"
            >
              <Home className="w-4 h-4" />
            </button>
          )}

          {onChangeDateClick && (
            <button
              onClick={onChangeDateClick}
              title="Atur Tanggal Acuan"
              className="p-1.5 rounded-lg hover:bg-white/15 active:bg-white/25 transition-colors cursor-pointer text-emerald-100 flex items-center gap-1 text-xs"
            >
              <Calendar className="w-4 h-4" />
            </button>
          )}

          {/* Tombol Input Kebutuhan Bahan (di samping tombol keluar ke portal utama) */}
          {onOpenSupplyNeed && (
            <button
              onClick={onOpenSupplyNeed}
              title={isRombongRole ? "Input Kebutuhan Bahan Besok" : "Lihat Kebutuhan Bahan Rombong"}
              className="relative p-1.5 rounded-lg hover:bg-white/20 active:bg-white/30 text-amber-200 hover:text-amber-100 transition-all cursor-pointer flex items-center gap-1 text-xs bg-emerald-900/40 border border-emerald-400/30"
            >
              <PackagePlus className="w-4 h-4 text-amber-300" />
              <span className="hidden sm:inline text-[11px] font-semibold text-white">
                {isRombongRole ? 'Kebutuhan Bahan' : 'Bahan'}
              </span>
              {activeSupplyCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-stone-950 font-bold text-[9px] flex items-center justify-center border border-white shadow-xs">
                  {activeSupplyCount}
                </span>
              )}
            </button>
          )}

          {onLogout && (
            <button
              onClick={onLogout}
              title="Kunci / Keluar ke Portal Login"
              className="p-1.5 rounded-lg hover:bg-red-500/20 active:bg-red-500/40 text-emerald-200 hover:text-red-200 transition-colors cursor-pointer flex items-center gap-1 text-xs"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {isMainScreen && referenceDateDisplay && (
        <div className="bg-[#1b553d] px-3.5 py-1 text-xs font-medium text-emerald-100 flex items-center justify-between border-t border-emerald-700/50">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-white">Tanggal :</span>
            <span>{referenceDateDisplay}</span>
            {dateMode === 'auto' ? (
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/25 text-emerald-200 border border-emerald-400/30 font-medium">
                Otomatis
              </span>
            ) : (
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-500/25 text-amber-200 border border-amber-400/40 font-medium">
                Manual
              </span>
            )}
          </div>
          {onChangeDateClick && (
            <button
              onClick={onChangeDateClick}
              className="text-[11px] underline hover:text-white transition-colors cursor-pointer"
            >
              Ubah Tanggal
            </button>
          )}
        </div>
      )}
    </header>
  );
};
