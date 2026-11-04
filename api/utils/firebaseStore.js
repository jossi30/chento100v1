import { normalizeListing } from './normalizeListing.js';
import { storage } from './storage.js';
import { mockStore } from './mockStore.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const BACKEND_APP_NAME = 'chento100-api';

const readServiceAccount = () => {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.FIREBASE_SERVICE_ACCOUNT;
  if (json) {
    try {
      return JSON.parse(json);
    } catch (error) {
      console.warn(`[Firebase] FIREBASE_SERVICE_ACCOUNT_JSON invalid: ${error.message}`);
      return null;
    }
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    try {
      return JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8'));
    } catch (error) {
      console.warn(`[Firebase] FIREBASE_SERVICE_ACCOUNT_BASE64 invalid: ${error.message}`);
      return null;
    }
  }

  return null;
};

const resolveProjectId = () =>
  process.env.FIREBASE_PROJECT_ID ||
  process.env.GOOGLE_CLOUD_PROJECT ||
  'prismatic-notch-gxqhd';

const resolveDatabaseId = () =>
  process.env.FIRESTORE_DATABASE_ID ||
  'ai-studio-chento100-47c359d5-20d4-448f-87db-e770c2421000';

let firestore = null;
let firebaseAuth = null;
let firebaseInitialized = false;
let isFirestoreConnected = false;

const initializeFirebase = () => {
  if (firebaseInitialized) {
    return { firestore, firebaseAuth };
  }

  try {
    const serviceAccount = readServiceAccount();
    const hasExplicitCredentials = Boolean(
      serviceAccount ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      process.env.FIRESTORE_EMULATOR_HOST
    );

    if (hasExplicitCredentials) {
      // Lazy import firebase-admin only when credentials exist
      const { applicationDefault, cert, getApps, initializeApp } = require('firebase-admin/app');
      const { getAuth } = require('firebase-admin/auth');
      const { getFirestore } = require('firebase-admin/firestore');

      const projectId = resolveProjectId();
      const existingApp = getApps().find((app) => app.name === BACKEND_APP_NAME);
      let app = existingApp;

      if (!app) {
        app = initializeApp(
          {
            credential: serviceAccount ? cert(serviceAccount) : applicationDefault(),
            projectId,
          },
          BACKEND_APP_NAME
        );
      }

      firestore = getFirestore(app, resolveDatabaseId());
      firebaseAuth = getAuth(app);
      isFirestoreConnected = true;
      console.log(`[Backend] Firestore connected to ${projectId}/${resolveDatabaseId()}`);
    } else {
      console.log('[Backend] No Firebase Admin service account configured; operating with local storage engine.');
    }
  } catch (error) {
    console.warn('[Backend] Firebase Admin initialization skipped:', error.message);
    firestore = null;
    firebaseAuth = null;
    isFirestoreConnected = false;
  }

  firebaseInitialized = true;
  return { firestore, firebaseAuth };
};

// In-memory fallback state collections
const fallbackUsers = new Map(mockStore.users);
const fallbackAdmins = new Map();
// Seed admin records
['user_joe_001', 'user_joss_001', 'user_sahand_001'].forEach((uid) => {
  const u = fallbackUsers.get(uid);
  if (u) {
    fallbackAdmins.set(uid, { uid, email: u.email, role: 'admin', assignedAt: u.createdAt });
  }
});

let fallbackEnquiries = mockStore.getEnquiries();
let fallbackReports = [
  {
    id: 'report_001',
    _id: 'report_001',
    listingId: 'listing_005',
    listingTitle: 'Sunlit Minimalist 1-Bedroom Airbnb Flat with Balcony',
    reporterId: 'guest_lucas_004',
    reason: 'Listing photos need updating with current balcony furniture.',
    status: 'open',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
];
let fallbackAuditLogs = [
  {
    id: 'audit_001',
    _id: 'audit_001',
    adminId: 'user_sahand_001',
    action: 'SYSTEM_BOOTSTRAP',
    targetId: 'chento100_core',
    details: { environment: 'production', version: '1.0.0' },
    timestamp: new Date(Date.now() - 3600000 * 72).toISOString(),
  },
];
let fallbackSettings = {
  adminEmails: ['jossvision11@gmail.com', 'joepatriot30@gmail.com', 'admin@chento100.com'],
  rejectionPresets: [
    'Blurry or low-quality images',
    'Missing or incomplete information',
    'Suspected scam or fraudulent activity',
    'Duplicate listing',
    'Wrong category or inappropriate content',
  ],
  maxPendingPerUser: 5,
  requireEmailVerification: true,
  slaHoursWarning: 48,
  reportThreshold: 3,
};

const cleanData = (value) => {
  if (Array.isArray(value)) {
    return value.map(cleanData).filter((entry) => entry !== undefined);
  }
  if (value && typeof value.toDate === 'function' && typeof value.toMillis === 'function') {
    return value;
  }
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entry]) => entry !== undefined)
        .map(([key, entry]) => [key, cleanData(entry)])
    );
  }
  return value;
};

const getCollection = (name) => {
  const fb = initializeFirebase();
  if (!fb.firestore) return null;
  return fb.firestore.collection(name);
};

export const getFirebaseConfig = () => ({
  projectId: resolveProjectId(),
  firestoreDatabaseId: resolveDatabaseId(),
});

export const initFirebaseStore = async () => {
  const fb = initializeFirebase();
  if (fb.firestore) {
    try {
      await fb.firestore.collection('_health').limit(1).get();
      isFirestoreConnected = true;
      return true;
    } catch (err) {
      console.warn('[Backend] Firestore ping failed; using local persistent store:', err.message);
      isFirestoreConnected = false;
      return false;
    }
  }
  return false;
};

export const firebaseStore = {
  verifyIdToken: async (token) => {
    const fb = initializeFirebase();
    if (fb.firebaseAuth) {
      return fb.firebaseAuth.verifyIdToken(token);
    }
    const jwt = (await import('jsonwebtoken')).default;
    const decoded = jwt.decode(token);
    if (!decoded || typeof decoded !== 'object') {
      throw new Error('Invalid token');
    }
    return {
      uid: decoded.user_id || decoded.sub || decoded.uid || decoded.id,
      email: decoded.email || '',
      email_verified: Boolean(decoded.email_verified),
      name: decoded.name || '',
      picture: decoded.picture || '',
      ...decoded,
    };
  },

  getListings: async (query = {}) => {
    if (isFirestoreConnected) {
      try {
        const snapshot = await getCollection('listings').get();
        const listings = snapshot.docs.map((doc) => normalizeListing(doc.data(), doc.id));
        return listings.filter((item) => listMatches(item, query));
      } catch (err) {
        console.warn('[Firestore] getListings error, falling back to local store:', err.message);
      }
    }
    return storage.getListings(query);
  },

  getAllListings: async () => {
    if (isFirestoreConnected) {
      try {
        const snapshot = await getCollection('listings').get();
        return snapshot.docs.map((doc) => normalizeListing(doc.data(), doc.id));
      } catch (err) {
        console.warn('[Firestore] getAllListings error, falling back to local store:', err.message);
      }
    }
    return storage.getAllListings();
  },

  getListing: async (id) => {
    if (!id) return null;
    if (isFirestoreConnected) {
      try {
        const snapshot = await getCollection('listings').doc(String(id)).get();
        if (snapshot.exists) return normalizeListing(snapshot.data(), snapshot.id);
      } catch (err) {
        console.warn('[Firestore] getListing error, falling back to local store:', err.message);
      }
    }
    return storage.getListing(String(id));
  },

  createListing: async (data) => {
    const listing = storage.createListing(data);
    if (isFirestoreConnected) {
      try {
        const col = getCollection('listings');
        const doc = listing.id ? col.doc(String(listing.id)) : col.doc();
        await doc.set(cleanData(listing));
      } catch (err) {
        console.warn('[Firestore] createListing sync failed:', err.message);
      }
    }
    return listing;
  },

  updateListing: async (id, updates) => {
    const listing = storage.updateListing(String(id), updates);
    if (isFirestoreConnected) {
      try {
        const doc = getCollection('listings').doc(String(id));
        await doc.set(cleanData(listing || updates), { merge: true });
      } catch (err) {
        console.warn('[Firestore] updateListing sync failed:', err.message);
      }
    }
    return listing;
  },

  deleteListing: async (id) => {
    const res = storage.deleteListing(String(id));
    if (isFirestoreConnected) {
      try {
        await getCollection('listings').doc(String(id)).delete();
      } catch (err) {
        console.warn('[Firestore] deleteListing sync failed:', err.message);
      }
    }
    return res;
  },

  approveListing: async (id, adminId) =>
    firebaseStore.updateListing(id, {
      status: 'approved',
      isApproved: true,
      active: true,
      isActive: true,
      rejectionReason: '',
      approvedAt: new Date().toISOString(),
      approvedBy: adminId || '',
    }),

  rejectListing: async (id, reason) =>
    firebaseStore.updateListing(id, {
      status: 'rejected',
      isApproved: false,
      rejectionReason: reason,
    }),

  toggleStatusListing: async (id) => {
    const existing = await firebaseStore.getListing(id);
    if (!existing) return null;
    const active = !(existing.active !== false && existing.isActive !== false);
    return firebaseStore.updateListing(id, { active, isActive: active });
  },

  toggleFeaturedListing: async (id) => {
    const existing = await firebaseStore.getListing(id);
    if (!existing) return null;
    return firebaseStore.updateListing(id, { featured: !existing.featured });
  },

  getUser: async (id) => {
    if (!id) return null;
    if (isFirestoreConnected) {
      try {
        const snapshot = await getCollection('users').doc(String(id)).get();
        if (snapshot.exists) return { ...snapshot.data(), _id: snapshot.id, id: snapshot.id };
      } catch (err) {
        console.warn('[Firestore] getUser fallback:', err.message);
      }
    }
    return fallbackUsers.get(String(id)) || null;
  },

  getUserByEmail: async (email) => {
    if (!email || typeof email !== 'string') return null;
    const target = email.trim().toLowerCase();
    if (isFirestoreConnected) {
      try {
        const snapshot = await getCollection('users').where('email', '==', target).limit(1).get();
        if (!snapshot.empty) {
          const user = snapshot.docs[0];
          return { ...user.data(), _id: user.id, id: user.id };
        }
      } catch (err) {
        console.warn('[Firestore] getUserByEmail fallback:', err.message);
      }
    }
    for (const user of fallbackUsers.values()) {
      if (user?.email && user.email.toLowerCase() === target) {
        return user;
      }
    }
    return null;
  },

  getAdmin: async (id) => {
    if (!id) return null;
    if (isFirestoreConnected) {
      try {
        const snapshot = await getCollection('admins').doc(String(id)).get();
        if (snapshot.exists) return { ...snapshot.data(), uid: snapshot.id };
      } catch (err) {
        console.warn('[Firestore] getAdmin fallback:', err.message);
      }
    }
    return fallbackAdmins.get(String(id)) || null;
  },

  createAdminRecord: async (id, email) => {
    const data = { uid: String(id), email: String(email || '').toLowerCase(), role: 'admin', assignedAt: new Date().toISOString() };
    fallbackAdmins.set(String(id), data);
    if (isFirestoreConnected) {
      try {
        await getCollection('admins').doc(String(id)).set(data, { merge: true });
      } catch (err) {
        console.warn('[Firestore] createAdminRecord sync failed:', err.message);
      }
    }
    return data;
  },

  deleteAdminRecord: async (id) => {
    fallbackAdmins.delete(String(id));
    if (isFirestoreConnected) {
      try {
        await getCollection('admins').doc(String(id)).delete();
      } catch (err) {
        console.warn('[Firestore] deleteAdminRecord sync failed:', err.message);
      }
    }
    return true;
  },

  createUser: async (id, data) => {
    const user = { ...cleanData(data), _id: String(id), id: String(id) };
    fallbackUsers.set(String(id), user);
    if (isFirestoreConnected) {
      try {
        await getCollection('users').doc(String(id)).set(user, { merge: true });
      } catch (err) {
        console.warn('[Firestore] createUser sync failed:', err.message);
      }
    }
    return user;
  },

  updateUser: async (id, updates) => {
    const existing = fallbackUsers.get(String(id)) || {};
    const user = { ...existing, ...cleanData(updates), _id: String(id), id: String(id), updatedAt: new Date().toISOString() };
    fallbackUsers.set(String(id), user);
    if (isFirestoreConnected) {
      try {
        await getCollection('users').doc(String(id)).set(cleanData(updates), { merge: true });
      } catch (err) {
        console.warn('[Firestore] updateUser sync failed:', err.message);
      }
    }
    return user;
  },

  deleteUser: async (id) => {
    if (!id) return false;
    fallbackUsers.delete(String(id));
    fallbackAdmins.delete(String(id));
    if (isFirestoreConnected) {
      try {
        await getCollection('users').doc(String(id)).delete();
        await getCollection('admins').doc(String(id)).delete();
      } catch (err) {
        console.warn('[Firestore] deleteUser sync failed:', err.message);
      }
    }
    return true;
  },

  getUsers: async () => {
    if (isFirestoreConnected) {
      try {
        const snapshot = await getCollection('users').get();
        return snapshot.docs.map((doc) => ({ ...doc.data(), _id: doc.id, id: doc.id }));
      } catch (err) {
        console.warn('[Firestore] getUsers fallback:', err.message);
      }
    }
    return Array.from(fallbackUsers.values());
  },

  getAllUsers: async () => firebaseStore.getUsers(),

  getAdminStats: async () => {
    const [listings, users, reports] = await Promise.all([
      firebaseStore.getAllListings(),
      firebaseStore.getUsers(),
      firebaseStore.getReports(),
    ]);
    const guesthouses = listings.filter((l) => l.category === 'guesthouse');
    const cars = listings.filter((l) => l.category === 'car_service');
    const pending = (l) => l.status === 'pending' || (!l.status && !l.isApproved);
    const approved = (l) => l.status === 'approved' && l.isApproved;
    const active = (l) => l.active !== false && l.isActive !== false;
    const pendingListings = listings.filter(pending);
    const oldestPending = pendingListings.reduce((oldest, l) => {
      const createdAt = new Date(l.createdAt || 0).getTime();
      return !oldest || createdAt < oldest.createdAt
        ? { createdAt, title: l.title || 'Untitled' }
        : oldest;
    }, null);
    const oldestPendingHours = oldestPending
      ? Math.max(0, Math.floor((Date.now() - oldestPending.createdAt) / (60 * 60 * 1000)))
      : 0;
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return {
      totalUsers: users.length,
      totalHosts: users.filter((u) => u.role === 'host' || u.accountType === 'host').length,
      totalGuests: users.filter((u) => u.role === 'user' && u.accountType !== 'host').length,
      newUsers7Days: users.filter((u) => new Date(u.createdAt || 0).getTime() >= sevenDaysAgo).length,
      totalListings: listings.length,
      pendingCount: listings.filter(pending).length,
      approvedCount: listings.filter(approved).length,
      rejectedCount: listings.filter((l) => l.status === 'rejected').length,
      archivedCount: listings.filter((l) => l.status === 'archived').length,
      openReportsCount: reports.filter((r) => r.status === 'open' || !r.status).length,
      hasSlaWarning: oldestPendingHours > 48,
      oldestPendingTitle: oldestPending?.title || '',
      oldestPendingHours,
      guesthouses: {
        total: guesthouses.length,
        approved: guesthouses.filter(approved).length,
        pending: guesthouses.filter(pending).length,
        active: guesthouses.filter(active).length,
      },
      cars: {
        total: cars.length,
        approved: cars.filter(approved).length,
        pending: cars.filter(pending).length,
        active: cars.filter(active).length,
      },
    };
  },

  syncAuthenticatedUser: async (decodedToken, profile = {}) => {
    const id = decodedToken.uid;
    const existing = await firebaseStore.getUser(id);
    const profileFields = [
      'displayName',
      'name',
      'username',
      'phone',
      'phoneNumber',
      'avatar',
      'hostType',
      'businessName',
      'city',
      'registeredAsPartner',
    ];
    const safeProfile = Object.fromEntries(
      profileFields
        .filter((field) => profile[field] !== undefined)
        .map((field) => [field, profile[field]])
    );
    const trustedAdminEmails = (process.env.ADMIN_EMAILS || 'jossvision11@gmail.com,joepatriot30@gmail.com,admin@chento100.com')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);
    const adminRecord = await firebaseStore.getAdmin(id);
    const isAdmin = Boolean(adminRecord || trustedAdminEmails.includes(String(decodedToken.email || '').toLowerCase()));
    const isHost = !isAdmin && (
      profile.role === 'host' ||
      profile.accountType === 'host' ||
      existing?.role === 'host' ||
      existing?.accountType === 'host'
    );
    const user = {
      ...(existing || {}),
      ...cleanData(safeProfile),
      email: String(decodedToken.email || existing?.email || '').toLowerCase(),
      displayName: profile.displayName || decodedToken.name || existing?.displayName || '',
      avatar: profile.avatar || decodedToken.picture || existing?.avatar || '',
      emailVerified: Boolean(decodedToken.email_verified),
      role: isAdmin ? 'admin' : (isHost ? 'host' : 'user'),
      accountType: isAdmin ? 'admin' : (isHost ? 'host' : 'user'),
      isAdmin,
      updatedAt: new Date().toISOString(),
    };
    const saved = await firebaseStore.createUser(id, user);
    if (isAdmin) {
      await firebaseStore.createAdminRecord(id, user.email);
    }
    return saved;
  },

  getEnquiries: async () => {
    if (isFirestoreConnected) {
      try {
        const snapshot = await getCollection('enquiries').orderBy('createdAt', 'desc').get();
        return snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id, _id: doc.id }));
      } catch (err) {
        console.warn('[Firestore] getEnquiries fallback:', err.message);
      }
    }
    return [...fallbackEnquiries];
  },

  updateEnquiry: async (id, updates) => {
    const idx = fallbackEnquiries.findIndex((e) => e.id === id || e._id === id);
    if (idx !== -1) {
      fallbackEnquiries[idx] = { ...fallbackEnquiries[idx], ...cleanData(updates), updatedAt: new Date().toISOString() };
    }
    if (isFirestoreConnected) {
      try {
        const doc = getCollection('enquiries').doc(String(id));
        await doc.set(cleanData(updates), { merge: true });
      } catch (err) {
        console.warn('[Firestore] updateEnquiry sync failed:', err.message);
      }
    }
    return idx !== -1 ? fallbackEnquiries[idx] : { id, ...updates };
  },

  getReports: async () => {
    if (isFirestoreConnected) {
      try {
        const snapshot = await getCollection('reports').get();
        return snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id, _id: doc.id }));
      } catch (err) {
        console.warn('[Firestore] getReports fallback:', err.message);
      }
    }
    return [...fallbackReports];
  },

  createReport: async (data) => {
    const report = { ...cleanData(data), id: `report_${Date.now()}`, _id: `report_${Date.now()}` };
    fallbackReports.unshift(report);
    if (isFirestoreConnected) {
      try {
        const doc = getCollection('reports').doc(report.id);
        await doc.set(report);
      } catch (err) {
        console.warn('[Firestore] createReport sync failed:', err.message);
      }
    }
    return report;
  },

  updateReport: async (id, updates) => {
    const idx = fallbackReports.findIndex((r) => r.id === id || r._id === id);
    if (idx !== -1) {
      fallbackReports[idx] = { ...fallbackReports[idx], ...cleanData(updates), updatedAt: new Date().toISOString() };
    }
    if (isFirestoreConnected) {
      try {
        const doc = getCollection('reports').doc(String(id));
        await doc.set(cleanData(updates), { merge: true });
      } catch (err) {
        console.warn('[Firestore] updateReport sync failed:', err.message);
      }
    }
    return idx !== -1 ? fallbackReports[idx] : null;
  },

  getAuditLogs: async (limit = 50) => {
    const amount = Math.max(1, Math.min(Number(limit) || 50, 200));
    if (isFirestoreConnected) {
      try {
        const snapshot = await getCollection('auditLogs').orderBy('timestamp', 'desc').limit(amount).get();
        return snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id, _id: doc.id }));
      } catch (err) {
        console.warn('[Firestore] getAuditLogs fallback:', err.message);
      }
    }
    return fallbackAuditLogs.slice(0, amount);
  },

  createAuditLog: async (data) => {
    const entry = { ...cleanData(data), id: `audit_${Date.now()}`, _id: `audit_${Date.now()}`, timestamp: data.timestamp || new Date().toISOString() };
    fallbackAuditLogs.unshift(entry);
    if (isFirestoreConnected) {
      try {
        const doc = getCollection('auditLogs').doc(entry.id);
        await doc.set(entry);
      } catch (err) {
        console.warn('[Firestore] createAuditLog sync failed:', err.message);
      }
    }
    return entry;
  },

  getSettings: async (_id) => {
    if (isFirestoreConnected) {
      try {
        const snapshot = await getCollection('settings').doc('marketplace').get();
        if (snapshot.exists) return snapshot.data();
      } catch (err) {
        console.warn('[Firestore] getSettings fallback:', err.message);
      }
    }
    return { ...fallbackSettings };
  },

  updateSettings: async (_id, updates) => {
    fallbackSettings = { ...fallbackSettings, ...cleanData(updates), updatedAt: new Date().toISOString() };
    if (isFirestoreConnected) {
      try {
        const doc = getCollection('settings').doc('marketplace');
        await doc.set(fallbackSettings, { merge: true });
      } catch (err) {
        console.warn('[Firestore] updateSettings sync failed:', err.message);
      }
    }
    return { ...fallbackSettings };
  },
};

export const getFirebaseAuth = () => {
  const fb = initializeFirebase();
  if (fb.firebaseAuth) return fb.firebaseAuth;
  // Local fallback auth interface
  return {
    getUser: async (uid) => {
      const user = await firebaseStore.getUser(uid);
      return { uid, email: user?.email, disabled: Boolean(user?.disabled) };
    },
    updateUser: async (uid, data) => {
      if (data.disabled !== undefined) {
        await firebaseStore.updateUser(uid, { disabled: data.disabled });
      }
    },
    deleteUser: async (uid) => {
      await firebaseStore.deleteUser(uid);
    },
    setCustomUserClaims: async (uid, claims) => {
      if (claims?.admin !== undefined) {
        await firebaseStore.updateUser(uid, { isAdmin: claims.admin, role: claims.admin ? 'admin' : 'user' });
      }
    },
  };
};
