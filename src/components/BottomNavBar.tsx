import React from 'react';
import { ActiveScreen } from '../types';
import { PlusCircle, ListOrdered, Settings, Store, PackagePlus } from 'lucide-react';

interface BottomNavBarProps {
  activeScreen: ActiveScreen;
  onNavigate: (screen: ActiveScreen) => void;
  orderCount: number;
  onOpenSupplyNeed?: () => void;
  activeSupplyCount?: number;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeScreen,
  onNavigate,
  orderCount,
  onOpenSupplyNeed,
  activeSupplyCount = 0,
}) => {
  const isRombongActive =
    activeScreen === 'rombong1' ||
    activeScreen === 'rombong2' ||
    activeScreen === 'rombong3' ||
    activeScreen === 'rombong4';

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-md border-t border-stone-200 z-30 shadow-lg px-2 py-1.5 select-none no-print">
      <div className="flex items-center justify-around text-[10px]">
        {/* Input Pesanan (Gambar 1) */}
        <button
          onClick={() => onNavigate('input')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-colors cursor-pointer ${
            activeScreen === 'input'
              ? 'text-[#236d4e] font-bold'
              : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          <PlusCircle className={`w-5 h-5 ${activeScreen === 'input' ? 'stroke-[2.5]' : ''}`} />
          <span>Input</span>
        </button>

        {/* Data Pesanan (Gambar 3) */}
        <button
          onClick={() => onNavigate('data_pesanan')}
          className={`relative flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-colors cursor-pointer ${
            activeScreen === 'data_pesanan'
              ? 'text-[#236d4e] font-bold'
              : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          <div className="relative">
            <ListOrdered className={`w-5 h-5 ${activeScreen === 'data_pesanan' ? 'stroke-[2.5]' : ''}`} />
            {orderCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-emerald-600 text-white rounded-full text-[9px] w-4 h-4 flex items-center justify-center font-bold">
                {orderCount}
              </span>
            )}
          </div>
          <span>Pesanan</span>
        </button>

        {/* Rombong View (Gambar 6, 7, 8, 9) */}
        <button
          onClick={() => onNavigate('rombong1')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-colors cursor-pointer ${
            isRombongActive
              ? 'text-[#236d4e] font-bold'
              : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          <Store className={`w-5 h-5 ${isRombongActive ? 'stroke-[2.5]' : ''}`} />
          <span>Rombong</span>
        </button>

        {/* Menu Kebutuhan Bahan (Admin) */}
        {onOpenSupplyNeed && (
          <button
            onClick={onOpenSupplyNeed}
            className="relative flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg text-amber-800 hover:text-amber-950 transition-colors cursor-pointer"
          >
            <div className="relative">
              <PackagePlus className="w-5 h-5" />
              {activeSupplyCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-amber-600 text-white rounded-full text-[9px] w-4 h-4 flex items-center justify-center font-bold">
                  {activeSupplyCount}
                </span>
              )}
            </div>
            <span className="font-semibold">Bahan</span>
          </button>
        )}

        {/* Preferensi (Gambar 2) */}
        <button
          onClick={() => onNavigate('preference')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-colors cursor-pointer ${
            activeScreen === 'preference'
              ? 'text-[#236d4e] font-bold'
              : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          <Settings className={`w-5 h-5 ${activeScreen === 'preference' ? 'stroke-[2.5]' : ''}`} />
          <span>Preference</span>
        </button>
      </div>
    </nav>
  );
};
