"use client";

import { useMemo, useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { InventoryNav } from "@/components/InventoryNav";
import { useMaterialBalances, useMonthlyReport } from "@/hooks/useInventory";
import {
  formatQty,
  formatMoney,
  downloadCSV,
} from "@/lib/inventory-format";
import { MaterialBalance } from "@/types/schema.types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Package,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";

const MONTH_NAMES = [
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

function exportCSV(rows: MaterialBalance[]) {
  downloadCSV(
    `uldegdel-${new Date().toISOString().slice(0, 10)}.csv`,
    ["Материал", "Ангилал", "Үлдэгдэл", "Нэгж", "Дундаж үнэ", "Дүн"],
    rows.map((r) => [
      r.name,
      r.category || "",
      String(r.balance),
      r.unit,
      r.avg_price !== null ? String(Math.round(r.avg_price)) : "",
      String(Math.round(r.balance_value)),
    ])
  );
}

export default function InventoryPage() {
  const { balances, loading } = useMaterialBalances();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [showReport, setShowReport] = useState(false);

  const { rows: reportRows, loading: reportLoading } = useMonthlyReport(
    year,
    month
  );

  const totalValue = useMemo(
    () => balances.reduce((sum, b) => sum + b.balance_value, 0),
    [balances]
  );

  const goToPrevMonth = () => {
    if (month === 1) {
      setYear(year - 1);
      setMonth(12);
    } else {
      setMonth(month - 1);
    }
  };

  const goToNextMonth = () => {
    if (month === 12) {
      setYear(year + 1);
      setMonth(1);
    } else {
      setMonth(month + 1);
    }
  };

  return (
    <ProtectedRoute requiredRole={["admin", "accountant", "chief"]}>
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-6 py-10 max-w-6xl">
          <InventoryNav subtitle="Агуулахын одоогийн үлдэгдэл" />

          {/* Хураангуй */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div className="rounded-lg border bg-card p-4">
              <p className="text-xs text-muted-foreground">Материалын тоо</p>
              <p className="text-2xl font-semibold tabular-nums mt-1">
                {balances.length}
              </p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-xs text-muted-foreground">
                Нөөцийн нийт дүн
              </p>
              <p className="text-2xl font-semibold tabular-nums mt-1">
                {formatMoney(totalValue)}₮
              </p>
            </div>
          </div>

          {/* Үлдэгдлийн хүснэгт */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium">Одоогийн үлдэгдэл</h2>
            <div className="flex items-center gap-2">
              {balances.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportCSV(balances)}
                >
                  <Download className="h-4 w-4 mr-1" />
                  CSV татах
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReport((v) => !v)}
              >
                {showReport ? "Тайлан хаах" : "Сарын тайлан"}
              </Button>
            </div>
          </div>

          <div className="rounded-lg border bg-card mb-8">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm">Уншиж байна...</span>
              </div>
            ) : balances.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Материал бүртгэгдээгүй байна
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Материал</TableHead>
                    <TableHead>Ангилал</TableHead>
                    <TableHead className="text-right">Үлдэгдэл</TableHead>
                    <TableHead className="text-right">Дундаж үнэ</TableHead>
                    <TableHead className="text-right">Дүн</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {balances.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium">{b.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {b.category || "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatQty(b.balance)} {b.unit}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {b.avg_price !== null
                            ? `${formatMoney(b.avg_price)}₮`
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatMoney(b.balance_value)}₮
                        </TableCell>
                      </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Сарын тайлан */}
          {showReport && (
            <>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-medium">Сарын тайлан</h2>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={goToPrevMonth}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium min-w-[120px] text-center">
                    {year} оны {MONTH_NAMES[month - 1]}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={goToNextMonth}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border bg-card overflow-x-auto">
                {reportLoading ? (
                  <div className="flex items-center justify-center py-12 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm">Уншиж байна...</span>
                  </div>
                ) : reportRows.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-sm text-muted-foreground">
                      Энэ сард хөдөлгөөн байхгүй байна
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Материал</TableHead>
                        <TableHead className="text-right">Эхний</TableHead>
                        <TableHead className="text-right">Орлого</TableHead>
                        <TableHead className="text-right">Зарлага</TableHead>
                        <TableHead className="text-right">Залруулга</TableHead>
                        <TableHead className="text-right">Эцсийн</TableHead>
                        <TableHead className="text-right">Дүн</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportRows.map((r) => (
                        <TableRow key={r.material_id}>
                          <TableCell className="font-medium">
                            {r.name}
                            <span className="text-muted-foreground text-xs ml-1">
                              ({r.unit})
                            </span>
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground">
                            {formatQty(r.opening_quantity)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-emerald-600">
                            {r.receipt_quantity > 0
                              ? `+${formatQty(r.receipt_quantity)}`
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-red-500">
                            {r.issue_quantity > 0
                              ? `−${formatQty(r.issue_quantity)}`
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground">
                            {r.adjustment_quantity !== 0
                              ? formatQty(r.adjustment_quantity)
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-medium">
                            {formatQty(r.closing_quantity)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatMoney(r.closing_value)}₮
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
