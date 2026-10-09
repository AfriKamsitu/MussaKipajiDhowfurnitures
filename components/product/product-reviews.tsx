"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Loader2, Star } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { StarRating } from "@/components/star-rating"
import { fetchApi } from "@/lib/api"
import { productHref } from "@/lib/catalog"
import type { Product } from "@/lib/data"
import { cn } from "@/lib/utils"

type ProductReview = {
  id: number
  customerName: string
  rating: number
  comment: string
  createdAt: string
}

type Notice = { type: "success" | "error"; text: string }

/** Published reviews from GET /api/reviews/product/{id} plus the buyer review form. */
export function ProductReviews({ product }: { product: Product }) {
  const { user } = useAuth()
  const isAdmin = user?.role === "admin"
  const [reviews, setReviews] = useState<ProductReview[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)

  useEffect(() => {
    let cancelled = false
    setReviews(null)
    setFailed(false)
    fetchApi<Record<string, unknown>[]>(`/api/reviews/product/${product.id}`)
      .then((payload) => {
        if (cancelled) return
        setReviews(
          (Array.isArray(payload) ? payload : []).map((review) => ({
            id: Number(review.id),
            customerName: String(review.customerName ?? "Customer"),
            rating: Number(review.rating ?? 0),
            comment: String(review.comment ?? ""),
            createdAt: String(review.createdAt ?? ""),
          })),
        )
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [product.id])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice(null)
    if (rating < 1) {
      setNotice({ type: "error", text: "Choose a rating from 1 to 5 stars." })
      return
    }
    if (comment.trim().length < 5) {
      setNotice({ type: "error", text: "Write a short review before submitting." })
      return
    }
    setSubmitting(true)
    try {
      await fetchApi("/api/account/reviews", {
        method: "POST",
        body: JSON.stringify({ productId: Number(product.id), rating, comment: comment.trim() }),
      })
      setRating(0)
      setComment("")
      setNotice({ type: "success", text: "Thank you. Your review will appear once it has been approved." })
    } catch (error) {
      setNotice({
        type: "error",
        text: error instanceof Error ? error.message : "Your review could not be submitted.",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const average =
    reviews && reviews.length > 0
      ? Math.round((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length) * 10) / 10
      : null

  return (
    <section id="reviews" aria-labelledby="reviews-title" className="sf-card scroll-mt-[calc(var(--site-header-height)+1rem)] p-4 sm:p-6">
      <h2 id="reviews-title" className="text-lg font-bold text-foreground sm:text-xl">
        Customer reviews
      </h2>

      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
        <div>
          {failed ? (
            <p role="alert" className="text-sm text-muted-foreground">
              Reviews could not be loaded right now.
            </p>
          ) : reviews === null ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Loading reviews…
            </p>
          ) : reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">This product has no reviews yet.</p>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-foreground">{average?.toFixed(1)}</span>
                <div>
                  <StarRating rating={average ?? 0} size="md" />
                  <p className="text-xs text-muted-foreground">
                    {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
                  </p>
                </div>
              </div>
              <ul className="mt-4 divide-y divide-border border-t border-border">
                {reviews.map((review) => (
                  <li key={review.id} className="py-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-bold text-foreground">{review.customerName}</p>
                      {review.createdAt && (
                        <time className="text-xs text-muted-foreground" dateTime={review.createdAt}>
                          {new Date(review.createdAt).toLocaleDateString()}
                        </time>
                      )}
                    </div>
                    <div className="mt-1">
                      <StarRating rating={review.rating} />
                    </div>
                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                      {review.comment}
                    </p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <form onSubmit={handleSubmit} className="h-fit rounded-lg bg-secondary/60 p-4">
          <h3 className="text-sm font-bold text-foreground">Review this product</h3>
          {!user ? (
            <p className="mt-2 text-sm text-muted-foreground">
              <Link
                href={`/login?redirect=${encodeURIComponent(productHref(product))}`}
                className="font-semibold text-primary hover:underline"
              >
                Sign in
              </Link>{" "}
              to write a review.
            </p>
          ) : isAdmin ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Admin accounts moderate reviews and cannot submit them.
            </p>
          ) : (
            <>
              <p className="mt-1 text-xs text-muted-foreground">
                Reviews are open to customers who have received this product.
              </p>
              <fieldset className="mt-3">
                <legend className="sf-label">Your rating</legend>
                <div className="mt-1 flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                      aria-label={`${value} ${value === 1 ? "star" : "stars"}`}
                      aria-pressed={rating === value}
                      className="grid size-10 place-items-center rounded-md hover:bg-card"
                    >
                      <Star
                        className={cn(
                          "size-6",
                          value <= rating ? "fill-star text-star" : "text-muted-foreground/50",
                        )}
                      />
                    </button>
                  ))}
                </div>
              </fieldset>
              <label className="sf-label mt-3">
                Your review
                <textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  maxLength={1000}
                  rows={4}
                  className="sf-input mt-1 resize-y font-normal"
                />
              </label>
              <button type="submit" disabled={submitting} className="sf-btn sf-btn-primary mt-3 w-full">
                {submitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                {submitting ? "Submitting…" : "Submit review"}
              </button>
            </>
          )}
          {notice && (
            <p
              role={notice.type === "error" ? "alert" : "status"}
              className={cn(
                "mt-3 rounded-md px-3 py-2 text-sm",
                notice.type === "error" ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success",
              )}
            >
              {notice.text}
            </p>
          )}
        </form>
      </div>
    </section>
  )
}
