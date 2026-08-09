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
 * Sanitizes an order object to ensure it stays well below Firestore's 1MB limit
 */
function sanitizeOrderForFirestore(order: PrintOrder): any {
  if (!order) return {};
  const clean: any = JSON.parse(JSON.stringify(order));

  // Attach current authenticated user id if available
  if (!clean.userId && auth.currentUser?.uid) {
    clean.userId = auth.currentUser.uid;
  }
  if (!clean.customerEmail && auth.currentUser?.email) {
    clean.customerEmail = auth.currentUser.email;
  }

  // Sanitize files array to remove DOM file references or large blob/data URLs
  if (Array.isArray(clean.files)) {
    clean.files = clean.files.map((file: any) => {
      const copy = { ...file };
      delete copy.file; // Delete non-serializable DOM file object
      if (copy.previewUrl) {
        // Strip blob: URLs or data: URLs larger than 25KB from file items to keep payload tiny
        if (typeof copy.previewUrl === 'string' && (copy.previewUrl.startsWith('blob:') || copy.previewUrl.length > 25000)) {
          delete copy.previewUrl;
        }
      }
      return copy;
    });
  }

  // Ensure bankakProofUrl doesn't exceed 250KB to avoid hitting Firestore document size limit
  if (clean.bankakProofUrl && typeof clean.bankakProofUrl === 'string') {
    if (clean.bankakProofUrl.length > 250000) {
      console.warn('Bankak proof image too large for direct Firestore payload, storing order details');
      delete clean.bankakProofUrl;
    }
  }

  // Explicitly strip any undefined properties
  Object.keys(clean).forEach(key => {
    if (clean[key] === undefined) {
      delete clean[key];
    }
  });

  return clean;
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
