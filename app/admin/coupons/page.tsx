"use client"

import { useEffect, useState } from "react"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { AdminPageHeader, PrimaryButton, StatusBadge } from "@/components/admin/admin-ui"
import { fetchApi } from "@/lib/api"
import { formatTZS, prettifyStatus } from "@/lib/admin-data"

type CouponRow = {
  id: string
  code: string
  discount: string
  usage: string
  validUntil: string
  status: string
}

function formatDiscount(type: string, value: number) {
  const t = type.toUpperCase()
  if (t === "PERCENTAGE") return `${value}% OFF`
  if (t === "FREE_SHIPPING") return "Free Shipping"
  return formatTZS(value)
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<CouponRow[]>([])

  useEffect(() => {
    fetchApi<Record<string, unknown>[]>("/api/admin/coupons")
      .then((payload) => {
        const list = Array.isArray(payload) ? payload : []
        setCoupons(
          list.map((c) => ({
            id: String(c.id),
            code: String(c.code ?? ""),
            discount: formatDiscount(String(c.discountType ?? ""), Number(c.discountValue ?? 0)),
            usage: `${c.usageCount ?? 0} / ${c.usageLimit ?? "∞"}`,
            validUntil: c.validUntil ? String(c.validUntil) : "—",
            status: prettifyStatus(String(c.status ?? "Active")),
          })),
        )
      })
      .catch(() => setCoupons([]))
  }, [])

  return (
    <div>
      <AdminPageHeader
        title="Coupons"
        breadcrumb={["Dashboard", "Coupons"]}
        actions={
          <PrimaryButton>
            <Plus className="size-4" />
            Add New Coupon
          </PrimaryButton>
        }
      />

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
                <tr key={c.id} className="transition-colors hover:bg-secondary/40">
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
                        className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
                        aria-label="Edit"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-red-50 hover:text-destructive"
                        aria-label="Delete"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
