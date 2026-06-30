const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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
