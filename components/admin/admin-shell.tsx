"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { Menu } from "lucide-react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { useAuth } from "@/components/auth-provider"

export function AdminShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const { user } = useAuth()
  const initials = (user?.name || "Admin User")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  useEffect(() => {
    if (!sidebarOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    window.requestAnimationFrame(() => {
      document.querySelector<HTMLButtonElement>("[data-admin-drawer-close]")?.focus()
    })

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return
      setSidebarOpen(false)
      menuButtonRef.current?.focus()
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [sidebarOpen])

  return (
    <div className="admin-theme admin-workspace flex min-h-screen text-foreground">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex min-h-16 items-center gap-3 border-b border-white/10 bg-[#11130f] px-4 py-3 text-[#f1eee6] shadow-[0_18px_40px_-28px_rgba(17,19,15,0.65)] lg:px-6">
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="grid size-11 place-items-center rounded-full text-muted-foreground transition-[background-color,color,transform] hover:scale-105 hover:bg-primary/10 hover:text-primary active:scale-95 lg:hidden"
            aria-label="Open admin menu"
            aria-expanded={sidebarOpen}
            aria-controls="admin-sidebar"
          >
            <Menu className="size-5" />
          </button>

          <div>
            <p className="text-sm font-bold text-[#f1eee6] sm:hidden">Paje Dhow Admin</p>
            <p className="hidden text-sm font-semibold text-[#f1eee6] sm:block">Administration workspace</p>
            <span className="hidden text-[10px] uppercase tracking-[0.2em] text-[#c5a274] md:block">
              Zanzibar workshop / orders and products
            </span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full border border-[#c5a274]/40 bg-[#c5a274]/15 text-sm font-semibold text-[#c5a274] shadow-sm">
              {initials || "AU"}
            </span>
          </div>
        </header>

        <main id="main-content" className="admin-enter flex-1 p-4 sm:p-5 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
