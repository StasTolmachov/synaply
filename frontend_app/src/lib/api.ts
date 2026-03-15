const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  let token = null;
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('token');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle 204 No Content or empty responses gracefully
  if (response.status === 204) return null;
  
  let data;
  try {
    const text = await response.text();
    data = text ? JSON.parse(text) : null;
  } catch (_err) {
    data = null;
  }

  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined' && !endpoint.includes('/login')) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    throw new Error(data?.error || `Error ${response.status}`);
  }

  return data;
}
