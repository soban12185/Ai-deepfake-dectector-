import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 120000, // 2 min for video uploads
});

// Attach JWT from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally → redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// ─── Auth ───────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data) => api.post('/auth/register', data).then((r) => r.data),
  login: (data) => api.post('/auth/login', data).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
};

// ─── Detections ──────────────────────────────────────────────────────────────
export const detectionsApi = {
  analyzeImage: (formData, onProgress) =>
    api.post('/detections/analyze/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => onProgress && onProgress(Math.round((e.loaded * 100) / e.total)),
    }).then((r) => r.data),

  analyzeVideo: (formData, onProgress) =>
    api.post('/detections/analyze/video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => onProgress && onProgress(Math.round((e.loaded * 100) / e.total)),
    }).then((r) => r.data),

  list: (skip = 0, limit = 20) =>
    api.get('/detections/', { params: { skip, limit } }).then((r) => r.data),

  get: (id) => api.get(`/detections/${id}`).then((r) => r.data),

  stats: () => api.get('/detections/stats').then((r) => r.data),

  delete: (id) => api.delete(`/detections/${id}`),

  downloadReport: (id) =>
    api.post(`/detections/${id}/report`, {}, { responseType: 'blob' }),

  heatmapUrl: (filename) => `${BASE_URL}/detections/heatmap/${filename}`,
};

// ─── Admin ───────────────────────────────────────────────────────────────────
export const adminApi = {
  stats: () => api.get('/admin/stats').then((r) => r.data),
  users: () => api.get('/admin/users').then((r) => r.data),
};

// Health
export const healthApi = {
  check: () => axios.get((import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/health').then((r) => r.data),
};
