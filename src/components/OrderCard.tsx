import React from 'react';
import { Order, ROMBONG_NAMES } from '../types';
import { getItemsSummary } from '../utils/format';
import { Edit2, Printer, Trash2, CheckCircle2, Clock } from 'lucide-react';

interface OrderCardProps {
  order: Order;
  isYesterday?: boolean;
  onEdit: (order: Order) => void;
  onPrintReceipt: (order: Order) => void;
  onDelete?: (orderId: string) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  isYesterday = false,
  onEdit,
  onPrintReceipt,
  onDelete,
}) => {
  const itemsText = getItemsSummary(order.items);
  const isLunas = order.statusPembayaran === 'lunas';

  const deliveryText =
    order.pengiriman === 'diambil'
      ? 'diambil'
      : order.alamatKirim
      ? `dikirim ${order.alamatKirim}`
      : 'dikirim ke rumah';

  const rombongLabel = ROMBONG_NAMES[order.rombong] || order.rombong;

  // Background and text styling based on whether it is yesterday or active
  const cardBgClass = isYesterday
    ? 'bg-white border-stone-200 text-stone-400 shadow-xs'
    : 'bg-[#d8f3dc] border-[#74c69d] text-stone-900 shadow-sm';

  const headerDateClass = isYesterday ? 'text-stone-400' : 'text-stone-800 font-medium';
  const itemsClass = isYesterday ? 'text-stone-500 font-semibold' : 'text-[#1b4332] font-bold';
  const nameClass = isYesterday ? 'text-stone-500 font-medium' : 'text-stone-900 font-semibold';
  const metaClass = isYesterday ? 'text-stone-400' : 'text-stone-700';
  
  const statusBadgeClass = isYesterday
    ? 'text-stone-400'
    : isLunas
    ? 'text-emerald-700 font-bold'
    : 'text-amber-800 font-bold';

  const buttonClass = isYesterday
    ? 'border-stone-300 text-stone-400 hover:bg-stone-50'
    : 'border-stone-400 text-stone-800 hover:bg-emerald-100/70 bg-white/60 active:bg-emerald-200';

  return (
    <div
      className={`rounded-lg border p-3.5 transition-all text-sm leading-relaxed ${cardBgClass}`}
    >
      {/* Date & Time Header */}
      <div className="flex items-center justify-between gap-2 text-xs mb-1">
        <div className={`flex items-center gap-1.5 ${headerDateClass}`}>
          <span>{order.hariTanggalDisplay || order.tanggalRaw}</span>
          <span className="font-bold">{order.jam}</span>
        </div>
        {isYesterday && (
          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-stone-100 text-stone-400 border border-stone-200">
            Kemarin
          </span>
        )}
      </div>

      {/* Items Summary */}
      <div className={`text-base tracking-tight mb-1 ${itemsClass}`}>
        {itemsText}
      </div>

      {/* Customer Name */}
      <div className={`text-sm mb-0.5 ${nameClass}`}>
        {order.nama || 'Tanpa Nama'}
      </div>

      {/* Delivery mode */}
      <div className={`text-xs mb-0.5 break-words ${metaClass}`}>
        {deliveryText}
      </div>

      {/* Rombong */}
      <div className={`text-xs mb-1 ${metaClass}`}>
        dikerjakan di {rombongLabel}
      </div>

      {/* Payment Status */}
      <div className="flex items-center justify-between mb-3">
        <div className={`text-xs flex items-center gap-1 ${statusBadgeClass}`}>
          {isLunas ? (
            <>
              <CheckCircle2 className={`w-3.5 h-3.5 ${isYesterday ? 'text-stone-400' : 'text-emerald-600'}`} />
              <span>lunas</span>
            </>
          ) : (
            <>
              <Clock className={`w-3.5 h-3.5 ${isYesterday ? 'text-stone-400' : 'text-amber-600'}`} />
              <span>belum lunas</span>
            </>
          )}
        </div>

        {order.noHp && (
          <span className={`text-[11px] ${isYesterday ? 'text-stone-400' : 'text-stone-500'}`}>
            {order.noHp}
          </span>
        )}
      </div>

      {/* Action Buttons: edit, cetak nota */}
      <div className="pt-2 border-t border-black/10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(order)}
            className={`px-3 py-1 text-xs rounded border transition-colors flex items-center gap-1 cursor-pointer font-medium ${buttonClass}`}
          >
            <Edit2 className="w-3 h-3" />
            <span>edit</span>
          </button>

          <button
            onClick={() => onPrintReceipt(order)}
            className={`px-3 py-1 text-xs rounded border transition-colors flex items-center gap-1 cursor-pointer font-medium ${buttonClass}`}
          >
            <Printer className="w-3 h-3" />
            <span>cetak nota</span>
          </button>
        </div>

        {onDelete && (
          <button
            onClick={() => {
              if (window.confirm(`Hapus pesanan untuk ${order.nama || 'ini'}?`)) {
                onDelete(order.id);
              }
            }}
            title="Hapus pesanan"
            className="p-1 rounded text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
