import type { Metadata } from "next"
import { AccountShell } from "@/components/account/account-shell"
import { AddressesView } from "@/components/account/addresses-view"

export const metadata: Metadata = {
  title: "My Addresses",
}

export default function AddressesPage() {
  return (
    <AccountShell title="Addresses">
      <AddressesView />
    </AccountShell>
  )
}
