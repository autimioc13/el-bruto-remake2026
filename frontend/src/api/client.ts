import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const raw = localStorage.getItem('session');
  if (raw && raw !== 'null') {
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.access_token) {
        config.headers.Authorization = `Bearer ${parsed.access_token}`;
      }
    } catch {}
  }
  return config;
});

export default api;
