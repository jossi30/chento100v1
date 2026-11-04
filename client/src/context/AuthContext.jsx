import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  EmailAuthProvider,
  reauthenticateWithCredential,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from '../firebase';
import { apiFetch } from '../services/apiFetch';

const AuthContext = createContext(null);

export const DEMO_ACCOUNTS = {
  host: {
    email: 'demo.host@chento100.com',
    password: 'password123',
    displayName: 'Alexander (Demo Host)',
    phone: '+291 7 888 999',
    role: 'host',
    accountType: 'host',
    hostType: 'both',
  },
  admin: {
    email: 'admin@chento100.com',
    password: 'password123',
    displayName: 'Chento Admin',
    phone: '+1 800-555-0100',
    role: 'admin',
    accountType: 'admin',
  },
  guest: {
    email: 'demo.traveler@chento100.com',
    password: 'password123',
    displayName: 'Sarah (Demo Traveler)',
    phone: '+1 305-555-1234',
    role: 'user',
    accountType: 'user',
  },
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Keep the application profile synchronized with the shared API/Firestore store.
  const fetchUserData = async (firebaseUser) => {
    if (!firebaseUser) {
      setUserProfile(null);
      setIsAdmin(false);
      return;
    }

    try {
      const response = await apiFetch('/api/auth/me');
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || `Could not load user profile (${response.status}).`);
      }
      const data = await response.json();
      setUserProfile(data);
      setIsAdmin(Boolean(data.isAdmin || data.role === 'admin'));
      return data;
    } catch (err) {
      console.error('Error fetching user profile from backend:', err);
      setUserProfile({
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
        phone: firebaseUser.phoneNumber || '',
        role: 'user',
        accountType: 'user',
      });
      setIsAdmin(false);
      return null;
    }
  };

  const handleBackendSession = (token, user) => {
    localStorage.setItem('auth_token', token);
    const uid = String(user._id || user.id || user.uid);
    const isAdminUser = Boolean(user.isAdmin || user.role === 'admin');
    const syntheticUser = {
      uid,
      id: uid,
      _id: uid,
      email: user.email,
      displayName: user.displayName || user.name || user.email?.split('@')[0],
      photoURL: user.avatar || user.photoURL || '',
      emailVerified: Boolean(user.emailVerified ?? true),
      role: isAdminUser ? 'admin' : (user.role || 'user'),
      isAdmin: isAdminUser,
      getIdToken: async () => token,
    };
    setCurrentUser(syntheticUser);
    setUserProfile(user);
    setIsAdmin(isAdminUser);
    return {
      uid,
      email: user.email,
      displayName: syntheticUser.displayName,
      photoURL: syntheticUser.photoURL,
      emailVerified: syntheticUser.emailVerified,
      role: isAdminUser ? 'admin' : (user.role || 'user'),
      isAdmin: isAdminUser,
    };
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        await fetchUserData(user);
        setLoading(false);
      } else {
        const storedToken = localStorage.getItem('auth_token') || localStorage.getItem('token');
        if (storedToken) {
          try {
            const response = await apiFetch('/api/auth/me');
            if (response.ok) {
              const data = await response.json();
              handleBackendSession(storedToken, data);
              setLoading(false);
              return;
            }
          } catch (e) {
            console.warn('Backend session restoration failed:', e);
          }
        }
        setCurrentUser(null);
        setUserProfile(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // Sign up with Email and Password
  const signUp = async (email, password, displayName = '', phone = '', role = 'user') => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const user = cred.user;

      if (displayName) {
        await updateProfile(user, { displayName }).catch(console.warn);
      }

      try {
        await sendEmailVerification(user);
      } catch (vErr) {
        console.warn('Verification email send notice:', vErr.message);
      }

      const userDoc = {
        email,
        displayName: displayName || email.split('@')[0],
        phone: phone || '',
        role: role === 'host' ? 'host' : 'user',
        accountType: role === 'host' ? 'host' : 'user',
        emailVerified: user.emailVerified,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        disabled: false,
      };

      const response = await apiFetch('/api/auth/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userDoc),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || `Could not create user profile (${response.status}).`);
      }
      const profile = await response.json();
      setUserProfile(profile);
      setIsAdmin(Boolean(profile.isAdmin || profile.role === 'admin'));
      return {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
        isAdmin: Boolean(profile.isAdmin || profile.role === 'admin'),
        role: profile.role || 'user',
      };
    } catch (fbErr) {
      // Backend registration fallback
      const response = await apiFetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName, phone, role }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.token && data.user) {
        return handleBackendSession(data.token, data.user);
      }
      throw new Error(data.message || fbErr.message || 'Registration failed.');
    }
  };

  // Sign in with Email and Password
  const signIn = async (email, password) => {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const profile = await fetchUserData(credential.user);
      if (!profile) {
        throw new Error('Your account was authenticated, but the application profile could not be loaded.');
      }
      return {
        uid: credential.user.uid,
        email: credential.user.email,
        displayName: credential.user.displayName,
        photoURL: credential.user.photoURL,
        emailVerified: credential.user.emailVerified,
        role: profile?.role || 'user',
        isAdmin: Boolean(profile?.isAdmin || profile?.role === 'admin'),
      };
    } catch (firebaseErr) {
      // Backend authentication fallback
      const res = await apiFetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.token && data.user) {
        return handleBackendSession(data.token, data.user);
      }
      throw new Error(data.message || firebaseErr.message || 'Authentication failed.');
    }
  };

  // Sign in with Google Popup
  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const credential = await signInWithPopup(auth, provider);
      const user = credential.user;

      try {
        const idToken = await user.getIdToken();
        const res = await apiFetch('/api/auth/google', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            uid: user.uid,
            id: user.uid,
            email: user.email,
            displayName: user.displayName || user.email?.split('@')[0],
            avatar: user.photoURL,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.token && data.user) {
            handleBackendSession(data.token, data.user);
          }
        }
      } catch (backendErr) {
        console.warn('Backend sync note:', backendErr.message);
      }

      const profile = await fetchUserData(user);
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
        role: profile?.role || 'user',
        isAdmin: Boolean(profile?.isAdmin || profile?.role === 'admin'),
      };
    } catch (googleErr) {
      console.error('Google Sign In error:', googleErr);
      throw googleErr;
    }
  };

  // Quick Demo Account Sign-In (Customer Guest by default)
  const loginDemo = async (accountType = 'guest') => {
    try {
      const res = await apiFetch('/api/auth/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: accountType }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.token && data.user) {
          return handleBackendSession(data.token, data.user);
        }
      }
    } catch (e) {
      console.warn('Demo API route fallback:', e);
    }
    const demo = DEMO_ACCOUNTS[accountType] || DEMO_ACCOUNTS.guest;
    return signIn(demo.email, demo.password);
  };

  // Resend verification email
  const resendVerification = async () => {
    if (!auth.currentUser) throw new Error('You must be signed in to send a verification email.');
    await sendEmailVerification(auth.currentUser);
  };

  // Send password reset email
  const resetPassword = async (email) => {
    if (!email) throw new Error('Please provide an email address.');
    await sendPasswordResetEmail(auth, email);
  };

  // Sign out
  const logOut = async () => {
    try {
      await firebaseSignOut(auth).catch(() => {});
      await apiFetch('/api/auth/signout').catch(() => {});
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('token');
      setCurrentUser(null);
      setUserProfile(null);
      setIsAdmin(false);
    }
  };

  // Update profile
  const updateUser = async (updates) => {
    if (!auth.currentUser) throw new Error('Not authenticated');

    if (updates.displayName) {
      await updateProfile(auth.currentUser, { displayName: updates.displayName });
    }

    const response = await apiFetch(`/api/user/${auth.currentUser.uid}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.message || `Could not update user profile (${response.status}).`);
    }

    const profile = await response.json();
    setUserProfile(profile);
  };

  // Re-authenticate before destructive actions
  const reauthenticateAdmin = async (password) => {
    if (!auth.currentUser) throw new Error('Not authenticated');
    if (!password) throw new Error('Password is required for re-authentication');
    const cred = EmailAuthProvider.credential(auth.currentUser.email, password);
    await reauthenticateWithCredential(auth.currentUser, cred);
    return true;
  };

  const isEmailVerified = Boolean(
    currentUser?.emailVerified ||
    userProfile?.emailVerified ||
    isAdmin
  );

  const value = {
    currentUser,
    userProfile,
    isAdmin,
    isEmailVerified,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    loginDemo,
    DEMO_ACCOUNTS,
    resendVerification,
    resetPassword,
    reauthenticateAdmin,
    logOut,
    updateUser,
    refreshUserData: () => fetchUserData(auth.currentUser),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
