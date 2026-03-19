import axios from 'axios';

const apiClient = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// ── Request interceptor ───────────────────────────────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('ds_token');
      if (token && config.headers) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor ──────────────────────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Globally handle 401 – session expired
    if (error.response?.status === 401) {
      // Remove stale token
      localStorage.removeItem('ds_token');
      localStorage.removeItem('ds_user');
      delete apiClient.defaults.headers.common['Authorization'];

      // Redirect to login (only safe to do in browser)
    // Skip redirect for public routes that allow unauthenticated access
    const publicPaths = ['/login', '/register', '/integration'];
    const isPublic = typeof window !== 'undefined' && publicPaths.some((p) => window.location.pathname.startsWith(p));
    if (typeof window !== 'undefined' && !isPublic) {
      window.location.href = '/login';
    }
    }

    // Normalise error message for UI consumption
    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';

    return Promise.reject(new Error(message));
  }
);

export default apiClient;
