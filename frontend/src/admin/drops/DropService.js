import axios from 'axios';

const API_URL = '/api/drops';

const DropService = {
    getDrops: async (activeOnly = false) => {
        try {
            const response = await axios.get(API_URL, { params: { active: activeOnly } });
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
    }
};

export default DropService;
