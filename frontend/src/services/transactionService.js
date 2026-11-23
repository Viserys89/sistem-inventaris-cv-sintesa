import api from "./api";

const transactionService = {
  // Mengambil daftar transaksi
  getTransactions: async (params = {}) => {
    const response = await api.get("/transactions", {
      params,
    });

    return response.data;
  },

  // Mengambil ringkasan transaksi
  getSummary: async (params = {}) => {
    const response = await api.get("/transactions/summary", {
      params,
    });

    return response.data;
  },

  // Mengambil detail transaksi
  getTransactionById: async (id) => {
    const response = await api.get(`/transactions/${id}`);

    return response.data;
  },

  // Menyimpan transaksi barang masuk
  createIncoming: async (data) => {
    const response = await api.post(
      "/transactions/incoming",
      data
    );

    return response.data;
  },

  // Menyimpan transaksi barang keluar
  createOutgoing: async (data) => {
    const response = await api.post(
      "/transactions/outgoing",
      data
    );

    return response.data;
  },

  // Menyimpan penyesuaian stok
  createAdjustment: async (data) => {
    const response = await api.post(
      "/transactions/adjustment",
      data
    );

    return response.data;
  },
};

export default transactionService;