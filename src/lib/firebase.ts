import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore,
  initializeFirestore,
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  getDocs,
  getDoc
} from 'firebase/firestore';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  updateProfile,
  User 
} from 'firebase/auth';
import appletConfig from '../../firebase-applet-config.json';
import { PrintOrder, StudySheet, PricingRates, Coupon, DeliveryZone } from '../types';
import { UniversityInfo, AcademicLevel } from '../data/neelainData';

// إعدادات Firebase المباشرة لمشروعك a4-sudan
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCW-9UB4KxQyz5B1PkQJct0uMSRSodPy_c",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "a4-sudan.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "a4-sudan",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "a4-sudan.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "250086907441",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:250086907441:web:5e6a24cce5f89ca2e83f10"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

let firestoreInstance;
try {
  firestoreInstance = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  });
} catch (e) {
  firestoreInstance = getFirestore(app);
}
export const db = firestoreInstance;
export const auth = getAuth(app);

const ORDERS_COLLECTION = 'orders';
const PENDING_QUEUE_KEY = 'a4_pending_cloud_orders';

/**
 * Firebase Authentication Helpers
 */

export async function signUpWithEmail(email: string, pass: string, displayName?: string): Promise<User> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  if (displayName && userCredential.user) {
    await updateProfile(userCredential.user, { displayName });
  }
  return userCredential.user;
}

export async function signInWithEmail(email: string, pass: string): Promise<User> {
  const userCredential = await signInWithEmailAndPassword(auth, email, pass);
  return userCredential.user;
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

export function subscribeToAuthState(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

/**
 * Compresses an image Data URL or File down to a compact JPEG string (~30-60KB).
 * This guarantees that payment receipts uploaded from mobile devices fit in Firestore!
 */
export async function compressImageToLightweightDataUrl(
  input: string | File,
  maxDimension = 800,
  quality = 0.65
): Promise<string> {
  return new Promise((resolve) => {
    if (typeof input === 'string' && !input.startsWith('data:image')) {
      resolve(input);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        } else {
          resolve(typeof input === 'string' ? input : '');
        }
      } catch (err) {
        resolve(typeof input === 'string' ? input : '');
      }
    };

    img.onerror = () => {
      resolve(typeof input === 'string' ? input : '');
    };

    if (typeof input === 'string') {
      img.src = input;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = (e.target?.result as string) || '';
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(input);
    }
  });
}

/**
 * Enqueues an order into local storage pending queue for background retry
 */
export function enqueuePendingCloudOrder(order: PrintOrder) {
  try {
    const raw = localStorage.getItem(PENDING_QUEUE_KEY);
    const queue: PrintOrder[] = raw ? JSON.parse(raw) : [];
    if (!queue.some(o => o.id === order.id)) {
      queue.push(order);
      localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(queue));
    }
  } catch (e) {}
}

/**
 * Processes and retries all pending cloud orders
 */
export async function processPendingCloudOrdersQueue(): Promise<number> {
  try {
    const raw = localStorage.getItem(PENDING_QUEUE_KEY);
    if (!raw) return 0;
    const queue: PrintOrder[] = JSON.parse(raw);
    if (!Array.isArray(queue) || queue.length === 0) return 0;

    const remaining: PrintOrder[] = [];
    let syncedCount = 0;

    for (const order of queue) {
      const success = await saveOrderToCloudDirect(order);
      if (success) {
        syncedCount++;
      } else {
        remaining.push(order);
      }
    }

    localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(remaining));
    return syncedCount;
  } catch (e) {
    return 0;
  }
}

/**
 * Deep recursive cleanup function to ensure no `undefined`, functions, or non-serializable objects exist.
 * Firestore setDoc strictly errors out if ANY field (even nested in arrays or objects) is `undefined`.
 */
function deepCleanForFirestore(val: any): any {
  if (val === undefined || val === null) return null;
  if (typeof val === 'function' || typeof val === 'symbol') return null;
  if (typeof val !== 'object') return val;

  // Omit DOM File / Blob instances
  if (typeof File !== 'undefined' && val instanceof File) return null;
  if (typeof Blob !== 'undefined' && val instanceof Blob) return null;

  if (Array.isArray(val)) {
    return val
      .map(item => deepCleanForFirestore(item))
      .filter(item => item !== null && item !== undefined);
  }

  const cleaned: Record<string, any> = {};
  for (const key of Object.keys(val)) {
    const child = deepCleanForFirestore(val[key]);
    if (child !== undefined && child !== null) {
      cleaned[key] = child;
    }
  }
  return cleaned;
}

/**
 * Sanitizes an order object to ensure it stays well below Firestore's 1MB limit
 * and never triggers undefined field errors.
 */
function sanitizeOrderForFirestore(order: PrintOrder): any {
  if (!order) return {};

  const cleanOrder: any = { ...order };

  // Attach current authenticated user id or email if available
  if (!cleanOrder.userId && auth.currentUser?.uid) {
    cleanOrder.userId = auth.currentUser.uid;
  }
  if (!cleanOrder.customerEmail && auth.currentUser?.email) {
    cleanOrder.customerEmail = auth.currentUser.email;
  }

  // Sanitize files array to remove DOM file references or massive blob/data URLs
  if (Array.isArray(cleanOrder.files)) {
    cleanOrder.files = cleanOrder.files.map((file: any) => {
      const copy = { ...file };
      delete copy.file; // Delete non-serializable DOM file object
      if (copy.previewUrl) {
        // Strip blob: URLs or data: URLs larger than 50KB from individual file items to keep order payload small
        if (typeof copy.previewUrl === 'string' && (copy.previewUrl.startsWith('blob:') || copy.previewUrl.length > 50000)) {
          delete copy.previewUrl;
        }
      }
      return copy;
    });
  }

  // Apply deep recursive cleaning to eliminate any nested undefined values
  return deepCleanForFirestore(cleanOrder);
}

/**
 * Internal direct saver to avoid recursion loop with queue
 */
async function saveOrderToCloudDirect(order: PrintOrder): Promise<boolean> {
  try {
    if (!order || !order.id) return false;

    const copy = { ...order };

    // Automatically compress Bankak payment proof receipt if present as Data URL
    if (copy.bankakProofUrl && copy.bankakProofUrl.startsWith('data:image')) {
      copy.bankakProofUrl = await compressImageToLightweightDataUrl(copy.bankakProofUrl, 800, 0.65);
    }

    const cleanOrder = sanitizeOrderForFirestore(copy);
    const docRef = doc(db, ORDERS_COLLECTION, order.id);
    await setDoc(docRef, { ...cleanOrder, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (error) {
    console.error('Direct Firestore save order error:', error);
    return false;
  }
}

/**
 * Saves or updates an order in Firebase Firestore
 */
export async function saveOrderToCloud(order: PrintOrder): Promise<boolean> {
  try {
    if (!order || !order.id) return false;

    const success = await saveOrderToCloudDirect(order);
    if (success) {
      // Broadcast across windows / tabs
      if (typeof BroadcastChannel !== 'undefined') {
        try {
          const bc = new BroadcastChannel('a4_orders_channel');
          bc.postMessage({ type: 'ORDER_SAVED', orderId: order.id });
          bc.close();
        } catch (e) {}
      }
      return true;
    } else {
      enqueuePendingCloudOrder(order);
      return false;
    }
  } catch (error) {
    console.error('Firestore save order error:', error);
    enqueuePendingCloudOrder(order);
    return false;
  }
}

/**
  * Alias function for saveOrderToCloud as saveOrderToFirestore
  */
export async function saveOrderToFirestore(order: PrintOrder): Promise<boolean> {
  return saveOrderToCloud(order);
}

/**
 * Fetches all orders directly from Firestore
 */
export async function getOrdersFromCloud(): Promise<PrintOrder[]> {
  try {
    const ordersRef = collection(db, ORDERS_COLLECTION);
    const snapshot = await getDocs(ordersRef);
    const ordersList: PrintOrder[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data && data.id) {
        ordersList.push(data as PrintOrder);
      }
    });
    ordersList.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    return ordersList;
  } catch (error) {
    console.warn('Error fetching orders from cloud:', error);
    return [];
  }
}

/**
 * Updates specific fields of an order in Firestore
 */
export async function updateOrderInCloud(orderId: string, updates: Partial<PrintOrder>): Promise<boolean> {
  try {
    if (!orderId) return false;
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    const cleanUpdates = JSON.parse(JSON.stringify(updates));
    await updateDoc(docRef, { ...cleanUpdates, updatedAt: new Date().toISOString() });
    return true;
  } catch (error) {
    console.warn('Firestore update order warning:', error);
    return false;
  }
}

/**
 * Deleted IDs Tombstones Collection (Guarantees deletion across all browsers & devices)
 */
const DELETED_IDS_COLLECTION = 'deleted_order_ids';

export async function recordDeletedOrderIdInCloud(orderId: string): Promise<boolean> {
  try {
    if (!orderId) return false;
    const lowerId = orderId.toLowerCase();
    const docRef = doc(db, DELETED_IDS_COLLECTION, lowerId);
    await setDoc(docRef, { id: lowerId, originalId: orderId, deletedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (e) {
    console.warn('Firestore record deleted ID warning:', e);
    return false;
  }
}

export async function removeDeletedOrderIdFromCloud(orderId: string): Promise<boolean> {
  try {
    if (!orderId) return false;
    const lowerId = orderId.toLowerCase();
    const docRef = doc(db, DELETED_IDS_COLLECTION, lowerId);
    await deleteDoc(docRef);
    return true;
  } catch (e) {
    console.warn('Firestore remove deleted ID warning:', e);
    return false;
  }
}

export async function getDeletedIdsFromCloud(): Promise<string[]> {
  try {
    const ref = collection(db, DELETED_IDS_COLLECTION);
    const snapshot = await getDocs(ref);
    const ids: string[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (data?.id) ids.push(data.id.toLowerCase());
      else ids.push(docSnap.id.toLowerCase());
    });
    return ids;
  } catch (e) {
    console.warn('Error fetching deleted IDs from cloud:', e);
    return [];
  }
}

export function subscribeToDeletedIds(callback: (deletedIds: string[]) => void): () => void {
  try {
    const ref = collection(db, DELETED_IDS_COLLECTION);
    const q = query(ref);
    return onSnapshot(
      q,
      (snapshot) => {
        const ids: string[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data();
          if (data?.id) ids.push(data.id.toLowerCase());
          else ids.push(docSnap.id.toLowerCase());
        });
        callback(ids);
      },
      (error) => {
        console.warn('Firestore deleted_order_ids listener warning:', error);
      }
    );
  } catch (e) {
    console.warn('Firestore deleted_order_ids subscribe warning:', e);
    return () => {};
  }
}

/**
 * Deletes an order from Firestore
 */
export async function deleteOrderFromCloud(orderId: string): Promise<boolean> {
  try {
    if (!orderId) return false;
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    await deleteDoc(docRef);
    await recordDeletedOrderIdInCloud(orderId);

    // Broadcast across windows / tabs
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const bc = new BroadcastChannel('a4_orders_channel');
        bc.postMessage({ type: 'ORDER_DELETED', orderId });
        bc.close();
      } catch (e) {}
    }
    return true;
  } catch (error) {
    console.warn('Firestore delete order warning:', error);
    return false;
  }
}

/**
 * Subscribes to real-time updates for all orders in Firestore
 */
export function subscribeToCloudOrders(callback: (orders: PrintOrder[]) => void): () => void {
  try {
    const ordersRef = collection(db, ORDERS_COLLECTION);
    const q = query(ordersRef);
    
    return onSnapshot(
      q,
      (snapshot) => {
        const ordersList: PrintOrder[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data && data.id) {
            ordersList.push(data as PrintOrder);
          }
        });
        ordersList.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        callback(ordersList);
      },
      (error) => {
        console.warn('Firestore snapshot listener warning:', error);
      }
    );
  } catch (error) {
    console.warn('Firestore subscribe warning:', error);
    return () => {};
  }
}

/**
 * Deleted Orders Firestore Integration (Recycle Bin Sync)
 */
const DELETED_ORDERS_COLLECTION = 'deleted_orders';

export async function saveDeletedOrderToCloud(order: PrintOrder): Promise<boolean> {
  try {
    if (!order || !order.id) return false;
    const cleanOrder = deepCleanForFirestore(order);
    const docRef = doc(db, DELETED_ORDERS_COLLECTION, order.id);
    await setDoc(docRef, { ...cleanOrder, deletedAt: order.deletedAt || new Date().toISOString() }, { merge: true });

    // Ensure removed from active orders collection
    const activeDocRef = doc(db, ORDERS_COLLECTION, order.id);
    await deleteDoc(activeDocRef);

    // Record tombstone
    await recordDeletedOrderIdInCloud(order.id);

    // Broadcast across windows / tabs
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const bc = new BroadcastChannel('a4_orders_channel');
        bc.postMessage({ type: 'ORDER_MOVED_TO_TRASH', orderId: order.id });
        bc.close();
      } catch (e) {}
    }
    return true;
  } catch (error) {
    console.warn('Firestore save deleted order warning:', error);
    return false;
  }
}

export async function deleteDeletedOrderFromCloud(orderId: string): Promise<boolean> {
  try {
    if (!orderId) return false;
    const docRef = doc(db, DELETED_ORDERS_COLLECTION, orderId);
    await deleteDoc(docRef);
    await recordDeletedOrderIdInCloud(orderId);

    // Broadcast across windows / tabs
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const bc = new BroadcastChannel('a4_orders_channel');
        bc.postMessage({ type: 'ORDER_PERMANENTLY_DELETED', orderId });
        bc.close();
      } catch (e) {}
    }
    return true;
  } catch (error) {
    console.warn('Firestore delete deleted order warning:', error);
    return false;
  }
}

export async function emptyDeletedOrdersInCloud(): Promise<boolean> {
  try {
    const ref = collection(db, DELETED_ORDERS_COLLECTION);
    const snapshot = await getDocs(ref);
    const promises: Promise<any>[] = [];
    snapshot.forEach(docSnap => {
      promises.push(deleteDoc(docSnap.ref));
      promises.push(recordDeletedOrderIdInCloud(docSnap.id));
    });
    await Promise.all(promises);

    // Broadcast across windows / tabs
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const bc = new BroadcastChannel('a4_orders_channel');
        bc.postMessage({ type: 'TRASH_EMPTIED' });
        bc.close();
      } catch (e) {}
    }
    return true;
  } catch (e) {
    console.warn('Firestore empty trash warning:', e);
    return false;
  }
}

export async function restoreOrderInCloud(order: PrintOrder): Promise<boolean> {
  try {
    if (!order || !order.id) return false;
    // 1. Remove from deleted_orders
    const trashDocRef = doc(db, DELETED_ORDERS_COLLECTION, order.id);
    await deleteDoc(trashDocRef);

    // 2. Remove from tombstone
    await removeDeletedOrderIdFromCloud(order.id);

    // 3. Save to active orders
    const restoredOrder = { ...order };
    delete restoredOrder.deletedAt;
    await saveOrderToCloud(restoredOrder);

    // Broadcast
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const bc = new BroadcastChannel('a4_orders_channel');
        bc.postMessage({ type: 'ORDER_RESTORED', orderId: order.id });
        bc.close();
      } catch (e) {}
    }
    return true;
  } catch (e) {
    console.warn('Firestore restore order warning:', e);
    return false;
  }
}

export async function getDeletedOrdersFromCloud(): Promise<PrintOrder[]> {
  try {
    const ref = collection(db, DELETED_ORDERS_COLLECTION);
    const snapshot = await getDocs(ref);
    const list: PrintOrder[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (data && data.id) list.push(data as PrintOrder);
    });
    list.sort((a, b) => new Date(b.deletedAt || b.createdAt || 0).getTime() - new Date(a.deletedAt || a.createdAt || 0).getTime());
    return list;
  } catch (e) {
    console.warn('Error fetching deleted orders from cloud:', e);
    return [];
  }
}

export function subscribeToCloudDeletedOrders(callback: (deletedOrders: PrintOrder[]) => void): () => void {
  try {
    const ref = collection(db, DELETED_ORDERS_COLLECTION);
    const q = query(ref);
    return onSnapshot(
      q,
      (snapshot) => {
        const list: PrintOrder[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data();
          if (data && data.id) list.push(data as PrintOrder);
        });
        list.sort((a, b) => new Date(b.deletedAt || b.createdAt || 0).getTime() - new Date(a.deletedAt || a.createdAt || 0).getTime());
        callback(list);
      },
      (error) => {
        console.warn('Firestore deleted_orders listener warning:', error);
      }
    );
  } catch (e) {
    console.warn('Firestore deleted_orders subscribe warning:', e);
    return () => {};
  }
}

/**
 * Study Sheets Firestore Integration
 */
const SHEETS_COLLECTION = 'study_sheets';

export async function saveSheetToCloud(sheet: StudySheet): Promise<boolean> {
  try {
    if (!sheet || !sheet.id) return false;
    const cleanSheet = deepCleanForFirestore(sheet);
    const docRef = doc(db, SHEETS_COLLECTION, sheet.id);
    await setDoc(docRef, { ...cleanSheet, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (error) {
    console.error('Firestore save sheet error:', error);
    return false;
  }
}

export async function deleteSheetFromCloud(sheetId: string): Promise<boolean> {
  try {
    if (!sheetId) return false;
    const docRef = doc(db, SHEETS_COLLECTION, sheetId);
    await deleteDoc(docRef);
    await recordDeletedSheetIdInCloud(sheetId);
    return true;
  } catch (error) {
    console.warn('Firestore delete sheet warning:', error);
    return false;
  }
}

export async function recordDeletedSheetIdInCloud(sheetId: string): Promise<boolean> {
  try {
    if (!sheetId) return false;
    const tombstoneRef = doc(db, 'deleted_sheet_ids', sheetId.toLowerCase());
    await setDoc(tombstoneRef, {
      sheetId: sheetId.toLowerCase(),
      deletedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (e) {
    return false;
  }
}

export async function getDeletedSheetIdsFromCloud(): Promise<string[]> {
  try {
    const colRef = collection(db, 'deleted_sheet_ids');
    const snap = await getDocs(colRef);
    const ids: string[] = [];
    snap.forEach(d => {
      const data = d.data();
      if (data && data.sheetId) ids.push(data.sheetId.toLowerCase());
    });
    return ids;
  } catch (e) {
    return [];
  }
}

export async function batchSaveSheetsToCloud(sheets: StudySheet[]): Promise<boolean> {
  try {
    if (!Array.isArray(sheets) || sheets.length === 0) return false;
    const promises = sheets.map(s => saveSheetToCloud(s));
    await Promise.allSettled(promises);
    return true;
  } catch (e) {
    console.error('Batch save sheets error:', e);
    return false;
  }
}

export async function getSheetsFromCloud(): Promise<StudySheet[]> {
  try {
    const sheetsRef = collection(db, SHEETS_COLLECTION);
    const snapshot = await getDocs(sheetsRef);
    const sheetsList: StudySheet[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data && data.id) {
        sheetsList.push(data as StudySheet);
      }
    });
    return sheetsList;
  } catch (error) {
    console.warn('Error fetching sheets from cloud:', error);
    return [];
  }
}

export function subscribeToCloudSheets(callback: (sheets: StudySheet[]) => void): () => void {
  try {
    const sheetsRef = collection(db, SHEETS_COLLECTION);
    const q = query(sheetsRef);
    
    return onSnapshot(
      q,
      (snapshot) => {
        const sheetsList: StudySheet[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data && data.id) {
            sheetsList.push(data as StudySheet);
          }
        });
        callback(sheetsList);
      },
      (error) => {
        console.warn('Firestore sheets listener warning:', error);
      }
    );
  } catch (error) {
    console.warn('Firestore sheets subscribe warning:', error);
    return () => {};
  }
}

/**
 * Universities & Colleges Global Firestore Integration
 * Synchronizes active/inactive states across all devices & browsers in real time.
 */
const UNIVERSITIES_COLLECTION = 'system_settings';
const UNIVERSITIES_DOC_ID = 'universities_config';

export async function saveUniversitiesToCloud(universities: UniversityInfo[]): Promise<boolean> {
  try {
    if (!Array.isArray(universities) || universities.length === 0) return false;
    const cleanList = universities.map(u => deepCleanForFirestore(u));
    const docRef = doc(db, UNIVERSITIES_COLLECTION, UNIVERSITIES_DOC_ID);
    await setDoc(docRef, {
      list: cleanList,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    // Broadcast across local browser tabs immediately
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const bc = new BroadcastChannel('a4_universities_channel');
        bc.postMessage({ type: 'UNIVERSITIES_UPDATED', list: universities });
        bc.close();
      } catch (e) {}
    }

    return true;
  } catch (error) {
    console.error('Firestore save universities error:', error);
    return false;
  }
}

export async function getUniversitiesFromCloud(): Promise<UniversityInfo[] | null> {
  try {
    const docRef = doc(db, UNIVERSITIES_COLLECTION, UNIVERSITIES_DOC_ID);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data && Array.isArray(data.list) && data.list.length > 0) {
        return data.list as UniversityInfo[];
      }
    }
    const docSnap = await getDocs(query(collection(db, UNIVERSITIES_COLLECTION)));
    let foundList: UniversityInfo[] | null = null;
    docSnap.forEach((d) => {
      if (d.id === UNIVERSITIES_DOC_ID) {
        const data = d.data();
        if (data && Array.isArray(data.list) && data.list.length > 0) {
          foundList = data.list as UniversityInfo[];
        }
      }
    });
    return foundList;
  } catch (error) {
    console.warn('Error fetching universities from cloud:', error);
    return null;
  }
}

export function subscribeToCloudUniversities(callback: (unis: UniversityInfo[]) => void): () => void {
  try {
    const docRef = doc(db, UNIVERSITIES_COLLECTION, UNIVERSITIES_DOC_ID);
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data && Array.isArray(data.list) && data.list.length > 0) {
            callback(data.list as UniversityInfo[]);
          }
        }
      },
      (error) => {
        console.warn('Firestore universities listener warning:', error);
      }
    );
  } catch (error) {
    console.warn('Firestore universities subscribe warning:', error);
    return () => {};
  }
}

/**
 * Academic Levels & Semesters Global Firestore Integration
 * Synchronizes ON/OFF availability states for levels and semesters across all devices & browsers.
 */
const ACADEMIC_LEVELS_DOC_ID = 'academic_levels_config';

export async function saveAcademicLevelsToCloud(levels: AcademicLevel[]): Promise<boolean> {
  try {
    if (!Array.isArray(levels) || levels.length === 0) return false;
    const cleanList = levels.map(l => deepCleanForFirestore(l));
    const docRef = doc(db, UNIVERSITIES_COLLECTION, ACADEMIC_LEVELS_DOC_ID);
    await setDoc(docRef, {
      list: cleanList,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    // Broadcast across local browser tabs immediately
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const bc = new BroadcastChannel('a4_academic_levels_channel');
        bc.postMessage({ type: 'ACADEMIC_LEVELS_UPDATED', list: levels });
        bc.close();
      } catch (e) {}
    }

    return true;
  } catch (error) {
    console.error('Firestore save academic levels error:', error);
    return false;
  }
}

export async function getAcademicLevelsFromCloud(): Promise<AcademicLevel[] | null> {
  try {
    const docRef = doc(db, UNIVERSITIES_COLLECTION, ACADEMIC_LEVELS_DOC_ID);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data && Array.isArray(data.list) && data.list.length > 0) {
        return data.list as AcademicLevel[];
      }
    }
    const docSnap = await getDocs(query(collection(db, UNIVERSITIES_COLLECTION)));
    let foundList: AcademicLevel[] | null = null;
    docSnap.forEach((d) => {
      if (d.id === ACADEMIC_LEVELS_DOC_ID) {
        const data = d.data();
        if (data && Array.isArray(data.list) && data.list.length > 0) {
          foundList = data.list as AcademicLevel[];
        }
      }
    });
    return foundList;
  } catch (error) {
    console.warn('Error fetching academic levels from cloud:', error);
    return null;
  }
}

export function subscribeToCloudAcademicLevels(callback: (levels: AcademicLevel[]) => void): () => void {
  try {
    const docRef = doc(db, UNIVERSITIES_COLLECTION, ACADEMIC_LEVELS_DOC_ID);
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data && Array.isArray(data.list) && data.list.length > 0) {
            callback(data.list as AcademicLevel[]);
          }
        }
      },
      (error) => {
        console.warn('Firestore academic levels listener warning:', error);
      }
    );
  } catch (error) {
    console.warn('Firestore academic levels subscribe warning:', error);
    return () => {};
  }
}

/**
 * Degree Tracks (Bachelor / Diploma) Global Firestore Integration
 * Synchronizes ON/OFF availability states for degree tracks across all devices & browsers.
 */
const DEGREE_TRACKS_DOC_ID = 'degree_tracks_config';

export async function saveDegreeTracksToCloud(tracks: any[]): Promise<boolean> {
  try {
    if (!Array.isArray(tracks) || tracks.length === 0) return false;
    const cleanList = tracks.map(t => deepCleanForFirestore(t));
    const docRef = doc(db, UNIVERSITIES_COLLECTION, DEGREE_TRACKS_DOC_ID);
    await setDoc(docRef, {
      list: cleanList,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    // Broadcast across local browser tabs immediately
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const bc = new BroadcastChannel('a4_degree_tracks_channel');
        bc.postMessage({ type: 'DEGREE_TRACKS_UPDATED', list: tracks });
        bc.close();
      } catch (e) {}
    }

    return true;
  } catch (error) {
    console.error('Firestore save degree tracks error:', error);
    return false;
  }
}

export async function getDegreeTracksFromCloud(): Promise<any[] | null> {
  try {
    const docRef = doc(db, UNIVERSITIES_COLLECTION, DEGREE_TRACKS_DOC_ID);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data && Array.isArray(data.list) && data.list.length > 0) {
        return data.list;
      }
    }
    const docSnap = await getDocs(query(collection(db, UNIVERSITIES_COLLECTION)));
    let foundList: any[] | null = null;
    docSnap.forEach((d) => {
      if (d.id === DEGREE_TRACKS_DOC_ID) {
        const data = d.data();
        if (data && Array.isArray(data.list) && data.list.length > 0) {
          foundList = data.list;
        }
      }
    });
    return foundList;
  } catch (error) {
    console.warn('Error fetching degree tracks from cloud:', error);
    return null;
  }
}

export function subscribeToCloudDegreeTracks(callback: (tracks: any[]) => void): () => void {
  try {
    const docRef = doc(db, UNIVERSITIES_COLLECTION, DEGREE_TRACKS_DOC_ID);
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data && Array.isArray(data.list) && data.list.length > 0) {
            callback(data.list);
          }
        }
      },
      (error) => {
        console.warn('Firestore degree tracks listener warning:', error);
      }
    );
  } catch (error) {
    console.warn('Firestore degree tracks subscribe warning:', error);
    return () => {};
  }
}

/**
 * Pricing Rates & Promo Campaign Global Firestore Integration
 * Synchronizes pricing definitions and promo paper prices (e.g. 99 SDG) across all client devices in real-time.
 */
const PRICING_RATES_DOC_ID = 'pricing_rates_config';

export async function savePricingRatesToCloud(rates: PricingRates): Promise<boolean> {
  try {
    if (!rates) return false;
    const cleanRates = deepCleanForFirestore(rates);
    const docRef = doc(db, UNIVERSITIES_COLLECTION, PRICING_RATES_DOC_ID);
    await setDoc(docRef, {
      rates: cleanRates,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    // Broadcast across local browser tabs immediately
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const bc = new BroadcastChannel('a4_rates_channel');
        bc.postMessage({ type: 'RATES_UPDATED', rates });
        bc.close();
      } catch (e) {}
    }

    return true;
  } catch (error) {
    console.error('Firestore save pricing rates error:', error);
    return false;
  }
}

export async function getPricingRatesFromCloud(): Promise<PricingRates | null> {
  try {
    const docRef = doc(db, UNIVERSITIES_COLLECTION, PRICING_RATES_DOC_ID);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data && data.rates && typeof data.rates.bwPerPage === 'number') {
        return data.rates as PricingRates;
      }
    }
    
    // Fallback: collection scan
    const docSnap = await getDocs(query(collection(db, UNIVERSITIES_COLLECTION)));
    let foundRates: PricingRates | null = null;
    docSnap.forEach((d) => {
      if (d.id === PRICING_RATES_DOC_ID) {
        const data = d.data();
        if (data && data.rates && typeof data.rates.bwPerPage === 'number') {
          foundRates = data.rates as PricingRates;
        }
      }
    });
    return foundRates;
  } catch (error) {
    console.warn('Error fetching pricing rates from cloud:', error);
    return null;
  }
}

export function subscribeToCloudPricingRates(callback: (rates: PricingRates) => void): () => void {
  try {
    const docRef = doc(db, UNIVERSITIES_COLLECTION, PRICING_RATES_DOC_ID);
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data && data.rates && typeof data.rates.bwPerPage === 'number') {
            callback(data.rates as PricingRates);
          }
        }
      },
      (error) => {
        console.warn('Firestore pricing rates listener warning:', error);
      }
    );
  } catch (error) {
    console.warn('Firestore pricing rates subscribe warning:', error);
    return () => {};
  }
}

// ---------------------------------------------------------------------------
// Real-time Cloud Firestore Coupons Management & Synchronization
// ---------------------------------------------------------------------------
export const COUPONS_DOC_ID = 'system_coupons_config';

export async function saveCouponsToCloud(couponsList: Coupon[]): Promise<boolean> {
  try {
    if (!Array.isArray(couponsList)) {
      return false;
    }
    const docRef = doc(db, UNIVERSITIES_COLLECTION, COUPONS_DOC_ID);
    const sanitized = couponsList.map(c => ({
      id: c.id || `coupon-${Date.now()}`,
      code: (c.code || '').trim().toUpperCase(),
      discountPercentage: Number(c.discountPercentage) || 10,
      targetBatch: c.targetBatch || 'all',
      isActive: c.isActive !== false,
      notes: c.notes || '',
      createdAt: c.createdAt || new Date().toISOString(),
    }));

    await setDoc(docRef, {
      coupons: sanitized,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('a4_coupons', JSON.stringify(sanitized));
        window.dispatchEvent(new CustomEvent('a4_coupons_updated', { detail: sanitized }));
        const bc = new BroadcastChannel('a4_coupons_channel');
        bc.postMessage({ type: 'COUPONS_UPDATED', coupons: sanitized });
        bc.close();
      } catch (e) {}
    }

    return true;
  } catch (error) {
    console.error('Firestore save coupons error:', error);
    return false;
  }
}

export async function getCouponsFromCloud(): Promise<Coupon[] | null> {
  try {
    const docRef = doc(db, UNIVERSITIES_COLLECTION, COUPONS_DOC_ID);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data && Array.isArray(data.coupons) && data.coupons.length > 0) {
        return data.coupons as Coupon[];
      }
    }
    return null;
  } catch (error) {
    console.warn('Error fetching coupons from cloud:', error);
    return null;
  }
}

export function subscribeToCloudCoupons(callback: (coupons: Coupon[]) => void): () => void {
  try {
    const docRef = doc(db, UNIVERSITIES_COLLECTION, COUPONS_DOC_ID);
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data && Array.isArray(data.coupons) && data.coupons.length > 0) {
            callback(data.coupons as Coupon[]);
          }
        }
      },
      (error) => {
        console.warn('Firestore coupons listener warning:', error);
      }
    );
  } catch (error) {
    console.warn('Firestore coupons subscribe warning:', error);
    return () => {};
  }
}

// ---------------------------------------------------------------------------
// Real-time Cloud Firestore Delivery Zones Management & Synchronization
// ---------------------------------------------------------------------------
export const DELIVERY_ZONES_DOC_ID = 'system_delivery_zones_config';

export async function saveDeliveryZonesToCloud(zonesList: DeliveryZone[]): Promise<boolean> {
  try {
    if (!Array.isArray(zonesList)) {
      return false;
    }
    const docRef = doc(db, UNIVERSITIES_COLLECTION, DELIVERY_ZONES_DOC_ID);
    const sanitized = zonesList.map(z => ({
      id: z.id || `zone-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      state: z.state || 'ولاية الخرطوم',
      locality: z.locality || 'محلية كرري',
      neighborhood: z.neighborhood || z.zoneName || '',
      zoneName: z.zoneName || '',
      fee: typeof z.fee === 'number' ? z.fee : Number(z.fee) || 0,
      details: z.details || '',
      regionKey: z.regionKey || 'omdurman',
      regionName: z.regionName || z.locality || 'منطقة التوصيل',
      isActive: z.isActive !== false,
    }));

    await setDoc(docRef, {
      zones: sanitized,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('a4_custom_delivery_zones', JSON.stringify(sanitized));
        window.dispatchEvent(new CustomEvent('a4_delivery_zones_updated', { detail: { zones: sanitized } }));
        if (typeof BroadcastChannel !== 'undefined') {
          const bc = new BroadcastChannel('a4_delivery_zones_channel');
          bc.postMessage({ type: 'DELIVERY_ZONES_UPDATED', zones: sanitized });
          bc.close();
        }
      } catch (e) {}
    }

    return true;
  } catch (error) {
    console.error('Firestore save delivery zones error:', error);
    return false;
  }
}

export async function getDeliveryZonesFromCloud(): Promise<DeliveryZone[] | null> {
  try {
    const docRef = doc(db, UNIVERSITIES_COLLECTION, DELIVERY_ZONES_DOC_ID);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data && Array.isArray(data.zones)) {
        return data.zones as DeliveryZone[];
      }
    }

    // Fallback: collection scan
    const docSnap = await getDocs(query(collection(db, UNIVERSITIES_COLLECTION)));
    let foundZones: DeliveryZone[] | null = null;
    docSnap.forEach((d) => {
      if (d.id === DELIVERY_ZONES_DOC_ID) {
        const data = d.data();
        if (data && Array.isArray(data.zones)) {
          foundZones = data.zones as DeliveryZone[];
        }
      }
    });
    return foundZones;
  } catch (error) {
    console.warn('Error fetching delivery zones from cloud:', error);
    return null;
  }
}

export function subscribeToCloudDeliveryZones(callback: (zones: DeliveryZone[]) => void): () => void {
  try {
    const docRef = doc(db, UNIVERSITIES_COLLECTION, DELIVERY_ZONES_DOC_ID);
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data && Array.isArray(data.zones)) {
            callback(data.zones as DeliveryZone[]);
          }
        }
      },
      (error) => {
        console.warn('Firestore delivery zones listener warning:', error);
      }
    );
  } catch (error) {
    console.warn('Firestore delivery zones subscribe warning:', error);
    return () => {};
  }
}




