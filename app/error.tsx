"use client"

import { useEffect } from "react"
import { PageShell } from "@/components/page-shell"
import { ErrorState } from "@/components/state-panels"

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <PageShell>
      <ErrorState
        title="Something went wrong"
        description="This page could not be shown. Please try again."
        onRetry={reset}
        className="mt-6"
      />
    </PageShell>
  )
}
