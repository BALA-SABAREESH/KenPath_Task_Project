import axios from 'axios';
import { Reading, ReadingPayload, ReportData, User, DBStatus } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token automatically
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('sweety_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401s gracefully
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config.url.includes('/auth/login')) {
      localStorage.removeItem('sweety_token');
      localStorage.removeItem('sweety_user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register' && window.location.pathname !== '/') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: async (data: { name: string; email: string; password: string }) => {
    const res = await apiClient.post<{ success: boolean; user: User; token: string }>('/auth/register', data);
    return res.data;
  },
  login: async (data: { email: string; password: string }) => {
    const res = await apiClient.post<{ success: boolean; user: User; token: string }>('/auth/login', data);
    return res.data;
  },
  getMe: async () => {
    const res = await apiClient.get<{ success: boolean; user: User }>('/auth/me');
    return res.data.user;
  },
};

// Readings API
export const readingsApi = {
  getAll: async (params?: { date?: string; startDate?: string; endDate?: string }) => {
    const res = await apiClient.get<{ success: boolean; readings: Reading[] }>('/readings', { params });
    return res.data.readings;
  },
  getById: async (id: string) => {
    const res = await apiClient.get<{ success: boolean; reading: Reading }>(`/readings/${id}`);
    return res.data.reading;
  },
  create: async (data: ReadingPayload) => {
    const res = await apiClient.post<{ success: boolean; message: string; reading: Reading }>('/readings', data);
    return res.data.reading;
  },
  update: async (id: string, data: ReadingPayload) => {
    const res = await apiClient.put<{ success: boolean; message: string; reading: Reading }>(`/readings/${id}`, data);
    return res.data.reading;
  },
  delete: async (id: string) => {
    const res = await apiClient.delete<{ success: boolean; message: string }>(`/readings/${id}`);
    return res.data;
  },
};

// Reports API
export const reportsApi = {
  getDaily: async (date?: string) => {
    const res = await apiClient.get<{ success: boolean; report: ReportData }>('/reports/daily', {
      params: date ? { date } : {},
    });
    return res.data.report;
  },
  getMonthToDate: async (date?: string) => {
    const res = await apiClient.get<{ success: boolean; report: ReportData }>('/reports/month-to-date', {
      params: date ? { date } : {},
    });
    return res.data.report;
  },
  getMonthly: async (date?: string) => {
    const res = await apiClient.get<{ success: boolean; report: ReportData }>('/reports/monthly', {
      params: date ? { date } : {},
    });
    return res.data.report;
  },
};

// System / Neon Database API
export const systemApi = {
  getStatus: async () => {
    const res = await apiClient.get<{ success: boolean; database: DBStatus }>('/system/status');
    return res.data.database;
  },
  configureDb: async (databaseUrl: string) => {
    const res = await apiClient.post<{ success: boolean; message: string; database: DBStatus }>('/system/configure-db', {
      databaseUrl,
    });
    return res.data;
  },
};
