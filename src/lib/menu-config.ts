import { CookingPot, Layers, Soup, Sunrise, UtensilsCrossed } from "lucide-react";
import { MealChoice, MealSession } from "@/types/schema.types";

// Хоолны сешн ба порцын сонголтын нийтлэг тохиргоо.
// Kiosk болон /menu хуудас хоёулаа үүнийг ашиглана — шошго зөрөхөөс сэргийлнэ.

export const SESSIONS: MealSession[] = ["breakfast", "lunch"];

export const SESSION_CONFIG: Record<
  MealSession,
  { label: string; short: string; icon: typeof Sunrise }
> = {
  breakfast: { label: "Өглөөний хоол", short: "Өглөө", icon: Sunrise },
  lunch: { label: "Өдрийн хоол", short: "Өдөр", icon: Soup },
};

export const CHOICES: MealChoice[] = ["meal_1", "meal_2", "both"];

export const CHOICE_CONFIG: Record<
  MealChoice,
  { label: string; icon: typeof CookingPot }
> = {
  meal_1: { label: "1-р хоол", icon: CookingPot },
  meal_2: { label: "2-р хоол", icon: UtensilsCrossed },
  both: { label: "Бүгд", icon: Layers },
};

/** Мэнюний нэг мөр — kiosk болон нийтийн API-аас ирдэг хөнгөн хэлбэр. */
export interface PublicMenuItem {
  name: string;
  itemType: "meal_1" | "meal_2" | "drink";
  mealSession: MealSession;
}

/** Тухайн сешний 1-р эсвэл 2-р хоолны нэр. Цэс ороогүй бол null. */
export function dishNameFor(
  items: PublicMenuItem[],
  session: MealSession,
  choice: MealChoice
): string | null {
  if (choice === "both") return null;
  const match = items.find(
    (i) => i.mealSession === session && i.itemType === choice
  );
  return match?.name ?? null;
}

/**
 * Товчны доод мөрөнд гарах тайлбар.
 *
 * Гол товч дээр "1-р хоол" гэж бичсэн байдаг тул энэ нь ЗӨВХӨН нэмэлт
 * мэдээлэл өгөх ёстой — хоолны нэр. Цэс ороогүй бол `null` буцаана,
 * дуудагч тал доод мөрийг огт харуулахгүй (эс тэгвэл нэг л текст хоёр
 * удаа гарна).
 *
 * "Бүгд" нь тодорхой нэргүй тул хоёр хоолыг нэгтгэж харуулна.
 */
export function choiceSubtitle(
  items: PublicMenuItem[],
  session: MealSession,
  choice: MealChoice
): string | null {
  if (choice !== "both") return dishNameFor(items, session, choice);

  const first = dishNameFor(items, session, "meal_1");
  const second = dishNameFor(items, session, "meal_2");
  if (first && second) return `${first} + ${second}`;
  return "1-р + 2-р хоол";
}
