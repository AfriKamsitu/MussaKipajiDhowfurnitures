import Link from "next/link"
import { SearchX } from "lucide-react"
import { PageShell } from "@/components/page-shell"
import { EmptyState } from "@/components/state-panels"

export default function NotFound() {
  return (
    <PageShell>
      <EmptyState
        icon={SearchX}
        title="We couldn't find that page"
        description="The link may be out of date, or the product may no longer be available."
        className="mt-6"
      >
        <Link href="/shop" className="sf-btn sf-btn-primary">
          Shop furniture
        </Link>
        <Link href="/" className="sf-btn sf-btn-outline">
          Go to homepage
        </Link>
      </EmptyState>
    </PageShell>
  )
}
