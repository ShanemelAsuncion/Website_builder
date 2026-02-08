import axios from 'axios';

// API base URL is set at runtime via setApiBaseUrl. Default to local dev.
let API_BASE_URL = 'http://localhost:5000/api';
let BACKEND_BASE_URL = API_BASE_URL.replace(/\/?api\/?$/, '');
export const setApiBaseUrl = (base: string) => {
  API_BASE_URL = base.replace(/\/$/, '');
  BACKEND_BASE_URL = API_BASE_URL.replace(/\/?api\/?$/, '');
  api.defaults.baseURL = API_BASE_URL;
};

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {}; // Ensure headers object exists
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const cfg = error?.config || {};
    // Retry on 429/503 with exponential backoff (max 2 retries)
    if (status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/admin/login';
      return Promise.reject(error);
    }
    if ((status === 429 || status === 503) && cfg && !cfg.__retryDisabled) {
      cfg.__retryCount = (cfg.__retryCount || 0) as number;
      const maxRetries = 2;
      if (cfg.__retryCount < maxRetries) {
        cfg.__retryCount++;
        // Honor Retry-After if present
        let delayMs = 0;
        const retryAfter = error?.response?.headers?.['retry-after'];
        if (retryAfter) {
          const asNum = Number(retryAfter);
          if (!isNaN(asNum)) delayMs = asNum * 1000;
        }
        if (!delayMs) {
          // base 500ms * 2^retries with jitter
          const base = 500 * Math.pow(2, cfg.__retryCount - 1);
          delayMs = base + Math.floor(Math.random() * 200);
        }
        await new Promise((r) => setTimeout(r, delayMs));
        return api(cfg);
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  register: async (email: string, password: string) => {
    const response = await api.post('/auth/register', { email, password });
    return response.data;
  },
  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  getFullProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data as { user: { id: number; email: string; isMaster: number } };
  },
  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.post('/auth/change-password', { currentPassword, newPassword });
    return response.data;
  },
  forgotPassword: async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data as { message: string };
  },
  resetPassword: async (token: string, newPassword: string) => {
    const response = await api.post('/auth/reset-password', { token, newPassword });
    return response.data as { message: string };
  },
  requestEmailChange: async (newEmail: string) => {
    const response = await api.post('/auth/request-email-change', { newEmail });
    return response.data as { message: string };
  },
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data as { url: string; path: string };
  }
};

// Content API
export const contentApi = {
  getAll: async () => {
    const response = await api.get('/content');
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/content/${id}`);
    return response.data;
  },
  createOrUpdate: async (id: string, data: { key: string; value: string; type: string }) => {
    const response = await api.put(`/content/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    await api.delete(`/content/${id}`);
  },
  reset: async () => {
    await api.post('/content/reset');
  }
};

// Admin (master only)
export const adminApi = {
  listUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data as Array<{ id: number; email: string; isMaster: number; createdAt: string }>;
  },
  createUser: async (payload: { email: string; password: string; isMaster?: boolean }) => {
    const response = await api.post('/admin/users', payload);
    return response.data as { id: number; email: string; isMaster: boolean };
  },
  updateUser: async (id: number, payload: { email?: string; password?: string; isMaster?: boolean }) => {
    const response = await api.put(`/admin/users/${id}`, payload);
    return response.data as { id: number; email: string; isMaster: number; createdAt: string };
  },
  deleteUser: async (id: number) => {
    await api.delete(`/admin/users/${id}`);
  }
};

export default api;

// Resolve asset URLs (e.g., images) to the backend origin so relative /uploads paths work in the browser
export const resolveAssetUrl = (url?: string) => {
  if (!url) return '';
  try {
    // If it's already absolute (http/https), return as-is
    if (/^https?:\/\//i.test(url)) return url;
  } catch {}
  // Ensure single slash between base and path
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${BACKEND_BASE_URL}${path}`;
};
