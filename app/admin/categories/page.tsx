"use client"

import { Fragment, useEffect, useState } from "react"
import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react"
import { AdminPageHeader, PrimaryButton, StatusBadge } from "@/components/admin/admin-ui"
import { fetchApi } from "@/lib/api"
import { prettifyStatus } from "@/lib/admin-data"

type CategoryRow = {
  id: string
  slug: string
  name: string
  description: string
  products: number
  status: string
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    image: "",
    status: "ACTIVE",
  })

  function loadCategories() {
    fetchApi<Record<string, unknown>[]>("/api/admin/categories")
      .then((payload) => {
        const list = Array.isArray(payload) ? payload : []
        setCategories(
          list.map((c) => ({
            id: String(c.id),
            slug: String(c.slug ?? ""),
            name: String(c.name ?? ""),
            description: String(c.description ?? ""),
            products: Number(c.productCount ?? c.products ?? 0),
            status: prettifyStatus(String(c.status ?? "Active")),
          })),
        )
      })
      .catch(() => setCategories([]))
  }

  useEffect(() => {
    loadCategories()
  }, [])

  async function saveCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await fetchApi(editingId ? `/api/admin/categories/${editingId}` : "/api/admin/categories", {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(form),
      })
      setForm({ name: "", slug: "", description: "", image: "", status: "ACTIVE" })
      setEditingId(null)
      setShowForm(false)
      setNotice({ type: "success", text: editingId ? "Category updated successfully." : "Category created successfully." })
      loadCategories()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add category.")
    } finally {
      setSaving(false)
    }
  }

  function startEdit(category: CategoryRow) {
    setEditingId(category.id)
    setNotice(null)
    setConfirmDeleteId(null)
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description,
      image: "",
      status: category.status.toUpperCase(),
    })
    setShowForm(true)
  }

  async function deleteCategory(category: CategoryRow) {
    setBusyId(category.id)
    setNotice(null)
    try {
      await fetchApi(`/api/admin/categories/${category.id}`, { method: "DELETE" })
      setCategories((current) => current.filter((item) => item.id !== category.id))
      setConfirmDeleteId(null)
      setNotice({ type: "success", text: "Category deleted from the database." })
      loadCategories()
    } catch (err) {
      setNotice({ type: "error", text: err instanceof Error ? err.message : "Failed to delete category." })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Categories"
        breadcrumb={["Dashboard", "Categories"]}
        actions={
          <PrimaryButton onClick={() => setShowForm((value) => !value)}>
            <Plus className="size-4" />
            Add New Category
          </PrimaryButton>
        }
      />

      {showForm && (
        <form onSubmit={saveCategory} className="mb-5 rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <input
              required
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Category name"
              className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-ring"
            />
            <input
              value={form.slug}
              onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
              placeholder="Slug, optional"
              className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-ring"
            />
            <input
              value={form.image}
              onChange={(event) => setForm((current) => ({ ...current, image: event.target.value }))}
              placeholder="Image path, optional"
              className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-ring"
            />
            <select
              value={form.status}
              onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
              className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-ring"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
            <textarea
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Description"
              className="md:col-span-2 rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-ring"
            />
          </div>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
          <div className="mt-4 flex justify-end">
            <PrimaryButton type="submit" disabled={saving}>{saving ? "Saving..." : editingId ? "Update Category" : "Save Category"}</PrimaryButton>
          </div>
        </form>
      )}

      {notice && (
        <div className={`mb-5 rounded-lg border px-4 py-3 text-sm ${
          notice.type === "success"
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-red-200 bg-red-50 text-red-700"
        }`}>
          {notice.text}
        </div>
      )}

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Products</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {categories.map((c) => (
                <Fragment key={c.id}>
                <tr className="transition-colors hover:bg-secondary/40">
                  <td className="px-4 py-3 font-medium text-foreground">{c.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.description}</td>
                  <td className="px-4 py-3 text-foreground">{c.products}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => startEdit(c)}
                        className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
                        aria-label="Edit"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId((current) => (current === c.id ? null : c.id))}
                        className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-red-50 hover:text-destructive"
                        aria-label="Delete"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                {confirmDeleteId === c.id && (
                  <tr className="bg-red-50/70">
                    <td colSpan={5} className="px-4 py-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-medium text-red-700">Delete {c.name}?</p>
                          <p className="text-xs text-red-600">This removes the category from the database.</p>
                        </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => deleteCategory(c)} disabled={busyId === c.id} className="inline-flex items-center justify-center gap-2 rounded-md bg-destructive px-3 py-2 text-sm font-semibold text-destructive-foreground disabled:opacity-70">
                            {busyId === c.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                            Delete
                          </button>
                          <button type="button" onClick={() => setConfirmDeleteId(null)} className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground">
                            <X className="size-4" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
