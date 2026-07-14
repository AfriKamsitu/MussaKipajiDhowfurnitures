"use client"

import { useEffect, useState } from "react"
import { Pencil, Plus, Trash2 } from "lucide-react"
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

  useEffect(() => {
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
  }, [])

  return (
    <div>
      <AdminPageHeader
        title="Users & Roles"
        breadcrumb={["Dashboard", "Users & Roles"]}
        actions={
          <PrimaryButton>
            <Plus className="size-4" />
            Add New User
          </PrimaryButton>
        }
      />

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
                <tr key={u.id} className="transition-colors hover:bg-secondary/40">
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
                        className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
                        aria-label="Edit"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-red-50 hover:text-destructive"
                        aria-label="Delete"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
