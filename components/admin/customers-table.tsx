"use client"

import { useEffect, useMemo, useState } from "react"
import { Filter, Mail, Pencil, Search } from "lucide-react"
import { StatusBadge } from "@/components/admin/admin-ui"
import { formatTZS, prettifyStatus } from "@/lib/admin-data"
import { fetchApi } from "@/lib/api"

type AdminCustomer = {
  id: string
  name: string
  email: string
  phone: string
  orders: number
  spent: number
  status: string
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
}

export function CustomersTable() {
  const [query, setQuery] = useState("")
  const [customers, setCustomers] = useState<AdminCustomer[]>([])

  useEffect(() => {
    fetchApi<Record<string, unknown>[]>("/api/admin/customers")
      .then((payload) => {
        const list = Array.isArray(payload) ? payload : []
        setCustomers(
          list.map((c) => ({
            id: String(c.id),
            name: String(c.name ?? ""),
            email: String(c.email ?? ""),
            phone: String(c.phone ?? "—"),
            orders: Number(c.orders ?? 0),
            spent: Number(c.spent ?? 0),
            status: prettifyStatus(String(c.status ?? "Active")),
          })),
        )
      })
      .catch(() => setCustomers([]))
  }, [])

  const filtered = useMemo(() => {
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.email.toLowerCase().includes(query.toLowerCase()),
    )
  }, [customers, query])

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customers..."
            className="w-full rounded-lg border border-border bg-secondary py-2 pl-9 pr-3 text-sm outline-none focus:border-ring focus:bg-card"
          />
        </div>
        <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground">
          <Filter className="size-4 text-muted-foreground" />
          Filters
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-y border-border bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Orders</th>
              <th className="px-4 py-3 font-medium">Spent</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((c) => (
              <tr key={c.id} className="transition-colors hover:bg-secondary/40">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {initials(c.name || "?")}
                    </span>
                    <span className="font-medium text-foreground">{c.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">{c.email}</span>
                    <span className="text-xs text-muted-foreground">{c.phone}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-foreground">{c.orders}</td>
                <td className="px-4 py-3 font-medium text-foreground">{formatTZS(c.spent)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={c.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <a
                      href={`mailto:${c.email}`}
                      className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
                      aria-label="Email"
                    >
                      <Mail className="size-4" />
                    </a>
                    <button
                      className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
                      aria-label="Edit"
                    >
                      <Pencil className="size-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
