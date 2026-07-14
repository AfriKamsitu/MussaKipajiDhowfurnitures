"use client"

import { useEffect, useState } from "react"
import { Check, Star, Trash2 } from "lucide-react"
import { AdminCard, AdminPageHeader, StatusBadge } from "@/components/admin/admin-ui"
import { fetchApi } from "@/lib/api"
import { prettifyStatus } from "@/lib/admin-data"

type ReviewRow = {
  id: string
  customer: string
  product: string
  rating: number
  comment: string
  date: string
  status: string
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={i < rating ? "size-3.5 fill-amber-400 text-amber-400" : "size-3.5 text-border"}
        />
      ))}
    </div>
  )
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewRow[]>([])

  useEffect(() => {
    fetchApi<Record<string, unknown>[]>("/api/admin/reviews")
      .then((payload) => {
        const list = Array.isArray(payload) ? payload : []
        setReviews(
          list.map((r) => ({
            id: String(r.id),
            customer: String(r.customerName ?? ""),
            product: String(r.productName ?? ""),
            rating: Number(r.rating ?? 0),
            comment: String(r.comment ?? ""),
            date: r.createdAt ? new Date(String(r.createdAt)).toLocaleDateString() : "—",
            status: prettifyStatus(String(r.status ?? "Pending")),
          })),
        )
      })
      .catch(() => setReviews([]))
  }, [])

  return (
    <div>
      <AdminPageHeader title="Reviews" breadcrumb={["Dashboard", "Reviews"]} />

      <div className="grid grid-cols-1 gap-4">
        {reviews.map((r) => (
          <AdminCard key={r.id}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-foreground">{r.customer}</span>
                  <Stars rating={r.rating} />
                  <StatusBadge status={r.status} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  on <span className="font-medium text-foreground">{r.product}</span> · {r.date}
                </p>
                <p className="mt-2 text-sm text-foreground">{r.comment}</p>
              </div>
              <div className="flex items-center gap-1.5">
                {r.status === "Pending" && (
                  <button className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100">
                    <Check className="size-3.5" />
                    Approve
                  </button>
                )}
                <button
                  className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-red-50 hover:text-destructive"
                  aria-label="Delete"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          </AdminCard>
        ))}
        {!reviews.length && <p className="text-sm text-muted-foreground">No reviews yet</p>}
      </div>
    </div>
  )
}
