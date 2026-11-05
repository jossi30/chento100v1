import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { apiFetch } from '../utils/apiFetch';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadProfile = async (firebaseUser) => {
    const response = await apiFetch('/api/auth/me', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        displayName: firebaseUser.displayName || '',
        avatar: firebaseUser.photoURL || '',
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || `Could not load admin profile (${response.status}).`);
    }
    if (!data.isAdmin && data.role !== 'admin') {
      await signOut(auth);
      throw new Error('This account does not have administrator access.');
    }
    setUser(data);
    localStorage.setItem('admin_user', JSON.stringify(data));
    return data;
  };

  const checkAuth = async () => {
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
      try {
        return await loadProfile(firebaseUser);
      } catch (authError) {
        setUser(null);
        localStorage.removeItem('admin_user');
        setError(authError.message);
        throw authError;
      } finally {
        setLoading(false);
      }
    }

    const storedToken = localStorage.getItem('admin_token');
    if (storedToken) {
      try {
        const res = await apiFetch('/api/auth/me');
        if (res.ok) {
          const profile = await res.json();
          if (profile.isAdmin || profile.role === 'admin') {
            setUser(profile);
            localStorage.setItem('admin_user', JSON.stringify(profile));
            setLoading(false);
            return profile;
          }
        }
      } catch (e) {
        console.warn('Session check error:', e);
      }
    }

    setUser(null);
    localStorage.removeItem('admin_user');
    setLoading(false);
    return null;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          await loadProfile(firebaseUser);
          setError(null);
        } catch (authError) {
          setUser(null);
          localStorage.removeItem('admin_user');
          setError(authError.message);
        } finally {
          setLoading(false);
        }
      } else {
        const storedToken = localStorage.getItem('admin_token');
        if (storedToken) {
          try {
            const res = await apiFetch('/api/auth/me');
            if (res.ok) {
              const profile = await res.json();
              if (profile.isAdmin || profile.role === 'admin') {
                setUser(profile);
                localStorage.setItem('admin_user', JSON.stringify(profile));
                setLoading(false);
                return;
              }
            }
          } catch (e) {
            console.warn('Admin token restoration failed:', e);
          }
        }
        setUser(null);
        localStorage.removeItem('admin_user');
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const loginDemo = async (role = 'admin') => {
    setError(null);
    try {
      const res = await apiFetch('/api/auth/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.token || !data.user) {
        throw new Error(data.message || 'Demo sign in failed.');
      }
      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_user', JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    } catch (authError) {
      setError(authError.message || 'Demo authentication failed.');
      throw authError;
    }
  };

  const login = async (email, password) => {
    setError(null);
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      return await loadProfile(credential.user);
    } catch (authError) {
      if (authError.code === 'auth/operation-not-allowed') {
        const message = 'Email and password sign-in is disabled in Firebase. Enable Authentication → Sign-in method → Email/Password for the Chento100 Firebase project, then try again.';
        setError(message);
        throw new Error(message);
      }
      setError(authError.message || 'Authentication failed. Please check your credentials.');
      throw authError;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth).catch(() => {});
      await apiFetch('/api/auth/signout').catch(() => {});
    } finally {
      setUser(null);
      localStorage.removeItem('admin_user');
      localStorage.removeItem('admin_token');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        loading,
        error,
        setError,
        login,
        loginDemo,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
