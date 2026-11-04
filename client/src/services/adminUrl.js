const ADMIN_BASE_URL = (import.meta.env.VITE_ADMIN_URL || '').replace(/\/+$/, '');

export function adminUrl(path = '/dashboard') {
  if (!ADMIN_BASE_URL) return '/admin-dashboard';
  return `${ADMIN_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
