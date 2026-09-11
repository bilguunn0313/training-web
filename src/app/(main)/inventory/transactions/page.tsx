"use client";

import { useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { InventoryNav } from "@/components/InventoryNav";
import { useUserContext } from "@/lib/userProvider";
import { useMaterials, useTransactions } from "@/hooks/useInventory";
import { useQueryClient } from "@tanstack/react-query";
import { inventoryAPI } from "@/lib/inventory";
import {
  formatQty,
  formatMoney,
  downloadCSV,
} from "@/lib/inventory-format";
import { MaterialTransaction } from "@/types/schema.types";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  ArrowDownToLine,
  ArrowUpFromLine,
  Loader2,
  Plus,
  Download,
  Scale,
} from "lucide-react";

const TX_LABEL: Record<string, string> = {
  receipt: "Орлого",
  issue: "Зарлага",
  adjustment: "Залруулга",
};

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function monthStartStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export default function TransactionsPage() {
  const { user } = useUserContext();
  const canEdit = user?.role === "admin" || user?.role === "accountant";

  const { materials } = useMaterials();

  const [filterMaterial, setFilterMaterial] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterFrom, setFilterFrom] = useState(monthStartStr());
  const [filterTo, setFilterTo] = useState(todayStr());

  const queryClient = useQueryClient();

  // Гүйлгээ өөрчлөгдвөл үлдэгдэл ба сарын тайлан хоёулаа хуучирна. Апп даяар
  // staleTime: 5 минут тул invalidate хийхгүй бол /inventory нь 5 минутын турш
  // гүйлгээний ӨМНӨХ үлдэгдлийг харуулсаар байна.
  const invalidateInventory = () => {
    queryClient.invalidateQueries({ queryKey: ["material-balances"] });
    queryClient.invalidateQueries({ queryKey: ["inventory-monthly-report"] });
  };

  const { transactions, loading, refetch } = useTransactions({
    materialId: filterMaterial === "all" ? undefined : Number(filterMaterial),
    txType:
      filterType === "all"
        ? undefined
        : (filterType as "receipt" | "issue" | "adjustment"),
    from: filterFrom || undefined,
    to: filterTo || undefined,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MaterialTransaction | null>(null);
  const [formType, setFormType] = useState<"receipt" | "issue">("receipt");
  const [formMaterial, setFormMaterial] = useState("");
  const [formQty, setFormQty] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formDate, setFormDate] = useState(todayStr());
  const [formNote, setFormNote] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<MaterialTransaction | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);

  const openCreateDialog = (txType: "receipt" | "issue") => {
    setEditing(null);
    setFormType(txType);
    setFormMaterial("");
    setFormQty("");
    setFormPrice("");
    setFormDate(todayStr());
    setFormNote("");
    setDialogOpen(true);
  };

  const openEditDialog = (tx: MaterialTransaction) => {
    setEditing(tx);
    setFormType(tx.tx_type === "issue" ? "issue" : "receipt");
    setFormMaterial(String(tx.material_id));
    setFormQty(String(Math.abs(tx.quantity)));
    setFormPrice(tx.unit_price !== null ? String(tx.unit_price) : "");
    setFormDate(tx.tx_date);
    setFormNote(tx.note || "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const qty = parseFloat(formQty);
    if (isNaN(qty) || qty <= 0) {
      toast.error("Тоо хэмжээ 0-ээс их байх ёстой");
      return;
    }

    let price: number | null = null;
    if (formPrice.trim()) {
      const parsed = parseFloat(formPrice);
      if (isNaN(parsed) || parsed < 0) {
        toast.error("Үнэ буруу байна");
        return;
      }
      price = parsed;
    }

    if (formType === "receipt" && price === null) {
      toast.error("Орлогод нэгжийн үнэ заавал шаардлагатай");
      return;
    }

    try {
      setSaving(true);

      if (editing) {
        await inventoryAPI.updateTransaction(editing.id, {
          quantity: qty,
          unitPrice: price,
          txDate: formDate,
          note: formNote || null,
        });
        toast.success("Гүйлгээ шинэчлэгдлээ");
      } else {
        if (!formMaterial) {
          toast.error("Материал сонгоно уу");
          setSaving(false);
          return;
        }

        await inventoryAPI.createTransaction({
          materialId: Number(formMaterial),
          txType: formType,
          quantity: qty,
          unitPrice: price,
          txDate: formDate,
          note: formNote || null,
        });
        toast.success(
          formType === "receipt" ? "Орлого бүртгэгдлээ" : "Зарлага бүртгэгдлээ"
        );
      }

      setDialogOpen(false);
      refetch();
      invalidateInventory();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || "Алдаа гарлаа";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await inventoryAPI.deleteTransaction(deleteTarget.id);
      toast.success("Гүйлгээ устгагдлаа");
      setDeleteTarget(null);
      refetch();
      invalidateInventory();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || "Алдаа гарлаа";
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  const exportCSV = () => {
    downloadCSV(
      `guilgee-${filterFrom}_${filterTo}.csv`,
      ["Огноо", "Материал", "Төрөл", "Тоо хэмжээ", "Нэгж", "Нэгж үнэ", "Дүн", "Тэмдэглэл", "Бүртгэсэн"],
      transactions.map((t) => [
        t.tx_date,
        t.material_name || "",
        TX_LABEL[t.tx_type],
        String(t.quantity),
        t.material_unit || "",
        t.unit_price !== null ? String(t.unit_price) : "",
        t.unit_price !== null
          ? String(Math.round(Math.abs(t.quantity) * t.unit_price))
          : "",
        t.note || "",
        t.created_by_name || "",
      ])
    );
  };

  return (
    <ProtectedRoute requiredRole={["admin", "accountant", "chief"]}>
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-6 py-10 max-w-6xl">
          <InventoryNav subtitle="Орлого, зарлагын бүртгэл" />

          {/* Шүүлтүүр + үйлдэл */}
          <div className="flex flex-wrap items-end gap-3 mb-4">
            <div>
              <Label className="text-xs text-muted-foreground">Материал</Label>
              <Select value={filterMaterial} onValueChange={setFilterMaterial}>
                <SelectTrigger className="w-[180px] mt-1 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Бүгд</SelectItem>
                  {materials.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Төрөл</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[140px] mt-1 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Бүгд</SelectItem>
                  <SelectItem value="receipt">Орлого</SelectItem>
                  <SelectItem value="issue">Зарлага</SelectItem>
                  <SelectItem value="adjustment">Залруулга</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Эхлэх</Label>
              <Input
                type="date"
                value={filterFrom}
                onChange={(e) => setFilterFrom(e.target.value)}
                className="w-[150px] mt-1 h-9"
              />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Дуусах</Label>
              <Input
                type="date"
                value={filterTo}
                onChange={(e) => setFilterTo(e.target.value)}
                className="w-[150px] mt-1 h-9"
              />
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {transactions.length > 0 && (
                <Button variant="outline" size="sm" onClick={exportCSV}>
                  <Download className="h-4 w-4 mr-1" />
                  CSV
                </Button>
              )}
              {canEdit && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openCreateDialog("receipt")}
                  >
                    <ArrowDownToLine className="h-4 w-4 mr-1 text-emerald-600" />
                    Орлого
                  </Button>
                  <Button size="sm" onClick={() => openCreateDialog("issue")}>
                    <ArrowUpFromLine className="h-4 w-4 mr-1" />
                    Зарлага
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Хүснэгт */}
          <div className="rounded-lg border bg-card overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm">Уншиж байна...</span>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12">
                <Plus className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Энэ хугацаанд гүйлгээ байхгүй байна
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Огноо</TableHead>
                    <TableHead>Материал</TableHead>
                    <TableHead>Төрөл</TableHead>
                    <TableHead className="text-right">Тоо хэмжээ</TableHead>
                    <TableHead className="text-right">Нэгж үнэ</TableHead>
                    <TableHead className="text-right">Дүн</TableHead>
                    <TableHead>Тэмдэглэл</TableHead>
                    {canEdit && (
                      <TableHead className="text-right">Үйлдэл</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => {
                    const isAdjustment = tx.tx_type === "adjustment";
                    const isReceipt = tx.tx_type === "receipt";
                    return (
                      <TableRow key={tx.id}>
                        <TableCell className="tabular-nums">
                          {tx.tx_date}
                        </TableCell>
                        <TableCell className="font-medium">
                          {tx.material_name}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md border ${
                              isReceipt
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                : isAdjustment
                                  ? "bg-muted text-muted-foreground"
                                  : "bg-orange-50 text-orange-700 border-orange-100"
                            }`}
                          >
                            {isAdjustment && <Scale className="h-3 w-3" />}
                            {TX_LABEL[tx.tx_type]}
                          </span>
                        </TableCell>
                        <TableCell
                          className={`text-right tabular-nums ${
                            tx.quantity > 0 ? "text-emerald-600" : "text-red-500"
                          }`}
                        >
                          {tx.quantity > 0 ? "+" : "−"}
                          {formatQty(Math.abs(tx.quantity))} {tx.material_unit}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {tx.unit_price !== null
                            ? `${formatMoney(tx.unit_price)}₮`
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {tx.unit_price !== null
                            ? `${formatMoney(Math.abs(tx.quantity) * tx.unit_price)}₮`
                            : "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-[160px] truncate">
                          {tx.note || "—"}
                        </TableCell>
                        {canEdit && (
                          <TableCell className="text-right">
                            {isAdjustment ? (
                              <span className="text-xs text-muted-foreground">
                                Тооллогоос
                              </span>
                            ) : (
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => openEditDialog(tx)}
                                >
                                  Засах
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs text-red-500 hover:text-red-600 hover:border-red-300"
                                  onClick={() => setDeleteTarget(tx)}
                                >
                                  Устгах
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </main>

        {/* Бүртгэх / Засах */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle>
                {editing
                  ? "Гүйлгээ засах"
                  : formType === "receipt"
                    ? "Орлого бүртгэх"
                    : "Зарлага бүртгэх"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              {!editing && (
                <div>
                  <Label>Материал</Label>
                  <Select value={formMaterial} onValueChange={setFormMaterial}>
                    <SelectTrigger className="mt-1.5 w-full">
                      <SelectValue placeholder="Материал сонгох" />
                    </SelectTrigger>
                    <SelectContent>
                      {materials.map((m) => (
                        <SelectItem key={m.id} value={String(m.id)}>
                          {m.name} ({m.unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="tx-date">Огноо</Label>
                <Input
                  id="tx-date"
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="tx-qty">Тоо хэмжээ</Label>
                <Input
                  id="tx-qty"
                  type="number"
                  step="0.001"
                  min="0"
                  placeholder="жишээ нь: 100"
                  value={formQty}
                  onChange={(e) => setFormQty(e.target.value)}
                  className="mt-1.5"
                />
              </div>

              {formType === "receipt" && (
                <div>
                  <Label htmlFor="tx-price">Нэгжийн үнэ (₮)</Label>
                  <Input
                    id="tx-price"
                    type="number"
                    step="1"
                    min="0"
                    placeholder="жишээ нь: 25000"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="tx-note">Тэмдэглэл</Label>
                <Textarea
                  id="tx-note"
                  placeholder={
                    formType === "issue"
                      ? "жишээ нь: Тогоочид тушаав"
                      : "жишээ нь: Нийлүүлэгчээс авав"
                  }
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  className="mt-1.5"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={saving}
                >
                  Болих
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                  {editing ? "Хадгалах" : "Бүртгэх"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Устгах */}
        <AlertDialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Гүйлгээ устгах</AlertDialogTitle>
              <AlertDialogDescription>
                Энэ гүйлгээг устгахдаа итгэлтэй байна уу? Үлдэгдэл дахин
                тооцогдоно.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Болих</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleting}
                className="bg-red-500 hover:bg-red-600"
              >
                {deleting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                Устгах
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ProtectedRoute>
  );
}
