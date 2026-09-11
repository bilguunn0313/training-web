"use client";

import { useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { InventoryNav } from "@/components/InventoryNav";
import { useUserContext } from "@/lib/userProvider";
import { useMaterials } from "@/hooks/useInventory";
import { inventoryAPI } from "@/lib/inventory";
import { Material } from "@/types/schema.types";
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
import { Package, Plus, Loader2 } from "lucide-react";

const UNIT_SUGGESTIONS = ["кг", "гр", "л", "ш", "боодол", "шуудай", "хайрцаг"];

export default function MaterialsPage() {
  const { user } = useUserContext();
  const canEdit = user?.role === "admin" || user?.role === "accountant";

  const { materials, loading, refetch } = useMaterials();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Material | null>(null);
  const [formName, setFormName] = useState("");
  const [formUnit, setFormUnit] = useState("кг");
  const [formCategory, setFormCategory] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Material | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openCreateDialog = () => {
    setEditing(null);
    setFormName("");
    setFormUnit("кг");
    setFormCategory("");
    setDialogOpen(true);
  };

  const openEditDialog = (material: Material) => {
    setEditing(material);
    setFormName(material.name);
    setFormUnit(material.unit);
    setFormCategory(material.category || "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formUnit.trim()) {
      toast.error("Материалын нэр болон хэмжих нэгж оруулна уу");
      return;
    }

    try {
      setSaving(true);
      if (editing) {
        await inventoryAPI.updateMaterial(editing.id, {
          name: formName.trim(),
          unit: formUnit.trim(),
          category: formCategory.trim() || null,
        });
        toast.success("Материал шинэчлэгдлээ");
      } else {
        await inventoryAPI.createMaterial({
          name: formName.trim(),
          unit: formUnit.trim(),
          category: formCategory.trim() || null,
        });
        toast.success("Материал бүртгэгдлээ");
      }
      setDialogOpen(false);
      refetch();
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
      await inventoryAPI.deleteMaterial(deleteTarget.id);
      toast.success("Материал идэвхгүй болголоо");
      setDeleteTarget(null);
      refetch();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || "Алдаа гарлаа";
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ProtectedRoute requiredRole={["admin", "accountant", "chief"]}>
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-6 py-10 max-w-5xl">
          <InventoryNav subtitle="Материалын сан" />

          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground">
              Нийт {materials.length} материал
            </p>
            {canEdit && (
              <Button size="sm" onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-1" />
                Материал нэмэх
              </Button>
            )}
          </div>

          <div className="rounded-lg border bg-card">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm">Уншиж байна...</span>
              </div>
            ) : materials.length === 0 ? (
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
                    <TableHead>Нэр</TableHead>
                    <TableHead>Хэмжих нэгж</TableHead>
                    <TableHead>Ангилал</TableHead>
                    {canEdit && (
                      <TableHead className="text-right">Үйлдэл</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materials.map((material) => (
                    <TableRow key={material.id}>
                      <TableCell className="font-medium">
                        {material.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {material.unit}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {material.category || "—"}
                      </TableCell>
                      {canEdit && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => openEditDialog(material)}
                            >
                              Засах
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs text-red-500 hover:text-red-600 hover:border-red-300"
                              onClick={() => setDeleteTarget(material)}
                            >
                              Идэвхгүй
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </main>

        {/* Нэмэх / Засах */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>
                {editing ? "Материал засах" : "Материал нэмэх"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label htmlFor="material-name">Нэр</Label>
                <Input
                  id="material-name"
                  placeholder="жишээ нь: Үхрийн мах"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="material-unit">Хэмжих нэгж</Label>
                <Input
                  id="material-unit"
                  list="unit-suggestions"
                  placeholder="кг"
                  value={formUnit}
                  onChange={(e) => setFormUnit(e.target.value)}
                  className="mt-1.5"
                />
                <datalist id="unit-suggestions">
                  {UNIT_SUGGESTIONS.map((u) => (
                    <option key={u} value={u} />
                  ))}
                </datalist>
              </div>
              <div>
                <Label htmlFor="material-category">Ангилал</Label>
                <Input
                  id="material-category"
                  placeholder="жишээ нь: Мах, Хүнсний ногоо"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="mt-1.5"
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
                  {editing ? "Хадгалах" : "Нэмэх"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Идэвхгүй болгох */}
        <AlertDialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Материал идэвхгүй болгох</AlertDialogTitle>
              <AlertDialogDescription>
                &ldquo;{deleteTarget?.name}&rdquo;-г идэвхгүй болгох уу?
                Жагсаалтаас алга болно, гэхдээ өмнөх гүйлгээний түүх хэвээр
                хадгалагдана.
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
                Идэвхгүй болгох
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ProtectedRoute>
  );
}
