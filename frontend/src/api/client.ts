import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

function getSession() {
  const raw = localStorage.getItem('session');
  if (!raw || raw === 'null') return null;
  try { return JSON.parse(raw); } catch { return null; }
}

api.interceptors.request.use((config) => {
  const session = getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

let refreshing: Promise<string | null> | null = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status !== 401 || original._retried) {
      return Promise.reject(error);
    }

    const session = getSession();
    if (!session?.refresh_token) {
      localStorage.removeItem('session');
      window.location.href = '/';
      return Promise.reject(error);
    }

    original._retried = true;

    if (!refreshing) {
      refreshing = axios
        .post(`${import.meta.env.VITE_API_URL}/auth/refresh`, { refresh_token: session.refresh_token })
        .then(({ data }) => {
          localStorage.setItem('session', JSON.stringify(data.session));
          return data.session.access_token as string;
        })
        .catch(() => {
          localStorage.removeItem('session');
          window.location.href = '/';
          return null;
        })
        .finally(() => { refreshing = null; });
    }

    const newToken = await refreshing;
    if (!newToken) return Promise.reject(error);

    original.headers.Authorization = `Bearer ${newToken}`;
    return api(original);
  }
);

export default api;
