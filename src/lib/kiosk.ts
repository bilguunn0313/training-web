import { MealChoice, MealSession, MenuCount } from "@/types/schema.types";
import { PublicMenuItem } from "./menu-config";

// Kiosk-ийн API client.
//
// ⚠️ @/lib/axios-ийг ЗОРИУДААР ашиглаагүй: тэр instance нь 401 хүлээж авбал
// localStorage цэвэрлээд /login руу шиддэг. Kiosk нь нэвтрэлтгүй ажиллах
// ёстой тул тэр зан авир хуудсыг эвдэнэ.

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export interface PublicMenu {
  date: string;
  notes: string | null;
  items: PublicMenuItem[];
  count: MenuCount;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;

  // fetch өөрөө унасан (сервер огт хариулаагүй) тохиолдлыг серверийн
  // татгалзлаас ялгана — хэрэглэгчид өөр өөр мессеж харуулах ёстой.
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
      cache: "no-store",
    });
  } catch {
    throw new Error("Сүлжээтэй холбогдож чадсангүй");
  }

  const body = await res.json().catch(() => null);

  if (!res.ok || !body?.success) {
    throw new Error(body?.message || `Алдаа гарлаа (${res.status})`);
  }

  return body.data as T;
}

export const kioskAPI = {
  /**
   * Маргаашийн мэню. Огноог СЕРВЕР тодорхойлно — таблетын огноо/цагийн бүс
   * буруу байсан ч kiosk зөв өдрийн төлөө бүртгэнэ.
   */
  getTomorrow: () => request<PublicMenu>("/public/menu/tomorrow"),

  getMenu: (date: string) => request<PublicMenu>(`/public/menu/${date}`),

  tap: (date: string, session: MealSession, choice: MealChoice) =>
    request<{ count: MenuCount }>("/public/menu/tap", {
      method: "POST",
      body: JSON.stringify({ date, session, choice }),
    }),
};
