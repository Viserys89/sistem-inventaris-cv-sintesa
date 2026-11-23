import api from './api';

const itemService = {
    // Mengambil ringkasan inventaris
    getSummary: async () => {
        const response = await api.get('/items/summary');
        return response.data;
    },

    // Mengambil daftar kategori
    getCategories: async () => {
        const response = await api.get('/items/categories');
        return response.data;
    },

    // Mengambil daftar barang
    getItems: async (params = {}) => {
        const response = await api.get('/items', {
            params,
        });

        return response.data;
    },

    // Menambahkan barang
    createItem: async (data) => {
        const response = await api.post('/items', data);
        return response.data;
    },

    // Memperbarui barang
    updateItem: async (id, data) => {
        const response = await api.put(`/items/${id}`, data);
        return response.data;
    },

    // Mengubah status barang
    updateStatus: async (id, is_active) => {
        const response = await api.patch(`/items/${id}/status`, {
            is_active,
        });

        return response.data;
    },
};

export default itemService;