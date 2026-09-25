import React, { useState } from 'react';
import { ActiveScreen, DeliveryType, Order, PaymentStatus, RombongId } from '../types';
import { formatIndoDate, parseDateFromRaw, toInputDateFormat } from '../utils/format';
import { PlusCircle, Check, Sparkles } from 'lucide-react';

interface InputPesananViewProps {
  onSaveOrder: (newOrder: Omit<Order, 'id' | 'createdAt'>) => void;
  onNavigate: (screen: ActiveScreen) => void;
  referenceDate: Date;
  onViewCreatedReceipt?: (order: Order) => void;
}

export const InputPesananView: React.FC<InputPesananViewProps> = ({
  onSaveOrder,
  onNavigate,
  referenceDate,
}) => {
  // Initial default date based on referenceDate or today
  const defaultDateStr = toInputDateFormat(referenceDate);
  const [tanggalRaw, setTanggalRaw] = useState<string>(defaultDateStr);
  const [hariTanggalDisplay, setHariTanggalDisplay] = useState<string>(formatIndoDate(referenceDate));
  const [jam, setJam] = useState<string>('09:00');

  // Quantities
  const [bijian, setBijian] = useState<string>('');
  const [box6, setBox6] = useState<string>('');
  const [box10, setBox10] = useState<string>('');
  const [box20, setBox20] = useState<string>('');
  const [hantr15, setHantr15] = useState<string>('');
  const [hantr24, setHantr24] = useState<string>('');

  // Customer info
  const [nama, setNama] = useState<string>('');
  const [noHp, setNoHp] = useState<string>('');

  // Delivery
  const [pengiriman, setPengiriman] = useState<DeliveryType>('diambil');
  const [alamatKirim, setAlamatKirim] = useState<string>('');

  // Rombong
  const [rombong, setRombong] = useState<RombongId>('rmb1');

  // Status
  const [statusPembayaran, setStatusPembayaran] = useState<PaymentStatus>('belum');

  // Success Feedback Toast
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);

  const handleDateChange = (newDateRaw: string) => {
    setTanggalRaw(newDateRaw);
    const d = parseDateFromRaw(newDateRaw);
    setHariTanggalDisplay(formatIndoDate(d));
  };

  const resetForm = () => {
    setBijian('');
    setBox6('');
    setBox10('');
    setBox20('');
    setHantr15('');
    setHantr24('');
    setNama('');
    setNoHp('');
    setPengiriman('diambil');
    setAlamatKirim('');
    setStatusPembayaran('belum');
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
      alert('Silakan masukkan minimal 1 pesanan onde-onde (bijian, box, atau hantaran)!');
      return;
    }

    if (!nama.trim()) {
      alert('Silakan masukkan nama pemesan (an.)!');
      return;
    }

    onSaveOrder({
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
    });

    setSavedSuccess(`Pesanan ${nama} berhasil disimpan!`);
    resetForm();

    setTimeout(() => {
      setSavedSuccess(null);
    }, 3500);
  };

  return (
    <div className="p-3 pb-8 max-w-md mx-auto">
      {savedSuccess && (
        <div className="mb-3 p-3 bg-emerald-100 border border-emerald-400 text-emerald-800 rounded-lg flex items-center justify-between text-xs font-semibold animate-fade-in shadow-xs">
          <div className="flex items-center gap-1.5">
            <Check className="w-4 h-4 text-emerald-700" />
            <span>{savedSuccess}</span>
          </div>
          <button
            onClick={() => onNavigate('data_pesanan')}
            className="underline text-emerald-900 font-bold ml-2 cursor-pointer hover:text-emerald-700"
          >
            Lihat Pesanan
          </button>
        </div>
      )}

      {/* Main Form Box matching mockup */}
      <div className="bg-white border-2 border-stone-800 rounded-md shadow-xs overflow-hidden mb-5">
        {/* Banner Title */}
        <div className="bg-white px-3 py-2 border-b-2 border-stone-800 text-center font-bold text-stone-900 text-base tracking-wide">
          input pemesanan
        </div>

        <form onSubmit={handleSubmit} className="p-3.5 space-y-3 text-sm">
          {/* Row 1: hari/tanggal & Jam */}
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
              placeholder="Nama pemesan (contoh: Bu Sholah)"
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
                  name="pengiriman"
                  checked={pengiriman === 'diambil'}
                  onChange={() => setPengiriman('diambil')}
                  className="accent-[#236d4e]"
                />
                <span>diambil</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="pengiriman"
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
                placeholder="alamat / lokasi (contoh: rumah, jl rambutan 15...)"
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
                    name="rombong"
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
                  name="statusPembayaran"
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
                  name="statusPembayaran"
                  checked={statusPembayaran === 'belum'}
                  onChange={() => setStatusPembayaran('belum')}
                  className="accent-amber-600"
                />
                <span className={statusPembayaran === 'belum' ? 'text-amber-700 font-bold' : ''}>
                  belum
                </span>
              </label>
            </div>

            <button
              type="submit"
              className="px-6 py-2 bg-[#236d4e] hover:bg-[#1b553d] active:bg-[#15422f] text-white font-bold text-sm rounded shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>simpan</span>
            </button>
          </div>
        </form>
      </div>

      {/* Navigation Buttons Grid (Green Outline Buttons matching Mockup) */}
      <div className="space-y-2 select-none">
        {/* Row 1: data pesanan & preference */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onNavigate('data_pesanan')}
            className="py-2.5 px-3 rounded-lg border-2 border-[#236d4e] text-[#236d4e] font-bold text-sm bg-white hover:bg-emerald-50 active:bg-emerald-100 transition-all text-center shadow-xs cursor-pointer"
          >
            data pesanan
          </button>
          <button
            onClick={() => onNavigate('preference')}
            className="py-2.5 px-3 rounded-lg border-2 border-[#236d4e] text-[#236d4e] font-bold text-sm bg-white hover:bg-emerald-50 active:bg-emerald-100 transition-all text-center shadow-xs cursor-pointer"
          >
            preference
          </button>
        </div>

        {/* Row 2: rombong 1 & rombong 2 */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onNavigate('rombong1')}
            className="py-2.5 px-3 rounded-lg border-2 border-[#236d4e] text-[#236d4e] font-bold text-sm bg-white hover:bg-emerald-50 active:bg-emerald-100 transition-all text-center shadow-xs cursor-pointer"
          >
            rombong 1
          </button>
          <button
            onClick={() => onNavigate('rombong2')}
            className="py-2.5 px-3 rounded-lg border-2 border-[#236d4e] text-[#236d4e] font-bold text-sm bg-white hover:bg-emerald-50 active:bg-emerald-100 transition-all text-center shadow-xs cursor-pointer"
          >
            rombong 2
          </button>
        </div>

        {/* Row 3: rombong 3 & rombong 4 */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onNavigate('rombong3')}
            className="py-2.5 px-3 rounded-lg border-2 border-[#236d4e] text-[#236d4e] font-bold text-sm bg-white hover:bg-emerald-50 active:bg-emerald-100 transition-all text-center shadow-xs cursor-pointer"
          >
            rombong 3
          </button>
          <button
            onClick={() => onNavigate('rombong4')}
            className="py-2.5 px-3 rounded-lg border-2 border-[#236d4e] text-[#236d4e] font-bold text-sm bg-white hover:bg-emerald-50 active:bg-emerald-100 transition-all text-center shadow-xs cursor-pointer"
          >
            rombong 4
          </button>
        </div>
      </div>
    </div>
  );
};
