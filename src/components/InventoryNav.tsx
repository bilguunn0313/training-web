"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Package } from "lucide-react";

const TABS = [
  { href: "/inventory", label: "Үлдэгдэл" },
  { href: "/inventory/materials", label: "Материал" },
  { href: "/inventory/transactions", label: "Орлого/Зарлага" },
  { href: "/inventory/count", label: "Тооллого" },
];

export function InventoryNav({ subtitle }: { subtitle: string }) {
  const pathname = usePathname();

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/home"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
          <Package className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Хүнсний материалын нөөц
          </h1>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      <nav className="flex items-center gap-1 mb-5 border-b">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-3 py-2 text-sm transition-colors border-b-2 -mb-px ${
                active
                  ? "border-emerald-500 text-foreground font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
