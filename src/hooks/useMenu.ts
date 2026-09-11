import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DailyMenu, MealSession, MenuCount } from "@/types/schema.types";
import { menuAPI } from "@/lib/menu";

export function useTodayMenu() {
  const query = useQuery({
    queryKey: ["today-menu"],
    queryFn: async () => {
      const response = await menuAPI.getToday();
      if (!response.success) throw new Error("Failed to fetch menu");
      return response.data as DailyMenu;
    },
  });

  return {
    menu: query.data ?? null,
    loading: query.isPending,
    error: query.error?.message ?? null,
    refetch: async () => {
      await query.refetch();
    },
  };
}

export function useMonthlyMenus(year: number, month: number) {
  const query = useQuery({
    queryKey: ["monthly-menus", year, month],
    queryFn: async () => {
      const response = await menuAPI.getMonthly(year, month);
      if (!response.success) throw new Error("Failed to fetch menus");
      return response.data as DailyMenu[];
    },
  });

  return {
    menus: query.data ?? [],
    loading: query.isPending,
    error: query.error?.message ?? null,
    refetch: async () => {
      await query.refetch();
    },
  };
}

export function useMenuByDate(date: string) {
  const query = useQuery({
    queryKey: ["menu-by-date", date],
    queryFn: async () => {
      const response = await menuAPI.getByDate(date);
      if (!response.success) throw new Error("Failed to fetch menu");
      return response.data as DailyMenu;
    },
    enabled: !!date,
  });

  return {
    menu: query.data ?? null,
    loading: query.isPending,
    error: query.error?.message ?? null,
    refetch: async () => {
      await query.refetch();
    },
  };
}

/**
 * Тухайн өдрийн бүртгэлийн тоо + тогоочийн засварын үйлдэл.
 *
 * Бүх бүртгэл kiosk-аар дамждаг ба МАРГААШИЙН төлөө хийгддэг. Тиймээс энэ
 * нь тухайн өдөр хэдэн порц чанах вэ гэсэн төлөвлөгөөний тоо.
 *
 * refetchInterval — тогооч дэлгэцээ нээлттэй орхиход амьд шинэчлэгдэнэ.
 */
export function useMenuCount(date: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["menu-count", date],
    queryFn: async () => {
      const res = await menuAPI.getCount(date!);
      if (!res.success) throw new Error("Failed to load count");
      return res.data as MenuCount;
    },
    enabled: !!date,
    refetchInterval: 30_000,
  });

  const removeTapMutation = useMutation({
    mutationFn: (session: MealSession) => menuAPI.removeKioskTap(date!, session),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-count", date] });
    },
  });

  return {
    count: query.data ?? null,
    loading: query.isPending,
    error: query.error?.message ?? null,
    removingTap: removeTapMutation.isPending,
    removeKioskTap: async (session: MealSession) => {
      await removeTapMutation.mutateAsync(session);
    },
    refetch: async () => {
      await query.refetch();
    },
  };
}
