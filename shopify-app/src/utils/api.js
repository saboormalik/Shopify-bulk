import axios from 'axios';
import { getSessionToken } from '@shopify/app-bridge/utilities';
import createApp from '@shopify/app-bridge';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

let appBridge = null;

export const initializeAppBridge = (config) => {
  appBridge = createApp(config);
  return appBridge;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    if (appBridge) {
      try {
        const token = await getSessionToken(appBridge);
        config.headers['Authorization'] = `Bearer ${token}`;
      } catch (error) {
        console.error('Failed to get session token:', error);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('Unauthorized - session token invalid');
    }
    return Promise.reject(error);
  }
);

export default api;
