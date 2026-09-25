/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ActiveScreen, AppPreferences, Order, RombongId } from './types';
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
import {
  subscribeToOrders,
  subscribeToPreferences,
  createOrderInFirestore,
  updateOrderInFirestore,
  deleteOrderInFirestore,
  updatePaymentStatusInFirestore,
  savePreferencesInFirestore,
} from './services/orderService';

export default function App() {
  const [orders, setOrders] = useState<Order[]>(() => loadOrders());
  const [preferences, setPreferences] = useState<AppPreferences>(() => loadPreferences());
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('input');
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

  // Real-time Firestore subscriptions for cross-device sync
  useEffect(() => {
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
  }, []);

  // Keep selectedOrderForReceipt in sync if it is updated remotely by another device
  useEffect(() => {
    if (selectedOrderForReceipt) {
      const updated = orders.find((o) => o.id === selectedOrderForReceipt.id);
      if (updated) {
        setSelectedOrderForReceipt(updated);
      }
    }
  }, [orders, selectedOrderForReceipt?.id]);

  // Handler: Add new order from Gambar 1 (instantly synced to Firestore)
  const handleSaveNewOrder = async (orderData: Omit<Order, 'id' | 'createdAt'>) => {
    try {
      setIsSyncing(true);
      await createOrderInFirestore(orderData);
    } catch (err) {
      console.error('Failed to create order in Firestore:', err);
      // Local optimistic fallback
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
      setActiveScreen('data_pesanan');
    } catch (err) {
      console.error('Failed to update order in Firestore:', err);
      setOrders((prev) =>
        prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
      );
      setSelectedOrderForEdit(null);
      setActiveScreen('data_pesanan');
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
        setActiveScreen('data_pesanan');
      }
    } catch (err) {
      console.error('Failed to delete order in Firestore:', err);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      if (selectedOrderForEdit?.id === orderId) {
        setSelectedOrderForEdit(null);
        setActiveScreen('data_pesanan');
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

  // Switch between rombong views
  const handleSelectRombong = (rombongId: RombongId) => {
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

  // Safe fallback if user navigates to edit or receipt with no item selected
  const activeOrderForEdit = selectedOrderForEdit || orders[0];
  const activeOrderForReceipt = selectedOrderForReceipt || orders[0];

  return (
    <div className="min-h-screen bg-stone-200/80 flex flex-col font-sans text-stone-900">
      {/* Top Interactive Schema Guide & Frame Toggle */}
      <MockupGuideBar
        activeScreen={activeScreen}
        onNavigate={(screen) => setActiveScreen(screen)}
        isMobileFrame={isMobileFrame}
        onToggleFrame={() => setIsMobileFrame((prev) => !prev)}
      />

      {/* Main Container - Mobile Phone Frame on Desktop or Responsive */}
      <main className="flex-1 flex justify-center items-start sm:py-6 px-0 sm:px-4">
        <div
          className={`w-full bg-[#f4f7f5] min-h-[92vh] flex flex-col relative transition-all ${
            isMobileFrame
              ? 'max-w-[420px] sm:rounded-3xl sm:border-[8px] sm:border-stone-800 sm:shadow-2xl sm:overflow-hidden sm:ring-1 sm:ring-black/10'
              : 'max-w-2xl sm:rounded-xl sm:shadow-lg sm:border sm:border-stone-300'
          }`}
        >
          {/* Header */}
          <Header
            activeScreen={activeScreen}
            onNavigate={(s) => setActiveScreen(s)}
            referenceDateDisplay={formatIndoDateFull(referenceDate)}
            onChangeDateClick={() => setIsDateModalOpen(true)}
            isSyncing={isSyncing}
          />

          {/* Screen Content */}
          <div className="flex-1 overflow-y-auto">
            {activeScreen === 'input' && (
              <InputPesananView
                onSaveOrder={handleSaveNewOrder}
                onNavigate={(s) => setActiveScreen(s)}
                referenceDate={referenceDate}
              />
            )}

            {activeScreen === 'preference' && (
              <PreferenceView
                preferences={preferences}
                onSavePreferences={handleSavePreferences}
                onBack={() => setActiveScreen('input')}
              />
            )}

            {activeScreen === 'data_pesanan' && (
              <DataPesananView
                orders={orders}
                referenceDate={referenceDate}
                onEditOrder={handleEditOrder}
                onPrintReceipt={handlePrintReceipt}
                onDeleteOrder={handleDeleteOrder}
                onNavigate={(s) => setActiveScreen(s)}
              />
            )}

            {activeScreen === 'edit' && activeOrderForEdit && (
              <EditPesananView
                order={activeOrderForEdit}
                onUpdateOrder={handleUpdateOrder}
                onDeleteOrder={handleDeleteOrder}
                onBack={() => setActiveScreen('data_pesanan')}
              />
            )}

            {activeScreen === 'cetak_nota' && activeOrderForReceipt && (
              <CetakNotaView
                order={activeOrderForReceipt}
                preferences={preferences}
                onBack={() => setActiveScreen('data_pesanan')}
                onUpdatePaymentStatus={handleUpdatePaymentStatus}
              />
            )}

            {activeScreen === 'rombong1' && (
              <RombongView
                rombongId="rmb1"
                orders={orders}
                preferences={preferences}
                referenceDate={referenceDate}
                onEditOrder={handleEditOrder}
                onPrintReceipt={handlePrintReceipt}
                onDeleteOrder={handleDeleteOrder}
                onNavigate={(s) => setActiveScreen(s)}
                onSelectRombong={handleSelectRombong}
              />
            )}

            {activeScreen === 'rombong2' && (
              <RombongView
                rombongId="rmb2"
                orders={orders}
                preferences={preferences}
                referenceDate={referenceDate}
                onEditOrder={handleEditOrder}
                onPrintReceipt={handlePrintReceipt}
                onDeleteOrder={handleDeleteOrder}
                onNavigate={(s) => setActiveScreen(s)}
                onSelectRombong={handleSelectRombong}
              />
            )}

            {activeScreen === 'rombong3' && (
              <RombongView
                rombongId="rmb3"
                orders={orders}
                preferences={preferences}
                referenceDate={referenceDate}
                onEditOrder={handleEditOrder}
                onPrintReceipt={handlePrintReceipt}
                onDeleteOrder={handleDeleteOrder}
                onNavigate={(s) => setActiveScreen(s)}
                onSelectRombong={handleSelectRombong}
              />
            )}

            {activeScreen === 'rombong4' && (
              <RombongView
                rombongId="rmb4"
                orders={orders}
                preferences={preferences}
                referenceDate={referenceDate}
                onEditOrder={handleEditOrder}
                onPrintReceipt={handlePrintReceipt}
                onDeleteOrder={handleDeleteOrder}
                onNavigate={(s) => setActiveScreen(s)}
                onSelectRombong={handleSelectRombong}
              />
            )}
          </div>

          {/* Sticky Mobile Bottom Navigation */}
          <BottomNavBar
            activeScreen={activeScreen}
            onNavigate={(s) => setActiveScreen(s)}
            orderCount={orders.length}
          />
        </div>
      </main>

      {/* Date Reference Modal */}
      {isDateModalOpen && (
        <DateReferenceModal
          currentDate={referenceDate}
          onSave={handleChangeReferenceDate}
          onClose={() => setIsDateModalOpen(false)}
        />
      )}
    </div>
  );
}
