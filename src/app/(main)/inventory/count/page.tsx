"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { InventoryNav } from "@/components/InventoryNav";
import { useUserContext } from "@/lib/userProvider";
import { useStockCount, useStockCounts } from "@/hooks/useInventory";
import { inventoryAPI } from "@/lib/inventory";
import { formatQty } from "@/lib/inventory-format";
import { StockCount } from "@/types/schema.types";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ClipboardCheck,
  Loader2,
  Plus,
  Lock,
  ChevronRight,
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

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function StockCountPage() {
  const { user } = useUserContext();
  const canEdit = user?.role === "admin" || user?.role === "accountant";

  const { counts, loading: countsLoading, refetch: refetchCounts } =
    useStockCounts();

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { count, loading: detailLoading, refetch: refetchDetail } =
    useStockCount(selectedId);

  // materialId → тоолсон тоо (input-ийн түүхий утга)
  const [counted, setCounted] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const now = new Date();
  const [formDate, setFormDate] = useState(todayStr());
  const [formYear, setFormYear] = useState(String(now.getFullYear()));
  const [formMonth, setFormMonth] = useState(String(now.getMonth() + 1));
  const [formNotes, setFormNotes] = useState("");
  const [creating, setCreating] = useState(false);

  const [closeTarget, setCloseTarget] = useState<StockCount | null>(null);
  const [closing, setClosing] = useState(false);

  // Тооллого сонгогдоход тоолсон тоог утгаар нь ачаална
  useEffect(() => {
    if (!count) {
      setCounted({});
      return;
    }
    const initial: Record<number, string> = {};
    for (const line of count.lines) {
      initial[line.material_id] = String(line.counted_quantity);
    }
    setCounted(initial);
  }, [count]);

  const handleCreate = async () => {
    try {
      setCreating(true);
      const res = await inventoryAPI.createStockCount({
        countDate: formDate,
        periodYear: Number(formYear),
        periodMonth: Number(formMonth),
        notes: formNotes || null,
      });
      toast.success("Тооллого үүслээ");
      setCreateOpen(false);
      setFormNotes("");
      await refetchCounts();
      if (res?.data?.id) setSelectedId(res.data.id);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || "Алдаа гарлаа";
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleSaveLines = async () => {
    if (!count) return;

    const lines = count.lines.map((line) => ({
      materialId: line.material_id,
      countedQuantity: parseFloat(counted[line.material_id] ?? "0"),
      note: line.note,
    }));

    if (lines.some((l) => isNaN(l.countedQuantity) || l.countedQuantity < 0)) {
      toast.error("Тоолсон тоо 0 буюу түүнээс их тоо байх ёстой");
      return;
    }

    try {
      setSaving(true);
      await inventoryAPI.saveStockCountLines(count.id, lines);
      toast.success("Тоолсон тоо хадгалагдлаа");
      refetchDetail();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || "Алдаа гарлаа";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = async () => {
    if (!closeTarget) return;
    try {
      setClosing(true);
      await inventoryAPI.closeStockCount(closeTarget.id);
      toast.success("Тооллого хаагдаж, үлдэгдэл залруулагдлаа");
      setCloseTarget(null);
      refetchCounts();
      refetchDetail();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || "Алдаа гарлаа";
      toast.error(msg);
    } finally {
      setClosing(false);
    }
  };

  const isDraft = count?.status === "draft";
  const canEditLines = canEdit && isDraft;

  return (
    <ProtectedRoute requiredRole={["admin", "accountant", "chief"]}>
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-6 py-10 max-w-6xl">
          <InventoryNav subtitle="Сарын тооллого, зөрүү" />

          {/* Тооллогын жагсаалт */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium">Тооллогууд</h2>
            {canEdit && (
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Шинэ тооллого
              </Button>
            )}
          </div>

          <div className="rounded-lg border bg-card mb-8">
            {countsLoading ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm">Уншиж байна...</span>
              </div>
            ) : counts.length === 0 ? (
              <div className="text-center py-10">
                <ClipboardCheck className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Тооллого хийгдээгүй байна
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Хугацаа</TableHead>
                    <TableHead>Тооллогын огноо</TableHead>
                    <TableHead>Төлөв</TableHead>
                    <TableHead>Бүртгэсэн</TableHead>
                    <TableHead className="text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {counts.map((c) => (
                    <TableRow
                      key={c.id}
                      className={`cursor-pointer ${
                        selectedId === c.id ? "bg-muted/50" : ""
                      }`}
                      onClick={() => setSelectedId(c.id)}
                    >
                      <TableCell className="font-medium">
                        {c.period_year} оны {MONTH_NAMES[c.period_month - 1]}
                      </TableCell>
                      <TableCell className="tabular-nums text-muted-foreground">
                        {c.count_date}
                      </TableCell>
                      <TableCell>
                        {c.status === "closed" ? (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                            <Lock className="h-3 w-3" />
                            Хаагдсан
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-100">
                            Ноорог
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {c.created_by_name || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <ChevronRight className="h-4 w-4 text-muted-foreground inline" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Сонгосон тооллогын дэлгэрэнгүй */}
          {selectedId !== null && (
            <>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-medium">
                  {count
                    ? `${count.period_year} оны ${MONTH_NAMES[count.period_month - 1]} — тоолсон тоо`
                    : "Тоолсон тоо"}
                </h2>
                {canEditLines && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSaveLines}
                      disabled={saving}
                    >
                      {saving && (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      )}
                      Хадгалах
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => count && setCloseTarget(count)}
                    >
                      <Lock className="h-4 w-4 mr-1" />
                      Тооллого хаах
                    </Button>
                  </div>
                )}
              </div>

              {count?.status === "closed" && (
                <div className="rounded-lg border bg-muted/40 px-4 py-3 mb-3 text-sm text-muted-foreground flex items-center gap-2">
                  <Lock className="h-4 w-4 shrink-0" />
                  Энэ тооллого хаагдсан. {count.count_date}-ны өмнөх огноотой
                  гүйлгээг өөрчлөх боломжгүй.
                </div>
              )}

              <div className="rounded-lg border bg-card">
                {detailLoading ? (
                  <div className="flex items-center justify-center py-12 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm">Уншиж байна...</span>
                  </div>
                ) : !count || count.lines.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-sm text-muted-foreground">
                      Мөр байхгүй байна
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Материал</TableHead>
                        <TableHead className="text-right">
                          Системийн үлдэгдэл
                        </TableHead>
                        <TableHead className="text-right w-[160px]">
                          Бодит тоолсон
                        </TableHead>
                        <TableHead className="text-right">Зөрүү</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {count.lines.map((line) => {
                        const raw = counted[line.material_id] ?? "";
                        const parsed = parseFloat(raw);
                        const diff = isNaN(parsed)
                          ? 0
                          : parsed - line.system_quantity;

                        return (
                          <TableRow key={line.id}>
                            <TableCell className="font-medium">
                              {line.material_name}
                              <span className="text-muted-foreground text-xs ml-1">
                                ({line.material_unit})
                              </span>
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-muted-foreground">
                              {formatQty(line.system_quantity)}
                            </TableCell>
                            <TableCell className="text-right">
                              {canEditLines ? (
                                <Input
                                  type="number"
                                  step="0.001"
                                  min="0"
                                  value={raw}
                                  onChange={(e) =>
                                    setCounted((prev) => ({
                                      ...prev,
                                      [line.material_id]: e.target.value,
                                    }))
                                  }
                                  className="h-8 text-right tabular-nums ml-auto"
                                />
                              ) : (
                                <span className="tabular-nums">
                                  {formatQty(line.counted_quantity)}
                                </span>
                              )}
                            </TableCell>
                            <TableCell
                              className={`text-right tabular-nums font-medium ${
                                diff === 0
                                  ? "text-muted-foreground"
                                  : diff > 0
                                    ? "text-emerald-600"
                                    : "text-red-500"
                              }`}
                            >
                              {diff === 0
                                ? "—"
                                : `${diff > 0 ? "+" : "−"}${formatQty(Math.abs(diff))}`}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </div>
            </>
          )}
        </main>

        {/* Шинэ тооллого */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Шинэ тооллого үүсгэх</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <p className="text-xs text-muted-foreground">
                Тооллого үүсгэхэд тухайн өдрийн системийн үлдэгдэл мөр болон
                бичигдэнэ. Дараа нь зөрүүтэй мөрөө засаад хаана.
              </p>

              <div>
                <Label htmlFor="count-date">Тооллогын огноо</Label>
                <Input
                  id="count-date"
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="mt-1.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="count-year">Он</Label>
                  <Input
                    id="count-year"
                    type="number"
                    value={formYear}
                    onChange={(e) => setFormYear(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="count-month">Сар</Label>
                  <Input
                    id="count-month"
                    type="number"
                    min="1"
                    max="12"
                    value={formMonth}
                    onChange={(e) => setFormMonth(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="count-notes">Тэмдэглэл</Label>
                <Textarea
                  id="count-notes"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="mt-1.5"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setCreateOpen(false)}
                  disabled={creating}
                >
                  Болих
                </Button>
                <Button onClick={handleCreate} disabled={creating}>
                  {creating && (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  )}
                  Үүсгэх
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Хаах баталгаажуулалт */}
        <AlertDialog
          open={!!closeTarget}
          onOpenChange={(open) => !open && setCloseTarget(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Тооллого хаах</AlertDialogTitle>
              <AlertDialogDescription>
                Зөрүүтэй мөр бүрт залруулгын гүйлгээ автоматаар үүсэж, үлдэгдэл
                бодит тоогоор засагдана. Хаасны дараа {closeTarget?.count_date}
                -ны өмнөх огноотой гүйлгээ түгжигдэнэ. Үргэлжлүүлэх үү?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={closing}>Болих</AlertDialogCancel>
              <AlertDialogAction onClick={handleClose} disabled={closing}>
                {closing && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                Хаах
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ProtectedRoute>
  );
}
