"use client"

import { Fragment, useEffect, useState } from "react"
import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react"
import { AdminPageHeader, PrimaryButton, StatusBadge } from "@/components/admin/admin-ui"
import { fetchApi } from "@/lib/api"
import { prettifyStatus } from "@/lib/admin-data"

type UserRow = {
  id: string
  name: string
  email: string
  role: string
  status: string
  lastActive: string
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    status: "ACTIVE",
  })

  function loadUsers() {
    fetchApi<Record<string, unknown>[]>("/api/admin/staff")
      .then((payload) => {
        const list = Array.isArray(payload) ? payload : []
        setUsers(
          list.map((u) => ({
            id: String(u.id),
            name: String(u.name ?? ""),
            email: String(u.email ?? ""),
            role: prettifyStatus(String(u.role ?? "Admin")),
            status: prettifyStatus(String(u.status ?? "Active")),
            lastActive: u.lastActiveAt
              ? new Date(String(u.lastActiveAt)).toLocaleString()
              : "—",
          })),
        )
      })
      .catch(() => setUsers([]))
  }

  useEffect(() => {
    loadUsers()
  }, [])

  async function saveUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await fetchApi(editingId ? `/api/admin/staff/${editingId}` : "/api/admin/staff", {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify({
          ...form,
          password: editingId && !form.password ? null : form.password,
          role: "ADMIN",
        }),
      })
      setForm({ name: "", email: "", password: "", status: "ACTIVE" })
      setEditingId(null)
      setShowForm(false)
      setNotice({ type: "success", text: editingId ? "User updated successfully." : "User created successfully." })
      loadUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add user.")
    } finally {
      setSaving(false)
    }
  }

  function startEdit(user: UserRow) {
    setEditingId(user.id)
    setNotice(null)
    setConfirmDeleteId(null)
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      status: user.status.toUpperCase(),
    })
    setShowForm(true)
  }

  async function deleteUser(user: UserRow) {
    setBusyId(user.id)
    setNotice(null)
    try {
      await fetchApi(`/api/admin/staff/${user.id}`, { method: "DELETE" })
      setUsers((current) => current.filter((item) => item.id !== user.id))
      setConfirmDeleteId(null)
      setNotice({ type: "success", text: "User deleted from the database." })
      loadUsers()
    } catch (err) {
      setNotice({ type: "error", text: err instanceof Error ? err.message : "Failed to delete user." })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Users & Roles"
        breadcrumb={["Dashboard", "Users & Roles"]}
        actions={
          <PrimaryButton onClick={() => setShowForm((value) => !value)}>
            <Plus className="size-4" />
            Add New User
          </PrimaryButton>
        }
      />

      {showForm && (
        <form onSubmit={saveUser} className="mb-5 rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <input
              required
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Full name"
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
              required={!editingId}
              type="password"
              minLength={6}
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              placeholder={editingId ? "New password, optional" : "Password"}
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
            <PrimaryButton type="submit" disabled={saving}>{saving ? "Saving..." : editingId ? "Update User" : "Save User"}</PrimaryButton>
          </div>
        </form>
      )}

      {notice && (
        <div className={`mb-5 rounded-lg border px-4 py-3 text-sm ${
          notice.type === "success"
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-red-200 bg-red-50 text-red-700"
        }`}>
          {notice.text}
        </div>
      )}

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Last Active</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => (
                <Fragment key={u.id}>
                <tr className="transition-colors hover:bg-secondary/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {initials(u.name || "?")}
                      </span>
                      <span className="font-medium text-foreground">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700 ring-1 ring-inset ring-violet-200">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={u.status} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.lastActive}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => startEdit(u)}
                        className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
                        aria-label="Edit"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        onClick={() => {
                          setNotice(null)
                          setConfirmDeleteId((current) => (current === u.id ? null : u.id))
                        }}
                        className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-red-50 hover:text-destructive"
                        aria-label="Delete"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                {confirmDeleteId === u.id && (
                  <tr className="bg-red-50/70">
                    <td colSpan={6} className="px-4 py-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-medium text-red-700">Delete {u.name}?</p>
                          <p className="text-xs text-red-600">This removes the staff user from the database.</p>
                        </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => deleteUser(u)} disabled={busyId === u.id} className="inline-flex items-center justify-center gap-2 rounded-md bg-destructive px-3 py-2 text-sm font-semibold text-destructive-foreground disabled:opacity-70">
                            {busyId === u.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
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
    </div>
  )
}
