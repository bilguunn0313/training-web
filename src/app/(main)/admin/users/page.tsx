"use client";

import { useState } from "react";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { adminAPI } from "@/lib/admin";
import { AdminUser, PaginationData } from "@/types/admin";
import SearchBar from "@/components/admin/SearchBar";
import FilterPanel, { FilterOption } from "@/components/admin/FilterPanel";
import DataTable, { Column } from "@/components/admin/DataTable";
import Pagination from "@/components/admin/Pagination";
import { EditUserDialog } from "@/components/admin/EditUserDialog";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-users", page, search, roleFilter],
    queryFn: async () => {
      const response = await adminAPI.getUsers({
        page,
        limit: 20,
        search: search || undefined,
        role:
          roleFilter !== "all"
            ? (roleFilter as
                | "admin"
                | "user"
                | "chief"
                | "supervisor"
                | "accountant")
            : undefined,
      });
      return response;
    },
    placeholderData: keepPreviousData,
  });

  const filters: FilterOption[] = [
    {
      label: "Role",
      value: "role",
      options: [
        { label: "Admin", value: "admin" },
        { label: "User", value: "user" },
        { label: "Chief", value: "chief" },
        { label: "Supervisor", value: "supervisor" },
        { label: "Accountant", value: "accountant" },
      ],
      onChange: setRoleFilter,
      currentValue: roleFilter,
    },
  ];

  const handleReset = () => {
    setRoleFilter("all");
    setSearch("");
    setPage(1);
  };

  const handleEdit = async (id: number, data: any) => {
    try {
      await adminAPI.updateUser(id, data);
      toast.success("Хэрэглэгч амжилттай шинэчлэгдлээ");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Хэрэглэгч шинэчлэхэд алдаа гарлаа");
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    try {
      setIsDeleting(true);
      await adminAPI.deleteUser(selectedUser.id);
      toast.success("Хэрэглэгч амжилттай устгагдлаа");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setDeleteDialogOpen(false);
      setSelectedUser(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Хэрэглэгч устгахад алдаа гарлаа");
    } finally {
      setIsDeleting(false);
    }
  };

  const activeFilterCount = (roleFilter !== "all" ? 1 : 0) + (search ? 1 : 0);

  const columns: Column<AdminUser>[] = [
    {
      key: "id",
      label: "ID",
    },
    {
      key: "name",
      label: "Name",
    },
    {
      key: "email",
      label: "Email",
    },
    {
      key: "role",
      label: "Role",
      render: (user) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded ${
            user.role === "admin"
              ? "bg-purple-100 text-purple-800"
              : user.role === "chief"
              ? "bg-brand-100 text-brand-800"
              : user.role === "supervisor"
              ? "bg-cyan-100 text-cyan-800"
              : user.role === "accountant"
              ? "bg-emerald-100 text-emerald-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {user.role}
        </span>
      ),
    },
    {
      key: "created_at",
      label: "Created At",
      render: (user) => format(new Date(user.created_at), "MMM dd, yyyy"),
    },
    {
      key: "actions",
      label: "Actions",
      render: (user) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedUser(user);
              setEditDialogOpen(true);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedUser(user);
              setDeleteDialogOpen(true);
            }}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage and view all registered users
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <SearchBar
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Search by name or email..."
          />
        </div>
        <FilterPanel
          filters={filters}
          onReset={handleReset}
          activeFilterCount={activeFilterCount}
        />
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Failed to load users</p>
        </div>
      )}

      {/* Data Table */}
      <DataTable
        data={data?.data || []}
        columns={columns}
        loading={isLoading}
        emptyMessage="No users found"
      />

      {/* Pagination */}
      {data?.pagination && (
        <Pagination
          pagination={data.pagination as PaginationData}
          onPageChange={setPage}
        />
      )}

      {/* Dialogs */}

      <EditUserDialog
        isOpen={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedUser(null);
        }}
        onSubmit={handleEdit}
        user={selectedUser}
      />

      <DeleteConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setSelectedUser(null);
        }}
        onConfirm={handleDelete}
        title="Delete User"
        description={`Are you sure you want to delete user "${selectedUser?.name}"? This action cannot be undone.`}
        isLoading={isDeleting}
      />
    </div>
  );
}
