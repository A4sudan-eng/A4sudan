import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  getDocs
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
import { PrintOrder, StudySheet } from '../types';

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
export const db = getFirestore(app);
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
 * Deletes an order from Firestore
 */
export async function deleteOrderFromCloud(orderId: string): Promise<boolean> {
  try {
    if (!orderId) return false;
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    await deleteDoc(docRef);
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
    return true;
  } catch (error) {
    console.warn('Firestore delete sheet warning:', error);
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


