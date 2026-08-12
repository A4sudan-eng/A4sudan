import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HomeView } from './components/HomeView';
import { NewOrderForm } from './components/NewOrderForm';
import { SheetsHub } from './components/SheetsHub';
import { OrderTracker } from './components/OrderTracker';
import { AdminDashboard } from './components/AdminDashboard';
import { ApkDownloadModal } from './components/ApkDownloadModal';
import { AuthModal } from './components/AuthModal';
import { Footer } from './components/Footer';
import { PrintOrder, PricingRates, PrintFileOptions, OrderStatus, StudySheet, Coupon } from './types';
import { DEFAULT_PRICING_RATES, INITIAL_ORDERS, SAMPLE_STUDY_SHEETS, INITIAL_COUPONS } from './data/initialData';
import { 
  saveOrderToCloud, 
  updateOrderInCloud, 
  deleteOrderFromCloud, 
  subscribeToCloudOrders, 
  getOrdersFromCloud, 
  subscribeToAuthState, 
  processPendingCloudOrdersQueue,
  saveSheetToCloud,
  deleteSheetFromCloud,
  getSheetsFromCloud,
  subscribeToCloudSheets
} from './lib/firebase';
import { User } from 'firebase/auth';

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'order' | 'sheets' | 'track' | 'admin'>('sheets');
  const [rates, setRates] = useState<PricingRates>(DEFAULT_PRICING_RATES);
  const [orders, setOrders] = useState<PrintOrder[]>(INITIAL_ORDERS);
  const [sheets, setSheets] = useState<StudySheet[]>(() => {
    try {
      const raw = localStorage.getItem('a4_sheets');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return SAMPLE_STUDY_SHEETS;
  });
  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    try {
      const raw = localStorage.getItem('a4_coupons');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return INITIAL_COUPONS;
  });
  const [preloadedFiles, setPreloadedFiles] = useState<Partial<PrintFileOptions>[]>([]);
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Subscribe to Firebase Auth state
  useEffect(() => {
    const unsubscribe = subscribeToAuthState((user) => {
      setCurrentUser(user);
      if (user) {
        // Automatically sync local orders to user cloud profile
        try {
          const raw = localStorage.getItem('a4_orders');
          if (raw) {
            const localOrders: PrintOrder[] = JSON.parse(raw);
            localOrders.forEach(o => {
              if (o && o.id) {
                saveOrderToCloud({ 
                  ...o, 
                  userId: user.uid, 
                  customerEmail: o.customerEmail || user.email || undefined 
                });
              }
            });
          }
        } catch (e) {}
        fetchOrders();
      }
    });
    return () => unsubscribe();
  }, []);

  // Capture Chrome Android PWA Installation Prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Fetch initial pricing & initialize orders from Cloud Firestore, localStorage and backend
  const fetchOrders = async () => {
    try {
      let localOrders: PrintOrder[] = [];
      try {
        const raw = localStorage.getItem('a4_orders');
        if (raw) localOrders = JSON.parse(raw);
      } catch (e) {}

      // Fetch from Cloud Firestore and backend API simultaneously in parallel
      const [cloudRes, serverRes] = await Promise.allSettled([
        getOrdersFromCloud(),
        fetch('/api/orders').then(res => res.ok ? res.json() : [])
      ]);

      const cloudOrders: PrintOrder[] = cloudRes.status === 'fulfilled' && Array.isArray(cloudRes.value) ? cloudRes.value : [];
      const serverOrders: PrintOrder[] = serverRes.status === 'fulfilled' && Array.isArray(serverRes.value) ? serverRes.value : [];

      // Sync local orders batch to server if available
      if (localOrders.length > 0) {
        fetch('/api/orders/batch-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orders: localOrders }),
        }).catch(() => {});
      }

      setOrders(prev => {
        const map = new Map<string, PrintOrder>();

        // 1. Populate from prev React state
        prev.forEach((o: PrintOrder) => { if (o && o.id) map.set(o.id, o); });

        // 2. Populate/merge from localOrders
        localOrders.forEach((o: PrintOrder) => {
          if (o && o.id) {
            const existing = map.get(o.id);
            if (!existing) {
              map.set(o.id, o);
            } else {
              map.set(o.id, {
                ...existing,
                ...o,
                files: (o.files && o.files.length > 0) ? o.files : existing.files,
              });
            }
          }
        });

        // 3. Populate/merge from serverOrders (Cross-device Server Source of Truth)
        serverOrders.forEach((o: PrintOrder) => {
          if (o && o.id) {
            const existing = map.get(o.id);
            if (!existing) {
              map.set(o.id, o);
            } else {
              map.set(o.id, {
                ...existing,
                ...o,
                files: (o.files && o.files.length > 0) ? o.files : existing.files,
                bankakProofUrl: o.bankakProofUrl || existing.bankakProofUrl,
              });
            }
          }
        });

        // 4. Merge Cloud Firestore orders (HIGHEST PRIORITY SOURCE OF TRUTH)
        cloudOrders.forEach((o: PrintOrder) => {
          if (o && o.id) {
            const existing = map.get(o.id);
            if (!existing) {
              map.set(o.id, o);
            } else {
              map.set(o.id, {
                ...existing,
                ...o,
                files: (o.files && o.files.length > 0) ? o.files : existing.files,
                bankakProofUrl: o.bankakProofUrl || existing.bankakProofUrl,
              });
            }
          }
        });

        const merged = Array.from(map.values());
        merged.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

        try {
          localStorage.setItem('a4_orders', JSON.stringify(merged));
        } catch (err) {}

        return merged;
      });
    } catch (e) {
      console.error('Error fetching orders:', e);
    }
  };

  // Fetch initial study sheets from Cloud Firestore, localStorage and backend
  const fetchSheets = async () => {
    try {
      let localSheets: StudySheet[] = [];
      try {
        const raw = localStorage.getItem('a4_sheets');
        if (raw) localSheets = JSON.parse(raw);
      } catch (e) {}

      // Fetch simultaneously from Cloud Firestore and Backend API
      const [cloudRes, serverRes] = await Promise.allSettled([
        getSheetsFromCloud(),
        fetch('/api/sheets').then(res => res.ok ? res.json() : [])
      ]);

      const cloudSheets: StudySheet[] = cloudRes.status === 'fulfilled' && Array.isArray(cloudRes.value) ? cloudRes.value : [];
      const serverSheets: StudySheet[] = serverRes.status === 'fulfilled' && Array.isArray(serverRes.value) ? serverRes.value : [];

      setSheets(prev => {
        const map = new Map<string, StudySheet>();

        // 1. Populate from SAMPLE_STUDY_SHEETS
        SAMPLE_STUDY_SHEETS.forEach(s => { if (s && s.id) map.set(s.id, s); });

        // 2. Populate/merge from prev state
        prev.forEach(s => { if (s && s.id) map.set(s.id, s); });

        // 3. Populate/merge from localSheets
        localSheets.forEach(s => { if (s && s.id) map.set(s.id, s); });

        // 4. Populate/merge from serverSheets
        serverSheets.forEach(s => { if (s && s.id) map.set(s.id, s); });

        // 5. Populate/merge from cloudSheets (Cloud Firestore - HIGHEST PRIORITY SOURCE OF TRUTH)
        cloudSheets.forEach(s => { if (s && s.id) map.set(s.id, s); });

        const merged = Array.from(map.values());
        try {
          localStorage.setItem('a4_sheets', JSON.stringify(merged));
        } catch (err) {}

        // If cloud Firestore has no sheets yet, seed initial sheets to cloud
        if (cloudSheets.length === 0 && merged.length > 0) {
          merged.forEach(sheet => {
            saveSheetToCloud(sheet).catch(() => {});
          });
        }

        return merged;
      });
    } catch (e) {
      console.error('Error fetching sheets:', e);
    }
  };

  useEffect(() => {
    try {
      const localOrders = localStorage.getItem('a4_orders');
      if (localOrders) {
        const parsed = JSON.parse(localOrders);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setOrders(parsed);
        } else {
          localStorage.setItem('a4_orders', JSON.stringify(INITIAL_ORDERS));
        }
      } else {
        localStorage.setItem('a4_orders', JSON.stringify(INITIAL_ORDERS));
      }
    } catch (e) {
      console.error('Error loading a4_orders from localStorage', e);
    }

    try {
      const localRates = localStorage.getItem('a4_pricing_rates');
      if (localRates) {
        const parsed = JSON.parse(localRates);
        if (parsed && parsed.bwPerPage && parsed.bwPerPage >= 200) {
          setRates(parsed);
        } else {
          // Upgrade old rates (< 200) to new rate standards
          const upgraded = { ...DEFAULT_PRICING_RATES, ...parsed, bwPerPage: Math.max(200, parsed?.bwPerPage || 200), colorPerPage: Math.max(500, parsed?.colorPerPage || 500) };
          setRates(upgraded);
          localStorage.setItem('a4_pricing_rates', JSON.stringify(upgraded));
        }
      } else {
        localStorage.setItem('a4_pricing_rates', JSON.stringify(DEFAULT_PRICING_RATES));
      }
    } catch (e) {
      console.error('Error loading pricing rates from localStorage', e);
    }

    fetch('/api/pricing')
      .then(res => res.json())
      .then(data => {
        if (data && data.bwPerPage) {
          const validRates = data.bwPerPage < 200 ? { ...DEFAULT_PRICING_RATES, ...data, bwPerPage: 200, colorPerPage: 500 } : data;
          setRates(validRates);
          try {
            localStorage.setItem('a4_pricing_rates', JSON.stringify(validRates));
          } catch (e) {}
        }
      })
      .catch(() => {});

    fetchOrders();
    fetchSheets();

    // Subscribe to real-time cloud orders from Firebase Firestore
    const unsubscribeCloudOrders = subscribeToCloudOrders((cloudOrders) => {
      if (Array.isArray(cloudOrders)) {
        setOrders(prev => {
          const map = new Map<string, PrintOrder>();
          // 1. Keep current state
          prev.forEach(o => { if (o && o.id) map.set(o.id, o); });
          // 2. Overwrite/merge with Firestore cloud orders
          cloudOrders.forEach(o => {
            if (o && o.id) {
              const existing = map.get(o.id);
              if (!existing) {
                map.set(o.id, o);
              } else {
                map.set(o.id, {
                  ...existing,
                  ...o,
                  files: (o.files && o.files.length > 0) ? o.files : existing.files,
                  bankakProofUrl: o.bankakProofUrl || existing.bankakProofUrl,
                });
              }
            }
          });
          const merged = Array.from(map.values());
          merged.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          try {
            localStorage.setItem('a4_orders', JSON.stringify(merged));
          } catch (e) {}
          return merged;
        });
      }
    });

    // Subscribe to real-time study sheets from Firebase Firestore
    const unsubscribeCloudSheets = subscribeToCloudSheets((cloudSheets) => {
      if (Array.isArray(cloudSheets) && cloudSheets.length > 0) {
        setSheets(cloudSheets);
        try {
          localStorage.setItem('a4_sheets', JSON.stringify(cloudSheets));
        } catch (e) {}
      }
    });

    // Auto-open APK download modal if link includes ?download_apk=true or ?apk=1 or hash #download-apk
    if (
      window.location.search.includes('download_apk') ||
      window.location.search.includes('apk=1') ||
      window.location.hash.includes('download-apk')
    ) {
      setIsApkModalOpen(true);
    }

    return () => {
      if (unsubscribeCloudOrders) unsubscribeCloudOrders();
      if (unsubscribeCloudSheets) unsubscribeCloudSheets();
    };
  }, []);

  // Auto refresh orders and sheets periodically every 3 seconds to instantly catch new client orders & sheets
  useEffect(() => {
    fetchOrders();
    fetchSheets();

    const interval = setInterval(() => {
      fetchOrders();
      fetchSheets();
    }, 3000);

    return () => clearInterval(interval);
  }, [currentView]);

  const handleOrderCreated = (newOrder: PrintOrder) => {
    // Save to user's personal order tracking list
    try {
      const myOrderIds: string[] = JSON.parse(localStorage.getItem('a4_my_order_ids') || '[]');
      if (!myOrderIds.includes(newOrder.id)) {
        myOrderIds.unshift(newOrder.id);
        localStorage.setItem('a4_my_order_ids', JSON.stringify(myOrderIds));
      }
      if (newOrder.customerPhone) {
        localStorage.setItem('a4_my_phone', newOrder.customerPhone);
      }
    } catch (e) {}

    setOrders(prev => {
      const existing = prev.some(o => o.id === newOrder.id);
      const updated = existing ? prev.map(o => o.id === newOrder.id ? newOrder : o) : [newOrder, ...prev];
      try {
        localStorage.setItem('a4_orders', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // Save to Firebase Cloud Firestore for instant cross-device Admin sync
    saveOrderToCloud(newOrder).catch(() => {});

    // POST to backend API for sync
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrder),
    }).catch(() => {});
  };

  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus, paymentStatus?: 'verified' | 'failed') => {
    setOrders(prev => {
      const updated = prev.map(o => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          status: newStatus,
          paymentStatus: paymentStatus || o.paymentStatus,
        };
      });
      try {
        localStorage.setItem('a4_orders', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // Sync with Firebase Cloud Firestore
    updateOrderInCloud(orderId, { status: newStatus, ...(paymentStatus ? { paymentStatus } : {}) }).catch(() => {});

    // Sync with backend API
    fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, paymentStatus }),
    }).catch(() => {});
  };

  const handleDeleteOrder = (orderId: string) => {
    setOrders(prev => {
      const updated = prev.filter(o => o.id !== orderId);
      try {
        localStorage.setItem('a4_orders', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // Delete from Firebase Cloud Firestore
    deleteOrderFromCloud(orderId).catch(() => {});

    // Sync with backend API
    fetch(`/api/orders/${orderId}`, {
      method: 'DELETE',
    }).catch(() => {});
  };

  const handleUpdateRates = (newRates: PricingRates) => {
    setRates(newRates);
    try {
      localStorage.setItem('a4_pricing_rates', JSON.stringify(newRates));
    } catch (e) {}
  };

  const handleAddSheet = (newSheet: StudySheet) => {
    setSheets(prev => {
      const updated = [newSheet, ...prev.filter(s => s.id !== newSheet.id)];
      try { localStorage.setItem('a4_sheets', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });

    // Save to Firebase Cloud Firestore for instant cross-device client sync
    saveSheetToCloud(newSheet).catch(() => {});

    // POST to backend API
    fetch('/api/sheets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSheet),
    }).catch(() => {});
  };

  const handleUpdateSheet = (updatedSheet: StudySheet) => {
    setSheets(prev => {
      const updated = prev.map(s => s.id === updatedSheet.id ? updatedSheet : s);
      try { localStorage.setItem('a4_sheets', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });

    // Save to Firebase Cloud Firestore for instant cross-device client sync
    saveSheetToCloud(updatedSheet).catch(() => {});

    // POST to backend API
    fetch('/api/sheets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedSheet),
    }).catch(() => {});
  };

  const handleDeleteSheet = (sheetId: string) => {
    setSheets(prev => {
      const updated = prev.filter(s => s.id !== sheetId);
      try { localStorage.setItem('a4_sheets', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });

    // Delete from Firebase Cloud Firestore
    deleteSheetFromCloud(sheetId).catch(() => {});

    // Sync with backend API
    fetch(`/api/sheets/${sheetId}`, {
      method: 'DELETE',
    }).catch(() => {});
  };

  const handleAddCoupon = (newCoupon: Coupon) => {
    setCoupons(prev => {
      const updated = [newCoupon, ...prev];
      try { localStorage.setItem('a4_coupons', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
  };

  const handleDeleteCoupon = (couponId: string) => {
    setCoupons(prev => {
      const updated = prev.filter(c => c.id !== couponId);
      try { localStorage.setItem('a4_coupons', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
  };

  const handleToggleCouponStatus = (couponId: string) => {
    setCoupons(prev => {
      const updated = prev.map(c => c.id === couponId ? { ...c, isActive: !c.isActive } : c);
      try { localStorage.setItem('a4_coupons', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
  };

  const handleSelectSheetForPrint = (options: Partial<PrintFileOptions> | Partial<PrintFileOptions>[]) => {
    setPreloadedFiles(Array.isArray(options) ? options : [options]);
    setCurrentView('order');
  };

  const getMyOrderIds = (): string[] => {
    try {
      const parsed = JSON.parse(localStorage.getItem('a4_my_order_ids') || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const myOrderIds = getMyOrderIds();
  const myPhone = (localStorage.getItem('a4_my_phone') || '').trim();

  const clientActiveOrders = orders.filter(o => {
    if (!o || o.status === 'completed' || o.status === 'cancelled') return false;
    const isAccountOrder = Boolean(currentUser) && (
      (Boolean(o.userId) && o.userId === currentUser?.uid) ||
      (Boolean(o.customerEmail) && Boolean(currentUser?.email) && o.customerEmail?.toLowerCase() === currentUser?.email?.toLowerCase())
    );
    const isOwn = isAccountOrder || 
      (myOrderIds.length > 0 && myOrderIds.includes(o.id)) ||
      (Boolean(myPhone) && o.customerPhone && o.customerPhone.trim() === myPhone);
    return isOwn;
  });

  const activeOrderCount = clientActiveOrders.length;

  return (
    <div className="min-h-screen bg-emerald-50/20 text-slate-900 font-sans flex flex-col justify-between dir-rtl text-right">
      <div>
        <Header
          currentView={currentView}
          setCurrentView={setCurrentView}
          activeOrderCount={activeOrderCount}
          onOpenApkModal={() => setIsApkModalOpen(true)}
          currentUser={currentUser}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
        />

        {/* Auth Modal */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          currentUser={currentUser}
          onAuthSuccess={fetchOrders}
        />

        {/* APK Download Modal */}
        <ApkDownloadModal
          isOpen={isApkModalOpen}
          onClose={() => setIsApkModalOpen(false)}
          deferredPrompt={deferredPrompt}
          setDeferredPrompt={setDeferredPrompt}
        />

        <main className="pb-12">
          {currentView === 'home' && (
            <HomeView
              onNavigateToSheets={() => setCurrentView('sheets')}
              onNavigateToTrack={() => setCurrentView('track')}
            />
          )}

          {currentView === 'order' && (
            <NewOrderForm
              rates={rates}
              coupons={coupons}
              onOrderCreated={handleOrderCreated}
              preloadedFiles={preloadedFiles}
            />
          )}

          {currentView === 'sheets' && (
            <SheetsHub
              sheets={sheets}
              onSelectSheetForPrint={handleSelectSheetForPrint}
              onAddSheet={handleAddSheet}
            />
          )}

          {currentView === 'track' && (
            <OrderTracker
              orders={orders}
              currentUser={currentUser}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
            />
          )}

          {currentView === 'admin' && (
            <AdminDashboard
              orders={orders}
              rates={rates}
              sheets={sheets}
              coupons={coupons}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onDeleteOrder={handleDeleteOrder}
              onUpdateRates={handleUpdateRates}
              onAddSheet={handleAddSheet}
              onUpdateSheet={handleUpdateSheet}
              onDeleteSheet={handleDeleteSheet}
              onAddCoupon={handleAddCoupon}
              onDeleteCoupon={handleDeleteCoupon}
              onToggleCouponStatus={handleToggleCouponStatus}
              onRefreshOrders={fetchOrders}
            />
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}
