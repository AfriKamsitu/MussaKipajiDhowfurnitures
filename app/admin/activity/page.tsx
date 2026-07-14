"use client"

import { useEffect, useState } from "react"
import { Activity } from "lucide-react"
import { AdminCard, AdminPageHeader } from "@/components/admin/admin-ui"
import { fetchApi } from "@/lib/api"

type ActivityRow = {
  id: string
  user: string
  action: string
  target: string
  time: string
}

export default function AdminActivityPage() {
  const [logs, setLogs] = useState<ActivityRow[]>([])

  useEffect(() => {
    fetchApi<Record<string, unknown>[]>("/api/admin/activity")
      .then((payload) => {
        const list = Array.isArray(payload) ? payload : []
        setLogs(
          list.map((log) => ({
            id: String(log.id),
            user: String(log.actor ?? log.user ?? "System"),
            action: String(log.action ?? ""),
            target: String(log.target ?? ""),
            time: String(log.time ?? ""),
          })),
        )
      })
      .catch(() => setLogs([]))
  }, [])

  return (
    <div>
      <AdminPageHeader title="Activity Logs" breadcrumb={["Dashboard", "Activity Logs"]} />

      <AdminCard>
        <ol className="space-y-5">
          {logs.map((log, i) => (
            <li key={log.id} className="relative flex gap-4 pb-5 last:pb-0">
              {i < logs.length - 1 && (
                <span className="absolute left-[18px] top-9 h-[calc(100%-1rem)] w-px bg-border" />
              )}
              <span className="relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Activity className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground">
                  <span className="font-semibold">{log.user}</span> {log.action.toLowerCase()}{" "}
                  <span className="font-medium text-primary">{log.target}</span>
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{log.time}</p>
              </div>
            </li>
          ))}
          {!logs.length && <li className="text-sm text-muted-foreground">No activity yet</li>}
        </ol>
      </AdminCard>
    </div>
  )
}
