"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUserContext } from "@/lib/userProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { enrollmentAPI } from "@/lib/enrollment";
import {
  GraduationCap,
  UtensilsCrossed,
  ArrowRight,
  LogOut,
  BookOpen,
  Thermometer,
  // CircleGauge, — Машин картыг түр хаасан
  Settings,
  ClipboardList,
  Monitor,
  Package,
} from "lucide-react";

const ROLE_LABEL: Record<string, string> = {
  user: "Хэрэглэгч",
  admin: "Админ",
  chief: "Менежер",
  supervisor: "Хянагч",
  accountant: "Нягтлан",
};

function formatDate(): string {
  const now = new Date();
  const days = ["Ням", "Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба"];
  const months = [
    "1-р сар",
    "2-р сар",
    "3-р сар",
    "4-р сар",
    "5-р сар",
    "6-р сар",
    "7-р сар",
    "8-р сар",
    "9-р сар",
    "10-р сар",
    "11-р сар",
    "12-р сар",
  ];
  return `${now.getFullYear()} оны ${months[now.getMonth()]}ын ${now.getDate()}, ${days[now.getDay()]} гараг`;
}

export default function HomePage() {
  const { user, logout } = useUserContext();
  const [enrolledCount, setEnrolledCount] = useState<number | null>(null);

  useEffect(() => {
    enrollmentAPI
      .getMyCourses()
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setEnrolledCount(res.data.length);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-page-bg flex flex-col">
        {/* ── Main ─────────────────────────────────────────────────────── */}
        <main className="flex-1 container mx-auto px-6 py-10 max-w-5xl">
          {/* Greeting */}
          <div className="flex items-start justify-between mb-10 animate-fade-in">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <span className="text-[11px] font-medium text-brand-600 bg-brand-50 border border-brand-100 rounded-md px-2 py-0.5">
                  {user ? (ROLE_LABEL[user.role] ?? "Хэрэглэгч") : ""}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {formatDate()}
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">
                Сайн байна уу, {user?.name ?? "..."}
              </h1>
              {enrolledCount !== null && enrolledCount > 0 && (
                <p className="text-sm text-muted-foreground mt-1.5 flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-brand-500" />
                  {enrolledCount} сургалтанд бүртгэлтэй
                </p>
              )}
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer mt-1"
            >
              <LogOut className="h-3.5 w-3.5" />
              Гарах
            </button>
          </div>

          {/* ── Navigation Cards ───────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
            <Link
              href="/course"
              className="group rounded-xl border border-t-2 border-t-brand-400 bg-card p-9 hover:border-brand-200 hover:border-t-brand-400 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 animate-slide-up delay-100"
            >
              <div className="flex items-start justify-between mb-5">
                <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <GraduationCap className="h-7 w-7 text-brand-600" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
              </div>
              <h2 className="font-semibold text-lg">Сургалт</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mt-1">
                Видео хичээл үзэх, мэдлэгээ дээшлүүлэх
              </p>
            </Link>

            <Link
              href="/menu"
              className="group rounded-xl border border-t-2 border-t-orange-400 bg-card p-9 hover:border-orange-200 hover:border-t-orange-400 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 animate-slide-up delay-200"
            >
              <div className="flex items-start justify-between mb-5">
                <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <UtensilsCrossed className="h-7 w-7 text-orange-600" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
              </div>
              <h2 className="font-semibold text-lg">Хоолны цэс</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mt-1">
                Өдрийн хоолны цэс харах
              </p>
            </Link>

            <Link
              href="/temperature"
              className="group rounded-xl border border-t-2 border-t-cyan-400 bg-card p-9 hover:border-cyan-200 hover:border-t-cyan-400 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 animate-slide-up delay-300"
            >
              <div className="flex items-start justify-between mb-5">
                <div className="w-14 h-14 rounded-2xl bg-cyan-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <Thermometer className="h-7 w-7 text-cyan-600" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
              </div>
              <h2 className="font-semibold text-lg">Температур</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mt-1">
                Агуулахын температурын бүртгэл харах
              </p>
            </Link>

            {/* Машин — түр хаасан
            <Link
              href="/tire-condition"
              className="group rounded-xl border border-t-2 border-t-amber-400 bg-card p-9 hover:border-amber-200 hover:border-t-amber-400 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 animate-slide-up delay-400"
            >
              <div className="flex items-start justify-between mb-5">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <CircleGauge className="h-7 w-7 text-amber-600" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
              </div>
              <h2 className="font-semibold text-lg">Машин</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mt-1">
                Машины дугуйн нөхцөл байдал
              </p>
            </Link>
            */}

            {(user?.role === "admin" ||
              user?.role === "accountant" ||
              user?.role === "chief") && (
              <Link
                href="/inventory"
                className="group rounded-xl border border-t-2 border-t-emerald-400 bg-card p-9 hover:border-emerald-200 hover:border-t-emerald-400 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 animate-slide-up delay-500"
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <Package className="h-7 w-7 text-emerald-600" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                </div>
                <h2 className="font-semibold text-lg">Хүнсний нөөц</h2>
                <p className="text-sm text-muted-foreground leading-relaxed mt-1">
                  Материалын үлдэгдэл, орлого зарлага, тооллого
                </p>
              </Link>
            )}

            {user?.role === "admin" && (
              <Link
                href="/admin/dashboard"
                className="group rounded-xl border border-t-2 border-t-purple-400 bg-card p-9 hover:border-purple-200 hover:border-t-purple-400 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 animate-slide-up delay-500"
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <Settings className="h-7 w-7 text-purple-600" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                </div>
                <h2 className="font-semibold text-lg">Админ хэсэг</h2>
                <p className="text-sm text-muted-foreground leading-relaxed mt-1">
                  Хэрэглэгч, сургалт, хичээл удирдах
                </p>
              </Link>
            )}

            {user?.role === "admin" && (
              <Link
                href="/computer-assets"
                className="group rounded-xl border border-t-2 border-t-teal-400 bg-card p-9 hover:border-teal-200 hover:border-t-teal-400 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 animate-slide-up delay-700"
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <Monitor className="h-7 w-7 text-teal-600" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                </div>
                <h2 className="font-semibold text-lg">МАБТТАX үзлэг</h2>
                <p className="text-sm text-muted-foreground leading-relaxed mt-1">
                  Техникийн мэдээлэл, QR код удирдах
                </p>
              </Link>
            )}
          </div>
        </main>

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <footer className="py-4 px-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground border-t">
          <GraduationCap className="h-3.5 w-3.5" />© {new Date().getFullYear()}{" "}
          Cosmo
        </footer>
      </div>
    </ProtectedRoute>
  );
}
