import { ItemKey, Order, OrderItems } from '../types';

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

export const calculateOrderTotal = (items: OrderItems, prices: Record<ItemKey, number>): number => {
  let total = 0;
  total += (items.bijian || 0) * (prices.bijian || 0);
  total += (items.box6 || 0) * (prices.box6 || 0);
  total += (items.box10 || 0) * (prices.box10 || 0);
  total += (items.box20 || 0) * (prices.box20 || 0);
  total += (items.hantr15 || 0) * (prices.hantr15 || 0);
  total += (items.hantr24 || 0) * (prices.hantr24 || 0);
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
