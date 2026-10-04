"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { listCategories } from "@/lib/catalog"
import type { Category } from "@/lib/data"

const CategoriesContext = createContext<Category[]>([])

/** Active storefront categories, shared by the header, home page and shop filters. */
export function useCategories() {
  return useContext(CategoriesContext)
}

export function CategoriesProvider({
  children,
  initialCategories,
}: {
  children: ReactNode
  /** Categories read on the server so navigation is present in the first paint. */
  initialCategories?: Category[] | null
}) {
  const [categories, setCategories] = useState<Category[]>(initialCategories ?? [])

  useEffect(() => {
    if (initialCategories) return
    let active = true
    listCategories()
      .then((list) => {
        if (active) setCategories(list)
      })
      .catch(() => {
        // Navigation still works through "All furniture" when categories fail to load.
      })
    return () => {
      active = false
    }
  }, [initialCategories])

  const value = useMemo(
    () => categories.filter((category) => (category.status ?? "ACTIVE") === "ACTIVE"),
    [categories],
  )

  return <CategoriesContext.Provider value={value}>{children}</CategoriesContext.Provider>
}
