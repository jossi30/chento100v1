import { auth } from '../firebase';

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

export async function apiFetch(path, options = {}) {
  const url = typeof path === 'string' && path.startsWith('/api/')
    ? `${API_BASE_URL}${path}`
    : path;
  const headers = new Headers(options.headers || {});
  if (auth.currentUser) {
    try {
      headers.set('Authorization', `Bearer ${await auth.currentUser.getIdToken()}`);
    } catch {
      // Fallback to token if getIdToken fails
    }
  }
  if (!headers.has('Authorization')) {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token') || localStorage.getItem('admin_token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }
  return fetch(url, { ...options, headers, credentials: options.credentials || 'include' });
}
