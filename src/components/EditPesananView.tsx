import React, { useState } from 'react';
import { DeliveryType, Order, PaymentStatus, RombongId } from '../types';
import { formatIndoDate, parseDateFromRaw } from '../utils/format';
import { Check, ArrowLeft, Trash2 } from 'lucide-react';

interface EditPesananViewProps {
  order: Order;
  onUpdateOrder: (updatedOrder: Order) => void;
  onDeleteOrder: (orderId: string) => void;
  onBack: () => void;
}

export const EditPesananView: React.FC<EditPesananViewProps> = ({
  order,
  onUpdateOrder,
  onDeleteOrder,
  onBack,
}) => {
  const [tanggalRaw, setTanggalRaw] = useState<string>(order.tanggalRaw || '');
  const [hariTanggalDisplay, setHariTanggalDisplay] = useState<string>(order.hariTanggalDisplay || '');
  const [jam, setJam] = useState<string>(order.jam || '09:00');

  // Quantities
  const [bijian, setBijian] = useState<string>(order.items.bijian ? String(order.items.bijian) : '');
  const [box6, setBox6] = useState<string>(order.items.box6 ? String(order.items.box6) : '');
  const [box10, setBox10] = useState<string>(order.items.box10 ? String(order.items.box10) : '');
  const [box20, setBox20] = useState<string>(order.items.box20 ? String(order.items.box20) : '');
  const [hantr15, setHantr15] = useState<string>(order.items.hantr15 ? String(order.items.hantr15) : '');
  const [hantr24, setHantr24] = useState<string>(order.items.hantr24 ? String(order.items.hantr24) : '');

  // Customer info
  const [nama, setNama] = useState<string>(order.nama || '');
  const [noHp, setNoHp] = useState<string>(order.noHp || '');

  // Delivery
  const [pengiriman, setPengiriman] = useState<DeliveryType>(order.pengiriman || 'diambil');
  const [alamatKirim, setAlamatKirim] = useState<string>(order.alamatKirim || '');

  // Rombong
  const [rombong, setRombong] = useState<RombongId>(order.rombong || 'rmb1');

  // Status
  const [statusPembayaran, setStatusPembayaran] = useState<PaymentStatus>(order.statusPembayaran || 'belum');

  const handleDateChange = (newDateRaw: string) => {
    setTanggalRaw(newDateRaw);
    const d = parseDateFromRaw(newDateRaw);
    setHariTanggalDisplay(formatIndoDate(d));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const qBijian = parseInt(bijian, 10) || 0;
    const qBox6 = parseInt(box6, 10) || 0;
    const qBox10 = parseInt(box10, 10) || 0;
    const qBox20 = parseInt(box20, 10) || 0;
    const qHantr15 = parseInt(hantr15, 10) || 0;
    const qHantr24 = parseInt(hantr24, 10) || 0;

    const totalQty = qBijian + qBox6 + qBox10 + qBox20 + qHantr15 + qHantr24;

    if (totalQty === 0) {
      alert('Silakan masukkan minimal 1 pesanan onde-onde!');
      return;
    }

    if (!nama.trim()) {
      alert('Silakan masukkan nama pemesan!');
      return;
    }

    const updated: Order = {
      ...order,
      tanggalRaw,
      hariTanggalDisplay: hariTanggalDisplay.trim() || formatIndoDate(parseDateFromRaw(tanggalRaw)),
      jam: jam.trim() || '09:00',
      items: {
        bijian: qBijian,
        box6: qBox6,
        box10: qBox10,
        box20: qBox20,
        hantr15: qHantr15,
        hantr24: qHantr24,
      },
      nama: nama.trim(),
      noHp: noHp.trim(),
      pengiriman,
      alamatKirim: pengiriman === 'dikirim' ? (alamatKirim.trim() || 'ke rumah') : '',
      rombong,
      statusPembayaran,
    };

    onUpdateOrder(updated);
  };

  const handleDelete = () => {
    if (window.confirm(`Yakin ingin menghapus pesanan atas nama "${order.nama}"?`)) {
      onDeleteOrder(order.id);
      onBack();
    }
  };

  return (
    <div className="p-3 pb-8 max-w-md mx-auto">
      {/* Box layout matching Gambar 4 */}
      <div className="bg-white border-2 border-stone-800 rounded-md shadow-xs overflow-hidden mb-4">
        {/* Banner Title */}
        <div className="bg-white px-3 py-2 border-b-2 border-stone-800 text-center font-bold text-stone-900 text-base tracking-wide flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="p-1 rounded text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span>edit pemesanan</span>
          <button
            type="button"
            onClick={handleDelete}
            title="Hapus pesanan"
            className="p-1 rounded text-red-500 hover:text-red-700 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-3.5 space-y-3 text-sm">
          {/* Row: hari/tanggal & Jam */}
          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-8">
              <label className="block text-xs font-medium text-stone-700 mb-1">
                hari/tanggal
              </label>
              <div className="space-y-1">
                <input
                  type="date"
                  value={tanggalRaw}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full text-xs px-2 py-1.5 border border-stone-400 rounded bg-white text-stone-800 focus:outline-emerald-600"
                  required
                />
                <input
                  type="text"
                  value={hariTanggalDisplay}
                  onChange={(e) => setHariTanggalDisplay(e.target.value)}
                  placeholder="e.g. senin, 28 Sept 2026"
                  className="w-full text-xs px-2 py-1 border border-stone-300 rounded bg-stone-50 text-stone-700 focus:outline-emerald-600"
                />
              </div>
            </div>

            <div className="col-span-4">
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Jam
              </label>
              <input
                type="text"
                value={jam}
                onChange={(e) => setJam(e.target.value)}
                placeholder="09:00"
                className="w-full text-xs px-2 py-1.5 border border-stone-400 rounded bg-white text-stone-800 font-mono focus:outline-emerald-600"
                required
              />
            </div>
          </div>

          {/* Product Quantities Grid */}
          <div className="bg-stone-50 p-2.5 rounded border border-stone-300 space-y-2">
            <div className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider">
              Jumlah Pesanan Onde-Onde
            </div>

            {/* Row: bijian & box 6 */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-between gap-1 bg-white p-1.5 border border-stone-300 rounded">
                <span className="text-xs font-medium text-stone-700">bijian</span>
                <input
                  type="number"
                  min="0"
                  value={bijian}
                  onChange={(e) => setBijian(e.target.value)}
                  placeholder="0"
                  className="w-16 text-center text-xs py-1 border border-stone-400 rounded font-semibold focus:outline-emerald-600"
                />
              </div>

              <div className="flex items-center justify-between gap-1 bg-white p-1.5 border border-stone-300 rounded">
                <span className="text-xs font-medium text-stone-700">box 6</span>
                <input
                  type="number"
                  min="0"
                  value={box6}
                  onChange={(e) => setBox6(e.target.value)}
                  placeholder="0"
                  className="w-16 text-center text-xs py-1 border border-stone-400 rounded font-semibold focus:outline-emerald-600"
                />
              </div>
            </div>

            {/* Row: box 10 & box 20 */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-between gap-1 bg-white p-1.5 border border-stone-300 rounded">
                <span className="text-xs font-medium text-stone-700">box 10</span>
                <input
                  type="number"
                  min="0"
                  value={box10}
                  onChange={(e) => setBox10(e.target.value)}
                  placeholder="0"
                  className="w-16 text-center text-xs py-1 border border-stone-400 rounded font-semibold focus:outline-emerald-600"
                />
              </div>

              <div className="flex items-center justify-between gap-1 bg-white p-1.5 border border-stone-300 rounded">
                <span className="text-xs font-medium text-stone-700">box 20</span>
                <input
                  type="number"
                  min="0"
                  value={box20}
                  onChange={(e) => setBox20(e.target.value)}
                  placeholder="0"
                  className="w-16 text-center text-xs py-1 border border-stone-400 rounded font-semibold focus:outline-emerald-600"
                />
              </div>
            </div>

            {/* Row: hantr 15 & hantr 24 */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-between gap-1 bg-white p-1.5 border border-stone-300 rounded">
                <span className="text-xs font-medium text-stone-700">hantr 15</span>
                <input
                  type="number"
                  min="0"
                  value={hantr15}
                  onChange={(e) => setHantr15(e.target.value)}
                  placeholder="0"
                  className="w-16 text-center text-xs py-1 border border-stone-400 rounded font-semibold focus:outline-emerald-600"
                />
              </div>

              <div className="flex items-center justify-between gap-1 bg-white p-1.5 border border-stone-300 rounded">
                <span className="text-xs font-medium text-stone-700">hantr 24</span>
                <input
                  type="number"
                  min="0"
                  value={hantr24}
                  onChange={(e) => setHantr24(e.target.value)}
                  placeholder="0"
                  className="w-16 text-center text-xs py-1 border border-stone-400 rounded font-semibold focus:outline-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* Customer Name: an. */}
          <div className="flex items-center gap-2">
            <label className="w-12 text-xs font-medium text-stone-700 text-left">
              an.
            </label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Nama pemesan"
              className="flex-1 text-xs px-2.5 py-1.5 border border-stone-400 rounded bg-white text-stone-900 focus:outline-emerald-600 font-medium"
              required
            />
          </div>

          {/* Phone: no. hp */}
          <div className="flex items-center gap-2">
            <label className="w-12 text-xs font-medium text-stone-700 text-left">
              no. hp
            </label>
            <input
              type="tel"
              value={noHp}
              onChange={(e) => setNoHp(e.target.value)}
              placeholder="08xxxxxxxxxx"
              className="flex-1 text-xs px-2.5 py-1.5 border border-stone-400 rounded bg-white text-stone-900 focus:outline-emerald-600"
            />
          </div>

          {/* Delivery: diambil / dikirim ke */}
          <div className="pt-1">
            <div className="flex items-center gap-4 text-xs font-medium text-stone-800">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="edit_pengiriman"
                  checked={pengiriman === 'diambil'}
                  onChange={() => setPengiriman('diambil')}
                  className="accent-[#236d4e]"
                />
                <span>diambil</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="edit_pengiriman"
                  checked={pengiriman === 'dikirim'}
                  onChange={() => setPengiriman('dikirim')}
                  className="accent-[#236d4e]"
                />
                <span>dikirim ke</span>
              </label>
            </div>

            {pengiriman === 'dikirim' && (
              <input
                type="text"
                value={alamatKirim}
                onChange={(e) => setAlamatKirim(e.target.value)}
                placeholder="alamat / lokasi..."
                className="mt-1.5 w-full text-xs px-2.5 py-1.5 border border-emerald-500 rounded bg-emerald-50/50 text-stone-900 focus:outline-emerald-600"
              />
            )}
          </div>

          {/* dikerjakan di */}
          <div className="pt-1">
            <div className="text-xs font-medium text-stone-700 mb-1">
              dikerjakan di
            </div>
            <div className="grid grid-cols-4 gap-1 text-xs">
              {(['rmb1', 'rmb2', 'rmb3', 'rmb4'] as RombongId[]).map((rmb) => (
                <label
                  key={rmb}
                  className={`flex items-center justify-center gap-1 px-1 py-1 rounded border cursor-pointer select-none text-xs transition-colors ${
                    rombong === rmb
                      ? 'bg-emerald-100 border-emerald-600 font-bold text-emerald-900'
                      : 'bg-white border-stone-300 text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="edit_rombong"
                    checked={rombong === rmb}
                    onChange={() => setRombong(rmb)}
                    className="hidden"
                  />
                  <span>{rmb}</span>
                </label>
              ))}
            </div>
          </div>

          {/* lunas / belum & simpan */}
          <div className="pt-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-xs font-semibold text-stone-800">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="edit_statusPembayaran"
                  checked={statusPembayaran === 'lunas'}
                  onChange={() => setStatusPembayaran('lunas')}
                  className="accent-emerald-700"
                />
                <span className={statusPembayaran === 'lunas' ? 'text-emerald-700 font-bold' : ''}>
                  lunas
                </span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="edit_statusPembayaran"
                  checked={statusPembayaran === 'belum'}
                  onChange={() => setStatusPembayaran('belum')}
                  className="accent-amber-600"
                />
                <span className={statusPembayaran === 'belum' ? 'text-amber-700 font-bold' : ''}>
                  belum
                </span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onBack}
                className="px-3 py-2 border border-stone-300 text-stone-600 text-xs rounded hover:bg-stone-100 transition-colors cursor-pointer"
              >
                Batal
              </button>

              <button
                type="submit"
                className="px-5 py-2 bg-[#236d4e] hover:bg-[#1b553d] active:bg-[#15422f] text-white font-bold text-xs rounded shadow-xs transition-colors cursor-pointer flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>simpan</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
