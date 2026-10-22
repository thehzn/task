import axios from 'axios';
import { ADMIN, ADMIN_BASE, API_URL, MANAGER, TASK_BASE } from './config';

const api = axios.create({ baseURL: `${API_URL}/api`, withCredentials: true });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || '';
    const msg = String(err.response?.data?.message || '');
    const authFail = err.response?.status === 401 || (err.response?.status === 500 && /jwt|token|signature/i.test(msg));
    if (authFail && !/login|register/.test(url)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const errMsg = (e) => e.response?.data?.message || e.response?.data?.error || e.message || 'Something went wrong';


export const pickList = (data, key) => data?.[key] || data?.data || (Array.isArray(data) ? data : []);
export const pickOne = (data, key) => data?.[key] || data?.data || data;
export const assigneeId = (t) => t.assignedTo?._id || t.assignedTo || '';

const isMgr = (role) => role === MANAGER || role === ADMIN;


export const taskApi = {
  list: (role, params) =>
    role === ADMIN ? api.get(`${ADMIN_BASE}/gettasklist`, { params })
    : role === MANAGER ? api.get(`${TASK_BASE}/getallformanager`, { params })
    : api.get(`${TASK_BASE}/getall`, { params }),
  create: (role, body) =>
    api.post(isMgr(role) ? `${TASK_BASE}/createbymanager` : `${TASK_BASE}/create`, body),
  update: (role, id, body) =>
    api.put(isMgr(role) ? `${TASK_BASE}/updatebymanager/${id}` : `${TASK_BASE}/update/${id}`, body),
  remove: (role, id) =>
    role === ADMIN ? api.delete(`${ADMIN_BASE}/deletetask/${id}`) : api.delete(`${TASK_BASE}/delete/${id}`),
};

export default api;
