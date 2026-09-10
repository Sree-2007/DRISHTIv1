import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Change to your machine's LAN IP when running Expo on a physical device
const HOST = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';

export const BASE_URL = HOST;

const api = axios.create({ baseURL: `${HOST}/api` });

api.interceptors.request.use(async (cfg) => {
  const t = await AsyncStorage.getItem('drishti_token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

export default api;
