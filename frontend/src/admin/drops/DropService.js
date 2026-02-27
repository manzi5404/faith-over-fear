import axios from 'axios';

const API_URL = '/api/drops';

// Base axios config for including cookies
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
    }
};

export default DropService;
