import type { Metadata } from "next"
import { Suspense } from "react"
import { PageShell } from "@/components/page-shell"
import { UnsubscribeView } from "@/components/unsubscribe-view"

export const metadata: Metadata = {
  title: "Unsubscribe",
  robots: { index: false },
}

export default function UnsubscribePage() {
  return (
    <PageShell footer={false}>
      <Suspense fallback={null}>
        <UnsubscribeView />
      </Suspense>
    </PageShell>
  )
}
