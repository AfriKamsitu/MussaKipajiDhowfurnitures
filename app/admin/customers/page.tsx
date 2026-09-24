"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { AdminPageHeader, PrimaryButton } from "@/components/admin/admin-ui"
import { CustomersTable } from "@/components/admin/customers-table"
import { fetchApi } from "@/lib/api"

export default function AdminCustomersPage() {
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    status: "ACTIVE",
  })

  async function createCustomer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await fetchApi("/api/admin/customers", {
        method: "POST",
        body: JSON.stringify(form),
      })
      setForm({ name: "", email: "", phone: "", password: "", status: "ACTIVE" })
      setShowForm(false)
      setRefreshKey((key) => key + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add customer.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Customers"
        breadcrumb={["Dashboard", "Customers"]}
        actions={
          <PrimaryButton onClick={() => setShowForm((value) => !value)}>
            <Plus className="size-4" />
            Add New Customer
          </PrimaryButton>
        }
      />

      {showForm && (
        <form onSubmit={createCustomer} className="mb-5 rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <input
              required
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Customer name"
              className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-ring"
            />
            <input
              required
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="Email address"
              className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-ring"
            />
            <input
              value={form.phone}
              onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              placeholder="Phone number"
              className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-ring"
            />
            <input
              required
              type="password"
              minLength={6}
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              placeholder="Password"
              className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-ring"
            />
            <select
              value={form.status}
              onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
              className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-ring"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
          <div className="mt-4 flex justify-end">
            <PrimaryButton type="submit" disabled={saving}>{saving ? "Saving..." : "Save Customer"}</PrimaryButton>
          </div>
        </form>
      )}

      <CustomersTable key={refreshKey} />
    </div>
  )
}
