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
import { AppPreferences, Order } from '../types';
import { DEFAULT_PREFERENCES, INITIAL_ORDERS } from '../utils/storage';

const ORDERS_COLLECTION = 'orders';
const PREFS_COLLECTION = 'preferences';
const PREFS_DOC_ID = 'general';

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
