import React, { useMemo } from 'react';
import { ActiveScreen, AppPreferences, Order, RombongId } from '../types';
import { OrderCard } from './OrderCard';
import { calculateOrderTotal, classifyOrderDate, formatRupiah } from '../utils/format';
import { PlusCircle, ShoppingBag, AlertCircle, ArrowLeft, History } from 'lucide-react';

interface RombongViewProps {
  rombongId: RombongId;
  orders: Order[];
  preferences: AppPreferences;
  referenceDate: Date;
  onEditOrder: (order: Order) => void;
  onPrintReceipt: (order: Order) => void;
  onDeleteOrder: (orderId: string) => void;
  onNavigate: (screen: ActiveScreen) => void;
  onSelectRombong: (rombongId: RombongId) => void;
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
}) => {
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
      const orderTotal = calculateOrderTotal(order.items, preferences.prices);

      if (cls === 'today_or_future') {
        active.push(order);
        totalNom += orderTotal;
        if (order.statusPembayaran !== 'lunas') {
          unpaidNom += orderTotal;
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
      {/* Rombong Switcher Tabs */}
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

      {/* Orders List for this Rombong */}
      {activeOrders.length === 0 && yesterdayOrders.length === 0 ? (
        <div className="text-center py-10 px-4 bg-white border border-dashed border-stone-300 rounded-lg">
          <ShoppingBag className="w-8 h-8 text-stone-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-stone-700">
            Belum ada pesanan untuk Rombong {rombongIndex}
          </p>
          <p className="text-xs text-stone-500 mt-1">
            Pesanan baru yang ditugaskan ke {rombongId} akan tampil di sini.
          </p>
          <button
            onClick={() => onNavigate('input')}
            className="mt-3 px-4 py-1.5 bg-[#236d4e] text-white text-xs font-semibold rounded-md shadow-xs hover:bg-[#1b553d] transition-colors cursor-pointer"
          >
            + Buat Pesanan Baru
          </button>
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
                    onEdit={onEditOrder}
                    onPrintReceipt={onPrintReceipt}
                    onDelete={onDeleteOrder}
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
