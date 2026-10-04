import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

export function StarRating({
  rating,
  reviews,
  size = "sm",
}: {
  rating: number
  reviews?: number
  size?: "sm" | "md"
}) {
  const stars = Array.from({ length: 5 }, (_, i) => i + 1)
  const dim = size === "md" ? "size-4" : "size-3.5"

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center">
        {stars.map((star) => {
          const filled = rating >= star
          const half = !filled && rating >= star - 0.5
          return (
            <span key={star} className="relative">
              <Star className={cn(dim, "text-muted-foreground/30")} />
              {(filled || half) && (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: filled ? "100%" : "50%" }}
                >
                  <Star className={cn(dim, "fill-star text-star")} />
                </span>
              )}
            </span>
          )
        })}
      </div>
      {reviews !== undefined && (
        <span className="text-xs text-muted-foreground">({reviews})</span>
      )}
    </div>
  )
}
