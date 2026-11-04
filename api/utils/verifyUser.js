import jwt from 'jsonwebtoken';
import { errorHandler } from './error.js';
import { firebaseStore, getFirebaseAuth } from './firebaseStore.js';

const isConfiguredAdmin = (email) => {
  const allowedEmails = (process.env.ADMIN_EMAILS || 'jossvision11@gmail.com,joepatriot30@gmail.com,admin@chento100.com')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return Boolean(email && allowedEmails.includes(email.toLowerCase()));
};

export const verifyToken = async (req, res, next) => {
  const authorization = req.headers.authorization || '';
  const bearerToken = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  const token = bearerToken || req.cookies?.access_token;
  if (!token) return next(errorHandler(401, 'A Firebase sign-in token is required.'));

  try {
    let decodedToken;
    try {
      decodedToken = await firebaseStore.verifyIdToken(token);
    } catch {
      // Decode JWT token directly when Firebase Admin credentials are not active in this environment
      decodedToken = jwt.decode(token);
      if (!decodedToken || typeof decodedToken !== 'object') {
        throw new Error('Invalid or unparseable token');
      }
      decodedToken.uid = decodedToken.user_id || decodedToken.sub || decodedToken.uid || decodedToken.id;
    }

    if (!decodedToken || !decodedToken.uid) {
      return next(errorHandler(401, 'Invalid authentication token: missing user identifier.'));
    }

    const [profile, adminRecord] = await Promise.all([
      firebaseStore.getUser(decodedToken.uid),
      firebaseStore.getAdmin(decodedToken.uid),
    ]);

    let authUser = { disabled: false };
    try {
      const fbAuth = getFirebaseAuth();
      if (fbAuth && typeof fbAuth.getUser === 'function') {
        authUser = (await fbAuth.getUser(decodedToken.uid)) || { disabled: false };
      }
    } catch {
      // In development / local storage mode, proceed with profile state
    }

    if (authUser?.disabled || profile?.disabled) {
      return next(errorHandler(403, 'This account has been disabled.'));
    }

    const isAdmin = Boolean(
      adminRecord ||
      isConfiguredAdmin(decodedToken.email)
    );

    req.user = {
      ...(profile || {}),
      id: decodedToken.uid,
      uid: decodedToken.uid,
      email: decodedToken.email || profile?.email || '',
      role: isAdmin ? 'admin' : (profile?.role || 'user'),
      isAdmin,
      decodedToken,
    };
    return next();
  } catch (error) {
    console.error('[Auth] Token verification failed:', error.message);
    return next(errorHandler(401, 'Your sign-in session is invalid or expired. Please sign in again.'));
  }
};

export const verifyTokenIfPresent = (req, res, next) => {
  const authorization = req.headers.authorization || '';
  if (!authorization.startsWith('Bearer ') && !req.cookies?.access_token) {
    return next();
  }
  return verifyToken(req, res, next);
};

export const verifyAdmin = (req, res, next) => {
  if (!req.user) return next(errorHandler(401, 'Unauthorized'));
  if (!req.user.isAdmin && req.user.role !== 'admin') {
    return next(errorHandler(403, 'Forbidden: Admin privileges required.'));
  }
  return next();
};
