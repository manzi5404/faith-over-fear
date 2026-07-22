const API_BASE_URL = window.API_BASE_URL || document.body?.dataset?.apiBaseUrl || (() => {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:5000';
    return 'https://dottie-backend-production.up.railway.app';
})();

export const authAPI = {
    async register(email, password, name) {
        const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Registration failed');
        return data;
    },

    async login(email, password) {
        const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Login failed');
        return data;
    },

    async me() {
        const token = localStorage.getItem('DOTTIE_token');
        const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch profile');
        return data;
    },

    setSession(token, user) {
        localStorage.setItem('DOTTIE_token', token);
        localStorage.setItem('DOTTIE_user', JSON.stringify(user));
    },

    clearSession() {
        localStorage.removeItem('DOTTIE_token');
        localStorage.removeItem('DOTTIE_user');
    },

    isLoggedIn() {
        return !!localStorage.getItem('DOTTIE_token');
    },

    getUser() {
        return JSON.parse(localStorage.getItem('DOTTIE_user') || 'null');
    }
};

