import type { Metadata } from "next"
import { AdminShell } from "@/components/admin/admin-shell"
import { AdminGuard } from "@/components/admin/admin-guard"

export const metadata: Metadata = {
  title: "Admin",
  description: "Manage products, orders, customers and store settings.",
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <AdminShell>{children}</AdminShell>
    </AdminGuard>
  )
}
