"use client"

import { useEffect, useState } from "react"
import { Check, Loader2, Star, Trash2, X } from "lucide-react"
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
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null)

  function loadReviews() {
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
  }

  useEffect(() => {
    loadReviews()
  }, [])

  async function updateStatus(id: string, status: "PUBLISHED" | "PENDING") {
    setBusyId(id)
    setNotice(null)
    try {
      await fetchApi(`/api/admin/reviews/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      })
      setNotice({ type: "success", text: status === "PUBLISHED" ? "Review approved." : "Review unpublished." })
      loadReviews()
    } catch (err) {
      setNotice({ type: "error", text: err instanceof Error ? err.message : "Failed to update review." })
    } finally {
      setBusyId(null)
    }
  }

  async function deleteReview(review: ReviewRow) {
    setBusyId(review.id)
    setNotice(null)
    try {
      await fetchApi(`/api/admin/reviews/${review.id}`, { method: "DELETE" })
      setReviews((current) => current.filter((item) => item.id !== review.id))
      setConfirmDeleteId(null)
      setNotice({ type: "success", text: "Review deleted from the database." })
      loadReviews()
    } catch (err) {
      setNotice({ type: "error", text: err instanceof Error ? err.message : "Failed to delete review." })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <AdminPageHeader title="Reviews" breadcrumb={["Dashboard", "Reviews"]} />

      {notice && (
        <div className={`mb-5 rounded-lg border px-4 py-3 text-sm ${
          notice.type === "success"
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-red-200 bg-red-50 text-red-700"
        }`}>
          {notice.text}
        </div>
      )}

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
                  <button
                    onClick={() => updateStatus(r.id, "PUBLISHED")}
                    disabled={busyId === r.id}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                  >
                    {busyId === r.id ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                    Approve
                  </button>
                )}
                {r.status === "Published" && (
                  <button
                    onClick={() => updateStatus(r.id, "PENDING")}
                    disabled={busyId === r.id}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-100"
                  >
                    Unpublish
                  </button>
                )}
                <button
                  onClick={() => {
                    setNotice(null)
                    setConfirmDeleteId((current) => (current === r.id ? null : r.id))
                  }}
                  className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-red-50 hover:text-destructive"
                  aria-label="Delete"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
            {confirmDeleteId === r.id && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-red-700">Delete this review?</p>
                    <p className="text-xs text-red-600">This removes the review from the database.</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => deleteReview(r)} disabled={busyId === r.id} className="inline-flex items-center justify-center gap-2 rounded-md bg-destructive px-3 py-2 text-sm font-semibold text-destructive-foreground disabled:opacity-70">
                      {busyId === r.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                      Delete
                    </button>
                    <button type="button" onClick={() => setConfirmDeleteId(null)} className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground">
                      <X className="size-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </AdminCard>
        ))}
        {!reviews.length && <p className="text-sm text-muted-foreground">No reviews yet</p>}
      </div>
    </div>
  )
}
