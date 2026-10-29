import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import { AppPreferences, Order, SupplyNeed, DailyReport } from '../types';
import { DEFAULT_PREFERENCES, INITIAL_ORDERS } from '../utils/storage';

const ORDERS_COLLECTION = 'orders';
const PREFS_COLLECTION = 'preferences';
const PREFS_DOC_ID = 'general';
const SUPPLY_NEEDS_COLLECTION = 'supply_needs';
const DAILY_REPORTS_COLLECTION = 'daily_reports';

/**
 * Real-time listener for orders collection across all devices
 */
export const subscribeToOrders = (
  onOrdersUpdated: (orders: Order[]) => void,
  onError?: (err: Error) => void
) => {
  const ordersRef = collection(db, ORDERS_COLLECTION);
  // Order by createdAt desc or order time
  const q = query(ordersRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    async (snapshot) => {
      // If Firestore is empty upon first load, seed with initial mock orders
      if (snapshot.empty) {
        console.log('Seeding initial orders to Firestore for real-time synchronization...');
        await seedInitialData();
        return;
      }

      const ordersList: Order[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        ordersList.push({
          id: docSnap.id,
          tanggalRaw: data.tanggalRaw || '',
          hariTanggalDisplay: data.hariTanggalDisplay || '',
          jam: data.jam || '09:00',
          items: {
            bijian: data.items?.bijian || 0,
            box6: data.items?.box6 || 0,
            box10: data.items?.box10 || 0,
            box20: data.items?.box20 || 0,
            hantr15: data.items?.hantr15 || 0,
            hantr24: data.items?.hantr24 || 0,
          },
          nama: data.nama || '',
          noHp: data.noHp || '',
          pengiriman: data.pengiriman || 'diambil',
          alamatKirim: data.alamatKirim || '',
          ongkir: data.ongkir || 0,
          rombong: data.rombong || 'rmb1',
          statusPembayaran: data.statusPembayaran || 'belum',
          uangDibayar: data.uangDibayar || 0,
          createdAt: data.createdAt || Date.now(),
        });
      });

      onOrdersUpdated(ordersList);
    },
    (error) => {
      console.error('Realtime orders error:', error);
      if (onError) onError(error);
    }
  );
};

/**
 * Real-time listener for preferences (phone number, prices)
 */
export const subscribeToPreferences = (
  onPrefsUpdated: (prefs: AppPreferences) => void,
  onError?: (err: Error) => void
) => {
  const prefDocRef = doc(db, PREFS_COLLECTION, PREFS_DOC_ID);

  return onSnapshot(
    prefDocRef,
    async (docSnap) => {
      if (!docSnap.exists()) {
        await setDoc(prefDocRef, DEFAULT_PREFERENCES);
        onPrefsUpdated(DEFAULT_PREFERENCES);
      } else {
        const data = docSnap.data();
        onPrefsUpdated({
          telp: data.telp || DEFAULT_PREFERENCES.telp,
          prices: {
            ...DEFAULT_PREFERENCES.prices,
            ...(data.prices || {}),
          },
          rombongSettings: {
            ...DEFAULT_PREFERENCES.rombongSettings,
            ...(data.rombongSettings || {}),
          },
        });
      }
    },
    (error) => {
      console.error('Realtime preferences error:', error);
      if (onError) onError(error);
    }
  );
};

/**
 * Save / Create new order in Firestore
 */
export const createOrderInFirestore = async (
  newOrder: Omit<Order, 'id' | 'createdAt'>
): Promise<string> => {
  const ordersRef = collection(db, ORDERS_COLLECTION);
  const newDocRef = doc(ordersRef);
  const orderWithMeta: Order = {
    ...newOrder,
    id: newDocRef.id,
    createdAt: Date.now(),
  };

  await setDoc(newDocRef, orderWithMeta);
  return newDocRef.id;
};

/**
 * Update existing order in Firestore
 */
export const updateOrderInFirestore = async (
  order: Order
): Promise<void> => {
  const docRef = doc(db, ORDERS_COLLECTION, order.id);
  await setDoc(docRef, order, { merge: true });
};

/**
 * Delete order in Firestore
 */
export const deleteOrderInFirestore = async (orderId: string): Promise<void> => {
  const docRef = doc(db, ORDERS_COLLECTION, orderId);
  await deleteDoc(docRef);
};

/**
 * Update payment status specifically (e.g. from receipt screen)
 */
export const updatePaymentStatusInFirestore = async (
  orderId: string,
  status: 'lunas' | 'belum'
): Promise<void> => {
  const docRef = doc(db, ORDERS_COLLECTION, orderId);
  await updateDoc(docRef, { statusPembayaran: status });
};

/**
 * Save preferences in Firestore
 */
export const savePreferencesInFirestore = async (
  prefs: AppPreferences
): Promise<void> => {
  const prefDocRef = doc(db, PREFS_COLLECTION, PREFS_DOC_ID);
  await setDoc(prefDocRef, prefs, { merge: true });
};

/**
 * Seed initial sample data to Firestore
 */
export const seedInitialData = async (): Promise<void> => {
  try {
    const batch = writeBatch(db);

    // Initial orders
    INITIAL_ORDERS.forEach((ord) => {
      const docRef = doc(db, ORDERS_COLLECTION, ord.id);
      batch.set(docRef, ord);
    });

    // Initial preferences
    const prefDocRef = doc(db, PREFS_COLLECTION, PREFS_DOC_ID);
    batch.set(prefDocRef, DEFAULT_PREFERENCES);

    await batch.commit();
    console.log('Sample data seeded to Firestore successfully.');
  } catch (err) {
    console.warn('Could not seed initial data:', err);
  }
};

/**
 * Real-time listener for Supply Needs (Kebutuhan Bahan dari setiap Rombong)
 */
export const subscribeToSupplyNeeds = (
  onSupplyNeedsUpdated: (needs: SupplyNeed[]) => void,
  onError?: (err: Error) => void
) => {
  const needsRef = collection(db, SUPPLY_NEEDS_COLLECTION);

  return onSnapshot(
    needsRef,
    (snapshot) => {
      const list: SupplyNeed[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          rombong: data.rombong,
          rombongName: data.rombongName || `Rombong ${data.rombong?.replace('rmb', '') || ''}`,
          kebutuhan: data.kebutuhan || '',
          updatedAt: data.updatedAt || Date.now(),
          updatedBy: data.updatedBy || '',
          targetDate: data.targetDate || '',
        });
      });
      onSupplyNeedsUpdated(list);
    },
    (error) => {
      console.error('Realtime supply needs error:', error);
      if (onError) onError(error);
    }
  );
};

/**
 * Save / Update Supply Need for a specific rombong
 */
export const saveSupplyNeedInFirestore = async (
  need: SupplyNeed
): Promise<void> => {
  const docRef = doc(db, SUPPLY_NEEDS_COLLECTION, need.id);
  await setDoc(docRef, need, { merge: true });
};

/**
 * Clear / Delete Supply Need for a rombong (misal saat reset atau setelah dipenuhi)
 */
export const clearSupplyNeedInFirestore = async (
  rombongId: string
): Promise<void> => {
  const docRef = doc(db, SUPPLY_NEEDS_COLLECTION, rombongId);
  await deleteDoc(docRef);
};

/**
 * Real-time listener for daily reports collection
 */
export const subscribeToDailyReports = (
  onReportsUpdated: (reports: DailyReport[]) => void,
  onError?: (err: Error) => void
) => {
  const reportsRef = collection(db, DAILY_REPORTS_COLLECTION);
  return onSnapshot(
    reportsRef,
    (snapshot) => {
      const list: DailyReport[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          rombong: data.rombong,
          hari: data.hari || '',
          tanggalRaw: data.tanggalRaw || '',
          tanggalDisplay: data.tanggalDisplay || '',
          stokMasuk: Number(data.stokMasuk) || 0,
          uraianTerjual: Array.isArray(data.uraianTerjual) ? data.uraianTerjual : [0, 0, 0, 0],
          terjual: Number(data.terjual) || 0,
          sisa: Number(data.sisa) || 0,
          harga: Number(data.harga) || 2500,
          cash: Number(data.cash) || 0,
          transfer: Number(data.transfer) || 0,
          qris: Number(data.qris) || 0,
          jumlah: Number(data.jumlah) || 0,
          totalBayarDiterima: Number(data.totalBayarDiterima) || 0,
          keterangan: data.keterangan || '',
          target: Number(data.target) || 70,
          gaji: Number(data.gaji) || 0,
          bonus: Number(data.bonus) || 0,
          total: Number(data.total) || 0,
          lembur: Number(data.lembur) || 0,
          grandTotalGaji: Number(data.grandTotalGaji) || 0,
          createdAt: data.createdAt || Date.now(),
          updatedAt: data.updatedAt || Date.now(),
          updatedBy: data.updatedBy || '',
        });
      });
      onReportsUpdated(list);
    },
    (error) => {
      console.error('Realtime daily reports error:', error);
      if (onError) onError(error);
    }
  );
};

/**
 * Save / Update Daily Report in Firestore
 */
export const saveDailyReportInFirestore = async (
  report: DailyReport
): Promise<void> => {
  const docRef = doc(db, DAILY_REPORTS_COLLECTION, report.id);
  await setDoc(docRef, report, { merge: true });
};

/**
 * Delete Daily Report in Firestore
 */
export const deleteDailyReportInFirestore = async (
  reportId: string
): Promise<void> => {
  const docRef = doc(db, DAILY_REPORTS_COLLECTION, reportId);
  await deleteDoc(docRef);
};

