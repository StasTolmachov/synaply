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

  let response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (_err) {
    throw new Error("Our servers are taking a little nap. Please check your connection or try again in a moment!");
  }

  // Handle 204 No Content or empty responses gracefully
  if (response.status === 204) return null;

  let data;
  let text;
  try {
    text = await response.text();
    data = text ? JSON.parse(text) : null;
  } catch (_err) {
    data = null;
  }

  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined' && !endpoint.includes('/login')) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    // Friendly error mapping for specific statuses
    const errorMap: Record<number, string> = {
      400: "Oops! Something in the request wasn't quite right. Please try again!",
      401: "You've been logged out. Please sign in again to continue!",
      403: "Sorry, you don't have permission to do that.",
      404: "We couldn't find what you were looking for. Is the URL correct?",
      422: "We couldn't process this information. Please check your input!",
      429: "Whoa, slow down! You're moving a bit too fast for us. Try again in a minute!",
      500: "Our servers are feeling a bit under the weather. Give us a moment to recover!",
      502: "It looks like our server is taking a quick break. We'll be back soon!",
      503: "We're currently tidying things up. Please check back in a few minutes!",
      504: "The server is taking too long to answer. Maybe try refreshing?",
    };

    const friendlyMessage = errorMap[response.status] || "Something went slightly wrong on our end. Please try again!";
    throw new Error(data?.error || friendlyMessage);
  }

  return data;
}
