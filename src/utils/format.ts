import { ItemKey, Order, OrderItems, SupplyNeed, DailyReportDayItem, WeeklyReport, RombongId } from '../types';

export const formatRupiah = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const parseNumber = (val: string | number): number => {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const cleaned = val.replace(/[^0-9]/g, '');
  return cleaned === '' ? 0 : parseInt(cleaned, 10);
};

const INDO_DAYS = ['Minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
const INDO_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agt', 'Sept', 'Okt', 'Nov', 'Des'
];
const INDO_MONTHS_FULL = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const formatIndoDate = (date: Date): string => {
  const dayName = INDO_DAYS[date.getDay()];
  const day = date.getDate();
  const month = INDO_MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${dayName}, ${day} ${month} ${year}`;
};

export const formatIndoDateFull = (date: Date): string => {
  const day = date.getDate();
  const month = INDO_MONTHS_FULL[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

export const toInputDateFormat = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const parseDateFromRaw = (raw: string): Date => {
  if (!raw) return new Date();
  const parts = raw.split('-');
  if (parts.length === 3) {
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  }
  return new Date();
};

export const getItemsSummary = (items: OrderItems): string => {
  const parts: string[] = [];
  if (items.bijian > 0) parts.push(`${items.bijian} biji`);
  if (items.box6 > 0) parts.push(`${items.box6} box6`);
  if (items.box10 > 0) parts.push(`${items.box10} box10`);
  if (items.box20 > 0) parts.push(`${items.box20} box20`);
  if (items.hantr15 > 0) parts.push(`${items.hantr15} hantaran 15`);
  if (items.hantr24 > 0) parts.push(`${items.hantr24} hantaran 24`);

  return parts.length > 0 ? parts.join(', ') : '0 item';
};

export const calculateOrderTotal = (
  items: OrderItems,
  prices: Record<ItemKey, number>,
  ongkir: number = 0
): number => {
  let total = 0;
  total += (items.bijian || 0) * (prices.bijian || 0);
  total += (items.box6 || 0) * (prices.box6 || 0);
  total += (items.box10 || 0) * (prices.box10 || 0);
  total += (items.box20 || 0) * (prices.box20 || 0);
  total += (items.hantr15 || 0) * (prices.hantr15 || 0);
  total += (items.hantr24 || 0) * (prices.hantr24 || 0);
  total += (ongkir || 0);
  return total;
};

export interface OrderItemDetail {
  key: ItemKey;
  label: string;
  qty: number;
  unitPrice: number;
  subtotal: number;
}

export const getOrderBreakdown = (
  items: OrderItems,
  prices: Record<ItemKey, number>
): OrderItemDetail[] => {
  const details: OrderItemDetail[] = [];
  const list: { key: ItemKey; label: string }[] = [
    { key: 'bijian', label: 'bijian' },
    { key: 'box6', label: 'box 6' },
    { key: 'box10', label: 'box 10' },
    { key: 'box20', label: 'box 20' },
    { key: 'hantr15', label: 'hantaran 15' },
    { key: 'hantr24', label: 'hantaran 24' },
  ];

  for (const item of list) {
    const qty = items[item.key] || 0;
    if (qty > 0) {
      const unitPrice = prices[item.key] || 0;
      details.push({
        key: item.key,
        label: item.label,
        qty,
        unitPrice,
        subtotal: qty * unitPrice,
      });
    }
  }

  return details;
};

/**
 * Checks how an order date compares to reference date (normally today):
 * - 'today_or_future': active orders (today, tomorrow, later)
 * - 'yesterday': exactly 1 day ago (show at bottom in white background, grey text)
 * - 'expired': 2 days ago or older (automatically hidden per user spec)
 */
export const classifyOrderDate = (
  orderDateRaw: string,
  referenceDate: Date = new Date()
): 'today_or_future' | 'yesterday' | 'expired' => {
  const orderDate = parseDateFromRaw(orderDateRaw);
  // Normalize both to midnight local time for fair day difference
  const refMidnight = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate()).getTime();
  const orderMidnight = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate()).getTime();
  
  const diffDays = Math.round((orderMidnight - refMidnight) / (1000 * 60 * 60 * 24));

  if (diffDays >= 0) {
    return 'today_or_future';
  } else if (diffDays === -1) {
    return 'yesterday';
  } else {
    return 'expired';
  }
};

/**
 * Cek apakah catatan kebutuhan bahan masih aktif atau sudah kedaluwarsa (auto reset pukul 09:00).
 * Aturan:
 * Jika kebutuhan diinput untuk besok/hari ini, batas kadaluwarsanya adalah pukul 09:00 pada hari target.
 * Atau jika dihitung dari waktu input updatedAt:
 * Batas waktu reset adalah pukul 09:00 berikutnya setelah diinput.
 * Jika saat ini sudah melewati pukul 09:00 tersebut, catatan otomatis dianggap kedaluwarsa/hilang.
 */
export const isSupplyNeedValid = (need: SupplyNeed, now: Date = new Date()): boolean => {
  if (!need || !need.kebutuhan || !need.kebutuhan.trim()) return false;
  if (!need.updatedAt) return false;

  const updatedDate = new Date(need.updatedAt);
  
  // Tentukan cut-off pukul 09:00
  // Jika diinput SEBELUM pukul 09:00 pada hari H, cut-off adalah hari H pukul 09:00
  // Jika diinput SETELAH pukul 09:00 pada hari H (misal sore/malam untuk kebutuhan besok),
  // cut-off adalah esok harinya (H+1) pukul 09:00
  const cutOff = new Date(updatedDate);
  if (updatedDate.getHours() < 9) {
    cutOff.setHours(9, 0, 0, 0);
  } else {
    cutOff.setDate(cutOff.getDate() + 1);
    cutOff.setHours(9, 0, 0, 0);
  }

  // Jika waktu sekarang masih sebelum cutoff 09:00, kebutuhan masih valid/aktif
  return now.getTime() < cutOff.getTime();
};

export const formatIndoDayUpper = (date: Date): string => {
  const days = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
  return days[date.getDay()];
};

export const formatShortDateDisplay = (date: Date): string => {
  const day = date.getDate();
  const month = INDO_MONTHS[date.getMonth()];
  const yr = String(date.getFullYear()).slice(-2);
  return `${day}-${month}-${yr}`;
};

/**
 * Perhitungan Laporan Penjualan Harian & Pendapatan Pegawai
 * Rumus dari gambar lampiran:
 * - TERJUAL = sum(uraianTerjual)
 * - SISA = stokMasuk - terjual
 * - JUMLAH = terjual * harga
 * - CASH + TRANSFER + QRIS
 * - Jika TERJUAL >= TARGET -> Gaji = 50.000
 *   Jika tidak -> Gaji = 50.000 - ((TARGET - TERJUAL) * 200)
 * - BONUS: jika TERJUAL > TARGET -> (TERJUAL - TARGET) * 200, jika tidak -> 0
 * - TOTAL = GAJI + BONUS
 * - GRAND TOTAL = TOTAL + LEMBUR
 */
export const calculateDailyReport = (
  stokMasuk: number,
  uraianTerjual: number[],
  harga: number,
  cash: number,
  transfer: number,
  qris: number,
  target: number,
  lembur: number = 0,
  gajiPokok: number = 50000,
  bonusPerPcs: number = 200
) => {
  const terjual = (uraianTerjual || []).reduce((acc, curr) => acc + (Number(curr) || 0), 0);
  const sisa = Math.max(0, (Number(stokMasuk) || 0) - terjual);
  const jumlah = terjual * (Number(harga) || 0);
  const totalBayarDiterima = (Number(cash) || 0) + (Number(transfer) || 0) + (Number(qris) || 0);
  const selisih = totalBayarDiterima - jumlah;
  const isSelisih = selisih !== 0;

  // Gaji calculation
  let gaji = gajiPokok;
  if (terjual >= target) {
    gaji = gajiPokok;
  } else {
    const defisit = target - terjual;
    gaji = Math.max(0, gajiPokok - (defisit * bonusPerPcs));
  }

  // Bonus calculation
  let bonus = 0;
  if (terjual > target) {
    bonus = (terjual - target) * bonusPerPcs;
  }

  const total = gaji + bonus;
  const grandTotalGaji = total + (Number(lembur) || 0);

  return {
    terjual,
    sisa,
    jumlah,
    totalBayarDiterima,
    selisih,
    isSelisih,
    gaji,
    bonus,
    total,
    grandTotalGaji,
  };
};

/**
 * Menghitung tanggal awal (Jumat) dan akhir (Kamis) untuk siklus 1 minggu.
 * Siklus: Jumat -> Sabtu -> Minggu -> Senin -> Selasa -> Rabu -> Kamis (tutup buku / gajian).
 */
export const getFridayPeriodDates = (date: Date = new Date()) => {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay(); // 0: Min, 1: Sen, 2: Sel, 3: Rab, 4: Kam, 5: Jum, 6: Sab
  
  // Hari Jumat adalah awal periode:
  // Jum (5): 0 hari lalu
  // Sab (6): 1 hari lalu
  // Min (0): 2 hari lalu
  // Sen (1): 3 hari lalu
  // Sel (2): 4 hari lalu
  // Rab (3): 5 hari lalu
  // Kam (4): 6 hari lalu
  const diffToFriday = (day + 2) % 7;
  const fridayDate = new Date(d);
  fridayDate.setDate(fridayDate.getDate() - diffToFriday);

  const days: {
    hari: string;
    tanggalRaw: string;
    tanggalDisplay: string;
    dateObj: Date;
  }[] = [];

  const dayNames = ['JUMAT', 'SABTU', 'MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS'];

  for (let i = 0; i < 7; i++) {
    const cur = new Date(fridayDate);
    cur.setDate(fridayDate.getDate() + i);
    days.push({
      hari: dayNames[i],
      tanggalRaw: toInputDateFormat(cur),
      tanggalDisplay: formatShortDateDisplay(cur),
      dateObj: cur,
    });
  }

  const thursdayDate = days[6].dateObj;

  return {
    startDate: fridayDate,
    endDate: thursdayDate,
    startDateRaw: days[0].tanggalRaw,
    endDateRaw: days[6].tanggalRaw,
    periodLabel: `${formatShortDateDisplay(fridayDate)} - ${formatShortDateDisplay(thursdayDate)} (Jumat - Kamis)`,
    days,
  };
};

export const createInitialWeeklyDays = (
  fridayStartDate: Date,
  harga: number = 2500,
  target: number = 70
): DailyReportDayItem[] => {
  const dayNames = ['JUMAT', 'SABTU', 'MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS'];
  const res: DailyReportDayItem[] = [];

  for (let i = 0; i < 7; i++) {
    const cur = new Date(fridayStartDate);
    cur.setDate(fridayStartDate.getDate() + i);
    res.push({
      hari: dayNames[i],
      tanggalRaw: toInputDateFormat(cur),
      tanggalDisplay: formatShortDateDisplay(cur),
      stokMasuk: 0,
      uraianTerjual: [0, 0, 0, 0],
      terjual: 0,
      sisa: 0,
      harga,
      cash: 0,
      transfer: 0,
      qris: 0,
      jumlah: 0,
      totalBayarDiterima: 0,
      isSelisih: false,
      keterangan: '',
      target,
      gaji: 0,
      bonus: 0,
      total: 0,
      lembur: 0,
      grandTotalGaji: 0,
      isFilled: false,
    });
  }

  return res;
};

export const calculateWeeklyTotals = (days: DailyReportDayItem[]) => {
  let totalMasuk = 0;
  let totalTerjual = 0;
  let totalSisa = 0;
  let totalCash = 0;
  let totalTransfer = 0;
  let totalQris = 0;
  let totalJumlah = 0;
  let totalSetoran = 0;
  let totalGaji = 0;
  let totalBonus = 0;
  let totalGajiPlusBonus = 0;
  let totalLembur = 0;
  let grandTotalHonor = 0;

  for (const d of days) {
    if (d.isFilled) {
      totalMasuk += Number(d.stokMasuk) || 0;
      totalTerjual += Number(d.terjual) || 0;
      totalSisa += Number(d.sisa) || 0;
      totalCash += Number(d.cash) || 0;
      totalTransfer += Number(d.transfer) || 0;
      totalQris += Number(d.qris) || 0;
      totalJumlah += Number(d.jumlah) || 0;
      totalSetoran += Number(d.totalBayarDiterima) || 0;
      totalGaji += Number(d.gaji) || 0;
      totalBonus += Number(d.bonus) || 0;
      totalGajiPlusBonus += Number(d.total) || 0;
      totalLembur += Number(d.lembur) || 0;
      grandTotalHonor += Number(d.grandTotalGaji) || 0;
    }
  }

  return {
    totalMasuk,
    totalTerjual,
    totalSisa,
    totalCash,
    totalTransfer,
    totalQris,
    totalJumlah,
    totalSetoran,
    totalGaji,
    totalBonus,
    totalGajiPlusBonus,
    totalLembur,
    grandTotalHonor,
  };
};
