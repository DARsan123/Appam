const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  campusId?: string;
  campus?: { id: string; name: string; code: string };
}

function getToken() {
  return localStorage.getItem('vms_token');
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || JSON.stringify(err));
  }
  return res.json();
}

export async function login(email: string, password: string) {
  return api<{ accessToken: string; user: User }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function publicApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers as Record<string, string>) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || JSON.stringify(err));
  }
  return res.json();
}
