import React, { useState } from 'react';
import { AppPreferences, Order } from '../types';
import { calculateOrderTotal, formatRupiah, getOrderBreakdown } from '../utils/format';
import { Printer, Share2, Copy, Check, ArrowLeft, MessageSquare } from 'lucide-react';

interface CetakNotaViewProps {
  order: Order;
  preferences: AppPreferences;
  onBack: () => void;
  onUpdatePaymentStatus?: (orderId: string, status: 'lunas' | 'belum') => void;
}

export const CetakNotaView: React.FC<CetakNotaViewProps> = ({
  order,
  preferences,
  onBack,
  onUpdatePaymentStatus,
}) => {
  const [copied, setCopied] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(order.statusPembayaran);

  const breakdown = getOrderBreakdown(order.items, preferences.prices);
  const total = calculateOrderTotal(order.items, preferences.prices);
  const isLunas = currentStatus === 'lunas';
  const dibayar = isLunas ? total : (order.uangDibayar || 0);
  const kurang = Math.max(0, total - dibayar);

  const handlePrint = () => {
    window.print();
  };

  const handleTogglePayment = () => {
    const nextStatus = currentStatus === 'lunas' ? 'belum' : 'lunas';
    setCurrentStatus(nextStatus);
    if (onUpdatePaymentStatus) {
      onUpdatePaymentStatus(order.id, nextStatus);
    }
  };

  // Generate plain text receipt for WhatsApp and clipboard
  const generateReceiptText = () => {
    let text = `*ONDE ONDE GAPURO*\n`;
    text += `Info/pemesanan\n`;
    text += `Telp. ${preferences.telp}\n\n`;
    text += `Tuan/Toko : ${order.nama || '-'}\n`;
    text += `Selesai   : ${order.hariTanggalDisplay} ${order.jam}\n`;
    if (order.pengiriman === 'dikirim') {
      text += `Kirim ke  : ${order.alamatKirim || 'ke rumah'}\n`;
    } else {
      text += `Status    : Diambil di ${order.rombong}\n`;
    }
    text += `--------------------------------\n`;

    breakdown.forEach((item) => {
      text += `${item.label}\n`;
      text += `${item.qty} x ${formatRupiah(item.unitPrice)} = Rp ${formatRupiah(item.subtotal)}\n`;
    });

    text += `--------------------------------\n`;
    text += `*Total   : Rp ${formatRupiah(total)}*\n`;
    text += `Dibayar : Rp ${formatRupiah(dibayar)}\n`;
    text += `--------------------------------\n`;
    text += `*${isLunas ? 'STATUS: LUNAS' : `Kurang  : Rp ${formatRupiah(kurang)} (BELUM LUNAS)`}*\n\n`;
    text += `Terima kasih atas pesanan Anda! 🙏`;
    return text;
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(generateReceiptText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('Gagal menyalin teks ke papan klip');
    }
  };

  const handleWhatsApp = () => {
    const rawPhone = (order.noHp || '').replace(/[^0-9]/g, '');
    let cleanPhone = rawPhone;
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.substring(1);
    }

    const message = encodeURIComponent(generateReceiptText());
    if (cleanPhone) {
      window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${message}`, '_blank');
    }
  };

  return (
    <div className="p-3 pb-16 max-w-md mx-auto">
      {/* Top action header */}
      <div className="flex items-center justify-between gap-2 mb-3 no-print">
        <button
          onClick={onBack}
          className="text-xs font-semibold text-stone-700 hover:text-stone-950 flex items-center gap-1 cursor-pointer bg-white px-2.5 py-1.5 rounded border border-stone-300"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>

        <button
          onClick={handleTogglePayment}
          className={`text-xs px-2.5 py-1.5 rounded border font-bold cursor-pointer transition-colors ${
            isLunas
              ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
              : 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
          }`}
        >
          {isLunas ? '✓ Status: LUNAS' : '⏳ Status: BELUM LUNAS'}
        </button>
      </div>

      {/* Notice matching mockup: cetak nota ini hanya preview bukan printout */}
      <div className="text-center text-xs text-stone-500 italic mb-2 no-print">
        cetak nota ini hanya preview bukan printout
      </div>

      {/* The Printable / Preview Receipt Paper */}
      <div
        id="thermal-receipt"
        className="bg-white border-2 border-stone-800 rounded shadow-md p-5 text-stone-900 font-mono text-xs max-w-xs mx-auto leading-relaxed relative print:border-none print:shadow-none print:p-0"
      >
        {/* Receipt Stamp if Lunas */}
        {isLunas ? (
          <div className="absolute right-4 top-16 border-2 border-emerald-600 text-emerald-700 font-bold px-2 py-0.5 rounded rotate-[-12deg] uppercase text-[11px] opacity-80 pointer-events-none tracking-widest">
            LUNAS
          </div>
        ) : (
          <div className="absolute right-4 top-16 border-2 border-amber-600 text-amber-800 font-bold px-2 py-0.5 rounded rotate-[-12deg] uppercase text-[11px] opacity-80 pointer-events-none tracking-widest">
            BELUM LUNAS
          </div>
        )}

        {/* Header */}
        <div className="text-center pb-2">
          <div className="font-extrabold text-sm tracking-wider">
            ONDE ONDE GAPURO
          </div>
          <div className="text-[11px] text-stone-600">Info/pemesanan</div>
          <div className="text-[11px] font-semibold">
            Telp. {preferences.telp}
          </div>
        </div>

        {/* Customer & Completion info */}
        <div className="pt-2 text-stone-800 space-y-0.5 text-[11px]">
          <div className="flex">
            <span className="w-24 text-stone-600">Tuan/Toko :</span>
            <span className="font-bold flex-1">{order.nama || '-'}</span>
          </div>
          <div className="flex">
            <span className="w-24 text-stone-600">Selesai :</span>
            <span className="flex-1">
              {order.hariTanggalDisplay || order.tanggalRaw} {order.jam}
            </span>
          </div>
          {order.pengiriman === 'dikirim' && (
            <div className="flex text-[10px] text-stone-600">
              <span className="w-24">Alamat :</span>
              <span className="flex-1 break-words">{order.alamatKirim || 'ke rumah'}</span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="my-2 border-t border-dashed border-stone-400"></div>

        {/* Items list */}
        <div className="space-y-1.5 text-[11px]">
          {breakdown.length === 0 ? (
            <div className="text-center text-stone-400 italic py-2">
              Tidak ada item pesanan
            </div>
          ) : (
            breakdown.map((item) => (
              <div key={item.key} className="space-y-0.5">
                <div className="font-semibold text-stone-800">{item.label}</div>
                <div className="flex items-center justify-between text-stone-600 pl-2">
                  <span>
                    {item.qty} x {formatRupiah(item.unitPrice)}
                  </span>
                  <span className="font-mono text-stone-900 font-medium">
                    {formatRupiah(item.subtotal)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Divider */}
        <div className="my-2 border-t border-dashed border-stone-400"></div>

        {/* Financial Summary matching mockup */}
        <div className="space-y-1 text-[11px]">
          <div className="flex items-center justify-between font-bold text-stone-900">
            <span>Total</span>
            <span className="text-xs">{formatRupiah(total)}</span>
          </div>

          <div className="flex items-center justify-between text-stone-700">
            <span>Dibayar</span>
            <span>{formatRupiah(dibayar)}</span>
          </div>

          <div className="my-1 border-t border-dashed border-stone-300"></div>

          <div className="flex items-center justify-between font-bold text-stone-900">
            <span>Kurang</span>
            <span className={kurang > 0 ? 'text-amber-800 font-extrabold' : ''}>
              {formatRupiah(kurang)}
            </span>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-4 pt-2 border-t border-stone-200 text-center text-[10px] text-stone-500">
          <div>Dikerjakan di: <strong>{order.rombong.toUpperCase()}</strong></div>
          <div className="mt-1">Terima kasih atas pesanan Anda 🙏</div>
        </div>
      </div>

      {/* Action Buttons in Preview Mode */}
      <div className="mt-5 space-y-2 no-print max-w-xs mx-auto">
        <button
          onClick={handlePrint}
          className="w-full py-2.5 px-3 bg-[#236d4e] hover:bg-[#1b553d] active:bg-[#15422f] text-white font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak / Cetak thermal / PDF</span>
        </button>

        <button
          onClick={handleWhatsApp}
          className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Kirim Nota ke WhatsApp ({order.nama || 'Pelanggan'})</span>
        </button>

        <button
          onClick={handleCopyText}
          className="w-full py-2 px-3 bg-white hover:bg-stone-50 border border-stone-300 text-stone-700 font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700 font-bold">Teks Nota Tersalin!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Salin Teks Nota</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
