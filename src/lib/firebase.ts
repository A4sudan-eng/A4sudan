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
  getDocs,
  where
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
import firebaseConfig from '../../firebase-applet-config.json';
import { PrintOrder } from '../types';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);

const ORDERS_COLLECTION = 'orders';

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

  // Keep bankakProofUrl if under 400KB to ensure proof image persists in Firestore
  if (cleanOrder.bankakProofUrl && typeof cleanOrder.bankakProofUrl === 'string') {
    if (cleanOrder.bankakProofUrl.length > 400000) {
      console.warn('Bankak proof image too large for direct Firestore payload, truncating proof image');
      delete cleanOrder.bankakProofUrl;
    }
  }

  // Apply deep recursive cleaning to eliminate any nested undefined values
  return deepCleanForFirestore(cleanOrder);
}

/**
 * Saves or updates an order in Firebase Firestore
 */
export async function saveOrderToCloud(order: PrintOrder): Promise<boolean> {
  try {
    if (!order || !order.id) return false;
    const cleanOrder = sanitizeOrderForFirestore(order);
    const docRef = doc(db, ORDERS_COLLECTION, order.id);
    await setDoc(docRef, { ...cleanOrder, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (error) {
    console.error('Firestore save order error:', error);
    return false;
  }
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
