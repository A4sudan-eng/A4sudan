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
import { DEFAULT_PRICING_RATES, INITIAL_ORDERS, SAMPLE_STUDY_SHEETS, INITIAL_COUPONS, getStoredDeletedIds, saveStoredDeletedId, getStoredDeletedSheetIds, saveStoredDeletedSheetId, removeStoredDeletedSheetId, getStoredSheets, getCanonicalSheetPrice } from './data/initialData';
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
  subscribeToCloudSheets,
  getDeletedIdsFromCloud,
  recordDeletedOrderIdInCloud,
  recordDeletedSheetIdInCloud,
  getDeletedSheetIdsFromCloud,
  batchSaveSheetsToCloud,
  getUniversitiesFromCloud,
  subscribeToCloudUniversities,
  saveUniversitiesToCloud,
  getAcademicLevelsFromCloud,
  subscribeToCloudAcademicLevels,
  saveAcademicLevelsToCloud,
  subscribeToCloudDegreeTracks,
  savePricingRatesToCloud,
  getPricingRatesFromCloud,
  subscribeToCloudPricingRates,
  saveCouponsToCloud,
  getCouponsFromCloud,
  subscribeToCloudCoupons
} from './lib/firebase';
import { getStoredUniversities, saveStoredUniversities, getStoredAcademicLevels, saveStoredAcademicLevels } from './data/neelainData';
import { recordVisit } from './utils/analyticsTracker';
import { User } from 'firebase/auth';

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'order' | 'sheets' | 'track' | 'admin'>('sheets');
  const [rates, setRates] = useState<PricingRates>(DEFAULT_PRICING_RATES);
  const [orders, setOrders] = useState<PrintOrder[]>(INITIAL_ORDERS);
  const [sheets, setSheets] = useState<StudySheet[]>(() => getStoredSheets());
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

  // Record visitor analytics on page navigation
  useEffect(() => {
    recordVisit({ path: currentView });
  }, [currentView]);

  // Deleted IDs Tombstone Set (Synchronized across Cloud Firestore, server and all browser tabs)
  const [deletedIds, setDeletedIds] = useState<Set<string>>(() => {
    return new Set(getStoredDeletedIds().map(id => id.toLowerCase()));
  });

  // Fetch initial pricing & initialize orders from Cloud Firestore, localStorage and backend
  const fetchOrders = async () => {
    try {
      // 1. Fetch current deleted IDs from cloud & server to guarantee synchronization
      const [cloudDeletedIdsRes, serverDeletedIdsRes] = await Promise.allSettled([
        getDeletedIdsFromCloud(),
        fetch('/api/deleted-ids').then(res => res.ok ? res.json() : [])
      ]);

      const cloudDeletedIds: string[] = cloudDeletedIdsRes.status === 'fulfilled' && Array.isArray(cloudDeletedIdsRes.value) ? cloudDeletedIdsRes.value : [];
      const serverDeletedIds: string[] = serverDeletedIdsRes.status === 'fulfilled' && Array.isArray(serverDeletedIdsRes.value) ? serverDeletedIdsRes.value : [];
      
      const combinedDeleted = new Set<string>([
        ...getStoredDeletedIds().map(id => id.toLowerCase()),
        ...cloudDeletedIds.map(id => id.toLowerCase()),
        ...serverDeletedIds.map(id => id.toLowerCase()),
      ]);

      setDeletedIds(combinedDeleted);

      let localOrders: PrintOrder[] = [];
      try {
        const raw = localStorage.getItem('a4_orders');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            localOrders = parsed.filter(o => o && o.id && !combinedDeleted.has(o.id.toLowerCase()) && !o.deletedAt);
          }
        }
      } catch (e) {}

      // Fetch from Cloud Firestore and backend API simultaneously in parallel
      const [cloudRes, serverRes] = await Promise.allSettled([
        getOrdersFromCloud(),
        fetch('/api/orders').then(res => res.ok ? res.json() : [])
      ]);

      const rawCloudOrders: PrintOrder[] = cloudRes.status === 'fulfilled' && Array.isArray(cloudRes.value) ? cloudRes.value : [];
      const rawServerOrders: PrintOrder[] = serverRes.status === 'fulfilled' && Array.isArray(serverRes.value) ? serverRes.value : [];

      const cloudOrders = rawCloudOrders.filter(o => o && o.id && !combinedDeleted.has(o.id.toLowerCase()) && !o.deletedAt);
      const serverOrders = rawServerOrders.filter(o => o && o.id && !combinedDeleted.has(o.id.toLowerCase()) && !o.deletedAt);

      // Sync local active orders batch to server if available
      if (localOrders.length > 0) {
        fetch('/api/orders/batch-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orders: localOrders }),
        }).catch(() => {});
      }

      setOrders(prev => {
        const map = new Map<string, PrintOrder>();

        // 1. Populate from prev React state (filtering deleted)
        prev.forEach((o: PrintOrder) => { 
          if (o && o.id && !combinedDeleted.has(o.id.toLowerCase()) && !o.deletedAt) {
            map.set(o.id.toLowerCase(), o); 
          }
        });

        // 2. Populate/merge from localOrders
        localOrders.forEach((o: PrintOrder) => {
          if (o && o.id && !combinedDeleted.has(o.id.toLowerCase()) && !o.deletedAt) {
            const key = o.id.toLowerCase();
            const existing = map.get(key);
            if (!existing) {
              map.set(key, o);
            } else {
              map.set(key, {
                ...existing,
                ...o,
                files: (o.files && o.files.length > 0) ? o.files : existing.files,
              });
            }
          }
        });

        // 3. Populate/merge from serverOrders
        serverOrders.forEach((o: PrintOrder) => {
          if (o && o.id && !combinedDeleted.has(o.id.toLowerCase()) && !o.deletedAt) {
            const key = o.id.toLowerCase();
            const existing = map.get(key);
            if (!existing) {
              map.set(key, o);
            } else {
              map.set(key, {
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
          if (o && o.id && !combinedDeleted.has(o.id.toLowerCase()) && !o.deletedAt) {
            const key = o.id.toLowerCase();
            const existing = map.get(key);
            if (!existing) {
              map.set(key, o);
            } else {
              map.set(key, {
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

      // Fetch simultaneously from Cloud Firestore, Backend API, and Cloud Deleted Sheet IDs
      const [cloudRes, serverRes, cloudDeletedRes] = await Promise.allSettled([
        getSheetsFromCloud(),
        fetch('/api/sheets').then(res => res.ok ? res.json() : []),
        getDeletedSheetIdsFromCloud()
      ]);

      const cloudSheets: StudySheet[] = cloudRes.status === 'fulfilled' && Array.isArray(cloudRes.value) ? cloudRes.value : [];
      const serverSheets: StudySheet[] = serverRes.status === 'fulfilled' && Array.isArray(serverRes.value) ? serverRes.value : [];
      const cloudDeletedIds: string[] = cloudDeletedRes.status === 'fulfilled' && Array.isArray(cloudDeletedRes.value) ? cloudDeletedRes.value : [];

      const currentDeletedSheets = new Set<string>([
        ...getStoredDeletedSheetIds().map(id => id.toLowerCase()),
        ...cloudDeletedIds.map(id => id.toLowerCase())
      ]);

      setSheets(prev => {
        const map = new Map<string, StudySheet>();

        // 1. Populate from SAMPLE_STUDY_SHEETS (only non-deleted)
        SAMPLE_STUDY_SHEETS.forEach(s => { 
          if (s && s.id && !currentDeletedSheets.has(s.id.toLowerCase())) {
            map.set(s.id.toLowerCase(), s); 
          }
        });

        // 2. Populate/merge custom sheets from prev state (preserving user-created sheets)
        prev.forEach(s => { 
          if (s && s.id && !currentDeletedSheets.has(s.id.toLowerCase())) {
            map.set(s.id.toLowerCase(), { ...s, priceEstimate: getCanonicalSheetPrice(s) }); 
          }
        });

        // 3. Populate/merge from localSheets
        localSheets.forEach(s => { 
          if (s && s.id && !currentDeletedSheets.has(s.id.toLowerCase())) {
            map.set(s.id.toLowerCase(), { ...s, priceEstimate: getCanonicalSheetPrice(s) }); 
          }
        });

        // 4. Populate/merge from serverSheets
        serverSheets.forEach(s => { 
          if (s && s.id && !currentDeletedSheets.has(s.id.toLowerCase())) {
            map.set(s.id.toLowerCase(), { ...s, priceEstimate: getCanonicalSheetPrice(s) }); 
          }
        });

        // 5. Populate/merge from cloudSheets
        cloudSheets.forEach(s => { 
          if (s && s.id && !currentDeletedSheets.has(s.id.toLowerCase())) {
            map.set(s.id.toLowerCase(), { ...s, priceEstimate: getCanonicalSheetPrice(s) }); 
          }
        });

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
        if (parsed && typeof parsed.bwPerPage === 'number') {
          setRates({
            ...DEFAULT_PRICING_RATES,
            ...parsed,
            promoPaperPrice: parsed.promoPaperPrice ?? 99
          });
        } else {
          localStorage.setItem('a4_pricing_rates', JSON.stringify(DEFAULT_PRICING_RATES));
        }
      } else {
        localStorage.setItem('a4_pricing_rates', JSON.stringify(DEFAULT_PRICING_RATES));
      }
    } catch (e) {
      console.error('Error loading pricing rates from localStorage', e);
    }

    // Fetch initial pricing rates from Firebase Firestore (Global Cloud Source)
    getPricingRatesFromCloud().then(cloudRates => {
      if (cloudRates && typeof cloudRates.bwPerPage === 'number') {
        const valid = {
          ...DEFAULT_PRICING_RATES,
          ...cloudRates,
          promoPaperPrice: cloudRates.promoPaperPrice ?? 99
        };
        setRates(valid);
        try {
          localStorage.setItem('a4_pricing_rates', JSON.stringify(valid));
        } catch (e) {}
      }
    }).catch(() => {});

    fetch('/api/pricing')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && typeof data.bwPerPage === 'number') {
          const validRates = {
            ...DEFAULT_PRICING_RATES,
            ...data,
            promoPaperPrice: data.promoPaperPrice ?? 99
          };
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
          const currentDeleted = new Set<string>([
            ...getStoredDeletedIds().map(id => id.toLowerCase()),
          ]);

          const map = new Map<string, PrintOrder>();
          
          // Populate from cloudOrders (authoritative source) excluding deleted
          cloudOrders.forEach(o => {
            if (o && o.id && !currentDeleted.has(o.id.toLowerCase()) && !o.deletedAt) {
              map.set(o.id.toLowerCase(), o);
            }
          });

          // Also retain any pure local unsynced pending orders that are NOT deleted
          prev.forEach(o => {
            if (o && o.id && !currentDeleted.has(o.id.toLowerCase()) && !o.deletedAt) {
              const key = o.id.toLowerCase();
              if (!map.has(key)) {
                map.set(key, o);
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
      if (Array.isArray(cloudSheets)) {
        const currentDeleted = new Set<string>([
          ...getStoredDeletedSheetIds().map(id => id.toLowerCase()),
        ]);
        const validSheets = cloudSheets.filter(s => s && s.id && !currentDeleted.has(s.id.toLowerCase()));
        if (validSheets.length > 0) {
          setSheets(validSheets);
          try {
            localStorage.setItem('a4_sheets', JSON.stringify(validSheets));
          } catch (e) {}
        }
      }
    });

    // Listen for broadcast changes across browser tabs
    let sheetsBc: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        sheetsBc = new BroadcastChannel('a4_sheets_channel');
        sheetsBc.onmessage = (event) => {
          if (event.data?.type === 'SHEETS_BATCH_SAVED' || event.data?.type === 'SHEET_SAVED' || event.data?.type === 'SHEET_DELETED') {
            try {
              const raw = localStorage.getItem('a4_sheets');
              if (raw) setSheets(JSON.parse(raw));
            } catch (e) {}
          }
        };
      } catch (e) {}
    }

    // Fetch and sync Universities & Colleges across all devices
    getUniversitiesFromCloud().then((cloudUnis) => {
      if (cloudUnis && Array.isArray(cloudUnis) && cloudUnis.length > 0) {
        try {
          localStorage.setItem('a4_universities_data', JSON.stringify(cloudUnis));
          window.dispatchEvent(new CustomEvent('a4_universities_updated', { detail: cloudUnis }));
        } catch (e) {}
      } else {
        // Fetch from backend API
        fetch('/api/universities')
          .then(res => res.ok ? res.json() : null)
          .then(serverUnis => {
            if (serverUnis && Array.isArray(serverUnis) && serverUnis.length > 0) {
              try {
                localStorage.setItem('a4_universities_data', JSON.stringify(serverUnis));
                window.dispatchEvent(new CustomEvent('a4_universities_updated', { detail: serverUnis }));
              } catch (e) {}
            }
          })
          .catch(() => {});
      }
    }).catch(() => {});

    // Fetch and sync Academic Levels & Semesters across all devices
    getAcademicLevelsFromCloud().then((cloudLevels) => {
      if (cloudLevels && Array.isArray(cloudLevels) && cloudLevels.length > 0) {
        try {
          localStorage.setItem('a4_academic_levels_data', JSON.stringify(cloudLevels));
          window.dispatchEvent(new CustomEvent('a4_academic_levels_updated', { detail: cloudLevels }));
        } catch (e) {}
      } else {
        fetch('/api/academic-levels')
          .then(res => res.ok ? res.json() : null)
          .then(serverLevels => {
            if (serverLevels && Array.isArray(serverLevels) && serverLevels.length > 0) {
              try {
                localStorage.setItem('a4_academic_levels_data', JSON.stringify(serverLevels));
                window.dispatchEvent(new CustomEvent('a4_academic_levels_updated', { detail: serverLevels }));
              } catch (e) {}
            }
          })
          .catch(() => {});
      }
    }).catch(() => {});

    // Subscribe to real-time universities updates from Firebase Firestore
    const unsubscribeCloudUnis = subscribeToCloudUniversities((cloudUnis) => {
      if (cloudUnis && Array.isArray(cloudUnis) && cloudUnis.length > 0) {
        try {
          localStorage.setItem('a4_universities_data', JSON.stringify(cloudUnis));
          window.dispatchEvent(new CustomEvent('a4_universities_updated', { detail: cloudUnis }));
        } catch (e) {}
      }
    });

    // Subscribe to real-time academic levels updates from Firebase Firestore
    const unsubscribeCloudLevels = subscribeToCloudAcademicLevels((cloudLevels) => {
      if (cloudLevels && Array.isArray(cloudLevels) && cloudLevels.length > 0) {
        try {
          localStorage.setItem('a4_academic_levels_data', JSON.stringify(cloudLevels));
          window.dispatchEvent(new CustomEvent('a4_academic_levels_updated', { detail: cloudLevels }));
        } catch (e) {}
      }
    });

    // Subscribe to real-time degree tracks updates from Firebase Firestore
    const unsubscribeCloudDegreeTracks = (typeof subscribeToCloudDegreeTracks === 'function')
      ? subscribeToCloudDegreeTracks((cloudTracks) => {
          if (cloudTracks && Array.isArray(cloudTracks) && cloudTracks.length > 0) {
            try {
              localStorage.setItem('a4_degree_tracks_data', JSON.stringify(cloudTracks));
              window.dispatchEvent(new CustomEvent('a4_degree_tracks_updated', { detail: cloudTracks }));
            } catch (e) {}
          }
        })
      : null;

    // Subscribe to real-time pricing rates updates from Firebase Firestore (Global Sync across all clients)
    const unsubscribeCloudPricing = (typeof subscribeToCloudPricingRates === 'function')
      ? subscribeToCloudPricingRates((cloudRates) => {
          if (cloudRates && cloudRates.bwPerPage) {
            const valid = {
              ...DEFAULT_PRICING_RATES,
              ...cloudRates,
              promoPaperPrice: cloudRates.promoPaperPrice ?? 99
            };
            setRates(valid);
            try {
              localStorage.setItem('a4_pricing_rates', JSON.stringify(valid));
            } catch (e) {}
          }
        })
      : null;

    // Subscribe to real-time coupons updates from Firebase Firestore
    const unsubscribeCloudCoupons = (typeof subscribeToCloudCoupons === 'function')
      ? subscribeToCloudCoupons((cloudCoupons) => {
          if (cloudCoupons && Array.isArray(cloudCoupons) && cloudCoupons.length > 0) {
            setCoupons(cloudCoupons);
            try {
              localStorage.setItem('a4_coupons', JSON.stringify(cloudCoupons));
            } catch (e) {}
          }
        })
      : null;

    // Initial fetch of coupons from server
    fetch('/api/coupons')
      .then(res => res.ok ? res.json() : [])
      .then((serverCoupons: Coupon[]) => {
        if (Array.isArray(serverCoupons) && serverCoupons.length > 0) {
          setCoupons(serverCoupons);
          try { localStorage.setItem('a4_coupons', JSON.stringify(serverCoupons)); } catch (e) {}
        }
      })
      .catch(() => {});

    // BroadcastChannel listener for instant cross-tab order deletion and creation
    let broadcastChannel: BroadcastChannel | null = null;
    let universitiesBroadcastChannel: BroadcastChannel | null = null;
    let academicLevelsBroadcastChannel: BroadcastChannel | null = null;
    let degreeTracksBroadcastChannel: BroadcastChannel | null = null;
    let ratesBroadcastChannel: BroadcastChannel | null = null;
    let couponsBroadcastChannel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        broadcastChannel = new BroadcastChannel('a4_orders_channel');
        broadcastChannel.onmessage = (event) => {
          if (event && event.data) {
            const { type, orderId } = event.data;
            if ((type === 'ORDER_DELETED' || type === 'ORDER_MOVED_TO_TRASH' || type === 'ORDER_PERMANENTLY_DELETED') && orderId) {
              const lowerId = String(orderId).toLowerCase();
              setDeletedIds(prev => new Set([...prev, lowerId]));
              saveStoredDeletedId(orderId);
              setOrders(prev => {
                const updated = prev.filter(o => o.id.toLowerCase() !== lowerId);
                try {
                  localStorage.setItem('a4_orders', JSON.stringify(updated));
                } catch (e) {}
                return updated;
              });
            } else if (type === 'ORDER_SAVED' || type === 'ORDER_RESTORED') {
              fetchOrders();
            }
          }
        };
      } catch (e) {}

      try {
        universitiesBroadcastChannel = new BroadcastChannel('a4_universities_channel');
        universitiesBroadcastChannel.onmessage = (event) => {
          if (event?.data?.type === 'UNIVERSITIES_UPDATED' && Array.isArray(event?.data?.list)) {
            try {
              localStorage.setItem('a4_universities_data', JSON.stringify(event.data.list));
              window.dispatchEvent(new CustomEvent('a4_universities_updated', { detail: event.data.list }));
            } catch (e) {}
          }
        };
      } catch (e) {}

      try {
        academicLevelsBroadcastChannel = new BroadcastChannel('a4_academic_levels_channel');
        academicLevelsBroadcastChannel.onmessage = (event) => {
          if (event?.data?.type === 'ACADEMIC_LEVELS_UPDATED' && Array.isArray(event?.data?.list)) {
            try {
              localStorage.setItem('a4_academic_levels_data', JSON.stringify(event.data.list));
              window.dispatchEvent(new CustomEvent('a4_academic_levels_updated', { detail: event.data.list }));
            } catch (e) {}
          }
        };
      } catch (e) {}

      try {
        degreeTracksBroadcastChannel = new BroadcastChannel('a4_degree_tracks_channel');
        degreeTracksBroadcastChannel.onmessage = (event) => {
          if (event?.data?.type === 'DEGREE_TRACKS_UPDATED' && Array.isArray(event?.data?.list)) {
            try {
              localStorage.setItem('a4_degree_tracks_data', JSON.stringify(event.data.list));
              window.dispatchEvent(new CustomEvent('a4_degree_tracks_updated', { detail: event.data.list }));
            } catch (e) {}
          }
        };
      } catch (e) {}

      try {
        ratesBroadcastChannel = new BroadcastChannel('a4_rates_channel');
        ratesBroadcastChannel.onmessage = (event) => {
          if (event?.data?.type === 'RATES_UPDATED' && event?.data?.rates) {
            const updated = {
              ...DEFAULT_PRICING_RATES,
              ...event.data.rates,
              promoPaperPrice: event.data.rates.promoPaperPrice ?? 99
            };
            setRates(updated);
            try {
              localStorage.setItem('a4_pricing_rates', JSON.stringify(updated));
            } catch (e) {}
          }
        };
      } catch (e) {}
      try {
        couponsBroadcastChannel = new BroadcastChannel('a4_coupons_channel');
        couponsBroadcastChannel.onmessage = (event) => {
          if (event?.data?.type === 'COUPONS_UPDATED' && Array.isArray(event?.data?.coupons)) {
            setCoupons(event.data.coupons);
            try {
              localStorage.setItem('a4_coupons', JSON.stringify(event.data.coupons));
            } catch (e) {}
          }
        };
      } catch (e) {}
    }

    // CustomEvent and Storage listener for instant cross-component updates
    const handleRatesUpdatedEvent = (e: any) => {
      if (e?.detail && typeof e.detail.bwPerPage === 'number') {
        const updated = {
          ...DEFAULT_PRICING_RATES,
          ...e.detail,
          promoPaperPrice: e.detail.promoPaperPrice ?? 99
        };
        setRates(updated);
      }
    };
    window.addEventListener('a4_pricing_rates_updated', handleRatesUpdatedEvent);

    const handleCouponsUpdatedEvent = (e: any) => {
      if (e?.detail && Array.isArray(e.detail)) {
        setCoupons(e.detail);
      }
    };
    window.addEventListener('a4_coupons_updated', handleCouponsUpdatedEvent);

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'a4_pricing_rates' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed && typeof parsed.bwPerPage === 'number') {
            setRates({
              ...DEFAULT_PRICING_RATES,
              ...parsed,
              promoPaperPrice: parsed.promoPaperPrice ?? 99
            });
          }
        } catch (err) {}
      } else if (e.key === 'a4_coupons' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setCoupons(parsed);
          }
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorageEvent);

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
      if (unsubscribeCloudUnis) unsubscribeCloudUnis();
      if (unsubscribeCloudLevels) unsubscribeCloudLevels();
      if (unsubscribeCloudDegreeTracks) unsubscribeCloudDegreeTracks();
      if (unsubscribeCloudPricing) unsubscribeCloudPricing();
      if (unsubscribeCloudCoupons) unsubscribeCloudCoupons();
      window.removeEventListener('a4_pricing_rates_updated', handleRatesUpdatedEvent);
      window.removeEventListener('a4_coupons_updated', handleCouponsUpdatedEvent);
      window.removeEventListener('storage', handleStorageEvent);
      if (broadcastChannel) {
        try { broadcastChannel.close(); } catch (e) {}
      }
      if (universitiesBroadcastChannel) {
        try { universitiesBroadcastChannel.close(); } catch (e) {}
      }
      if (academicLevelsBroadcastChannel) {
        try { academicLevelsBroadcastChannel.close(); } catch (e) {}
      }
      if (degreeTracksBroadcastChannel) {
        try { degreeTracksBroadcastChannel.close(); } catch (e) {}
      }
      if (ratesBroadcastChannel) {
        try { ratesBroadcastChannel.close(); } catch (e) {}
      }
      if (couponsBroadcastChannel) {
        try { couponsBroadcastChannel.close(); } catch (e) {}
      }
    };
  }, []);

  // Auto refresh orders, sheets, and coupons periodically every 3 seconds to instantly catch new updates
  useEffect(() => {
    fetchOrders();
    fetchSheets();
    fetch('/api/coupons')
      .then(res => res.ok ? res.json() : [])
      .then(serverCoupons => {
        if (Array.isArray(serverCoupons) && serverCoupons.length > 0) {
          setCoupons(serverCoupons);
          try { localStorage.setItem('a4_coupons', JSON.stringify(serverCoupons)); } catch (e) {}
        }
      })
      .catch(() => {});

    const interval = setInterval(() => {
      fetchOrders();
      fetchSheets();
      fetch('/api/coupons')
        .then(res => res.ok ? res.json() : [])
        .then(serverCoupons => {
          if (Array.isArray(serverCoupons) && serverCoupons.length > 0) {
            setCoupons(serverCoupons);
          }
        })
        .catch(() => {});
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

  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus, paymentStatus?: 'verified' | 'failed', estimatedCompletionTime?: string) => {
    setOrders(prev => {
      const updated = prev.map(o => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          status: newStatus,
          paymentStatus: paymentStatus || o.paymentStatus,
          ...(estimatedCompletionTime !== undefined ? { estimatedCompletionTime } : {}),
        };
      });
      try {
        localStorage.setItem('a4_orders', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // Sync with Firebase Cloud Firestore
    updateOrderInCloud(orderId, { 
      status: newStatus, 
      ...(paymentStatus ? { paymentStatus } : {}),
      ...(estimatedCompletionTime !== undefined ? { estimatedCompletionTime } : {}),
    }).catch(() => {});

    // Sync with backend API
    fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        status: newStatus, 
        paymentStatus, 
        ...(estimatedCompletionTime !== undefined ? { estimatedCompletionTime } : {}),
      }),
    }).catch(() => {});
  };

  const handleDeleteOrder = (orderId: string) => {
    if (!orderId) return;
    const lowerId = orderId.toLowerCase();
    
    // 1. Update local deleted IDs tombstone set
    setDeletedIds(prev => new Set([...prev, lowerId]));
    saveStoredDeletedId(orderId);

    // 2. Remove immediately from orders state and localStorage
    setOrders(prev => {
      const updated = prev.filter(o => o.id.toLowerCase() !== lowerId);
      try {
        localStorage.setItem('a4_orders', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // 3. Delete from Firebase Cloud Firestore and record tombstone
    deleteOrderFromCloud(orderId).catch(() => {});
    recordDeletedOrderIdInCloud(orderId).catch(() => {});

    // 4. Sync with backend API
    fetch(`/api/orders/${orderId}`, {
      method: 'DELETE',
    }).catch(() => {});

    // 5. Broadcast across windows / tabs
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const bc = new BroadcastChannel('a4_orders_channel');
        bc.postMessage({ type: 'ORDER_DELETED', orderId });
        bc.close();
      } catch (e) {}
    }
  };

  const handleUpdateRates = (newRates: PricingRates) => {
    const valid = {
      ...DEFAULT_PRICING_RATES,
      ...newRates,
      promoPaperPrice: newRates.promoPaperPrice ?? 99
    };
    setRates(valid);
    try {
      localStorage.setItem('a4_pricing_rates', JSON.stringify(valid));
    } catch (e) {}

    // 1. Sync with Firebase Firestore Global Cloud
    savePricingRatesToCloud(valid).catch(err => {
      console.warn('Could not save pricing rates to Firestore cloud:', err);
    });

    // 2. Sync with Backend Express Server
    fetch('/api/pricing', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(valid),
    }).catch(err => {
      console.warn('Could not save pricing rates to backend API:', err);
    });

    // 3. Dispatch Local CustomEvent for instantaneous reactive re-render
    window.dispatchEvent(new CustomEvent('a4_pricing_rates_updated', { detail: valid }));

    // 4. Broadcast across local browser windows / tabs
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const bc = new BroadcastChannel('a4_rates_channel');
        bc.postMessage({ type: 'RATES_UPDATED', rates: valid });
        bc.close();
      } catch (e) {}
    }
  };

  const handleAddSheet = (newSheet: StudySheet) => {
    removeStoredDeletedSheetId(newSheet.id);
    let updatedList: StudySheet[] = [];
    setSheets(prev => {
      updatedList = [newSheet, ...prev.filter(s => s.id !== newSheet.id)];
      try { localStorage.setItem('a4_sheets', JSON.stringify(updatedList)); } catch (e) {}
      return updatedList;
    });

    // Save to Firebase Cloud Firestore for instant cross-device client sync
    saveSheetToCloud(newSheet).catch(() => {});

    // POST to backend API
    fetch('/api/sheets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSheet),
    }).catch(() => {});

    // Broadcast across windows / tabs
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const bc = new BroadcastChannel('a4_sheets_channel');
        bc.postMessage({ type: 'SHEET_SAVED', sheet: newSheet });
        bc.close();
      } catch (e) {}
    }
  };

  const handleUpdateSheet = (updatedSheet: StudySheet) => {
    removeStoredDeletedSheetId(updatedSheet.id);
    let updatedList: StudySheet[] = [];
    setSheets(prev => {
      updatedList = prev.map(s => s.id === updatedSheet.id ? updatedSheet : s);
      try { localStorage.setItem('a4_sheets', JSON.stringify(updatedList)); } catch (e) {}
      return updatedList;
    });

    // Save to Firebase Cloud Firestore for instant cross-device client sync
    saveSheetToCloud(updatedSheet).catch(() => {});

    // POST to backend API
    fetch('/api/sheets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedSheet),
    }).catch(() => {});

    // Broadcast across windows / tabs
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const bc = new BroadcastChannel('a4_sheets_channel');
        bc.postMessage({ type: 'SHEET_SAVED', sheet: updatedSheet });
        bc.close();
      } catch (e) {}
    }
  };

  const handleDeleteSheet = (sheetId: string) => {
    const lowerId = sheetId.toLowerCase();
    saveStoredDeletedSheetId(lowerId);

    let updatedList: StudySheet[] = [];
    setSheets(prev => {
      updatedList = prev.filter(s => s.id.toLowerCase() !== lowerId);
      try { localStorage.setItem('a4_sheets', JSON.stringify(updatedList)); } catch (e) {}
      return updatedList;
    });

    // Delete from Firebase Cloud Firestore and record tombstone
    deleteSheetFromCloud(sheetId).catch(() => {});
    recordDeletedSheetIdInCloud(sheetId).catch(() => {});

    // Sync with backend API
    fetch(`/api/sheets/${sheetId}`, {
      method: 'DELETE',
    }).catch(() => {});

    // Broadcast across windows / tabs
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const bc = new BroadcastChannel('a4_sheets_channel');
        bc.postMessage({ type: 'SHEET_DELETED', sheetId });
        bc.close();
      } catch (e) {}
    }
  };

  const handleBatchSaveSheets = (updatedSheets: StudySheet[]) => {
    setSheets(updatedSheets);
    try {
      localStorage.setItem('a4_sheets', JSON.stringify(updatedSheets));
    } catch (e) {}

    // Batch save to Firebase Cloud Firestore
    batchSaveSheetsToCloud(updatedSheets).catch(() => {});

    // Batch sync with backend API
    fetch('/api/sheets/batch-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sheets: updatedSheets }),
    }).catch(() => {});

    // Broadcast across windows / tabs
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const bc = new BroadcastChannel('a4_sheets_channel');
        bc.postMessage({ type: 'SHEETS_BATCH_SAVED', count: updatedSheets.length });
        bc.close();
      } catch (e) {}
    }
  };

  const handleAddCoupon = (newCoupon: Coupon) => {
    let updatedList: Coupon[] = [];
    setCoupons(prev => {
      const sanitized: Coupon = {
        ...newCoupon,
        code: newCoupon.code.trim().toUpperCase(),
        isActive: newCoupon.isActive !== false,
        discountPercentage: Number(newCoupon.discountPercentage) || 10,
        createdAt: newCoupon.createdAt || new Date().toISOString(),
      };
      // Prevent duplicate codes
      const filtered = prev.filter(c => c.code.toUpperCase() !== sanitized.code.toUpperCase() && c.id !== sanitized.id);
      updatedList = [sanitized, ...filtered];
      try { localStorage.setItem('a4_coupons', JSON.stringify(updatedList)); } catch (e) {}
      return updatedList;
    });

    // Sync to Cloud Firestore
    saveCouponsToCloud(updatedList).catch(() => {});

    // Sync to backend API
    fetch('/api/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCoupon),
    }).catch(() => {});

    // Broadcast across tabs
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const bc = new BroadcastChannel('a4_coupons_channel');
        bc.postMessage({ type: 'COUPONS_UPDATED', coupons: updatedList });
        bc.close();
      } catch (e) {}
    }
  };

  const handleDeleteCoupon = (couponId: string) => {
    let updatedList: Coupon[] = [];
    setCoupons(prev => {
      updatedList = prev.filter(c => c.id !== couponId);
      try { localStorage.setItem('a4_coupons', JSON.stringify(updatedList)); } catch (e) {}
      return updatedList;
    });

    // Sync to Cloud Firestore
    saveCouponsToCloud(updatedList).catch(() => {});

    // Sync to backend API
    fetch(`/api/coupons/${couponId}`, {
      method: 'DELETE',
    }).catch(() => {});

    // Broadcast across tabs
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const bc = new BroadcastChannel('a4_coupons_channel');
        bc.postMessage({ type: 'COUPONS_UPDATED', coupons: updatedList });
        bc.close();
      } catch (e) {}
    }
  };

  const handleToggleCouponStatus = (couponId: string) => {
    let updatedList: Coupon[] = [];
    let updatedTarget: Coupon | undefined;
    setCoupons(prev => {
      updatedList = prev.map(c => {
        if (c.id === couponId) {
          updatedTarget = { ...c, isActive: !c.isActive };
          return updatedTarget;
        }
        return c;
      });
      try { localStorage.setItem('a4_coupons', JSON.stringify(updatedList)); } catch (e) {}
      return updatedList;
    });

    // Sync to Cloud Firestore
    saveCouponsToCloud(updatedList).catch(() => {});

    // Sync to backend API
    if (updatedTarget) {
      fetch(`/api/coupons/${couponId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTarget),
      }).catch(() => {});
    }

    // Broadcast across tabs
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const bc = new BroadcastChannel('a4_coupons_channel');
        bc.postMessage({ type: 'COUPONS_UPDATED', coupons: updatedList });
        bc.close();
      } catch (e) {}
    }
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
      (Boolean(myPhone) && ((o.customerPhone && o.customerPhone.trim() === myPhone) || (o.customerPhone2 && o.customerPhone2.trim() === myPhone)));
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
              rates={rates}
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
              rates={rates}
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
              onBatchSaveSheets={handleBatchSaveSheets}
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
