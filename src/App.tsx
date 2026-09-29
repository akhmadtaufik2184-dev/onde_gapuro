/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ActiveScreen, AppPreferences, Order, RombongId, UserRole } from './types';
import {
  loadOrders,
  loadPreferences,
  getSavedReferenceDate,
  saveReferenceDate,
  DEFAULT_PREFERENCES,
} from './utils/storage';
import { formatIndoDateFull, parseDateFromRaw } from './utils/format';
import { Header } from './components/Header';
import { InputPesananView } from './components/InputPesananView';
import { PreferenceView } from './components/PreferenceView';
import { DataPesananView } from './components/DataPesananView';
import { EditPesananView } from './components/EditPesananView';
import { CetakNotaView } from './components/CetakNotaView';
import { RombongView } from './components/RombongView';
import { BottomNavBar } from './components/BottomNavBar';
import { MockupGuideBar } from './components/MockupGuideBar';
import { DateReferenceModal } from './components/DateReferenceModal';
import { PortalLoginView } from './components/PortalLoginView';
import {
  subscribeToOrders,
  subscribeToPreferences,
  createOrderInFirestore,
  updateOrderInFirestore,
  deleteOrderInFirestore,
  updatePaymentStatusInFirestore,
  savePreferencesInFirestore,
} from './services/orderService';

const PORTAL_AUTH_KEY = 'gapuro_portal_authorized';
const PORTAL_ROLE_KEY = 'gapuro_portal_role';

export default function App() {
  // Sesi Login Portal & Role tersimpan permanen di perangkat (localStorage)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem(PORTAL_AUTH_KEY) === 'true';
  });

  const [userRole, setUserRole] = useState<UserRole>(() => {
    const savedRole = localStorage.getItem(PORTAL_ROLE_KEY);
    return (savedRole as UserRole) || 'admin';
  });

  const [orders, setOrders] = useState<Order[]>(() => loadOrders());
  const [preferences, setPreferences] = useState<AppPreferences>(() => loadPreferences());
  
  // Tentukan activeScreen berdasarkan role saat pertama kali dimuat
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>(() => {
    const savedRole = localStorage.getItem(PORTAL_ROLE_KEY) as UserRole | null;
    if (savedRole === 'rombong 1') return 'rombong1';
    if (savedRole === 'rombong 2') return 'rombong2';
    if (savedRole === 'rombong 3') return 'rombong3';
    if (savedRole === 'rombong 4') return 'rombong4';
    return 'input';
  });

  const [isSyncing, setIsSyncing] = useState<boolean>(true);
  
  // Specific order states for Edit (Gambar 4) and Cetak Nota (Gambar 5)
  const [selectedOrderForEdit, setSelectedOrderForEdit] = useState<Order | null>(null);
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState<Order | null>(null);

  // Reference date: defaults to 2026-09-28 (from mockup) or saved
  const [referenceDate, setReferenceDate] = useState<Date>(() => {
    const saved = getSavedReferenceDate();
    return parseDateFromRaw(saved);
  });

  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [isMobileFrame, setIsMobileFrame] = useState(true);

  // Real-time Firestore subscriptions for cross-device sync (hanya aktif bila terautentikasi)
  useEffect(() => {
    if (!isAuthenticated) return;

    setIsSyncing(true);

    // 1. Subscribe to orders in real-time
    const unsubscribeOrders = subscribeToOrders(
      (realtimeOrders) => {
        setOrders(realtimeOrders);
        setIsSyncing(false);
      },
      (err) => {
        console.error('Error in realtime orders subscription:', err);
        setIsSyncing(false);
      }
    );

    // 2. Subscribe to preferences (prices and phone) in real-time
    const unsubscribePrefs = subscribeToPreferences(
      (realtimePrefs) => {
        setPreferences(realtimePrefs);
      },
      (err) => {
        console.error('Error in realtime prefs subscription:', err);
      }
    );

    return () => {
      unsubscribeOrders();
      unsubscribePrefs();
    };
  }, [isAuthenticated]);

  // Keep selectedOrderForReceipt in sync if it is updated remotely by another device
  useEffect(() => {
    if (selectedOrderForReceipt) {
      const updated = orders.find((o) => o.id === selectedOrderForReceipt.id);
      if (updated) {
        setSelectedOrderForReceipt(updated);
      }
    }
  }, [orders, selectedOrderForReceipt?.id]);

  // Login handler dengan dukungan role (disimpan permanen di localStorage)
  const handleLoginSuccess = (role: UserRole) => {
    localStorage.setItem(PORTAL_AUTH_KEY, 'true');
    localStorage.setItem(PORTAL_ROLE_KEY, role);
    setUserRole(role);
    setIsAuthenticated(true);

    // Arahkan ke screen yang sesuai dengan role
    if (role === 'rombong 1') {
      setActiveScreen('rombong1');
    } else if (role === 'rombong 2') {
      setActiveScreen('rombong2');
    } else if (role === 'rombong 3') {
      setActiveScreen('rombong3');
    } else if (role === 'rombong 4') {
      setActiveScreen('rombong4');
    } else {
      setActiveScreen('input');
    }
  };

  // Logout handler
  const handleLogout = () => {
    if (window.confirm('Keluar dari portal?')) {
      localStorage.removeItem(PORTAL_AUTH_KEY);
      localStorage.removeItem(PORTAL_ROLE_KEY);
      setIsAuthenticated(false);
      setUserRole('admin');
    }
  };

  // Handler: Add new order from Gambar 1 (instantly synced to Firestore)
  const handleSaveNewOrder = async (orderData: Omit<Order, 'id' | 'createdAt'>) => {
    try {
      setIsSyncing(true);
      await createOrderInFirestore(orderData);
    } catch (err) {
      console.error('Failed to create order in Firestore:', err);
      const fallback: Order = {
        ...orderData,
        id: `ord-${Date.now().toString(36)}`,
        createdAt: Date.now(),
      };
      setOrders((prev) => [fallback, ...prev]);
    } finally {
      setIsSyncing(false);
    }
  };

  // Handler: Update order from Gambar 4 (instantly synced to Firestore)
  const handleUpdateOrder = async (updatedOrder: Order) => {
    try {
      setIsSyncing(true);
      await updateOrderInFirestore(updatedOrder);
      setSelectedOrderForEdit(null);
      // Kembali ke screen asal
      if (userRole === 'rombong 1') setActiveScreen('rombong1');
      else if (userRole === 'rombong 2') setActiveScreen('rombong2');
      else if (userRole === 'rombong 3') setActiveScreen('rombong3');
      else if (userRole === 'rombong 4') setActiveScreen('rombong4');
      else setActiveScreen('data_pesanan');
    } catch (err) {
      console.error('Failed to update order in Firestore:', err);
      setOrders((prev) =>
        prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
      );
      setSelectedOrderForEdit(null);
      if (userRole.startsWith('rombong')) {
        setActiveScreen(userRole === 'rombong 1' ? 'rombong1' : userRole === 'rombong 2' ? 'rombong2' : userRole === 'rombong 3' ? 'rombong3' : 'rombong4');
      } else {
        setActiveScreen('data_pesanan');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Handler: Delete order (instantly synced to Firestore)
  const handleDeleteOrder = async (orderId: string) => {
    try {
      setIsSyncing(true);
      await deleteOrderInFirestore(orderId);
      if (selectedOrderForEdit?.id === orderId) {
        setSelectedOrderForEdit(null);
        if (userRole.startsWith('rombong')) {
          setActiveScreen(userRole === 'rombong 1' ? 'rombong1' : userRole === 'rombong 2' ? 'rombong2' : userRole === 'rombong 3' ? 'rombong3' : 'rombong4');
        } else {
          setActiveScreen('data_pesanan');
        }
      }
    } catch (err) {
      console.error('Failed to delete order in Firestore:', err);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      if (selectedOrderForEdit?.id === orderId) {
        setSelectedOrderForEdit(null);
        if (userRole.startsWith('rombong')) {
          setActiveScreen(userRole === 'rombong 1' ? 'rombong1' : userRole === 'rombong 2' ? 'rombong2' : userRole === 'rombong 3' ? 'rombong3' : 'rombong4');
        } else {
          setActiveScreen('data_pesanan');
        }
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Handler: Save preferences from Gambar 2 (instantly synced to Firestore)
  const handleSavePreferences = async (newPrefs: AppPreferences) => {
    try {
      setIsSyncing(true);
      await savePreferencesInFirestore(newPrefs);
      setPreferences(newPrefs);
    } catch (err) {
      console.error('Failed to save preferences in Firestore:', err);
      setPreferences(newPrefs);
    } finally {
      setIsSyncing(false);
    }
  };

  // Handler: Trigger edit view (Gambar 4)
  const handleEditOrder = (order: Order) => {
    setSelectedOrderForEdit(order);
    setActiveScreen('edit');
  };

  // Handler: Trigger receipt view (Gambar 5)
  const handlePrintReceipt = (order: Order) => {
    setSelectedOrderForReceipt(order);
    setActiveScreen('cetak_nota');
  };

  // Handler: Update payment status from Cetak Nota (instantly synced to Firestore)
  const handleUpdatePaymentStatus = async (orderId: string, status: 'lunas' | 'belum') => {
    try {
      await updatePaymentStatusInFirestore(orderId, status);
    } catch (err) {
      console.error('Failed to update payment status in Firestore:', err);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, statusPembayaran: status } : o))
      );
    }
  };

  // Handler: Change reference date
  const handleChangeReferenceDate = (newDate: Date) => {
    setReferenceDate(newDate);
    const y = newDate.getFullYear();
    const m = String(newDate.getMonth() + 1).padStart(2, '0');
    const d = String(newDate.getDate()).padStart(2, '0');
    saveReferenceDate(`${y}-${m}-${d}`);
  };

  // Switch between rombong views (hanya untuk Admin)
  const handleSelectRombong = (rombongId: RombongId) => {
    if (userRole !== 'admin') return;
    switch (rombongId) {
      case 'rmb1':
        setActiveScreen('rombong1');
        break;
      case 'rmb2':
        setActiveScreen('rombong2');
        break;
      case 'rmb3':
        setActiveScreen('rombong3');
        break;
      case 'rmb4':
        setActiveScreen('rombong4');
        break;
    }
  };

  // Navigation guard untuk mencegah rombong berpindah ke screen admin
  const handleNavigate = (targetScreen: ActiveScreen) => {
    if (userRole.startsWith('rombong')) {
      // Role rombong HANYA boleh mengakses screen rombongnya sendiri, atau edit/cetak nota untuk pesanan rombongnya
      const allowedScreen =
        userRole === 'rombong 1' ? 'rombong1' :
        userRole === 'rombong 2' ? 'rombong2' :
        userRole === 'rombong 3' ? 'rombong3' : 'rombong4';

      if (targetScreen === 'edit' || targetScreen === 'cetak_nota') {
        setActiveScreen(targetScreen);
      } else {
        setActiveScreen(allowedScreen);
      }
      return;
    }

    setActiveScreen(targetScreen);
  };

  const isRombongRole = userRole.startsWith('rombong');
  const activeOrderForEdit = selectedOrderForEdit || orders[0];
  const activeOrderForReceipt = selectedOrderForReceipt || orders[0];

  return (
    <div className="min-h-screen bg-stone-200/80 flex flex-col font-sans text-stone-900">
      {/* Mockup Guide Bar: HANYA untuk Admin */}
      {isAuthenticated && userRole === 'admin' && (
        <MockupGuideBar
          activeScreen={activeScreen}
          onNavigate={handleNavigate}
          isMobileFrame={isMobileFrame}
          onToggleFrame={() => setIsMobileFrame((prev) => !prev)}
        />
      )}

      {/* Main Container */}
      <main className="flex-1 flex justify-center items-start sm:py-6 px-0 sm:px-4">
        <div
          className={`w-full bg-[#f4f7f5] min-h-[92vh] flex flex-col relative transition-all ${
            isMobileFrame
              ? 'max-w-[420px] sm:rounded-3xl sm:border-[8px] sm:border-stone-800 sm:shadow-2xl sm:overflow-hidden sm:ring-1 sm:ring-black/10'
              : 'max-w-2xl sm:rounded-xl sm:shadow-lg sm:border sm:border-stone-300'
          }`}
        >
          {/* TAMPILAN JIKA BELUM LOGIN: PORTAL UTAMA DENGAN KODE */}
          {!isAuthenticated ? (
            <PortalLoginView onLoginSuccess={handleLoginSuccess} />
          ) : (
            <>
              {/* Header */}
              <Header
                activeScreen={activeScreen}
                onNavigate={handleNavigate}
                referenceDateDisplay={formatIndoDateFull(referenceDate)}
                onChangeDateClick={userRole === 'admin' ? () => setIsDateModalOpen(true) : undefined}
                onLogout={handleLogout}
                userRole={userRole}
                isSyncing={isSyncing}
              />

              {/* Screen Content */}
              <div className="flex-1 overflow-y-auto">
                {/* 1. INPUT PESANAN (Hanya Admin) */}
                {activeScreen === 'input' && userRole === 'admin' && (
                  <InputPesananView
                    onSaveOrder={handleSaveNewOrder}
                    onNavigate={handleNavigate}
                    referenceDate={referenceDate}
                  />
                )}

                {/* 2. PREFERENCE (Hanya Admin) */}
                {activeScreen === 'preference' && userRole === 'admin' && (
                  <PreferenceView
                    preferences={preferences}
                    onSavePreferences={handleSavePreferences}
                    onBack={() => handleNavigate('input')}
                    onLogout={handleLogout}
                  />
                )}

                {/* 3. DATA PESANAN (Hanya Admin) */}
                {activeScreen === 'data_pesanan' && userRole === 'admin' && (
                  <DataPesananView
                    orders={orders}
                    referenceDate={referenceDate}
                    onEditOrder={handleEditOrder}
                    onPrintReceipt={handlePrintReceipt}
                    onDeleteOrder={handleDeleteOrder}
                    onNavigate={handleNavigate}
                  />
                )}

                {/* 4. EDIT PESANAN */}
                {activeScreen === 'edit' && activeOrderForEdit && (
                  <EditPesananView
                    order={activeOrderForEdit}
                    onUpdateOrder={handleUpdateOrder}
                    onDeleteOrder={userRole === 'admin' ? handleDeleteOrder : undefined}
                    onBack={() => {
                      if (userRole === 'rombong 1') handleNavigate('rombong1');
                      else if (userRole === 'rombong 2') handleNavigate('rombong2');
                      else if (userRole === 'rombong 3') handleNavigate('rombong3');
                      else if (userRole === 'rombong 4') handleNavigate('rombong4');
                      else handleNavigate('data_pesanan');
                    }}
                  />
                )}

                {/* 5. CETAK NOTA */}
                {activeScreen === 'cetak_nota' && activeOrderForReceipt && (
                  <CetakNotaView
                    order={activeOrderForReceipt}
                    preferences={preferences}
                    onBack={() => {
                      if (userRole === 'rombong 1') handleNavigate('rombong1');
                      else if (userRole === 'rombong 2') handleNavigate('rombong2');
                      else if (userRole === 'rombong 3') handleNavigate('rombong3');
                      else if (userRole === 'rombong 4') handleNavigate('rombong4');
                      else handleNavigate('data_pesanan');
                    }}
                    onUpdatePaymentStatus={handleUpdatePaymentStatus}
                  />
                )}

                {/* 6. ROMBONG 1 */}
                {(activeScreen === 'rombong1' || activeScreen === 'rombong 1') && (userRole === 'admin' || userRole === 'rombong 1') && (
                  <RombongView
                    rombongId="rmb1"
                    orders={orders}
                    preferences={preferences}
                    referenceDate={referenceDate}
                    onEditOrder={handleEditOrder}
                    onPrintReceipt={handlePrintReceipt}
                    onDeleteOrder={handleDeleteOrder}
                    onNavigate={handleNavigate}
                    onSelectRombong={handleSelectRombong}
                    isReadOnly={isRombongRole}
                  />
                )}

                {/* 7. ROMBONG 2 */}
                {(activeScreen === 'rombong2' || activeScreen === 'rombong 2') && (userRole === 'admin' || userRole === 'rombong 2') && (
                  <RombongView
                    rombongId="rmb2"
                    orders={orders}
                    preferences={preferences}
                    referenceDate={referenceDate}
                    onEditOrder={handleEditOrder}
                    onPrintReceipt={handlePrintReceipt}
                    onDeleteOrder={handleDeleteOrder}
                    onNavigate={handleNavigate}
                    onSelectRombong={handleSelectRombong}
                    isReadOnly={isRombongRole}
                  />
                )}

                {/* 8. ROMBONG 3 */}
                {(activeScreen === 'rombong3' || activeScreen === 'rombong 3') && (userRole === 'admin' || userRole === 'rombong 3') && (
                  <RombongView
                    rombongId="rmb3"
                    orders={orders}
                    preferences={preferences}
                    referenceDate={referenceDate}
                    onEditOrder={handleEditOrder}
                    onPrintReceipt={handlePrintReceipt}
                    onDeleteOrder={handleDeleteOrder}
                    onNavigate={handleNavigate}
                    onSelectRombong={handleSelectRombong}
                    isReadOnly={isRombongRole}
                  />
                )}

                {/* 9. ROMBONG 4 */}
                {(activeScreen === 'rombong4' || activeScreen === 'rombong 4') && (userRole === 'admin' || userRole === 'rombong 4') && (
                  <RombongView
                    rombongId="rmb4"
                    orders={orders}
                    preferences={preferences}
                    referenceDate={referenceDate}
                    onEditOrder={handleEditOrder}
                    onPrintReceipt={handlePrintReceipt}
                    onDeleteOrder={handleDeleteOrder}
                    onNavigate={handleNavigate}
                    onSelectRombong={handleSelectRombong}
                    isReadOnly={isRombongRole}
                  />
                )}
              </div>

              {/* Sticky Mobile Bottom Navigation: HANYA untuk Admin */}
              {!isRombongRole && (
                <BottomNavBar
                  activeScreen={activeScreen}
                  onNavigate={handleNavigate}
                  orderCount={orders.length}
                />
              )}
            </>
          )}
        </div>
      </main>

      {/* Date Reference Modal (Admin only) */}
      {isDateModalOpen && userRole === 'admin' && (
        <DateReferenceModal
          currentDate={referenceDate}
          onSave={handleChangeReferenceDate}
          onClose={() => setIsDateModalOpen(false)}
        />
      )}
    </div>
  );
}
