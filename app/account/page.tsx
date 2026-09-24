import type { Metadata } from "next"
import { AccountShell } from "@/components/account/account-shell"
import { AccountOverviewView } from "@/components/account/account-overview-view"

export const metadata: Metadata = {
  title: "My Account",
}

export default function AccountPage() {
  return (
    <AccountShell title="Account overview">
      <AccountOverviewView />
    </AccountShell>
  )
}
