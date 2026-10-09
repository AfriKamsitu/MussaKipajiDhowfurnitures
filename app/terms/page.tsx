import type { Metadata } from "next"
import Link from "next/link"
import { Breadcrumb, PageIntro, PageShell } from "@/components/page-shell"
import { TermsContent } from "@/components/terms-content"

export const metadata: Metadata = {
  title: "Terms and Privacy",
  description: "How ordering, payment, collection and your personal information work on this store.",
}

export default function TermsPage() {
  return (
    <PageShell>
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Terms and privacy" }]} />
      <PageIntro title="Terms and privacy" description="How ordering works here and what we do with your information." />
      <TermsContent />
      <p className="mt-8 text-sm text-muted-foreground">
        Questions about any of this?{" "}
        <Link href="/contact" className="font-semibold text-primary hover:underline">
          Contact us
        </Link>
        .
      </p>
    </PageShell>
  )
}
