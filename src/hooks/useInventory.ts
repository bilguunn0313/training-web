import { useQuery } from "@tanstack/react-query";
import {
  Material,
  MaterialBalance,
  MaterialTransaction,
  MonthlyReportRow,
  StockCount,
  StockCountWithLines,
} from "@/types/schema.types";
import { inventoryAPI } from "@/lib/inventory";

export function useMaterials(includeInactive = false) {
  const query = useQuery({
    queryKey: ["materials", includeInactive],
    queryFn: async () => {
      const response = await inventoryAPI.getMaterials(includeInactive);
      if (!response.success) throw new Error("Материал татахад алдаа гарлаа");
      return response.data as Material[];
    },
  });

  return {
    materials: query.data ?? [],
    loading: query.isPending,
    error: query.error?.message ?? null,
    refetch: async () => {
      await query.refetch();
    },
  };
}

export function useMaterialBalances() {
  const query = useQuery({
    queryKey: ["material-balances"],
    queryFn: async () => {
      const response = await inventoryAPI.getBalances();
      if (!response.success) throw new Error("Үлдэгдэл татахад алдаа гарлаа");
      return response.data as MaterialBalance[];
    },
  });

  return {
    balances: query.data ?? [],
    loading: query.isPending,
    error: query.error?.message ?? null,
    refetch: async () => {
      await query.refetch();
    },
  };
}

export function useTransactions(filters?: {
  materialId?: number;
  txType?: "receipt" | "issue" | "adjustment";
  from?: string;
  to?: string;
}) {
  const query = useQuery({
    queryKey: ["material-transactions", filters],
    queryFn: async () => {
      const response = await inventoryAPI.getTransactions(filters);
      if (!response.success) throw new Error("Гүйлгээ татахад алдаа гарлаа");
      return response.data as MaterialTransaction[];
    },
  });

  return {
    transactions: query.data ?? [],
    loading: query.isPending,
    error: query.error?.message ?? null,
    refetch: async () => {
      await query.refetch();
    },
  };
}

export function useStockCounts() {
  const query = useQuery({
    queryKey: ["stock-counts"],
    queryFn: async () => {
      const response = await inventoryAPI.getStockCounts();
      if (!response.success) throw new Error("Тооллого татахад алдаа гарлаа");
      return response.data as StockCount[];
    },
  });

  return {
    counts: query.data ?? [],
    loading: query.isPending,
    error: query.error?.message ?? null,
    refetch: async () => {
      await query.refetch();
    },
  };
}

export function useStockCount(id: number | null) {
  const query = useQuery({
    queryKey: ["stock-count", id],
    enabled: id !== null,
    queryFn: async () => {
      const response = await inventoryAPI.getStockCount(id!);
      if (!response.success) throw new Error("Тооллого татахад алдаа гарлаа");
      return response.data as StockCountWithLines;
    },
  });

  return {
    count: query.data ?? null,
    loading: query.isPending,
    error: query.error?.message ?? null,
    refetch: async () => {
      await query.refetch();
    },
  };
}

export function useMonthlyReport(year: number, month: number) {
  const query = useQuery({
    queryKey: ["inventory-monthly-report", year, month],
    queryFn: async () => {
      const response = await inventoryAPI.getMonthlyReport(year, month);
      if (!response.success) throw new Error("Тайлан татахад алдаа гарлаа");
      return response.data as MonthlyReportRow[];
    },
  });

  return {
    rows: query.data ?? [],
    loading: query.isPending,
    error: query.error?.message ?? null,
    refetch: async () => {
      await query.refetch();
    },
  };
}
