import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const raw = localStorage.getItem('session');
  if (raw) {
    const { access_token } = JSON.parse(raw);
    config.headers.Authorization = `Bearer ${access_token}`;
  }
  return config;
});

export default api;
