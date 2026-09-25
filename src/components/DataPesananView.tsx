import React, { useState, useMemo } from 'react';
import { ActiveScreen, Order, RombongId } from '../types';
import { OrderCard } from './OrderCard';
import { classifyOrderDate } from '../utils/format';
import { Search, PlusCircle, ArrowLeft, Filter, AlertCircle, History } from 'lucide-react';

interface DataPesananViewProps {
  orders: Order[];
  referenceDate: Date;
  onEditOrder: (order: Order) => void;
  onPrintReceipt: (order: Order) => void;
  onDeleteOrder: (orderId: string) => void;
  onNavigate: (screen: ActiveScreen) => void;
  showAllHistory?: boolean;
}

export const DataPesananView: React.FC<DataPesananViewProps> = ({
  orders,
  referenceDate,
  onEditOrder,
  onPrintReceipt,
  onDeleteOrder,
  onNavigate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRombong, setSelectedRombong] = useState<string>('all');
  const [includeOlderArchived, setIncludeOlderArchived] = useState(false);

  // Group and sort orders according to the specification:
  // 1. Active orders (Today & Future): shown on top, light green background.
  // 2. Yesterday orders (1 day ago): shown at bottom, white background, grey text.
  // 3. Orders 2+ days old: hidden automatically (unless user toggles show archive).
  const { activeOrders, yesterdayOrders, expiredCount } = useMemo(() => {
    let filtered = orders;

    // Filter by rombong if selected
    if (selectedRombong !== 'all') {
      filtered = filtered.filter((o) => o.rombong === selectedRombong);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.nama.toLowerCase().includes(q) ||
          o.noHp.includes(q) ||
          (o.alamatKirim && o.alamatKirim.toLowerCase().includes(q)) ||
          o.jam.includes(q) ||
          o.hariTanggalDisplay.toLowerCase().includes(q)
      );
    }

    const active: Order[] = [];
    const yesterday: Order[] = [];
    let expired = 0;

    for (const order of filtered) {
      const classification = classifyOrderDate(order.tanggalRaw, referenceDate);
      if (classification === 'today_or_future') {
        active.push(order);
      } else if (classification === 'yesterday') {
        yesterday.push(order);
      } else {
        expired++;
        if (includeOlderArchived) {
          yesterday.push(order);
        }
      }
    }

    // Sort active: soonest date first
    active.sort((a, b) => a.tanggalRaw.localeCompare(b.tanggalRaw) || a.jam.localeCompare(b.jam));

    // Sort yesterday/older: most recent first
    yesterday.sort((a, b) => b.tanggalRaw.localeCompare(a.tanggalRaw) || b.jam.localeCompare(a.jam));

    return {
      activeOrders: active,
      yesterdayOrders: yesterday,
      expiredCount: expired,
    };
  }, [orders, referenceDate, selectedRombong, searchQuery, includeOlderArchived]);

  const totalVisible = activeOrders.length + yesterdayOrders.length;

  return (
    <div className="p-3 pb-24 max-w-md mx-auto">
      {/* Top action / search bar */}
      <div className="mb-3 space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama pemesan, no hp, alamat..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-stone-300 rounded-lg bg-white text-stone-800 placeholder-stone-400 focus:outline-emerald-600 shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs font-bold"
            >
              ×
            </button>
          )}
        </div>

        {/* Quick Rombong Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar select-none">
          <button
            onClick={() => setSelectedRombong('all')}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedRombong === 'all'
                ? 'bg-[#236d4e] text-white shadow-2xs'
                : 'bg-white border border-stone-300 text-stone-700 hover:bg-stone-50'
            }`}
          >
            Semua ({orders.length})
          </button>
          {(['rmb1', 'rmb2', 'rmb3', 'rmb4'] as RombongId[]).map((r, i) => (
            <button
              key={r}
              onClick={() => setSelectedRombong(r)}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedRombong === r
                  ? 'bg-[#236d4e] text-white shadow-2xs'
                  : 'bg-white border border-stone-300 text-stone-700 hover:bg-stone-50'
              }`}
            >
              Rombong {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Specification explanation badge */}
      <div className="mb-3 px-3 py-1.5 bg-emerald-50/80 border border-emerald-200/80 rounded-md text-[11px] text-emerald-900 flex items-center justify-between">
        <span>
          Aktif: <strong>{activeOrders.length}</strong> | Kemarin: <strong>{yesterdayOrders.length}</strong>
        </span>
        {expiredCount > 0 && (
          <button
            onClick={() => setIncludeOlderArchived((prev) => !prev)}
            className="text-[10px] text-emerald-800 underline hover:text-emerald-950 font-medium cursor-pointer"
          >
            {includeOlderArchived
              ? 'Sembunyikan arsip ≥2 hari'
              : `${expiredCount} pesanan ≥2 hari disembunyikan`}
          </button>
        )}
      </div>

      {/* Main List of Orders */}
      {totalVisible === 0 ? (
        <div className="text-center py-12 px-4 bg-white border border-dashed border-stone-300 rounded-lg">
          <AlertCircle className="w-8 h-8 text-stone-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-stone-700">Tidak ada data pesanan</p>
          <p className="text-xs text-stone-500 mt-1">
            {searchQuery
              ? 'Tidak ditemukan pesanan dengan kata kunci tersebut.'
              : 'Belum ada pesanan aktif atau kemarin.'}
          </p>
          <button
            onClick={() => onNavigate('input')}
            className="mt-4 px-4 py-1.5 bg-[#236d4e] text-white text-xs font-semibold rounded-md shadow-xs hover:bg-[#1b553d] transition-colors cursor-pointer"
          >
            + Input Pesanan Baru
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Active Orders Section (Light green cards) */}
          {activeOrders.length > 0 && (
            <div className="space-y-2.5">
              <div className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                <span>Pesanan Hari Ini & Mendatang</span>
              </div>
              <div className="space-y-2.5">
                {activeOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    isYesterday={false}
                    onEdit={onEditOrder}
                    onPrintReceipt={onPrintReceipt}
                    onDelete={onDeleteOrder}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Yesterday Orders Section (White background with grey text) */}
          {yesterdayOrders.length > 0 && (
            <div className="pt-2 space-y-2.5 border-t-2 border-dashed border-stone-200">
              <div className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-stone-400" />
                  <span>Pesanan 1 Hari Kemarin (Riwayat)</span>
                </div>
                <span className="text-[10px] lowercase text-stone-400 font-normal">
                  (background putih, tulisan grey)
                </span>
              </div>
              <div className="space-y-2.5">
                {yesterdayOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    isYesterday={true}
                    onEdit={onEditOrder}
                    onPrintReceipt={onPrintReceipt}
                    onDelete={onDeleteOrder}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Add Order Button */}
      <div className="fixed bottom-4 right-4 z-20">
        <button
          onClick={() => onNavigate('input')}
          className="bg-[#236d4e] hover:bg-[#1b553d] active:bg-[#15422f] text-white px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 text-xs font-bold transition-all transform hover:scale-105 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Input Pesanan</span>
        </button>
      </div>
    </div>
  );
};
