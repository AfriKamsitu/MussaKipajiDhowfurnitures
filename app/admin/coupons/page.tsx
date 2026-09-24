"use client"

import { Fragment, useCallback, useEffect, useState } from "react"
import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react"
import { AdminPageHeader, PrimaryButton, StatusBadge } from "@/components/admin/admin-ui"
import { fetchApi } from "@/lib/api"
import { formatTZS, prettifyStatus } from "@/lib/admin-data"
import { useStoreSettings } from "@/components/store-settings-provider"

type CouponRow = {
  id: string
  code: string
  discountType: string
  discountValue: number
  usageLimit: number
  discount: string
  usage: string
  validUntil: string
  status: string
}

function formatDiscount(type: string, value: number, currency: string) {
  const t = type.toUpperCase()
  if (t === "PERCENTAGE") return `${value}% OFF`
  if (t === "FREE_SHIPPING") return "Free Shipping"
  return formatTZS(value, currency)
}

export default function AdminCouponsPage() {
  const { currency } = useStoreSettings()
  const [coupons, setCoupons] = useState<CouponRow[]>([])
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    code: "",
    discountType: "PERCENTAGE",
    discountValue: "0",
    usageLimit: "0",
    validUntil: "",
    status: "ACTIVE",
  })

  const loadCoupons = useCallback(() => {
    fetchApi<Record<string, unknown>[]>("/api/admin/coupons")
      .then((payload) => {
        const list = Array.isArray(payload) ? payload : []
        setCoupons(
          list.map((c) => ({
            id: String(c.id),
            code: String(c.code ?? ""),
            discountType: String(c.discountType ?? "PERCENTAGE"),
            discountValue: Number(c.discountValue ?? 0),
            usageLimit: Number(c.usageLimit ?? 0),
            discount: formatDiscount(String(c.discountType ?? ""), Number(c.discountValue ?? 0), currency),
            usage: `${c.usageCount ?? 0} / ${c.usageLimit ?? "∞"}`,
            validUntil: c.validUntil ? String(c.validUntil) : "—",
            status: prettifyStatus(String(c.status ?? "Active")),
          })),
        )
      })
      .catch(() => setCoupons([]))
  }, [currency])

  useEffect(() => {
    loadCoupons()
  }, [loadCoupons])

  async function saveCoupon(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await fetchApi(editingId ? `/api/admin/coupons/${editingId}` : "/api/admin/coupons", {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify({
          code: form.code.trim().toUpperCase(),
          discountType: form.discountType,
          discountValue: Number(form.discountValue || 0),
          usageLimit: Number(form.usageLimit || 0),
          validUntil: form.validUntil || null,
          status: form.status,
        }),
      })
      setForm({ code: "", discountType: "PERCENTAGE", discountValue: "0", usageLimit: "0", validUntil: "", status: "ACTIVE" })
      setEditingId(null)
      setShowForm(false)
      setNotice({ type: "success", text: editingId ? "Coupon updated successfully." : "Coupon created successfully." })
      loadCoupons()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add coupon.")
    } finally {
      setSaving(false)
    }
  }

  function startEdit(coupon: CouponRow) {
    setEditingId(coupon.id)
    setNotice(null)
    setConfirmDeleteId(null)
    setForm({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: String(coupon.discountValue),
      usageLimit: String(coupon.usageLimit),
      validUntil: coupon.validUntil === "—" ? "" : coupon.validUntil,
      status: coupon.status.toUpperCase(),
    })
    setShowForm(true)
  }

  async function deleteCoupon(coupon: CouponRow) {
    setBusyId(coupon.id)
    setNotice(null)
    try {
      await fetchApi(`/api/admin/coupons/${coupon.id}`, { method: "DELETE" })
      setCoupons((current) => current.filter((item) => item.id !== coupon.id))
      setConfirmDeleteId(null)
      setNotice({ type: "success", text: "Coupon deleted from the database." })
      loadCoupons()
    } catch (err) {
      setNotice({ type: "error", text: err instanceof Error ? err.message : "Failed to delete coupon." })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Coupons"
        breadcrumb={["Dashboard", "Coupons"]}
        actions={
          <PrimaryButton onClick={() => setShowForm((value) => !value)}>
            <Plus className="size-4" />
            Add New Coupon
          </PrimaryButton>
        }
      />

      {showForm && (
        <form onSubmit={saveCoupon} className="mb-5 rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <input
              required
              value={form.code}
              onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
              placeholder="Coupon code"
              className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-ring"
            />
            <select
              value={form.discountType}
              onChange={(event) => setForm((current) => ({ ...current, discountType: event.target.value }))}
              className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-ring"
            >
              <option value="PERCENTAGE">Percentage</option>
              <option value="FIXED">Fixed Amount</option>
              <option value="FREE_SHIPPING">Free Shipping</option>
            </select>
            <input
              type="number"
              min="0"
              value={form.discountValue}
              onChange={(event) => setForm((current) => ({ ...current, discountValue: event.target.value }))}
              placeholder="Discount value"
              className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-ring"
            />
            <input
              type="number"
              min="0"
              value={form.usageLimit}
              onChange={(event) => setForm((current) => ({ ...current, usageLimit: event.target.value }))}
              placeholder="Usage limit, 0 for unlimited"
              className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-ring"
            />
            <input
              type="date"
              value={form.validUntil}
              onChange={(event) => setForm((current) => ({ ...current, validUntil: event.target.value }))}
              className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-ring"
            />
            <select
              value={form.status}
              onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
              className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-ring"
            >
              <option value="ACTIVE">Active</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
          <div className="mt-4 flex justify-end">
            <PrimaryButton type="submit" disabled={saving}>{saving ? "Saving..." : editingId ? "Update Coupon" : "Save Coupon"}</PrimaryButton>
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
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Coupon Code</th>
                <th className="px-4 py-3 font-medium">Discount</th>
                <th className="px-4 py-3 font-medium">Usage</th>
                <th className="px-4 py-3 font-medium">Valid Until</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {coupons.map((c) => (
                <Fragment key={c.id}>
                <tr className="transition-colors hover:bg-secondary/40">
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-secondary px-2 py-1 font-mono text-xs font-semibold text-foreground">
                      {c.code}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">{c.discount}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.usage}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.validUntil}</td>
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
                    <td colSpan={6} className="px-4 py-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-medium text-red-700">Delete {c.code}?</p>
                          <p className="text-xs text-red-600">This removes the coupon from the database.</p>
                        </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => deleteCoupon(c)} disabled={busyId === c.id} className="inline-flex items-center justify-center gap-2 rounded-md bg-destructive px-3 py-2 text-sm font-semibold text-destructive-foreground disabled:opacity-70">
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
