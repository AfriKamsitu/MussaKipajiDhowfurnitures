"use client"

import { useState } from "react"
import { Loader2, MapPin, Plus, Star, Trash2, X } from "lucide-react"
import { useAuth, type Address } from "@/components/auth-provider"
import { authInputClass } from "@/components/auth/auth-shell"
import { cn } from "@/lib/utils"

const empty = {
  label: "Home",
  fullName: "",
  phone: "",
  street: "",
  city: "",
  region: "",
  isDefault: false,
}

export function AddressesView() {
  const { user, addAddress, updateAddress, removeAddress } = useAuth()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Address | null>(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!user) return null

  function startAdd() {
    setEditing(null)
    setForm(empty)
    setOpen(true)
  }

  function startEdit(addr: Address) {
    setEditing(addr)
    setForm({
      label: addr.label,
      fullName: addr.fullName,
      phone: addr.phone,
      street: addr.street,
      city: addr.city,
      region: addr.region,
      isDefault: addr.isDefault,
    })
    setOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      if (editing) await updateAddress(editing.id, form)
      else await addAddress(form)
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "The address could not be saved.")
    } finally {
      setSaving(false)
    }
  }

  async function handleAddressAction(action: () => Promise<void>) {
    setSaving(true)
    setError(null)
    try {
      await action()
    } catch (err) {
      setError(err instanceof Error ? err.message : "The address could not be updated.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      {error && (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="flex justify-end">
        <button
          onClick={startAdd}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-accent-glow transition-colors hover:bg-accent"
        >
          <Plus className="size-4" />
          Add Address
        </button>
      </div>

      {user.addresses.length === 0 ? (
        <div className="surface-premium flex flex-col items-center justify-center gap-4 rounded-3xl px-6 py-16 text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-secondary text-accent">
            <MapPin className="size-7" />
          </span>
          <h2 className="text-lg font-semibold text-foreground">No saved addresses</h2>
          <p className="text-sm text-muted-foreground">Add an address so we can reach you about your orders.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {user.addresses.map((addr) => (
            <div key={addr.id} className="surface-premium relative rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-premium">
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-foreground">
                  {addr.label}
                </span>
                {addr.isDefault && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-medium text-accent">
                    <Star className="size-3 fill-accent" />
                    Default
                  </span>
                )}
              </div>
              <p className="font-semibold text-foreground">{addr.fullName}</p>
              <p className="text-sm text-muted-foreground">{addr.phone}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {addr.street}, {addr.city}, {addr.region}
              </p>
              <div className="mt-4 flex gap-3 text-sm">
                <button onClick={() => startEdit(addr)} className="font-medium text-accent hover:underline">
                  Edit
                </button>
                {!addr.isDefault && (
                  <button
                    onClick={() => void handleAddressAction(() => updateAddress(addr.id, { isDefault: true }))}
                    disabled={saving}
                    className="font-medium text-foreground hover:text-accent"
                  >
                    Set default
                  </button>
                )}
                <button
                  onClick={() => void handleAddressAction(() => removeAddress(addr.id))}
                  disabled={saving}
                  className="ml-auto inline-flex items-center gap-1 font-medium text-destructive hover:underline"
                >
                  <Trash2 className="size-3.5" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" onClick={() => setOpen(false)}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
            className="w-full max-w-md space-y-4 rounded-xl bg-card p-6 shadow-elevated"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">{editing ? "Edit Address" : "Add Address"}</h3>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close">
                <X className="size-5 text-muted-foreground" />
              </button>
            </div>
            {error && (
              <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-foreground">Label</label>
                <input
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder="Home, Office..."
                  className={authInputClass}
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Full Name</label>
                <input
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className={authInputClass}
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Phone</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className={authInputClass}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-foreground">Street Address</label>
                <input
                  value={form.street}
                  onChange={(e) => setForm({ ...form, street: e.target.value })}
                  className={authInputClass}
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">City</label>
                <input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className={authInputClass}
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Region</label>
                <input
                  value={form.region}
                  onChange={(e) => setForm({ ...form, region: e.target.value })}
                  className={authInputClass}
                  required
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                className="size-4 rounded border-border accent-[var(--accent)]"
              />
              Set as default address
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-md border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className={cn(
                  "flex-1 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60",
                )}
              >
                {saving ? <Loader2 className="mx-auto size-4 animate-spin" /> : editing ? "Save" : "Add"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
