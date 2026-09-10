import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('drishti_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401 && localStorage.getItem('drishti_refresh')) {
      try {
        const { data } = await axios.post('/api/auth/refresh', {
          refreshToken: localStorage.getItem('drishti_refresh')
        });
        localStorage.setItem('drishti_token', data.accessToken);
        localStorage.setItem('drishti_refresh', data.refreshToken);
        err.config.headers.Authorization = `Bearer ${data.accessToken}`;
        return axios(err.config);
      } catch { localStorage.clear(); window.location.href = '/login'; }
    }
    return Promise.reject(err);
  }
);

export default api;
