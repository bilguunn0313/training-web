import { CookingPot, Layers, Soup, Sunrise, UtensilsCrossed } from "lucide-react";
import { MealChoice, MealSession } from "@/types/schema.types";

// Хоолны сешн ба порцын сонголтын нийтлэг тохиргоо.
// Kiosk болон /menu хуудас хоёулаа үүнийг ашиглана — шошго зөрөхөөс сэргийлнэ.

export const SESSIONS: MealSession[] = ["breakfast", "lunch"];

/**
 * Сешн бүрийн өнгөний таних тэмдэг.
 *
 * Kiosk дээр хоёр товч 1.5 метрээс зогсож харахад ЯЛГАРАХ ёстой. Хэлбэр,
 * үсэг хоёроос өнгө хамаагүй хурдан ялгагддаг тул өглөө/өдрийг өөр өнгөөр
 * тэмдэглэв. Хоол тул дулаан өнгө сонгосон — цэнхэр-саарал нь эмнэлгийн
 * бүртгэл шиг мэдрэмж өгдөг.
 *
 * Tailwind класс нэрийг эх кодоос уншдаг тул бүтэн нэрээр бичсэн —
 * `text-${color}-500` гэж угсарвал build-д ороогүй ангилал болно.
 */
interface SessionAccent {
  idleBorder: string;
  icon: string;
  lineLabel: string;
  activeBg: string;
  activeBorder: string;
  activeShadow: string;
  arrow: string;
  choiceActive: string;
}

export const SESSION_CONFIG: Record<
  MealSession,
  { label: string; short: string; icon: typeof Sunrise; accent: SessionAccent }
> = {
  // Өглөө — алтлаг шар, нар мандахтай нийцнэ
  breakfast: {
    label: "Өглөөний хоол",
    short: "Өглөө",
    icon: Sunrise,
    accent: {
      idleBorder: "border-amber-300",
      icon: "text-amber-500",
      lineLabel: "text-amber-600",
      activeBg: "bg-amber-600",
      activeBorder: "border-amber-600",
      activeShadow: "shadow-amber-600/25",
      arrow: "border-t-amber-600",
      choiceActive: "active:border-amber-500 active:bg-amber-50",
    },
  },
  // Өдөр — гүн улбар шар, илүү тодорхой
  lunch: {
    label: "Өдрийн хоол",
    short: "Өдөр",
    icon: Soup,
    accent: {
      idleBorder: "border-orange-400",
      icon: "text-orange-600",
      lineLabel: "text-orange-700",
      activeBg: "bg-orange-700",
      activeBorder: "border-orange-700",
      activeShadow: "shadow-orange-700/25",
      arrow: "border-t-orange-700",
      choiceActive: "active:border-orange-500 active:bg-orange-50",
    },
  },
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

// Kiosk дээр зөвхөн СОНГОХ боломжтой хоолыг харуулна.
// Уух зүйл сонголтод ордоггүй тул жагсаалтад ч гаргахгүй.
const SHOWN_ITEMS: { type: "meal_1" | "meal_2"; label: string }[] = [
  { type: "meal_1", label: "1-р" },
  { type: "meal_2", label: "2-р" },
];

/**
 * Тухайн сешнд оруулсан цэсийг дэлгэцэнд харуулах мөрүүд болгоно.
 *
 * Хүн товч дарахаасаа ӨМНӨ юу өгөхийг харах ёстой — тиймээс сешний карт
 * дээр шууд гаргана. Цэс ороогүй бол хоосон массив буцаах ба дуудагч тал
 * юу ч зурахгүй.
 */
export function sessionMenuLines(
  items: PublicMenuItem[],
  session: MealSession
): { label: string; name: string }[] {
  return SHOWN_ITEMS.flatMap(({ type, label }) =>
    items
      .filter((i) => i.mealSession === session && i.itemType === type)
      .map((i) => ({ label, name: i.name }))
  );
}
