import { AppPreferences, Order, SupplyNeed, DailyReport, DEFAULT_ROMBONG_SETTINGS } from '../types';

const ORDERS_KEY = 'gapuro_orders_v1';
const PREFS_KEY = 'gapuro_preferences_v1';
const DATE_REF_KEY = 'gapuro_reference_date';
const DATE_MODE_KEY = 'gapuro_date_mode';
const SUPPLY_NEEDS_KEY = 'gapuro_supply_needs_v1';
const DAILY_REPORTS_KEY = 'gapuro_daily_reports_v1';

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
  rombongSettings: DEFAULT_ROMBONG_SETTINGS,
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
    nama: 'Pak Haris',
    noHp: '082345678902',
    pengiriman: 'diambil',
    alamatKirim: '',
    rombong: 'rmb2',
    statusPembayaran: 'lunas',
    createdAt: 1790758800000,
  },
  {
    id: 'ord-003',
    tanggalRaw: '2026-09-29',
    hariTanggalDisplay: 'selasa, 29 Sept 2026',
    jam: '14:30',
    items: {
      bijian: 10,
      box6: 0,
      box10: 5,
      box20: 2,
      hantr15: 1,
      hantr24: 0,
    },
    nama: 'Ibu Ratna',
    noHp: '085678901234',
    pengiriman: 'dikirim',
    alamatKirim: 'Jl. Merdeka No. 12',
    rombong: 'rmb3',
    statusPembayaran: 'lunas',
    createdAt: 1790672400000,
  },
  {
    id: 'ord-004',
    tanggalRaw: '2026-09-28',
    hariTanggalDisplay: 'senin, 28 Sept 2026',
    jam: '16:00',
    items: {
      bijian: 0,
      box6: 4,
      box10: 2,
      box20: 1,
      hantr15: 0,
      hantr24: 1,
    },
    nama: 'Mas Doni',
    noHp: '087890123456',
    pengiriman: 'diambil',
    alamatKirim: '',
    rombong: 'rmb4',
    statusPembayaran: 'belum',
    uangDibayar: 50000,
    createdAt: 1790586000000,
  },
  {
    id: 'ord-005',
    tanggalRaw: '2026-09-28',
    hariTanggalDisplay: 'senin, 28 Sept 2026',
    jam: '10:00',
    items: {
      bijian: 0,
      box6: 5,
      box10: 0,
      box20: 0,
      hantr15: 0,
      hantr24: 0,
    },
    nama: 'Pak Joko',
    noHp: '081398765432',
    pengiriman: 'diambil',
    alamatKirim: '',
    rombong: 'rmb1',
    statusPembayaran: 'lunas',
    createdAt: 1790589600000,
  },
  {
    id: 'ord-006',
    tanggalRaw: '2026-09-28',
    hariTanggalDisplay: 'senin, 28 Sept 2026',
    jam: '13:00',
    items: {
      bijian: 0,
      box6: 0,
      box10: 4,
      box20: 0,
      hantr15: 0,
      hantr24: 0,
    },
    nama: 'Bu Dewi',
    noHp: '081234876543',
    pengiriman: 'dikirim',
    alamatKirim: 'Kantor BKD',
    rombong: 'rmb1',
    statusPembayaran: 'belum',
    uangDibayar: 0,
    createdAt: 1790600400000,
  },
];

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
      rombongSettings: {
        ...DEFAULT_PREFERENCES.rombongSettings,
        ...(parsed.rombongSettings || {}),
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

export const getDateMode = (): 'auto' | 'manual' => {
  try {
    const mode = localStorage.getItem(DATE_MODE_KEY);
    if (mode === 'manual') return 'manual';
    return 'auto'; // Default: otomatis selalu mengikuti tanggal hari ini
  } catch {
    return 'auto';
  }
};

export const setDateMode = (mode: 'auto' | 'manual'): void => {
  try {
    localStorage.setItem(DATE_MODE_KEY, mode);
  } catch (err) {
    console.error('Failed to save date mode to localStorage', err);
  }
};

export const getEffectiveDate = (): Date => {
  const mode = getDateMode();
  if (mode === 'auto') {
    return new Date();
  }
  const saved = localStorage.getItem(DATE_REF_KEY);
  // Bila nilai tersimpan adalah dummy 2026-09-28 dan mode bukan eksplisit manual, gunakan hari ini
  if (saved && saved !== '2026-09-28') {
    const parts = saved.split('-');
    if (parts.length === 3) {
      return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }
  }
  return new Date();
};

export const getSavedReferenceDate = (): string => {
  const mode = getDateMode();
  if (mode === 'auto') {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return localStorage.getItem(DATE_REF_KEY) || new Date().toISOString().split('T')[0];
};

export const saveReferenceDate = (dateStr: string): void => {
  try {
    localStorage.setItem(DATE_REF_KEY, dateStr);
  } catch (err) {
    console.error('Failed to save reference date to localStorage', err);
  }
};

export const loadLocalSupplyNeeds = (): SupplyNeed[] => {
  try {
    const raw = localStorage.getItem(SUPPLY_NEEDS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) || [];
  } catch {
    return [];
  }
};

export const saveLocalSupplyNeeds = (needs: SupplyNeed[]): void => {
  try {
    localStorage.setItem(SUPPLY_NEEDS_KEY, JSON.stringify(needs));
  } catch (err) {
    console.error('Failed to save supply needs to localStorage', err);
  }
};

export const loadLocalDailyReports = (): DailyReport[] => {
  try {
    const raw = localStorage.getItem(DAILY_REPORTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) || [];
  } catch {
    return [];
  }
};

export const saveLocalDailyReports = (reports: DailyReport[]): void => {
  try {
    localStorage.setItem(DAILY_REPORTS_KEY, JSON.stringify(reports));
  } catch (err) {
    console.error('Failed to save daily reports to localStorage', err);
  }
};
