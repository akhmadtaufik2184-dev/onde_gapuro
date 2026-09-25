import { AppPreferences, Order } from '../types';

export const DEFAULT_PREFERENCES: AppPreferences = {
  telp: '081998765433',
  prices: {
    bijian: 2500,
    box6: 15000,
    box10: 25000,
    box20: 50000,
    hantr15: 45000,
    hantr24: 70000,
  },
};

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-001',
    tanggalRaw: '2026-09-28',
    hariTanggalDisplay: 'senin, 28 Sept 2026',
    jam: '09:00',
    items: {
      bijian: 0,
      box6: 2,
      box10: 3,
      box20: 0,
      hantr15: 0,
      hantr24: 0,
    },
    nama: 'Bu Sholah',
    noHp: '081234567891',
    pengiriman: 'dikirim',
    alamatKirim: 'ke rumah',
    rombong: 'rmb1',
    statusPembayaran: 'belum',
    uangDibayar: 0,
    createdAt: 1790586000000,
  },
  {
    id: 'ord-002',
    tanggalRaw: '2026-09-30',
    hariTanggalDisplay: 'rabu, 30 Sept 2026',
    jam: '11:00',
    items: {
      bijian: 4,
      box6: 7,
      box10: 1,
      box20: 0,
      hantr15: 0,
      hantr24: 0,
    },
    nama: 'bagio',
    noHp: '085712349988',
    pengiriman: 'diambil',
    alamatKirim: '',
    rombong: 'rmb2',
    statusPembayaran: 'lunas',
    uangDibayar: 140000,
    createdAt: 1790766000000,
  },
  {
    id: 'ord-003',
    tanggalRaw: '2026-09-30',
    hariTanggalDisplay: 'rabu, 30 Sept 2026',
    jam: '12:00',
    items: {
      bijian: 0,
      box6: 0,
      box10: 10,
      box20: 0,
      hantr15: 0,
      hantr24: 0,
    },
    nama: 'bambang',
    noHp: '081399887766',
    pengiriman: 'dikirim',
    alamatKirim: 'jl rambutan 15 magersari indah wates',
    rombong: 'rmb1',
    statusPembayaran: 'lunas',
    uangDibayar: 250000,
    createdAt: 1790769600000,
  },
  {
    id: 'ord-004',
    tanggalRaw: '2026-10-01',
    hariTanggalDisplay: 'kamis, 1 okt 2026',
    jam: '08:00',
    items: {
      bijian: 0,
      box6: 0,
      box10: 0,
      box20: 0,
      hantr15: 0,
      hantr24: 1,
    },
    nama: 'edi',
    noHp: '087812903456',
    pengiriman: 'diambil',
    alamatKirim: '',
    rombong: 'rmb3',
    statusPembayaran: 'belum',
    uangDibayar: 0,
    createdAt: 1790841600000,
  },
  {
    id: 'ord-005',
    tanggalRaw: '2026-09-27',
    hariTanggalDisplay: 'Minggu, 27 Sept 2026',
    jam: '13:00',
    items: {
      bijian: 0,
      box6: 0,
      box10: 3,
      box20: 0,
      hantr15: 0,
      hantr24: 0,
    },
    nama: 'badri',
    noHp: '082199884433',
    pengiriman: 'diambil',
    alamatKirim: '',
    rombong: 'rmb1',
    statusPembayaran: 'lunas',
    uangDibayar: 75000,
    createdAt: 1790514000000,
  },
];

const ORDERS_KEY = 'gapuro_orders_v2';
const PREFS_KEY = 'gapuro_preferences_v2';
const DATE_REF_KEY = 'gapuro_simulated_date_v2';

export const loadOrders = (): Order[] => {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    if (!raw) {
      saveOrders(INITIAL_ORDERS);
      return INITIAL_ORDERS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_ORDERS;
  } catch {
    return INITIAL_ORDERS;
  }
};

export const saveOrders = (orders: Order[]): void => {
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } catch (err) {
    console.error('Failed to save orders to localStorage', err);
  }
};

export const loadPreferences = (): AppPreferences => {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) {
      savePreferences(DEFAULT_PREFERENCES);
      return DEFAULT_PREFERENCES;
    }
    const parsed = JSON.parse(raw);
    return {
      telp: parsed.telp || DEFAULT_PREFERENCES.telp,
      prices: {
        ...DEFAULT_PREFERENCES.prices,
        ...(parsed.prices || {}),
      },
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
};

export const savePreferences = (prefs: AppPreferences): void => {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch (err) {
    console.error('Failed to save preferences to localStorage', err);
  }
};

export const getSavedReferenceDate = (): string => {
  return localStorage.getItem(DATE_REF_KEY) || '2026-09-28';
};

export const saveReferenceDate = (dateStr: string): void => {
  localStorage.setItem(DATE_REF_KEY, dateStr);
};
