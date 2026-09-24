"use client"

import { Fragment, useEffect, useMemo, useState } from "react"
import { Check, Download, Loader2, Mail, Pencil, Search, Trash2, X } from "lucide-react"
import { StatusBadge } from "@/components/admin/admin-ui"
import { formatTZS, prettifyStatus } from "@/lib/admin-data"
import { useStoreSettings } from "@/components/store-settings-provider"
import { fetchApi } from "@/lib/api"

type AdminCustomer = {
  id: string
  name: string
  email: string
  phone: string
  orders: number
  spent: number
  status: string
  marketingOptIn: boolean
}

type CustomerDraft = {
  name: string
  email: string
  phone: string
  status: "ACTIVE" | "INACTIVE"
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
}

export function CustomersTable() {
  const { currency } = useStoreSettings()
  const [query, setQuery] = useState("")
  const [marketingFilter, setMarketingFilter] = useState<"all" | "subscribed">("all")
  const [customers, setCustomers] = useState<AdminCustomer[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<CustomerDraft | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null)

  function loadCustomers() {
    fetchApi<Record<string, unknown>[]>("/api/admin/customers")
      .then((payload) => {
        const list = Array.isArray(payload) ? payload : []
        setCustomers(
          list.map((c) => ({
            id: String(c.id),
            name: String(c.name ?? ""),
            email: String(c.email ?? ""),
            phone: String(c.phone ?? "-"),
            orders: Number(c.orders ?? 0),
            spent: Number(c.spent ?? 0),
            status: prettifyStatus(String(c.status ?? "Active")),
            marketingOptIn: Boolean(c.marketingOptIn),
          })),
        )
      })
      .catch(() => setCustomers([]))
  }

  useEffect(() => {
    loadCustomers()
  }, [])

  function startEdit(customer: AdminCustomer) {
    setNotice(null)
    setConfirmDeleteId(null)
    setEditingId(customer.id)
    setDraft({
      name: customer.name,
      email: customer.email,
      phone: customer.phone === "-" ? "" : customer.phone,
      status: customer.status.toUpperCase() as CustomerDraft["status"],
    })
  }

  async function saveCustomer(customer: AdminCustomer) {
    if (!draft) return
    setBusyId(customer.id)
    setNotice(null)
    try {
      await fetchApi(`/api/admin/customers/${customer.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...draft, password: "" }),
      })
      setEditingId(null)
      setDraft(null)
      setNotice({ type: "success", text: "Customer updated successfully." })
      loadCustomers()
    } catch (err) {
      setNotice({ type: "error", text: err instanceof Error ? err.message : "Failed to update customer." })
    } finally {
      setBusyId(null)
    }
  }

  async function deleteCustomer(customer: AdminCustomer) {
    setBusyId(customer.id)
    setNotice(null)
    try {
      await fetchApi(`/api/admin/customers/${customer.id}`, { method: "DELETE" })
      setCustomers((current) => current.filter((item) => item.id !== customer.id))
      setConfirmDeleteId(null)
      setNotice({ type: "success", text: "Customer deleted from the database." })
      loadCustomers()
    } catch (err) {
      setNotice({ type: "error", text: err instanceof Error ? err.message : "Failed to delete customer." })
    } finally {
      setBusyId(null)
    }
  }

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      const matchesQuery =
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.email.toLowerCase().includes(query.toLowerCase())
      const matchesMarketing = marketingFilter === "all" || c.marketingOptIn
      return matchesQuery && matchesMarketing
    })
  }, [customers, marketingFilter, query])

  const subscriberCount = customers.filter((customer) => customer.marketingOptIn).length

  function exportSubscribers() {
    const subscribers = customers.filter((customer) => customer.marketingOptIn)
    if (subscribers.length === 0) {
      setNotice({ type: "error", text: "There are no opted-in email subscribers yet." })
      return
    }
    const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`
    const csv = [
      "Name,Email,Phone",
      ...subscribers.map((customer) =>
        [customer.name, customer.email, customer.phone === "-" ? "" : customer.phone]
          .map((value) => escapeCsv(value))
          .join(","),
      ),
    ].join("\r\n")
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }))
    const link = document.createElement("a")
    link.href = url
    link.download = `paje-dhow-email-subscribers-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
    setNotice({ type: "success", text: `${subscribers.length} opted-in subscriber emails exported.` })
  }

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
        <select
          value={marketingFilter}
          onChange={(event) => setMarketingFilter(event.target.value as "all" | "subscribed")}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
          aria-label="Filter customers by email marketing preference"
        >
          <option value="all">All customers</option>
          <option value="subscribed">Email subscribers ({subscriberCount})</option>
        </select>
        <button
          type="button"
          onClick={exportSubscribers}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
        >
          <Download className="size-4 text-primary" />
          Export Subscribers
        </button>
      </div>

      {notice && (
        <div className="px-4 pb-4">
          <div className={`rounded-lg border px-4 py-3 text-sm ${
            notice.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}>
            {notice.text}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[840px] text-left text-sm">
          <thead>
            <tr className="border-y border-border bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Orders</th>
              <th className="px-4 py-3 font-medium">Spent</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Email Marketing</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((c) => (
              <Fragment key={c.id}>
                <tr className="transition-colors hover:bg-secondary/40">
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
                  <td className="px-4 py-3 font-medium text-foreground">{formatTZS(c.spent, currency)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                      c.marketingOptIn
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-secondary text-muted-foreground"
                    }`}>
                      {c.marketingOptIn ? "Subscribed" : "Not subscribed"}
                    </span>
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
                        onClick={() => startEdit(c)}
                        className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
                        aria-label="Edit"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        onClick={() => {
                          setNotice(null)
                          setEditingId(null)
                          setDraft(null)
                          setConfirmDeleteId((current) => (current === c.id ? null : c.id))
                        }}
                        className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-red-50 hover:text-destructive"
                        aria-label="Delete"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                {editingId === c.id && draft && (
                  <tr className="bg-secondary/30">
                    <td colSpan={7} className="px-4 py-4">
                      <div className="grid gap-3 lg:grid-cols-[minmax(180px,1fr)_minmax(220px,1fr)_150px_140px_auto] lg:items-end">
                        <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
                          Name
                          <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-ring" />
                        </label>
                        <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
                          Email
                          <input type="email" value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-ring" />
                        </label>
                        <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
                          Phone
                          <input value={draft.phone} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-ring" />
                        </label>
                        <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
                          Status
                          <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as CustomerDraft["status"] })} className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-ring">
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                          </select>
                        </label>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => saveCustomer(c)} disabled={busyId === c.id} className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-70">
                            {busyId === c.id ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                            Save
                          </button>
                          <button type="button" onClick={() => { setEditingId(null); setDraft(null) }} className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground">
                            <X className="size-4" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                {confirmDeleteId === c.id && (
                  <tr className="bg-red-50/70">
                    <td colSpan={7} className="px-4 py-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-medium text-red-700">Delete {c.email}?</p>
                          <p className="text-xs text-red-600">This removes the customer from the database.</p>
                        </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => deleteCustomer(c)} disabled={busyId === c.id} className="inline-flex items-center justify-center gap-2 rounded-md bg-destructive px-3 py-2 text-sm font-semibold text-destructive-foreground disabled:opacity-70">
                            {busyId === c.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                            Delete
                          </button>
                          <button type="button" onClick={() => setConfirmDeleteId(null)} className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground">
                            <X className="size-4" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
