"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { MenuCalendar } from "@/components/MenuCalendar";
import { useMenuByDate, useMonthlyMenus, useMenuCount } from "@/hooks/useMenu";
import { SESSIONS, SESSION_CONFIG } from "@/lib/menu-config";
import { useUserContext } from "@/lib/userProvider";
import { MenuItem } from "@/types/schema.types";
import {
  UtensilsCrossed,
  Flame,
  Settings,
  ArrowLeft,
  CookingPot,
  GlassWater,
  Loader2,
} from "lucide-react";

const ITEM_TYPE_CONFIG: Record<
  string,
  { label: string; icon: typeof CookingPot; accent: string }
> = {
  meal_1: {
    label: "1-р хоол",
    icon: CookingPot,
    accent: "text-amber-600 bg-amber-50 border-amber-200",
  },
  meal_2: {
    label: "2-р хоол",
    icon: UtensilsCrossed,
    accent: "text-orange-600 bg-orange-50 border-orange-200",
  },
  drink: {
    label: "Уух зүйл",
    icon: GlassWater,
    accent: "text-sky-600 bg-sky-50 border-sky-200",
  },
};

function MenuItemCard({ item }: { item: MenuItem }) {
  const [imgError, setImgError] = useState(false);
  const backendUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const getFullUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `${backendUrl}${url}`;
  };

  const ingredientList = item.ingredients
    ? item.ingredients
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const showImage = item.image_url && !imgError;

  return (
    <div className="group bg-card rounded-xl border border-border overflow-hidden flex flex-row hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 ease-out">
      {showImage ? (
        <div className="w-[130px] sm:w-[160px] h-[110px] sm:h-[130px] flex-shrink-0 overflow-hidden bg-muted">
          <img
            src={getFullUrl(item.image_url!)}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            onError={() => setImgError(true)}
          />
        </div>
      ) : (
        <div className="w-[130px] sm:w-[160px] h-[110px] sm:h-[130px] flex-shrink-0 bg-muted/50 flex items-center justify-center">
          <UtensilsCrossed className="h-7 w-7 text-muted-foreground/20" />
        </div>
      )}

      <div className="flex-1 p-3 sm:p-4 flex flex-col justify-center min-w-0 relative">
        {item.calories && (
          <span className="absolute top-2 right-2 flex items-center gap-0.5 text-[10px] font-semibold text-orange-500 bg-orange-50 border border-orange-100 px-1.5 py-0.5 rounded-md">
            <Flame className="h-2.5 w-2.5" />
            {item.calories}
          </span>
        )}

        <p className="font-semibold text-foreground text-sm sm:text-[15px] leading-snug pr-14">
          {item.name}
        </p>

        {ingredientList.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {ingredientList.map((ing, i) => (
              <span
                key={i}
                className="text-[10px] font-medium text-muted-foreground bg-muted/70 px-1.5 py-0.5 rounded"
              >
                {ing}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Тухайн өдөр хэдэн хүн иднэ.
 * Бүртгэл нь хоолны газрын kiosk дээр хийгддэг тул энэ хуудас зөвхөн
 * харуулна — энд дарж бүртгүүлэх боломжгүй.
 */
function MenuDayCount({ date }: { date: string }) {
  const { count, loading } = useMenuCount(date);

  if (loading || !count) return null;

  const total = count.breakfast.people + count.lunch.people;
  if (total === 0) return null;

  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        Хэдэн хүн иднэ
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {SESSIONS.map((session) => {
          const c = count[session];
          return (
            <div
              key={session}
              className="rounded-xl border border-border bg-muted/20 px-4 py-3"
            >
              <p className="text-xs text-muted-foreground">
                {SESSION_CONFIG[session].label}
              </p>
              <p className="text-2xl font-bold text-foreground tabular-nums mt-0.5">
                {c.people}
              </p>
              {c.people > 0 && (
                <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                  1-р {c.meal_1} · 2-р {c.meal_2}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function MenuPage() {
  const { user } = useUserContext();
  const [mounted, setMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [calYear, setCalYear] = useState(2026);
  const [calMonth, setCalMonth] = useState(1);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    const now = new Date();
    const todayStr = format(now, "yyyy-MM-dd");
    setSelectedDate(todayStr);
    setCalYear(now.getFullYear());
    setCalMonth(now.getMonth() + 1);
    setMounted(true);
  }, []);

  const today = mounted ? format(new Date(), "yyyy-MM-dd") : "";

  const { menus } = useMonthlyMenus(calYear, calMonth);
  const { menu, loading: dayLoading } = useMenuByDate(selectedDate);

  const menuDates = new Set(menus.map((m) => m.menu_date.split("T")[0]));

  useEffect(() => {
    if (!mounted) return;
    setAnimKey((k) => k + 1);
  }, [selectedDate]);

  const handleMonthChange = (year: number, month: number) => {
    setCalYear(year);
    setCalMonth(month);
  };

  const displayDate = selectedDate
    ? (() => {
        const d = new Date(selectedDate + "T00:00:00");
        const weekdays = ["Ням", "Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба"];
        const months = [
          "1-р сарын", "2-р сарын", "3-р сарын", "4-р сарын",
          "5-р сарын", "6-р сарын", "7-р сарын", "8-р сарын",
          "9-р сарын", "10-р сарын", "11-р сарын", "12-р сарын",
        ];
        return `${d.getFullYear()} оны ${months[d.getMonth()]} ${d.getDate()}, ${weekdays[d.getDay()]} гараг`;
      })()
    : "";

  const grouped = menu
    ? {
        meal_1: menu.items.filter((i) => i.item_type === "meal_1"),
        meal_2: menu.items.filter((i) => i.item_type === "meal_2"),
        drink: menu.items.filter((i) => i.item_type === "drink"),
      }
    : null;

  if (!mounted) {
    return (
      <main className="container mx-auto px-6 py-10 max-w-screen-2xl">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/40" />
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-6 py-10 max-w-screen-2xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/home"
              className="flex items-center justify-center w-9 h-9 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:border-gray-300 transition-all duration-200"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                Хоолны цэс
              </h1>
            </div>
          </div>
          {(user?.role === "admin" || user?.role === "chief") && (
            <Link
              href="/menu/manage"
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground bg-card border border-border hover:border-gray-300 px-3.5 py-2 rounded-xl transition-all duration-200"
            >
              <Settings className="h-4 w-4" />
              Цэс удирдах
            </Link>
          )}
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-8">
          {/* Left: Calendar */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <MenuCalendar
              year={calYear}
              month={calMonth}
              menuDates={menuDates}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              onMonthChange={handleMonthChange}
            />
          </div>

          {/* Right: Day detail */}
          <div className="space-y-5">
            {/* Date header */}
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-foreground">
                {displayDate}
              </h2>
              {selectedDate === today && (
                <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-600 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded-md">
                  Өнөөдөр
                </span>
              )}
            </div>

            {/* Content */}
            <div
              key={animKey}
              className="animate-[fadeSlideIn_0.3s_ease-out]"
            >
              {dayLoading && (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/40" />
                </div>
              )}

              {!dayLoading && (
                <div className="space-y-5">
                  {!menu && (
                    <div className="rounded-2xl border-2 border-dashed border-border py-12 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-4">
                        <UtensilsCrossed className="h-7 w-7 text-muted-foreground/30" />
                      </div>
                      <p className="text-muted-foreground font-medium">
                        Энэ өдөр цэс бүртгэгдээгүй байна
                      </p>
                      <p className="text-sm text-muted-foreground/60 mt-1">
                        Гал тогоо цэс оруулсны дараа энд харагдана
                      </p>
                    </div>
                  )}

                  {menu?.notes && (
                    <div className="bg-brand-50/60 border border-brand-200 rounded-xl px-4 py-3 text-sm text-brand-700 font-medium">
                      {menu.notes}
                    </div>
                  )}

                  {/* Food sections */}
                  {grouped &&
                    (["meal_1", "meal_2", "drink"] as const).map((type) => {
                      if (grouped[type].length === 0) return null;
                      const config = ITEM_TYPE_CONFIG[type];
                      const Icon = config.icon;

                      return (
                        <section key={type}>
                          <div className="flex items-center gap-2 mb-3">
                            <span
                              className={`inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${config.accent}`}
                            >
                              <Icon className="h-3.5 w-3.5" />
                              {config.label}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                            {grouped[type].map((item) => (
                              <MenuItemCard key={item.id} item={item} />
                            ))}
                          </div>
                        </section>
                      );
                    })}

                  {/* Бүртгэл нь хоолны газрын kiosk дээр хийгддэг тул энд
                      зөвхөн тухайн өдөр хэдэн хүн идэхийг харуулна. */}
                  <MenuDayCount date={selectedDate} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </main>
  );
}
