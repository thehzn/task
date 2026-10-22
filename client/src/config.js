
export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_URL;

export const USER_BASE = '/auth';
export const TASK_BASE = '/tasks';
export const ADMIN_BASE = '/admin';

export const STATUSES = ['pending', 'in progress', 'completed'];
export const PRIORITIES = ['low', 'medium', 'high'];
export const ROLES = ['user', 'manager', 'admin'];
export const ADMIN = 'admin';
export const MANAGER = 'manager';

export const label = (s = '') => s.replace(/\b\w/g, (c) => c.toUpperCase());


export const REGISTER_ROLES = ['user', 'manager'];
