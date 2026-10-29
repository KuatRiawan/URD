import axios from 'axios';

export const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  headers: {
    'X-Requested-With': 'XMLHttpRequest'
  }
});

let memoryAccessToken = null;
let onUnauthorizedCallback = null;
let refreshPromise = null;

export function setAccessToken(token) {
  memoryAccessToken = token;
}

export function setOnUnauthorized(cb) {
  onUnauthorizedCallback = cb;
}

export function getErrorMessage(err, fallback = 'Terjadi kendala saat memproses permintaan.') {
  return err?.response?.data?.error?.message || err?.message || fallback;
}

export async function performRefresh() {
  if (!refreshPromise) {
    refreshPromise = api
      .post('/auth/refresh')
      .then((res) => {
        setAccessToken(res.data?.accessToken);
        return res.data;
      })
      .finally(() => {
        setTimeout(() => {
          refreshPromise = null;
        }, 500);
      });
  }
  return refreshPromise;
}

api.interceptors.request.use((config) => {
  if (memoryAccessToken) {
    config.headers.Authorization = `Bearer ${memoryAccessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const isAuthRoute =
      original?.url?.includes('/auth/login') ||
      original?.url?.includes('/auth/refresh') ||
      original?.url?.includes('/auth/logout');

    if (status === 401 && !original?._retry && !isAuthRoute) {
      original._retry = true;
      try {
        const data = await performRefresh();
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (refreshErr) {
        setAccessToken(null);
        if (onUnauthorizedCallback) onUnauthorizedCallback();
        return Promise.reject(refreshErr);
      }
    }
    return Promise.reject(error);
  }
);
