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
  catatan?: string;
  updatedAt: number; // timestamp ms
  updatedBy: string; // "Rombong 1" / "Admin"
  targetDate: string; // YYYY-MM-DD (misal untuk kebutuhan besok)
}

export interface AppPreferences {
  telp: string;
  prices: Record<ItemKey, number>;
}

export type ActiveScreen = 
  | 'input'        // gambar 1
  | 'preference'   // gambar 2
  | 'data_pesanan' // gambar 3
  | 'edit'         // gambar 4
  | 'cetak_nota'   // gambar 5
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
