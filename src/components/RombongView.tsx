import React, { useMemo } from 'react';
import { ActiveScreen, AppPreferences, Order, RombongId, SupplyNeed } from '../types';
import { OrderCard } from './OrderCard';
import { calculateOrderTotal, classifyOrderDate, formatRupiah, isSupplyNeedValid } from '../utils/format';
import { PlusCircle, ShoppingBag, History, PackagePlus, Sparkles } from 'lucide-react';

interface RombongViewProps {
  rombongId: RombongId;
  orders: Order[];
  preferences: AppPreferences;
  referenceDate: Date;
  onEditOrder?: (order: Order) => void;
  onPrintReceipt?: (order: Order) => void;
  onDeleteOrder?: (orderId: string) => void;
  onNavigate: (screen: ActiveScreen) => void;
  onSelectRombong: (rombongId: RombongId) => void;
  isReadOnly?: boolean; // When true (rombong role), cannot switch rombongs, input orders, edit, or print receipt
  onOpenSupplyNeed?: () => void;
  supplyNeed?: SupplyNeed;
}

export const RombongView: React.FC<RombongViewProps> = ({
  rombongId,
  orders,
  preferences,
  referenceDate,
  onEditOrder,
  onPrintReceipt,
  onDeleteOrder,
  onNavigate,
  onSelectRombong,
  isReadOnly = false,
  onOpenSupplyNeed,
  supplyNeed,
}) => {
  // Check if supply need for this rombong is currently active (before 09:00 reset)
  const hasActiveNeed = supplyNeed ? isSupplyNeedValid(supplyNeed) : false;
  // Filter for this specific rombong
  const rombongOrders = useMemo(() => {
    return orders.filter((o) => o.rombong === rombongId);
  }, [orders, rombongId]);

  // Separate active vs yesterday vs expired
  const { activeOrders, yesterdayOrders, totalNominal, unpaidNominal } = useMemo(() => {
    const active: Order[] = [];
    const yesterday: Order[] = [];
    let totalNom = 0;
    let unpaidNom = 0;

    for (const order of rombongOrders) {
      const cls = classifyOrderDate(order.tanggalRaw, referenceDate);
      const orderTotal = calculateOrderTotal(order.items, preferences.prices, order.ongkir || 0);
      const dibayar = order.statusPembayaran === 'lunas' ? orderTotal : (order.uangDibayar || 0);
      const sisaKurang = Math.max(0, orderTotal - dibayar);

      if (cls === 'today_or_future') {
        active.push(order);
        totalNom += orderTotal;
        if (order.statusPembayaran !== 'lunas') {
          unpaidNom += sisaKurang;
        }
      } else if (cls === 'yesterday') {
        yesterday.push(order);
      }
      // >=2 days are automatically hidden as per scheme
    }

    // Sort active by date and time
    active.sort((a, b) => a.tanggalRaw.localeCompare(b.tanggalRaw) || a.jam.localeCompare(b.jam));
    // Sort yesterday by recent first
    yesterday.sort((a, b) => b.tanggalRaw.localeCompare(a.tanggalRaw) || b.jam.localeCompare(a.jam));

    return {
      activeOrders: active,
      yesterdayOrders: yesterday,
      totalNominal: totalNom,
      unpaidNominal: unpaidNom,
    };
  }, [rombongOrders, referenceDate, preferences.prices]);

  const rombongIndex =
    rombongId === 'rmb1' ? 1 : rombongId === 'rmb2' ? 2 : rombongId === 'rmb3' ? 3 : 4;

  return (
    <div className="p-3 pb-24 max-w-md mx-auto">
      {/* Rombong Switcher Tabs: Hanya ditampilkan untuk Admin. Disembunyikan bila role rombong */}
      {!isReadOnly ? (
        <div className="flex items-center gap-1.5 p-1 bg-stone-200/80 rounded-lg mb-3 text-xs select-none">
          {(['rmb1', 'rmb2', 'rmb3', 'rmb4'] as RombongId[]).map((r, idx) => (
            <button
              key={r}
              onClick={() => onSelectRombong(r)}
              className={`flex-1 py-1.5 rounded-md font-bold text-center transition-all cursor-pointer ${
                rombongId === r
                  ? 'bg-[#236d4e] text-white shadow-xs'
                  : 'text-stone-700 hover:bg-stone-300/50'
              }`}
            >
              Rombong {idx + 1}
            </button>
          ))}
        </div>
      ) : (
        <div className="bg-emerald-800 text-white px-3 py-2 rounded-lg mb-3 flex items-center justify-between text-xs font-bold shadow-xs">
          <span>Kios Rombong {rombongIndex}</span>
          <span className="text-[10px] bg-emerald-950/60 px-2 py-0.5 rounded text-emerald-200 border border-emerald-400/20 font-medium">
            Khusus Antrean Rombong {rombongIndex}
          </span>
        </div>
      )}

      {/* Rombong Summary Stats Card */}
      <div className="bg-white border border-stone-300 rounded-lg p-3 shadow-2xs mb-3 flex items-center justify-between text-xs">
        <div>
          <span className="text-stone-500 font-medium">Antrean Pesanan:</span>
          <div className="text-base font-bold text-stone-900">
            {activeOrders.length} pesanan
          </div>
        </div>

        <div className="text-right">
          <span className="text-stone-500 font-medium">Total Nilai:</span>
          <div className="text-sm font-bold text-emerald-800">
            Rp {formatRupiah(totalNominal)}
          </div>
          {unpaidNominal > 0 && (
            <div className="text-[10px] text-amber-700 font-semibold">
              Belum lunas: Rp {formatRupiah(unpaidNominal)}
            </div>
          )}
        </div>
      </div>

      {/* Card Info Kebutuhan Bahan (Besok) */}
      <div className="bg-amber-50/80 border border-amber-300 rounded-lg p-3 shadow-2xs mb-3 text-xs">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5 font-bold text-amber-950">
            <PackagePlus className="w-4 h-4 text-amber-700" />
            <span>Kebutuhan Bahan Besok:</span>
          </div>
          {onOpenSupplyNeed && (
            <button
              onClick={onOpenSupplyNeed}
              className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 underline flex items-center gap-0.5 cursor-pointer"
            >
              <span>{hasActiveNeed ? 'Edit / Perbarui' : '+ Tulis Kebutuhan'}</span>
            </button>
          )}
        </div>

        {hasActiveNeed && supplyNeed ? (
          <div className="bg-white/90 border border-amber-200 rounded p-2 text-stone-800 font-medium space-y-1">
            <div className="text-stone-900 leading-relaxed font-semibold">{supplyNeed.kebutuhan}</div>
            {supplyNeed.catatan && (
              <div className="text-[11px] text-stone-500 italic">Catatan: {supplyNeed.catatan}</div>
            )}
            <div className="text-[10px] text-amber-800 pt-1 border-t border-amber-100 flex items-center justify-between">
              <span>Diisi: {new Date(supplyNeed.updatedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
              <span className="text-stone-500">Auto reset jam 09:00</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between text-stone-500 text-[11px]">
            <span>Belum ada catatan kebutuhan bahan untuk rombong ini.</span>
            {onOpenSupplyNeed && (
              <button
                onClick={onOpenSupplyNeed}
                className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-[10px] cursor-pointer"
              >
                + Input
              </button>
            )}
          </div>
        )}
      </div>

      {/* Orders List for this Rombong */}
      {activeOrders.length === 0 && yesterdayOrders.length === 0 ? (
        <div className="text-center py-10 px-4 bg-white border border-dashed border-stone-300 rounded-lg">
          <ShoppingBag className="w-8 h-8 text-stone-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-stone-700">
            Belum ada pesanan untuk Rombong {rombongIndex}
          </p>
          <p className="text-xs text-stone-500 mt-1">
            Pesanan baru yang ditugaskan ke rombong ini akan langsung tampil di sini secara real-time.
          </p>
          {!isReadOnly && (
            <button
              onClick={() => onNavigate('input')}
              className="mt-3 px-4 py-1.5 bg-[#236d4e] text-white text-xs font-semibold rounded-md shadow-xs hover:bg-[#1b553d] transition-colors cursor-pointer"
            >
              + Buat Pesanan Baru
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Active Orders (Light Green) */}
          {activeOrders.length > 0 && (
            <div className="space-y-2.5">
              <div className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                <span>Pesanan Rombong {rombongIndex}</span>
              </div>
              <div className="space-y-2.5">
                {activeOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    isYesterday={false}
                    onEdit={!isReadOnly ? onEditOrder : undefined}
                    onPrintReceipt={!isReadOnly ? onPrintReceipt : undefined}
                    onDelete={!isReadOnly ? onDeleteOrder : undefined}
                    showActions={!isReadOnly}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Yesterday Orders (White with grey text) */}
          {yesterdayOrders.length > 0 && (
            <div className="pt-2 space-y-2.5 border-t-2 border-dashed border-stone-200">
              <div className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-stone-400" />
                  <span>Kemarin (Rombong {rombongIndex})</span>
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
                    onEdit={!isReadOnly ? onEditOrder : undefined}
                    onPrintReceipt={!isReadOnly ? onPrintReceipt : undefined}
                    onDelete={!isReadOnly ? onDeleteOrder : undefined}
                    showActions={!isReadOnly}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Add Order Button: HANYA untuk Admin */}
      {!isReadOnly && (
        <div className="fixed bottom-4 right-4 z-20">
          <button
            onClick={() => onNavigate('input')}
            className="bg-[#236d4e] hover:bg-[#1b553d] active:bg-[#15422f] text-white px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 text-xs font-bold transition-all transform hover:scale-105 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Input Pesanan</span>
          </button>
        </div>
      )}
    </div>
  );
};
