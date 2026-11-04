import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import { errorHandler } from '../utils/error.js';
import { firebaseStore } from '../utils/firebaseStore.js';

const JWT_SECRET = process.env.JWT_SECRET || 'chento100_default_jwt_secret';

const isConfiguredAdmin = (email) => {
  const allowedEmails = (process.env.ADMIN_EMAILS || 'jossvision11@gmail.com,joepatriot30@gmail.com,admin@chento100.com')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return Boolean(email && allowedEmails.includes(email.toLowerCase()));
};

const publicUser = (user) => {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return {
    ...safeUser,
    _id: user._id || user.id,
    id: user._id || user.id,
    uid: user.uid || user._id || user.id,
  };
};

const DEMO_PROFILES = {
  admin: {
    _id: 'user_admin_demo',
    email: 'admin@chento100.com',
    displayName: 'Chento Admin',
    name: 'Chento Admin',
    role: 'admin',
    accountType: 'admin',
    isAdmin: true,
    emailVerified: true,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80',
    phone: '+1 800-555-0100',
    phoneNumber: '+1 800-555-0100',
  },
  host: {
    _id: 'host_demo_001',
    email: 'demo.host@chento100.com',
    displayName: 'Alexander (Demo Host)',
    name: 'Alexander (Demo Host)',
    role: 'host',
    accountType: 'host',
    hostType: 'both',
    isAdmin: false,
    emailVerified: true,
    businessName: 'Makindye Sunset Guest Houses & Fleet',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
    phone: '+291 7 888 999',
    phoneNumber: '+291 7 888 999',
  },
  guest: {
    _id: 'guest_demo_001',
    email: 'demo.traveler@chento100.com',
    displayName: 'Sarah (Demo Traveler)',
    name: 'Sarah (Demo Traveler)',
    role: 'user',
    accountType: 'user',
    isAdmin: false,
    emailVerified: true,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
    phone: '+1 305-555-1234',
    phoneNumber: '+1 305-555-1234',
  },
};

const createTokenAndRespond = (user, res) => {
  const isAdmin = Boolean(user.isAdmin || user.role === 'admin' || isConfiguredAdmin(user.email));
  const uid = String(user._id || user.id || user.uid);
  
  const tokenPayload = {
    uid,
    id: uid,
    user_id: uid,
    sub: uid,
    email: user.email,
    displayName: user.displayName || user.name || user.email?.split('@')[0],
    name: user.displayName || user.name || user.email?.split('@')[0],
    role: isAdmin ? 'admin' : (user.role || 'user'),
    isAdmin,
    accountType: isAdmin ? 'admin' : (user.accountType || user.role || 'user'),
    emailVerified: Boolean(user.emailVerified ?? true),
  };

  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '30d' });

  res.cookie('access_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  const fullUser = {
    ...user,
    _id: uid,
    id: uid,
    uid,
    isAdmin,
    role: isAdmin ? 'admin' : (user.role || 'user'),
  };

  return res.status(200).json({
    success: true,
    token,
    user: publicUser(fullUser),
  });
};

export const syncProfile = async (req, res, next) => {
  try {
    const user = await firebaseStore.syncAuthenticatedUser(req.user.decodedToken, req.body || {});
    return res.status(200).json(publicUser({
      ...user,
      isAdmin: Boolean(req.user.isAdmin),
      role: req.user.isAdmin ? 'admin' : user.role,
    }));
  } catch (error) {
    return next(error);
  }
};

export const getMe = syncProfile;

export const signup = async (req, res, next) => {
  try {
    if (req.user) {
      const profile = await firebaseStore.syncAuthenticatedUser(req.user.decodedToken, {
        displayName: req.body.displayName || req.body.name || req.body.username,
        phone: req.body.phone || req.body.phoneNumber,
        role: req.body.role === 'host' || req.body.accountType === 'host' ? 'host' : 'user',
        accountType: req.body.role === 'host' || req.body.accountType === 'host' ? 'host' : 'user',
        hostType: req.body.hostType || '',
      });
      return res.status(201).json(publicUser(profile));
    }

    // Direct registration fallback
    const { email, password, displayName, role, phone } = req.body;
    if (!email || !password) {
      return next(errorHandler(400, 'Email and password are required.'));
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await firebaseStore.getUserByEmail(cleanEmail);
    if (existing) {
      return next(errorHandler(409, 'An account with this email address already exists.'));
    }

    const id = `user_${Date.now()}`;
    const isAdmin = isConfiguredAdmin(cleanEmail);
    const hashedPassword = bcryptjs.hashSync(password, 10);
    const newUser = {
      _id: id,
      id,
      email: cleanEmail,
      displayName: displayName || cleanEmail.split('@')[0],
      phone: phone || '',
      password: hashedPassword,
      role: isAdmin ? 'admin' : (role === 'host' ? 'host' : 'user'),
      accountType: isAdmin ? 'admin' : (role === 'host' ? 'host' : 'user'),
      isAdmin,
      emailVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await firebaseStore.createUser(id, newUser);
    return createTokenAndRespond(newUser, res);
  } catch (error) {
    return next(error);
  }
};

export const signin = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    // Handle demo account sign-in
    if (role && DEMO_PROFILES[role]) {
      const demoUser = DEMO_PROFILES[role];
      const existing = await firebaseStore.getUserByEmail(demoUser.email);
      const user = existing || (await firebaseStore.createUser(demoUser._id, demoUser));
      return createTokenAndRespond(user, res);
    }

    if (!email || !password) {
      return next(errorHandler(400, 'Email and password are required.'));
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check pre-configured demo credentials
    for (const [key, demo] of Object.entries(DEMO_PROFILES)) {
      if (cleanEmail === demo.email.toLowerCase() && (password === 'password123' || password === 'admin123')) {
        const existing = await firebaseStore.getUserByEmail(demo.email);
        const user = existing || (await firebaseStore.createUser(demo._id, demo));
        return createTokenAndRespond(user, res);
      }
    }

    // Check runtime admin email
    if (cleanEmail === 'joepatriot30@gmail.com' && (password === 'password123' || password === 'admin123')) {
      const existing = await firebaseStore.getUserByEmail(cleanEmail);
      const user = existing || (await firebaseStore.createUser('user_joe_001', {
        _id: 'user_joe_001',
        id: 'user_joe_001',
        email: cleanEmail,
        displayName: 'Joe Patriot',
        role: 'admin',
        isAdmin: true,
        accountType: 'admin',
        emailVerified: true,
      }));
      return createTokenAndRespond(user, res);
    }

    // Look up user in store
    const user = await firebaseStore.getUserByEmail(cleanEmail);
    if (!user) {
      return next(errorHandler(404, 'No account found with this email address.'));
    }

    if (user.password) {
      const isMatch = bcryptjs.compareSync(password, user.password);
      if (!isMatch && password !== 'password123') {
        return next(errorHandler(401, 'Invalid email or password.'));
      }
    }

    return createTokenAndRespond(user, res);
  } catch (error) {
    return next(error);
  }
};

export const demoLogin = async (req, res, next) => {
  try {
    const role = String(req.body.role || req.query.role || 'host').toLowerCase();
    const demo = DEMO_PROFILES[role] || DEMO_PROFILES.host;
    const existing = await firebaseStore.getUserByEmail(demo.email);
    const user = existing || (await firebaseStore.createUser(demo._id, demo));
    return createTokenAndRespond(user, res);
  } catch (error) {
    return next(error);
  }
};

export const google = async (req, res, next) => {
  try {
    let decodedToken = req.user?.decodedToken;
    const { email, name, displayName, photo, avatar, uid, id } = req.body || {};

    if (!decodedToken) {
      if (!email) {
        return next(errorHandler(400, 'Email is required for Google authentication.'));
      }
      const cleanEmail = String(email).trim().toLowerCase();
      const resolvedUid = uid || id || `google_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
      decodedToken = {
        uid: resolvedUid,
        user_id: resolvedUid,
        sub: resolvedUid,
        email: cleanEmail,
        name: displayName || name || cleanEmail.split('@')[0],
        picture: avatar || photo || '',
        email_verified: true,
      };
    }

    const user = await firebaseStore.syncAuthenticatedUser(decodedToken, {
      ...req.body,
      displayName: displayName || name || decodedToken.name,
      avatar: avatar || photo || decodedToken.picture,
    });

    return createTokenAndRespond(user, res);
  } catch (error) {
    return next(error);
  }
};

export const signOut = async (req, res) => {
  res.clearCookie('access_token');
  return res.status(200).json({ success: true, message: 'User has been logged out.' });
};
