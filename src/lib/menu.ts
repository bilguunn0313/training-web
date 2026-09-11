import api from "./axios";
import { MealSession } from "@/types/schema.types";

interface MenuItemPayload {
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  itemType: "meal_1" | "meal_2" | "drink";
  mealSession?: MealSession;
  ingredients?: string | null;
  calories?: number | null;
}

export const menuAPI = {
  getToday: async () => {
    const res = await api.get("/menu/today");
    return res.data;
  },
  getByDate: async (date: string) => {
    const res = await api.get(`/menu/${date}`);
    return res.data;
  },
  getMonthly: async (year: number, month: number) => {
    const res = await api.get(`/menu/monthly/${year}/${month}`);
    return res.data;
  },
  create: async (data: {
    menuDate: string;
    notes?: string | null;
    items?: MenuItemPayload[];
  }) => {
    const res = await api.post("/menu", data);
    return res.data;
  },
  update: async (
    id: number,
    data: {
      menuDate?: string;
      notes?: string | null;
      items?: MenuItemPayload[];
    }
  ) => {
    const res = await api.put(`/menu/${id}`, data);
    return res.data;
  },
  delete: async (id: number) => {
    const res = await api.delete(`/menu/${id}`);
    return res.data;
  },
  addItem: async (menuId: number, data: MenuItemPayload) => {
    const res = await api.post(`/menu/${menuId}/items`, data);
    return res.data;
  },
  updateItem: async (
    itemId: number,
    data: Partial<MenuItemPayload>
  ) => {
    const res = await api.put(`/menu/items/${itemId}`, data);
    return res.data;
  },
  deleteItem: async (itemId: number) => {
    const res = await api.delete(`/menu/items/${itemId}`);
    return res.data;
  },
  // ─── Хоолны бүртгэл ───────────────────────────────────────────────
  // Бүх бүртгэл kiosk-аар дамждаг тул энд зөвхөн унших зам байна.
  getCount: async (date: string) => {
    const res = await api.get(`/menu/count/${date}`);
    return res.data;
  },
  /** Тогооч андуурч дарсан kiosk бүртгэлийг хасах (−1). */
  removeKioskTap: async (date: string, session: MealSession) => {
    const res = await api.delete(`/menu/kiosk-tap/${date}/${session}`);
    return res.data;
  },
};
