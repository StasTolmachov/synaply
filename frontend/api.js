const API_BASE = 'http://localhost:8080/api/v1';

// Утилита для выполнения запросов с токеном
async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem('token');

    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers,
    };

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, config);
        const data = await response.json();

        if (!response.ok) {
            // Если токен протух (401), выкидываем на логин
            if (response.status === 401 && !endpoint.includes('/login')) {
                logout();
            }
            throw new Error(data.error || 'Произошла ошибка при запросе');
        }

        return data;
    } catch (error) {
        throw error;
    }
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}

// Проверка авторизации для защищенных страниц
function requireAuth() {
    if (!localStorage.getItem('token')) {
        window.location.href = 'login.html';
    }
}