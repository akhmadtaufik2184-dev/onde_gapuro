import React, { useState } from 'react';
import { ActiveScreen } from '../types';
import { ChevronDown, ChevronUp, Layers, Smartphone, Monitor } from 'lucide-react';

interface MockupGuideBarProps {
  activeScreen: ActiveScreen;
  onNavigate: (screen: ActiveScreen) => void;
  isMobileFrame: boolean;
  onToggleFrame: () => void;
}

export const MockupGuideBar: React.FC<MockupGuideBarProps> = ({
  activeScreen,
  onNavigate,
  isMobileFrame,
  onToggleFrame,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const screens: { id: ActiveScreen; label: string; figure: string }[] = [
    { id: 'input', label: 'Input Pemesanan', figure: 'Gambar 1' },
    { id: 'preference', label: 'Preference', figure: 'Gambar 2' },
    { id: 'data_pesanan', label: 'Data Pesanan', figure: 'Gambar 3' },
    { id: 'edit', label: 'Edit Pesanan', figure: 'Gambar 4' },
    { id: 'cetak_nota', label: 'Preview Nota', figure: 'Gambar 5' },
    { id: 'rombong1', label: 'Rombong 1', figure: 'Gambar 6' },
    { id: 'rombong2', label: 'Rombong 2', figure: 'Gambar 7' },
    { id: 'rombong3', label: 'Rombong 3', figure: 'Gambar 8' },
    { id: 'rombong4', label: 'Rombong 4', figure: 'Gambar 9' },
  ];

  const current = screens.find((s) => s.id === activeScreen) || screens[0];

  return (
    <div className="bg-stone-900 text-stone-200 text-xs shadow-md border-b border-stone-800 no-print">
      <div className="max-w-4xl mx-auto px-3 py-1.5 flex items-center justify-between gap-2">
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-1.5 font-medium hover:text-emerald-400 transition-colors cursor-pointer"
        >
          <Layers className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-bold text-white">Alur Skema:</span>
          <span className="bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded text-[11px] border border-emerald-800">
            {current.figure} : {current.label}
          </span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        <div className="flex items-center gap-2">
          {/* Desktop/Mobile Frame Toggle */}
          <button
            onClick={onToggleFrame}
            className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 text-[11px] transition-colors cursor-pointer"
            title="Ubah tampilan frame HP / Layar penuh"
          >
            {isMobileFrame ? (
              <>
                <Monitor className="w-3 h-3 text-emerald-400" />
                <span>Layar Penuh</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3 h-3 text-emerald-400" />
                <span>Frame HP</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Expanded quick navigation panel */}
      {isOpen && (
        <div className="bg-stone-950 px-3 py-2.5 border-t border-stone-800 grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-1.5 animate-fade-in">
          {screens.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                setIsOpen(false);
              }}
              className={`p-1.5 rounded text-left text-[11px] transition-all cursor-pointer ${
                activeScreen === item.id
                  ? 'bg-emerald-700 text-white font-bold ring-1 ring-emerald-400'
                  : 'bg-stone-800/80 hover:bg-stone-700 text-stone-300'
              }`}
            >
              <div className="text-[10px] text-emerald-400 font-mono font-semibold">
                {item.figure}
              </div>
              <div className="truncate font-medium">{item.label}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
