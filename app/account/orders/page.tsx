import type { Metadata } from "next"
import { AccountShell } from "@/components/account/account-shell"
import { OrdersView } from "@/components/account/orders-view"

export const metadata: Metadata = {
  title: "My Orders",
}

export default function OrdersPage() {
  return (
    <AccountShell title="My Orders">
      <OrdersView />
    </AccountShell>
  )
}
