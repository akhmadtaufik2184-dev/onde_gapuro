import React from 'react';
import { ActiveScreen } from '../types';
import { ArrowLeft, Home, Calendar, Wifi, WifiOff } from 'lucide-react';

interface HeaderProps {
  activeScreen: ActiveScreen;
  onNavigate: (screen: ActiveScreen) => void;
  titleOverride?: string;
  referenceDateDisplay?: string;
  onChangeDateClick?: () => void;
  isSyncing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeScreen,
  onNavigate,
  titleOverride,
  referenceDateDisplay,
  onChangeDateClick,
  isSyncing = false,
}) => {
  const isMainScreen = activeScreen === 'input';

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
        return 'Rombong 1';
      case 'rombong2':
        return 'Rombong 2';
      case 'rombong3':
        return 'Rombong 3';
      case 'rombong4':
        return 'Rombong 4';
      default:
        return 'Aplikasi Pesanan\nOnde-onde Gapuro';
    }
  };

  return (
    <header className="bg-[#236d4e] text-white shadow-md select-none sticky top-0 z-30">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {!isMainScreen && (
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
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold leading-tight tracking-wide text-white drop-shadow-xs">
                    Aplikasi Pesanan
                  </h1>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold ${
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
                <p className="text-base font-semibold text-emerald-100 tracking-wide">
                  Onde-onde Gapuro
                </p>
              </div>
            ) : (
              <h1 className="text-xl font-bold tracking-wide capitalize text-white">
                {getScreenTitle()}
              </h1>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {!isMainScreen && (
            <button
              onClick={() => onNavigate('input')}
              title="Menu Utama"
              className="p-1.5 rounded-lg hover:bg-white/15 active:bg-white/25 transition-colors cursor-pointer text-white"
            >
              <Home className="w-5 h-5" />
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
        </div>
      </div>

      {isMainScreen && referenceDateDisplay && (
        <div className="bg-[#1b553d] px-4 py-1.5 text-xs font-medium text-emerald-100 flex items-center justify-between border-t border-emerald-700/50">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-white">Tanggal :</span>
            <span>{referenceDateDisplay}</span>
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
