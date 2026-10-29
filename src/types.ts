export type ItemKey = 'bijian' | 'box6' | 'box10' | 'box20' | 'hantr15' | 'hantr24';

export interface OrderItems {
  bijian: number;
  box6: number;
  box10: number;
  box20: number;
  hantr15: number;
  hantr24: number;
}

export type RombongId = 'rmb1' | 'rmb2' | 'rmb3' | 'rmb4';
export type DeliveryType = 'diambil' | 'dikirim';
export type PaymentStatus = 'lunas' | 'belum';

export type UserRole = 'admin' | 'rombong 1' | 'rombong 2' | 'rombong 3' | 'rombong 4';

export interface Order {
  id: string;
  tanggalRaw: string; // YYYY-MM-DD
  hariTanggalDisplay: string; // e.g., "senin, 28 Sept 2026"
  jam: string; // e.g., "09:00"
  items: OrderItems;
  nama: string; // an.
  noHp: string; // no. hp
  pengiriman: DeliveryType; // diambil / dikirim
  alamatKirim: string; // destination text if dikirim
  ongkir?: number; // ongkos kirim manual saat diantar/dikirim
  rombong: RombongId; // rmb1, rmb2, rmb3, rmb4
  statusPembayaran: PaymentStatus; // lunas / belum
  uangDibayar?: number; // optional payment amount / DP jika belum lunas
  catatan?: string;
  createdAt: number;
}

export interface SupplyNeed {
  id: string; // document id: e.g. "rmb1", "rmb2", "rmb3", "rmb4"
  rombong: RombongId;
  rombongName: string; // "Rombong 1", etc.
  kebutuhan: string; // deskripsi kebutuhan bahan, e.g. "Wijen 2kg, Kacang Ijo 3kg, Tepung Ketan 5 pack"
  updatedAt: number; // timestamp ms
  updatedBy: string; // "Rombong 1" / "Admin"
  targetDate: string; // YYYY-MM-DD (misal untuk kebutuhan besok)
}

export interface RombongConfig {
  harga: number; // Harga onde-onde per butir di rombong ini (default: 2500)
  target: number; // Target penjualan harian (Rombong 1 = 140, Rombong 2 = 70, Rombong 3 = 70, Rombong 4 = 70)
  gajiPokok?: number; // Default 50000
  bonusPerPcs?: number; // Default 200
}

export const DEFAULT_ROMBONG_SETTINGS: Record<RombongId, RombongConfig> = {
  rmb1: { harga: 2500, target: 140, gajiPokok: 50000, bonusPerPcs: 200 },
  rmb2: { harga: 2500, target: 70, gajiPokok: 50000, bonusPerPcs: 200 },
  rmb3: { harga: 2500, target: 70, gajiPokok: 50000, bonusPerPcs: 200 },
  rmb4: { harga: 2500, target: 70, gajiPokok: 50000, bonusPerPcs: 200 },
};

export interface AppPreferences {
  telp: string;
  prices: Record<ItemKey, number>;
  rombongSettings?: Record<RombongId, RombongConfig>;
}

export interface DailyReport {
  id: string; // e.g. "rmb1_2026-10-28"
  rombong: RombongId;
  hari: string; // e.g. "JUMAT"
  tanggalRaw: string; // "2026-10-23"
  tanggalDisplay: string; // "23-Okt-26"

  // STOK
  stokMasuk: number; // diisi pegawai
  uraianTerjual: number[]; // 4 kolom rincian terjual, e.g. [30, 20, 20, 0]
  terjual: number; // otomatis sum(uraianTerjual)
  sisa: number; // otomatis (stokMasuk - terjual)

  // PEMBAYARAN
  harga: number; // dari preference rombong (e.g. 2500)
  cash: number; // diisi pegawai
  transfer: number; // diisi pegawai
  qris: number; // diisi pegawai
  jumlah: number; // terjual * harga
  totalBayarDiterima: number; // cash + transfer + qris

  // KETERANGAN
  keterangan: string; // diisi pegawai

  // PENDAPATAN
  target: number; // dari preference rombong (e.g. 140 atau 70)
  gaji: number; // jika terjual >= target maka 50.000, jika tidak maka 50.000 - ((target - terjual) * 200)
  bonus: number; // jika terjual > target maka (terjual - target) * 200, jika tidak maka 0
  total: number; // gaji + bonus
  lembur: number; // diisi pegawai
  grandTotalGaji: number; // total + lembur

  createdAt: number;
  updatedAt: number;
  updatedBy?: string;
}

export interface DailyReportDayItem {
  hari: string; // "JUMAT", "SABTU", "MINGGU", "SENIN", "SELASA", "RABU", "KAMIS"
  tanggalRaw: string; // "2026-10-23"
  tanggalDisplay: string; // "23-Okt-26"
  stokMasuk: number;
  uraianTerjual: number[]; // 4 kolom uraian
  terjual: number;
  sisa: number;
  harga: number;
  cash: number;
  transfer: number;
  qris: number;
  jumlah: number;
  totalBayarDiterima: number;
  isSelisih: boolean;
  keterangan: string;
  target: number;
  gaji: number;
  bonus: number;
  total: number;
  lembur: number;
  grandTotalGaji: number;
  isFilled: boolean;
}

export interface WeeklyReport {
  id: string; // e.g. "rmb2_2026-10-23_sd_2026-10-29"
  rombong: RombongId;
  startDateRaw: string; // Hari Jumat (e.g. "2026-10-23")
  endDateRaw: string; // Hari Kamis (e.g. "2026-10-29")
  periodLabel: string; // e.g. "23 Okt 2026 - 29 Okt 2026 (Jumat - Kamis)"
  status: 'aktif' | 'selesai';
  days: DailyReportDayItem[]; // 7 hari: [Jumat, Sabtu, Minggu, Senin, Selasa, Rabu, Kamis]

  // Totals for the 1-week period
  totalMasuk: number;
  totalTerjual: number;
  totalSisa: number;
  totalCash: number;
  totalTransfer: number;
  totalQris: number;
  totalJumlah: number; // Total Omset 1 Minggu
  totalSetoran: number; // Total Uang Masuk (Cash + Transfer + QRIS)
  totalGaji: number;
  totalBonus: number;
  totalGajiPlusBonus: number;
  totalLembur: number;
  grandTotalHonor: number; // Total Honor yang diserahkan ke karyawan di Hari Kamis

  createdAt: number;
  updatedAt: number;
  updatedBy?: string;
}

export type ActiveScreen = 
  | 'input'        // gambar 1
  | 'preference'   // gambar 2
  | 'data_pesanan' // gambar 3
  | 'edit'         // gambar 4
  | 'cetak_nota'   // gambar 5
  | 'laporan_harian' // Laporan Penjualan Harian Rombong + Download PDF
  | 'rombong1'     // gambar 6
  | 'rombong 1'    // alias
  | 'rombong2'     // gambar 7
  | 'rombong 2'    // alias
  | 'rombong3'     // gambar 8
  | 'rombong 3'    // alias
  | 'rombong4'     // gambar 9
  | 'rombong 4';   // alias

export const ITEM_LABELS: Record<ItemKey, string> = {
  bijian: 'bijian',
  box6: 'box 6',
  box10: 'box 10',
  box20: 'box 20',
  hantr15: 'hantr 15',
  hantr24: 'hantr 24',
};

export const ITEM_FULL_NAMES: Record<ItemKey, string> = {
  bijian: 'Onde-Onde Satuan (biji)',
  box6: 'Onde-Onde Box 6',
  box10: 'Onde-Onde Box 10',
  box20: 'Onde-Onde Box 20',
  hantr15: 'Onde-Onde Hantaran 15',
  hantr24: 'Onde-Onde Hantaran 24',
};

export const ROMBONG_NAMES: Record<RombongId, string> = {
  rmb1: 'rombong 1',
  rmb2: 'rombong 2',
  rmb3: 'rombong 3',
  rmb4: 'rombong 4',
};
