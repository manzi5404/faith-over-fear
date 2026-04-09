import axios from 'axios';

// Configure API base URL
// Local dev: uses Vite proxy (empty string)
// Netlify: use _redirects file OR set VITE_API_URL env var
const API_BASE_URL = import.meta.env.VITE_API_URL || '';
const API_URL = `${API_BASE_URL}/api/drops`;

// Base axios config for including cookies
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.withCredentials = true;

const DropService = {
    verifySession: async () => {
        try {
            const response = await axios.get('/api/auth/verify');
            return response.data;
        } catch (error) {
            console.error('Session verification failed:', error);
            throw error;
        }
    },

    login: async (email, password) => {
        try {
            const response = await axios.post('/api/auth/login', { email, password });
            return response.data;
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    },

    googleLogin: async (token) => {
        try {
            const response = await axios.post('/api/auth/google', { token });
            return response.data;
        } catch (error) {
            console.error('Google login failed:', error);
            throw error;
        }
    },

    logout: async () => {
        try {
            const response = await axios.post('/api/auth/logout');
            return response.data;
        } catch (error) {
            console.error('Logout failed:', error);
            throw error;
        }
    },

    getDrops: async (activeOnly = false, includeProducts = false) => {

        try {
            const response = await axios.get(API_URL, { params: { active: activeOnly, includeProducts } });
            return response.data.drops || [];
        } catch (error) {
            console.error('Error fetching drops:', error);
            throw error;
        }
    },

    createDrop: async (dropData) => {
        try {
            const response = await axios.post(API_URL, dropData);
            return response.data;
        } catch (error) {
            console.error('Error creating drop:', error);
            throw error;
        }
    },

    updateDrop: async (id, dropData) => {
        try {
            const response = await axios.put(`${API_URL}/${id}`, dropData);
            return response.data;
        } catch (error) {
            console.error('Error updating drop:', error);
            throw error;
        }
    },

    deleteDrop: async (id) => {
        try {
            const response = await axios.delete(`${API_URL}/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting drop:', error);
            throw error;
        }
    },

    // Product APIs
    getProducts: async (dropId = null) => {
        try {
            const response = await axios.get('/api/products', { params: { dropId } });
            return response.data.products || [];
        } catch (error) {
            console.error('Error fetching products:', error);
            throw error;
        }
    },

    createProduct: async (productData) => {
        try {
            const response = await axios.post('/api/products', productData);
            return response.data;
        } catch (error) {
            console.error('Error creating product:', error);
            throw error;
        }
    },

    updateProduct: async (id, productData) => {
        try {
            const response = await axios.put(`/api/products/${id}`, productData);
            return response.data;
        } catch (error) {
            console.error('Error updating product:', error);
            throw error;
        }
    },

    deleteProduct: async (id) => {
        try {
            const response = await axios.delete(`/api/products/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting product:', error);
            throw error;
        }
    },

    // Store Config APIs
    getStoreConfig: async () => {
        try {
            const response = await axios.get('/api/admin/store-config');
            return response.data;
        } catch (error) {
            console.error('Error fetching store config:', error);
            throw error;
        }
    },

    updateStoreConfig: async (configData) => {
        try {
            const response = await axios.put('/api/admin/store-config', configData);
            return response.data;
        } catch (error) {
            console.error('Error updating store config:', error);
            throw error;
        }
    },

    // Reservation APIs
    getReservations: async () => {
        try {
            const response = await axios.get('/api/admin/reservations');
            return response.data.reservations || [];
        } catch (error) {
            console.error('Error fetching reservations:', error);
            throw error;
        }
    },

    updateReservationStatus: async (id, status) => {
        try {
            const response = await axios.patch(`/api/admin/reservations/${id}/status`, { status });
            return response.data;
        } catch (error) {
            console.error('Error updating reservation status:', error);
            throw error;
        }
    },

    // Order APIs
    getOrders: async () => {
        try {
            const response = await axios.get('/api/orders');
            return response.data.orders || [];
        } catch (error) {
            console.error('Error fetching orders:', error);
            throw error;
        }
    },

    updateOrderStatus: async (id, status) => {
        try {
            const response = await axios.put(`/api/orders/${id}/status`, { status });
            return response.data;
        } catch (error) {
            console.error('Error updating order status:', error);
            throw error;
        }
    },

    // Announcement APIs
    getAnnouncement: async () => {
        try {
            const response = await axios.get('/api/announcement');
            return response.data.announcement || null;
        } catch (error) {
            console.error('Error fetching announcement:', error);
            throw error;
        }
    },

    updateAnnouncement: async (announcementData) => {
        try {
            const response = await axios.put('/api/admin/announcement', announcementData);
            return response.data;
        } catch (error) {
            console.error('Error updating announcement:', error);
            throw error;
        }
    },

    // Contact Messages APIs
    getMessages: async (status = '') => {
        try {
            const response = await axios.get('/api/admin/messages', { params: { status } });
            return response.data;
        } catch (error) {
            console.error('Error fetching messages:', error);
            throw error;
        }
    },

    getMessageById: async (id) => {
        try {
            const response = await axios.get(`/api/admin/messages/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching message:', error);
            throw error;
        }
    },

    updateMessageStatus: async (id, status) => {
        try {
            const response = await axios.patch(`/api/admin/messages/${id}`, { status });
            return response.data;
        } catch (error) {
            console.error('Error updating message status:', error);
            throw error;
        }
    },

    // Notification APIs
    getNotifications: async (unseenOnly = false) => {
        try {
            const response = await axios.get('/api/admin/notifications', { params: { unseen: unseenOnly } });
            return response.data;
        } catch (error) {
            console.error('Error fetching notifications:', error);
            throw error;
        }
    },

    getNotificationCount: async () => {
        try {
            const response = await axios.get('/api/admin/notifications/count');
            return response.data;
        } catch (error) {
            console.error('Error fetching notification count:', error);
            throw error;
        }
    },

    markNotificationSeen: async (id) => {
        try {
            const response = await axios.patch(`/api/admin/notifications/${id}/seen`);
            return response.data;
        } catch (error) {
            console.error('Error marking notification:', error);
            throw error;
        }
    },

    markAllNotificationsSeen: async () => {
        try {
            const response = await axios.post('/api/admin/notifications/seen-all');
            return response.data;
        } catch (error) {
            console.error('Error marking all notifications:', error);
            throw error;
        }
    }
};

export default DropService;
