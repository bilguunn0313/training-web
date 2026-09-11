"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { MenuCalendar } from "@/components/MenuCalendar";
import { ImageUpload } from "@/components/ImageUpload";
import {
  useMenuByDate,
  useMonthlyMenus,
  useMenuCount,
} from "@/hooks/useMenu";
import { menuAPI } from "@/lib/menu";
import { useDishes } from "@/hooks/useDishes";
import { Dish, MealSession } from "@/types/schema.types";
import {
  SESSIONS,
  SESSION_CONFIG,
  CHOICE_CONFIG,
} from "@/lib/menu-config";
import { toast } from "sonner";
import {
  Plus,
  Save,
  Trash2,
  Loader2,
  Users,
  Check,
  X,
  ArrowLeft,
  CookingPot,
  UtensilsCrossed,
  GlassWater,
  BookOpen,
  Search,
  PenLine,
  ChefHat,
  Minus,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ItemFormData {
  name: string;
  imageUrl: string;
  itemType: "meal_1" | "meal_2" | "drink";
  mealSession: MealSession;
}

const EMPTY_ITEM = (
  type: "meal_1" | "meal_2" | "drink",
  session: MealSession,
): ItemFormData => ({
  name: "",
  imageUrl: "",
  itemType: type,
  mealSession: session,
});

const ITEM_TYPE_CONFIG: Record<
  string,
  { label: string; icon: typeof CookingPot; accent: string; addLabel: string }
> = {
  meal_1: {
    label: "Хоол 1",
    icon: CookingPot,
    accent: "text-amber-600 bg-amber-50 border-amber-200",
    addLabel: "Хоол нэмэх",
  },
  meal_2: {
    label: "Хоол 2",
    icon: UtensilsCrossed,
    accent: "text-orange-600 bg-orange-50 border-orange-200",
    addLabel: "Хоол нэмэх",
  },
  drink: {
    label: "Уух зүйл",
    icon: GlassWater,
    accent: "text-sky-600 bg-sky-50 border-sky-200",
    addLabel: "Ундаа нэмэх",
  },
};

function MenuManageContent() {
  const [mounted, setMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [calYear, setCalYear] = useState(2026);
  const [calMonth, setCalMonth] = useState(1);

  useEffect(() => {
    const now = new Date();
    setSelectedDate(format(now, "yyyy-MM-dd"));
    setCalYear(now.getFullYear());
    setCalMonth(now.getMonth() + 1);
    setMounted(true);
  }, []);

  const { menus, refetch: refetchMonthly } = useMonthlyMenus(
    calYear,
    calMonth,
  );
  const {
    menu,
    loading: dayLoading,
    refetch: refetchDay,
  } = useMenuByDate(selectedDate);
  const { count, removingTap, removeKioskTap } = useMenuCount(selectedDate);

  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<ItemFormData[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editSession, setEditSession] = useState<MealSession>("lunch");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerType, setPickerType] = useState<"meal_1" | "meal_2" | "drink">("meal_1");
  const [pickerSearch, setPickerSearch] = useState("");

  useEffect(() => {
    if (menu) {
      setNotes(menu.notes || "");
      setItems(
        menu.items.map((item) => ({
          name: item.name,
          imageUrl: item.image_url || "",
          itemType: item.item_type,
          mealSession: item.meal_session,
        })),
      );
    } else {
      setNotes("");
      setItems([]);
    }
  }, [menu]);

  const menuDates = new Set(menus.map((m) => m.menu_date.split("T")[0]));

  const handleMonthChange = (year: number, month: number) => {
    setCalYear(year);
    setCalMonth(month);
  };

  const handleAddItem = (type: "meal_1" | "meal_2" | "drink") => {
    setPickerType(type);
    setPickerSearch("");
    setPickerOpen(true);
  };

  const handleAddManualItem = (type: "meal_1" | "meal_2" | "drink") => {
    setItems((prev) => [...prev, EMPTY_ITEM(type, editSession)]);
    setPickerOpen(false);
  };

  const handleSelectDish = (dish: Dish, type: "meal_1" | "meal_2" | "drink") => {
    setItems((prev) => [
      ...prev,
      {
        name: dish.name,
        imageUrl: dish.image_url || "",
        itemType: type,
        mealSession: editSession,
      },
    ]);
    setPickerOpen(false);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: keyof ItemFormData,
    value: string,
  ) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleSave = async () => {
    const validItems = items.filter((i) => i.name.trim());
    if (validItems.length === 0) {
      toast.error("Хамгийн багадаа нэг хоол нэмнэ үү");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        menuDate: selectedDate,
        notes: notes || null,
        items: validItems.map((i) => ({
          name: i.name,
          imageUrl: i.imageUrl || null,
          itemType: i.itemType,
          mealSession: i.mealSession,
        })),
      };

      if (menu) {
        await menuAPI.update(menu.id, payload);
        toast.success("Цэс амжилттай шинэчлэгдлээ");
      } else {
        await menuAPI.create(payload);
        toast.success("Цэс амжилттай үүсгэгдлээ");
      }

      await Promise.all([refetchDay(), refetchMonthly()]);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Алдаа гарлаа");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!menu) return;
    setDeleting(true);
    try {
      await menuAPI.delete(menu.id);
      toast.success("Цэс амжилттай устгагдлаа");
      await Promise.all([refetchDay(), refetchMonthly()]);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Устгахад алдаа гарлаа");
    } finally {
      setDeleting(false);
    }
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

  const handleRemoveTap = async (session: MealSession) => {
    try {
      await removeKioskTap(session);
      toast.success("Нэг бүртгэл хасагдлаа");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Хасахад алдаа гарлаа");
    }
  };

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
        <div className="flex items-center gap-3">
          <Link
            href="/menu"
            className="flex items-center justify-center w-9 h-9 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:border-gray-300 transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Цэс удирдах
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Өдөр сонгоод цэс нэмэх, засах, хариулт харах
            </p>
          </div>
          <Link
            href="/menu/dishes"
            className="ml-auto flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 hover:bg-brand-50 px-3 py-2 rounded-lg transition-colors"
          >
            <BookOpen className="h-4 w-4" />
            Хоолны сан
          </Link>
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-8">
          {/* Calendar */}
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

          {/* Editor Panel */}
          <div className="space-y-5">
            {/* Date header + actions */}
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {displayDate}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {menu
                      ? "Цэс бүртгэгдсэн"
                      : "Цэс байхгүй — шинээр үүсгэх"}
                  </p>
                </div>
                {/* Бүртгэл нь хоолны газрын kiosk дээр хийгддэг тул энд
                    нэрсийн жагсаалт байхгүй — доорх тоо нь бодит бүртгэл. */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {menu && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-red-500 hover:text-red-700 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
                          disabled={deleting}
                        >
                          {deleting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          Устгах
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Цэс устгах уу?</AlertDialogTitle>
                          <AlertDialogDescription>
                            {displayDate}-ний цэс болон бүх хоолны мэдээлэл
                            устгагдана. Энэ үйлдлийг буцаах боломжгүй.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Болих</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            Устгах
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>

              {/* Status indicator */}
              {menu && (
                <div className="h-1 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400" />
              )}
            </div>

            {/* Порцын тоо — тогоочийн гол мэдээлэл.
                Хүний тоо ба порцын тоо ӨӨР: "Бүгд" сонгосон хүн нэг хүн
                боловч хоёр порц эзэлдэг. */}
            <div className="bg-card rounded-2xl border border-border p-5">
              <div className="flex items-center gap-2 mb-4">
                <ChefHat className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Хэдэн порц чанах вэ
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {SESSIONS.map((session) => {
                  const c = count?.[session];
                  const people = c?.people ?? 0;
                  const m1 = c?.meal_1 ?? 0;
                  const m2 = c?.meal_2 ?? 0;
                  const both = m1 + m2 - people;

                  return (
                    <div
                      key={session}
                      className="rounded-xl border border-border bg-muted/20 p-4"
                    >
                      <div className="flex items-baseline justify-between mb-3">
                        <span className="text-sm font-semibold text-foreground">
                          {SESSION_CONFIG[session].label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {people} хүн
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <div className="flex-1 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700">
                            1-р хоол
                          </p>
                          <p className="text-2xl font-bold text-amber-800 tabular-nums">
                            {m1}
                          </p>
                        </div>
                        <div className="flex-1 rounded-lg bg-orange-50 border border-orange-200 px-3 py-2">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-orange-700">
                            2-р хоол
                          </p>
                          <p className="text-2xl font-bold text-orange-800 tabular-nums">
                            {m2}
                          </p>
                        </div>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between gap-2">
                        <p className="text-[11px] text-muted-foreground leading-tight">
                          нийт {m1 + m2} порц
                          {both > 0 && ` · ${both} хүн бүгдийг авна`}
                        </p>
                        {people > 0 && (
                          <button
                            onClick={() => handleRemoveTap(session)}
                            disabled={removingTap}
                            title="Kiosk дээр андуурч дарсныг хасах"
                            className="flex items-center gap-1 flex-shrink-0 text-[11px] font-medium text-muted-foreground hover:text-red-600 border border-border hover:border-red-200 hover:bg-red-50 px-2 py-1 rounded-md transition-colors disabled:opacity-50"
                          >
                            {removingTap ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Minus className="h-3 w-3" />
                            )}
                            Засах
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {dayLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/40" />
              </div>
            ) : (
              <>
                {/* Notes */}
                <div className="bg-card rounded-2xl border border-border p-5">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Тэмдэглэл
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Нэмэлт тэмдэглэл..."
                    className="w-full border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring resize-none bg-muted/30 placeholder:text-muted-foreground/40 transition-colors"
                    rows={2}
                  />
                </div>

                {/* Өглөө / Өдөр — тус тусдаа цэстэй */}
                <div className="flex gap-1 bg-muted/50 rounded-xl p-1">
                  {SESSIONS.map((session) => {
                    const filled = items.filter(
                      (i) => i.mealSession === session && i.name.trim(),
                    ).length;

                    return (
                      <button
                        key={session}
                        onClick={() => setEditSession(session)}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          editSession === session
                            ? "bg-card text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {SESSION_CONFIG[session].label}
                        {filled > 0 && (
                          <span className="text-xs font-semibold bg-muted px-1.5 py-0.5 rounded">
                            {filled}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Item Slots by Type — идэвхтэй сешний зүйлс */}
                {(["meal_1", "meal_2", "drink"] as const).map((type) => {
                  const config = ITEM_TYPE_CONFIG[type];
                  const Icon = config.icon;
                  const typeItems = items
                    .map((item, idx) => ({ item, idx }))
                    .filter(
                      ({ item }) =>
                        item.itemType === type &&
                        item.mealSession === editSession,
                    );

                  return (
                    <div
                      key={type}
                      className="bg-card rounded-2xl border border-border overflow-hidden"
                    >
                      <div className="flex items-center justify-between p-5 pb-4">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border ${config.accent}`}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          <h3 className="text-base font-semibold text-foreground">
                            {config.label}
                          </h3>
                          {typeItems.length > 0 && (
                            <span className="text-xs font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                              {typeItems.length}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleAddItem(type)}
                          className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 hover:bg-brand-50 px-2.5 py-1.5 rounded-lg transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                          {config.addLabel}
                        </button>
                      </div>

                      {typeItems.length === 0 ? (
                        <div className="px-5 pb-5">
                          <div className="rounded-xl border-2 border-dashed border-border py-8 text-center">
                            <Icon className="h-6 w-6 text-muted-foreground/20 mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground/60">
                              Хоол нэмэгдээгүй байна
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="px-5 pb-5 space-y-3">
                          {typeItems.map(({ item, idx }) => (
                            <div
                              key={idx}
                              className="border border-border rounded-xl p-4 space-y-3 relative bg-muted/20 hover:bg-muted/30 transition-colors"
                            >
                              <button
                                onClick={() => handleRemoveItem(idx)}
                                className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/40 hover:text-red-500 hover:bg-red-50 transition-colors"
                              >
                                <X className="h-4 w-4" />
                              </button>

                              <div>
                                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                                  Нэр
                                </label>
                                <input
                                  value={item.name}
                                  onChange={(e) =>
                                    handleItemChange(
                                      idx,
                                      "name",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Хоолны нэр"
                                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring bg-card placeholder:text-muted-foreground/40 transition-colors"
                                />
                              </div>

                              <ImageUpload
                                value={item.imageUrl}
                                onChange={(url) =>
                                  handleItemChange(idx, "imageUrl", url)
                                }
                                label="Зураг"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Save button */}
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl font-semibold hover:opacity-90 transition-all duration-200 disabled:opacity-50 shadow-sm active:scale-[0.99]"
                >
                  {saving ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Save className="h-5 w-5" />
                  )}
                  {menu ? "Шинэчлэх" : "Үүсгэх"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Dish Picker Dialog */}
      <DishPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        itemType={pickerType}
        search={pickerSearch}
        onSearchChange={setPickerSearch}
        onSelect={(dish, type) => handleSelectDish(dish, type)}
        onManualAdd={(type) => handleAddManualItem(type)}
      />
    </main>
  );
}

function DishPickerDialog({
  open,
  onOpenChange,
  itemType,
  search,
  onSearchChange,
  onSelect,
  onManualAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemType: "meal_1" | "meal_2" | "drink";
  search: string;
  onSearchChange: (search: string) => void;
  onSelect: (dish: Dish, type: "meal_1" | "meal_2" | "drink") => void;
  onManualAdd: (type: "meal_1" | "meal_2" | "drink") => void;
}) {
  const { dishes, loading } = useDishes(
    open ? { itemType, search: search || undefined } : {}
  );
  const config = ITEM_TYPE_CONFIG[itemType];
  const Icon = config.icon;
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg border ${config.accent}`}>
              <Icon className="h-3.5 w-3.5" />
            </span>
            Хоолны сангаас сонгох — {config.label}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 pt-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Хоол хайх..."
              className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring bg-muted/30 placeholder:text-muted-foreground/40 transition-colors"
            />
          </div>
          <button
            onClick={() => onManualAdd(itemType)}
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg border border-border hover:bg-muted/60 transition-colors whitespace-nowrap"
          >
            <PenLine className="h-4 w-4" />
            Гараар нэмэх
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 pt-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/40" />
            </div>
          ) : dishes.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {search ? "Хайлтад тохирох хоол олдсонгүй" : "Энэ төрлийн хоол бүртгэгдээгүй байна"}
              </p>
              <button
                onClick={() => onManualAdd(itemType)}
                className="mt-2 text-sm font-medium text-brand-600 hover:text-brand-700"
              >
                Гараар нэмэх
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {dishes.map((dish) => (
                <button
                  key={dish.id}
                  onClick={() => onSelect(dish, itemType)}
                  className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-md hover:border-brand-300 transition-all text-left group"
                >
                  <div className="aspect-[4/3] bg-muted/30 relative">
                    {dish.image_url ? (
                      <img
                        src={`${backendUrl}${dish.image_url}`}
                        alt={dish.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Icon className="h-8 w-8 text-muted-foreground/15" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-brand-600/0 group-hover:bg-brand-600/5 transition-colors" />
                  </div>
                  <div className="p-2.5">
                    <p className="text-sm font-medium text-foreground truncate">
                      {dish.name}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function MenuManagePage() {
  return (
    <ProtectedRoute requiredRole={["admin", "chief"]}>
      <MenuManageContent />
    </ProtectedRoute>
  );
}
