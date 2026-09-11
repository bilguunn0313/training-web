import api from "./axios";

export const inventoryAPI = {
  // ── Материалын сан ─────────────────────────────────────────────────────
  getMaterials: async (includeInactive = false) => {
    const res = await api.get("/inventory/materials", {
      params: includeInactive ? { includeInactive: "true" } : undefined,
    });
    return res.data;
  },

  createMaterial: async (data: {
    name: string;
    unit: string;
    category?: string | null;
  }) => {
    const res = await api.post("/inventory/materials", data);
    return res.data;
  },

  updateMaterial: async (
    id: number,
    data: {
      name?: string;
      unit?: string;
      category?: string | null;
        isActive?: boolean;
    }
  ) => {
    const res = await api.put(`/inventory/materials/${id}`, data);
    return res.data;
  },

  deleteMaterial: async (id: number) => {
    const res = await api.delete(`/inventory/materials/${id}`);
    return res.data;
  },

  // ── Үлдэгдэл ───────────────────────────────────────────────────────────
  getBalances: async () => {
    const res = await api.get("/inventory/balances");
    return res.data;
  },

  // ── Орлого / зарлага ───────────────────────────────────────────────────
  getTransactions: async (filters?: {
    materialId?: number;
    txType?: "receipt" | "issue" | "adjustment";
    from?: string;
    to?: string;
  }) => {
    const res = await api.get("/inventory/transactions", { params: filters });
    return res.data;
  },

  createTransaction: async (data: {
    materialId: number;
    txType: "receipt" | "issue";
    quantity: number;
    unitPrice?: number | null;
    txDate: string;
    note?: string | null;
  }) => {
    const res = await api.post("/inventory/transactions", data);
    return res.data;
  },

  updateTransaction: async (
    id: number,
    data: {
      quantity?: number;
      unitPrice?: number | null;
      txDate?: string;
      note?: string | null;
    }
  ) => {
    const res = await api.put(`/inventory/transactions/${id}`, data);
    return res.data;
  },

  deleteTransaction: async (id: number) => {
    const res = await api.delete(`/inventory/transactions/${id}`);
    return res.data;
  },

  // ── Сарын тооллого ─────────────────────────────────────────────────────
  getStockCounts: async () => {
    const res = await api.get("/inventory/counts");
    return res.data;
  },

  getStockCount: async (id: number) => {
    const res = await api.get(`/inventory/counts/${id}`);
    return res.data;
  },

  createStockCount: async (data: {
    countDate: string;
    periodYear: number;
    periodMonth: number;
    notes?: string | null;
  }) => {
    const res = await api.post("/inventory/counts", data);
    return res.data;
  },

  saveStockCountLines: async (
    id: number,
    lines: {
      materialId: number;
      countedQuantity: number;
      note?: string | null;
    }[]
  ) => {
    const res = await api.put(`/inventory/counts/${id}/lines`, { lines });
    return res.data;
  },

  closeStockCount: async (id: number) => {
    const res = await api.post(`/inventory/counts/${id}/close`);
    return res.data;
  },

  deleteStockCount: async (id: number) => {
    const res = await api.delete(`/inventory/counts/${id}`);
    return res.data;
  },

  // ── Тайлан ─────────────────────────────────────────────────────────────
  getMonthlyReport: async (year: number, month: number) => {
    const res = await api.get(`/inventory/reports/monthly/${year}/${month}`);
    return res.data;
  },
};
