"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Check, Loader2, TriangleAlert } from "lucide-react";
import { kioskAPI, PublicMenu } from "@/lib/kiosk";
import {
  SESSIONS,
  CHOICES,
  SESSION_CONFIG,
  CHOICE_CONFIG,
  choiceSubtitle,
  dishNameFor,
} from "@/lib/menu-config";
import { formatMongolianDate, tomorrowString } from "@/lib/date-mn";
import { MealChoice, MealSession } from "@/types/schema.types";

// Хоолны газрын таблет дээр байнга нээлттэй байх өөрөө үйлчлэх терминал.
//
// МАРГААШИЙН төлөө бүртгэдэг: тогооч өнөөдөр дуусахад маргаашийн тоогоо
// мэдэж, хэдэн порц чанахаа шийднэ.
//
// Огноог таблет биш СЕРВЕР тодорхойлно (/public/menu/tomorrow) — таблетын
// огноо буруу байсан ч зөв өдрийн төлөө бүртгэнэ.
//
// Дизайны зарчим: нисэх буудлын бүртгэлийн машин шиг. Жижиг текст байхгүй,
// хоосон зай байхгүй, товч бүр алгаараа дарахад тохирсон. Дэлгэц үргэлж
// бүтнээрээ дүүрнэ — сешн сонгоогүй үед сешний карт бүх зайг эзэлж, сонгосон
// үед агшиж, доор нь порцын сонголт орж ирнэ.

const REFRESH_MS = 60_000;
const CONFIRM_MS = 2_000;
// Амжилтгүй болсныг уншиж ойлгоход амжилтаас илүү хугацаа хэрэгтэй
const FAILURE_MS = 4_000;
// Хагас нээлттэй орхиод явбал дараагийн хүн буруу сешнд бүртгүүлэхээс сэргийлнэ
const COLLAPSE_MS = 15_000;

interface Confirmation {
  session: MealSession;
  choice: MealChoice;
}

export default function KioskPage() {
  const [menu, setMenu] = useState<PublicMenu | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<MealSession | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const collapseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const failureTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    try {
      setMenu(await kioskAPI.getTomorrow());
    } catch {
      // Сүлжээ тасарсан ч сүүлд амжилттай татсан мэнюг харуулсаар байна —
      // таблет хоосон дэлгэц харуулахаас хамаагүй дээр. Даралт унавал
      // хэрэглэгч бүтэн дэлгэцийн анхааруулга харна.
    } finally {
      setLoading(false);
    }
  }, []);

  // Сервер огноог өөрөө тооцоолдог тул шөнө дунд "маргааш" шилжихэд таблет
  // дахин ачаалалгүйгээр дагаж шинэчлэгдэнэ.
  useEffect(() => {
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    return () => {
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
      if (collapseTimer.current) clearTimeout(collapseTimer.current);
      if (failureTimer.current) clearTimeout(failureTimer.current);
    };
  }, []);

  // Дэлгэцийг унтраахгүй байлгана.
  //
  // Kiosk таблет хэдэн цагаар хөдөлгөөнгүй зогсоно. Үүнгүйгээр дэлгэц бараан
  // болж, ажилтан эхлээд сэрээх гэж нэг удаа дарж, дараа нь бүртгэлээ хийх
  // болно — олон хүн эхний даралтыг бүртгэгдсэн гэж андуурна.
  //
  // Таб нуугдахад (дэлгэц түгжигдэх, өөр апп руу шилжих) түгжээ автоматаар
  // суларна. Тиймээс visibilitychange дээр дахин авах ёстой.
  useEffect(() => {
    const nav = navigator as Navigator & {
      wakeLock?: {
        request: (type: "screen") => Promise<{ release: () => Promise<void> }>;
      };
    };
    if (!nav.wakeLock) return;

    let sentinel: { release: () => Promise<void> } | null = null;
    let cancelled = false;

    const acquire = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const lock = await nav.wakeLock!.request("screen");
        if (cancelled) {
          void lock.release().catch(() => {});
          return;
        }
        sentinel = lock;
      } catch {
        // Браузер дэмжихгүй эсвэл татгалзсан — kiosk ажиллахаа болихгүй
      }
    };

    void acquire();
    document.addEventListener("visibilitychange", acquire);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", acquire);
      void sentinel?.release().catch(() => {});
    };
  }, []);

  const handleExpand = (session: MealSession) => {
    if (collapseTimer.current) clearTimeout(collapseTimer.current);
    const next = expanded === session ? null : session;
    setExpanded(next);
    if (next) {
      collapseTimer.current = setTimeout(() => setExpanded(null), COLLAPSE_MS);
    }
  };

  const handleTap = async (session: MealSession, choice: MealChoice) => {
    // Урьдчилан илгээсэн даралт дуусаагүй бол чимээгүй алгасана — энэ нь давхар
    // бүртгэлээс сэргийлэх зориулалттай.
    if (pending) return;

    // Цэс ачаалагдаагүй байхад UI бүрэн харагддаг тул даралт ЧИМЭЭГҮЙ алга
    // болохгүйн тулд заавал мэдэгдэнэ (доорх catch-тай ижил дүрэм).
    if (!menu) {
      setExpanded(null);
      setFailure("Цэс ачаалагдаагүй байна. Түр хүлээгээд дахин оролдоно уу.");
      failureTimer.current = setTimeout(() => setFailure(null), FAILURE_MS);
      return;
    }

    setPending(true);
    if (collapseTimer.current) clearTimeout(collapseTimer.current);

    try {
      const result = await kioskAPI.tap(menu.date, session, choice);
      setMenu((prev) => (prev ? { ...prev, count: result.count } : prev));
      setExpanded(null);
      setConfirmation({ session, choice });
      confirmTimer.current = setTimeout(() => setConfirmation(null), CONFIRM_MS);
    } catch (err) {
      // Даралт унасныг ЗААВАЛ хэлэх ёстой. Эс тэгвэл хүн андуурч дарсан
      // гэж бодоод дахин дарах ба тоо нь бүртгэгдэхгүй хэвээр үлдэнэ.
      setExpanded(null);
      setFailure(err instanceof Error ? err.message : "Алдаа гарлаа");
      failureTimer.current = setTimeout(() => setFailure(null), FAILURE_MS);
    } finally {
      setPending(false);
    }
  };

  if (loading) {
    return (
      <div className="kiosk-root flex items-center justify-center bg-slate-100">
        <Loader2 className="h-20 w-20 animate-spin text-slate-300" />
      </div>
    );
  }

  // ── Амжилтгүй: даралт бүртгэгдээгүйг тодорхой хэлнэ ──
  // Буланд байгаа жижиг тэмдэг хангалтгүй — хүн дарж байгаа газраа хардаг.
  if (failure) {
    return (
      <div className="kiosk-root flex flex-col items-center justify-center bg-rose-600 px-12 text-center text-white">
        <div className="animate-[popIn_0.35s_cubic-bezier(0.34,1.56,0.64,1)] rounded-full bg-white/15 p-[4vmin]">
          <TriangleAlert
            className="h-[var(--k-hero-icon)] w-[var(--k-hero-icon)]"
            strokeWidth={2.5}
          />
        </div>
        <p className="mt-[5vmin] text-[length:var(--k-hero)] font-black tracking-tight">
          Бүртгэгдсэнгүй
        </p>
        <p className="mt-[2.5vmin] text-[length:var(--k-hero-sub)] font-medium text-white/80">
          {failure}
        </p>
        <p className="mt-[3vmin] text-[length:var(--k-hero-sub)] text-white/60">
          Дахин оролдоно уу
        </p>
        <KioskStyles />
      </div>
    );
  }

  // ── Баталгаа: дараагийн хүн цэвэр дэлгэц харах ёстой ──
  if (confirmation) {
    const dish = menu
      ? dishNameFor(menu.items, confirmation.session, confirmation.choice)
      : null;

    return (
      <div className="kiosk-root flex flex-col items-center justify-center bg-emerald-600 px-12 text-center text-white">
        <div className="animate-[popIn_0.35s_cubic-bezier(0.34,1.56,0.64,1)] rounded-full bg-white/15 p-[4vmin]">
          <Check
            className="h-[var(--k-hero-icon)] w-[var(--k-hero-icon)]"
            strokeWidth={3}
          />
        </div>
        <p className="mt-[5vmin] text-[length:var(--k-hero)] font-black tracking-tight">
          Баярлалаа!
        </p>
        <p className="mt-[2.5vmin] text-[length:var(--k-hero-sub)] font-medium text-white/80">
          Маргааш · {SESSION_CONFIG[confirmation.session].label}
        </p>
        <p className="mt-[1vmin] text-[length:var(--k-hero-sub)] text-white/60">
          {dish ?? CHOICE_CONFIG[confirmation.choice].label}
        </p>
        <KioskStyles />
      </div>
    );
  }

  // Мэню татагдаагүй үед ч огноо гарч байх ёстой — таблет хоосон толгойтой
  // байвал ажилтан аль өдрийн төлөө дарж байгаагаа мэдэхгүй
  const shownDate = menu?.date ?? tomorrowString();
  const isOpen = expanded !== null;

  return (
    <div className="kiosk-root flex flex-col bg-slate-100">
      {/* ── Толгойн зурвас: терминалын таних тэмдэг ── */}
      {/* flex-wrap — нарийн (босоо) таблет дээр огноо доош бууна, халихгүй */}
      <header className="flex flex-wrap items-baseline gap-x-5 gap-y-1 bg-slate-900 px-[3vmin] py-[2.5vmin] text-white">
        <span className="rounded-xl bg-brand-500 px-3 py-1 text-[length:var(--k-badge)] font-black tracking-widest">
          МАРГААШ
        </span>
        <span className="text-[length:var(--k-date)] font-semibold tracking-tight">
          {formatMongolianDate(shownDate)}
        </span>
      </header>

      {/* ── Заавар ── */}
      <div className="px-[3vmin] pt-[3vmin]">
        <h1 className="text-[length:var(--k-title)] font-black tracking-tight text-slate-900">
          Маргаашийн хоолны цэс
        </h1>
        {menu?.notes && (
          <p className="mt-1 line-clamp-2 text-[length:var(--k-notes)] text-slate-500">
            {menu.notes}
          </p>
        )}
      </div>

      {/* ── Сонголтын хэсэг: дэлгэцийн үлдсэн зайг бүтнээр эзэлнэ ──
          Сешн сонгоогүй үед сешний мөр бүх зайг авна; сонгосон үед агшиж,
          порцын мөр орж ирнэ. Ингэснээр доор хоосон зай үлдэхгүй. */}
      <main className="flex min-h-0 flex-1 flex-col px-[3vmin] pb-[3vmin] pt-[2.5vmin]">
        {/* Сешн — 2 том карт зэрэгцээ */}
        <div
          className="grid min-h-0 grid-cols-2 gap-[2vmin] transition-[flex-grow] duration-500 ease-out"
          style={{ flexGrow: isOpen ? 0.7 : 2, flexShrink: 1, flexBasis: 0 }}
        >
          {SESSIONS.map((session) => {
            const config = SESSION_CONFIG[session];
            const Icon = config.icon;
            const count = menu?.count[session];
            const active = expanded === session;

            return (
              <button
                key={session}
                onClick={() => handleExpand(session)}
                aria-expanded={active}
                className={`group relative flex min-h-0 items-center justify-center overflow-hidden rounded-[2rem] border-4 px-4 transition-all duration-300 active:scale-[0.98] ${
                  // Сонголт нээгдэхэд карт хэвтээ болж агшина — эс тэгвэл
                  // намхан дэлгэц дээр агуулга картаас халина
                  isOpen ? "flex-row gap-5" : "flex-col gap-4"
                } ${
                  active
                    ? "border-brand-600 bg-brand-600 text-white shadow-xl shadow-brand-600/25"
                    : "border-slate-200 bg-white text-slate-900 shadow-sm"
                }`}
              >
                <Icon
                  className={`shrink-0 transition-all duration-300 ${
                    isOpen
                      ? "h-[var(--k-icon-md)] w-[var(--k-icon-md)]"
                      : "h-[var(--k-icon-lg)] w-[var(--k-icon-lg)]"
                  } ${active ? "text-white" : "text-brand-500"}`}
                  strokeWidth={1.5}
                />

                <span
                  className={`font-black tracking-tight transition-all duration-300 ${
                    isOpen
                      ? "text-[length:var(--k-session-sm)]"
                      : "text-[length:var(--k-session)]"
                  }`}
                >
                  {config.short.toUpperCase()}
                </span>

                {!isOpen && !!count?.people && (
                  <span
                    className={`text-[length:var(--k-count)] font-semibold transition-colors duration-300 ${
                      active ? "text-white/70" : "text-slate-400"
                    }`}
                  >
                    {count.people} хүн
                  </span>
                )}

                {/* Идэвхтэй карт руу заасан сум — доорх сонголт үүнийх гэдгийг
                    харуулна */}
                <span
                  className={`absolute -bottom-[18px] left-1/2 h-0 w-0 -translate-x-1/2 border-x-[18px] border-t-[18px] border-x-transparent transition-opacity duration-300 ${
                    active
                      ? "border-t-brand-600 opacity-100"
                      : "border-t-transparent opacity-0"
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Порц — 3 карт, сешн сонгосон үед орж ирнэ */}
        <div
          className="grid min-h-0 grid-cols-3 overflow-hidden transition-all duration-500 ease-out"
          style={{
            flexGrow: isOpen ? 1 : 0,
            flexShrink: 1,
            flexBasis: 0,
            marginTop: isOpen ? "3vmin" : "0",
            columnGap: "2vmin",
            opacity: isOpen ? 1 : 0,
          }}
        >
          {CHOICES.map((choice, i) => {
            const config = CHOICE_CONFIG[choice];
            const Icon = config.icon;
            // Цэс ороогүй бол доод мөр огт гарахгүй — эс тэгвэл "1-р хоол"
            // гэсэн текст хоёр удаа давхарлана
            const subtitle =
              menu && expanded
                ? choiceSubtitle(menu.items, expanded, choice)
                : null;

            return (
              <button
                key={choice}
                onClick={() => expanded && handleTap(expanded, choice)}
                disabled={pending || !isOpen}
                style={{ transitionDelay: isOpen ? `${i * 70}ms` : "0ms" }}
                className={`flex min-h-0 flex-col items-center justify-center gap-[1vmin] overflow-hidden rounded-[2rem] border-4 border-slate-200 bg-white px-3 py-[2vmin] shadow-sm transition-all duration-300 active:scale-[0.97] active:border-brand-500 active:bg-brand-50 disabled:pointer-events-none ${
                  isOpen
                    ? "translate-y-0 opacity-100"
                    : "translate-y-6 opacity-0"
                }`}
              >
                <Icon
                  className="h-[var(--k-icon-sm)] w-[var(--k-icon-sm)] shrink-0 text-brand-500"
                  strokeWidth={1.5}
                />
                <span className="text-center text-[length:var(--k-choice)] font-black leading-tight tracking-tight text-slate-900">
                  {config.label}
                </span>
                {subtitle && (
                  <span className="line-clamp-2 text-center text-[length:var(--k-sub)] font-medium leading-snug text-slate-500">
                    {subtitle}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </main>

      {/* ── Хөлийн зурвас: өдрийн нийт тоо ── */}
      <footer className="flex items-center justify-center gap-[5vmin] border-t-2 border-slate-200 bg-white px-[3vmin] py-[2vmin]">
        {SESSIONS.map((session) => (
          <span key={session} className="flex items-baseline gap-2">
            <span className="text-[length:var(--k-sub)] font-semibold uppercase tracking-widest text-slate-400">
              {SESSION_CONFIG[session].short}
            </span>
            <span className="text-[length:var(--k-session-sm)] font-black tabular-nums text-slate-900">
              {menu?.count[session].people ?? 0}
            </span>
          </span>
        ))}
      </footer>

      <KioskStyles />
    </div>
  );
}

function KioskStyles() {
  return (
    <style jsx global>{`
      /* Таблет дээр гүйлгэх, томруулах, текст сонгохыг хаана */
      html,
      body {
        overflow: hidden;
        overscroll-behavior: none;
      }
      .kiosk-root {
        height: 100dvh;
        width: 100vw;
        overflow: hidden;
        touch-action: manipulation;
        user-select: none;
        -webkit-user-select: none;
        -webkit-tap-highlight-color: transparent;
        /* iOS дээр удаан дарахад гарч ирдэг цэсийг хаана */
        -webkit-touch-callout: none;

        /* Таблетын хэмжээ урьдчилан мэдэгдэхгүй (10", 8", хэвтээ, босоо).
           vmin ашигласнаар богино талаас нь хамаарч томрох тул хоёр
           чиглэлд аль алинд нь халихгүй. clamp нь хэт жижиг/том болохоос
           сэргийлнэ. */
        --k-badge: clamp(0.95rem, 2.2vmin, 1.5rem);
        --k-date: clamp(1rem, 2.8vmin, 1.875rem);
        --k-title: clamp(1.5rem, 4.2vmin, 3rem);
        --k-notes: clamp(0.95rem, 2.4vmin, 1.5rem);
        --k-session: clamp(2rem, 7vmin, 3.75rem);
        --k-session-sm: clamp(1.5rem, 4.5vmin, 2.25rem);
        --k-count: clamp(1rem, 2.6vmin, 1.5rem);
        --k-choice: clamp(1.35rem, 3.8vmin, 2.25rem);
        --k-sub: clamp(0.9rem, 2.3vmin, 1.25rem);
        --k-icon-lg: clamp(3rem, 10vmin, 6rem);
        --k-icon-md: clamp(2.25rem, 6vmin, 3.5rem);
        --k-icon-sm: clamp(1.75rem, 4.5vmin, 3rem);
        --k-hero: clamp(2.25rem, 8vmin, 4.5rem);
        --k-hero-sub: clamp(1.15rem, 3.4vmin, 2.25rem);
        --k-hero-icon: clamp(4rem, 14vmin, 8rem);
      }
      @keyframes popIn {
        from {
          opacity: 0;
          transform: scale(0.7);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }
    `}</style>
  );
}
