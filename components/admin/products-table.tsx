"use client"

import { Fragment, useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Check, ChevronDown, Eye, Filter, Loader2, Pencil, Search, Trash2, UploadCloud, X } from "lucide-react"
import { StatusBadge } from "@/components/admin/admin-ui"
import { formatTZS, prettifyStatus } from "@/lib/admin-data"
import { useStoreSettings } from "@/components/store-settings-provider"
import { deleteUploadedImages, fetchApi, uploadImage } from "@/lib/api"
import { cn } from "@/lib/utils"

type AdminProduct = {
  id: string
  name: string
  category: string
  price: number
  oldPrice?: number | null
  stock: number
  status: string
  image: string
  images: string[]
  isNew: boolean
  colors: string[]
  material: string
  sku: string
  moq: number
  warrantyMonths: number
  deliveryDays: number
}

type ProductDraft = {
  name: string
  price: string
  stock: string
  status: "PUBLISHED" | "DRAFT" | "ARCHIVED"
}

export function ProductsTable() {
  const { currency } = useStoreSettings()
  const [tab, setTab] = useState("All Products")
  const [query, setQuery] = useState("")
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<ProductDraft | null>(null)
  const [editImageFiles, setEditImageFiles] = useState<File[]>([])
  const [editImagePreviews, setEditImagePreviews] = useState<string[]>([])
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState("All categories")
  const [stockFilter, setStockFilter] = useState("All stock")

  function loadProducts() {
    fetchApi<{ products: Record<string, unknown>[] }>("/api/admin/products")
      .then((payload) => {
        const list = Array.isArray(payload?.products) ? payload.products : []
        setProducts(
          list.map((p) => ({
            id: String(p.id),
            name: String(p.name ?? ""),
            category: String(p.category ?? ""),
            price: Number(p.price ?? 0),
            oldPrice: p.oldPrice == null ? null : Number(p.oldPrice),
            stock: Number(p.stock ?? 0),
            status: prettifyStatus(String(p.status ?? "Draft")),
            image: String(p.image ?? "/placeholder.svg"),
            images: Array.isArray(p.images) ? p.images.map(String) : [],
            isNew: Boolean(p.isNew),
            colors: Array.isArray(p.colors) ? p.colors.map(String) : [],
            material: String(p.material ?? ""),
            sku: String(p.sku ?? ""),
            moq: Number(p.moq ?? 1),
            warrantyMonths: Number(p.warrantyMonths ?? 12),
            deliveryDays: Number(p.deliveryDays ?? 5),
          })),
        )
      })
      .catch(() => setProducts([]))
  }

  useEffect(() => {
    loadProducts()
  }, [])

  function startEdit(product: AdminProduct) {
    setNotice(null)
    setConfirmDeleteId(null)
    setEditingId(product.id)
    setEditImageFiles([])
    setEditImagePreviews([])
    setDraft({
      name: product.name,
      price: String(product.price),
      stock: String(product.stock),
      status: product.status.toUpperCase() as ProductDraft["status"],
    })
  }

  function handleEditImages(files: FileList | null) {
    const list = files ? Array.from(files) : []
    setEditImageFiles(list)
    setEditImagePreviews(list.map((file) => URL.createObjectURL(file)))
  }

  async function uploadEditImages() {
    return Promise.all(editImageFiles.map((file) => uploadImage(file)))
  }

  async function saveProduct(product: AdminProduct) {
    if (!draft) return
    setBusyId(product.id)
    setNotice(null)
    let uploadedImages: string[] = []
    try {
      uploadedImages = editImageFiles.length ? await uploadEditImages() : []
      const nextImages = uploadedImages.length
        ? uploadedImages
        : product.images.length
          ? product.images
          : product.image && product.image !== "/placeholder.svg"
            ? [product.image]
            : []
      await fetchApi(`/api/admin/products/${product.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: draft.name.trim(),
          category: product.category,
          price: Number(draft.price),
          oldPrice: product.oldPrice ?? null,
          image: nextImages[0] ?? null,
          images: nextImages,
          isNew: product.isNew,
          colors: product.colors,
          material: product.material || null,
          status: draft.status,
          stock: Number(draft.stock),
          sku: product.sku || null,
          moq: product.moq,
          warrantyMonths: product.warrantyMonths,
          deliveryDays: product.deliveryDays,
        }),
      })
      setEditingId(null)
      setDraft(null)
      setEditImageFiles([])
      setEditImagePreviews([])
      setNotice({ type: "success", text: "Product updated successfully." })
      loadProducts()
    } catch (error) {
      if (uploadedImages.length) {
        await deleteUploadedImages(uploadedImages).catch(() => undefined)
      }
      setNotice({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to update product.",
      })
    } finally {
      setBusyId(null)
    }
  }

  async function deleteProduct(product: AdminProduct) {
    setBusyId(product.id)
    setNotice(null)
    try {
      await fetchApi(`/api/admin/products/${product.id}`, { method: "DELETE" })
      await deleteUploadedImages([
        ...(product.images || []),
        product.image,
      ]).catch(() => undefined)
      setProducts((current) => current.filter((item) => item.id !== product.id))
      setConfirmDeleteId(null)
      setNotice({ type: "success", text: "Product deleted from the database." })
      loadProducts()
    } catch (error) {
      setNotice({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to delete product.",
      })
    } finally {
      setBusyId(null)
    }
  }

  useEffect(() => {
    return () => {
      editImagePreviews.forEach((preview) => URL.revokeObjectURL(preview))
    }
  }, [editImagePreviews])

  const tabs = useMemo(() => {
    const counts = {
      "All Products": products.length,
      Published: products.filter((p) => p.status === "Published").length,
      Draft: products.filter((p) => p.status === "Draft").length,
      Archived: products.filter((p) => p.status === "Archived").length,
    }
    return Object.entries(counts).map(([label, count]) => ({ label, count }))
  }, [products])

  const categoryOptions = useMemo(
    () => ["All categories", ...Array.from(new Set(products.map((product) => product.category))).sort()],
    [products],
  )

  const filtered = useMemo(() => {
    return products.filter((product) => {
      const matchesTab = tab === "All Products" || product.status === tab
      const normalizedQuery = query.trim().toLowerCase()
      const matchesQuery =
        !normalizedQuery ||
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.category.toLowerCase().includes(normalizedQuery) ||
        product.sku.toLowerCase().includes(normalizedQuery)
      const matchesCategory = categoryFilter === "All categories" || product.category === categoryFilter
      const matchesStock =
        stockFilter === "All stock" ||
        (stockFilter === "In stock" ? product.stock > 0 : product.stock <= 0)
      return matchesTab && matchesQuery && matchesCategory && matchesStock
    })
  }, [products, tab, query, categoryFilter, stockFilter])

  return (
    <div className="admin-glass overflow-hidden rounded-xl border border-border/80 bg-white shadow-soft">
      <div className="scrollbar-none flex flex-nowrap items-center gap-1 overflow-x-auto border-b border-border px-4 pt-4">
        {tabs.map((t) => (
          <button
            key={t.label}
            onClick={() => setTab(t.label)}
            className={`relative flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-t-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              tab === t.label ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[11px] ${
                tab === t.label ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
              }`}
            >
              {t.count}
            </span>
            {tab === t.label && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products..."
            aria-label="Search products"
            className="min-h-11 w-full rounded-lg border border-border bg-secondary py-2 pl-9 pr-3 text-sm outline-none focus:border-ring focus:bg-card"
          />
        </div>
        <button
          type="button"
          onClick={() => setFiltersOpen((current) => !current)}
          aria-expanded={filtersOpen}
          aria-controls="admin-product-filters"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-white px-3 text-sm font-semibold text-foreground transition-colors hover:border-primary/35 hover:text-primary"
        >
          <Filter className="size-4 text-muted-foreground" />
          Filters
          <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", filtersOpen && "rotate-180")} />
        </button>
      </div>

      {filtersOpen && (
        <div id="admin-product-filters" className="grid gap-3 border-t border-border/70 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
          <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
            Category
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="min-h-11 rounded-lg border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15">
              {categoryOptions.map((category) => <option key={category}>{category}</option>)}
            </select>
          </label>
          <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">
            Stock availability
            <select value={stockFilter} onChange={(event) => setStockFilter(event.target.value)} className="min-h-11 rounded-lg border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15">
              <option>All stock</option>
              <option>In stock</option>
              <option>Out of stock</option>
            </select>
          </label>
          <button type="button" onClick={() => { setCategoryFilter("All categories"); setStockFilter("All stock") }} className="min-h-11 rounded-lg border border-border bg-white px-4 text-sm font-semibold text-foreground transition-colors hover:bg-secondary">
            Clear filters
          </button>
        </div>
      )}
      {notice && (
        <div className="px-4 pb-4">
          <div
            role={notice.type === "error" ? "alert" : "status"}
            aria-live={notice.type === "error" ? "assertive" : "polite"}
            className={cn(
              "rounded-lg border px-4 py-3 text-sm",
              notice.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700",
            )}
          >
            {notice.text}
          </div>
        </div>
      )}

      <div className="divide-y divide-border md:hidden">
        {filtered.map((product) => (
          <article key={`mobile-${product.id}`} className="p-4">
            <div className="flex gap-3">
              <span className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-secondary shadow-sm">
                <Image src={product.image || "/placeholder.svg"} alt="" fill sizes="80px" className="object-cover" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="line-clamp-2 text-sm font-bold text-foreground">{product.name}</h3>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{product.category}</p>
                  </div>
                  <StatusBadge status={product.status} />
                </div>
                <p className="mt-2 text-base font-black text-foreground">{formatTZS(product.price, currency)}</p>
                <p className="mt-1 text-xs text-muted-foreground">{product.stock} in stock · MOQ {product.moq}</p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <Link href={`/product/${product.id}`} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-border bg-white text-xs font-semibold text-foreground transition-colors hover:border-primary/35 hover:text-primary">
                <Eye className="size-4" /> View
              </Link>
              <button type="button" onClick={() => startEdit(product)} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-border bg-white text-xs font-semibold text-foreground transition-colors hover:border-primary/35 hover:text-primary">
                <Pencil className="size-4" /> Edit
              </button>
              <button type="button" onClick={() => { setNotice(null); setEditingId(null); setDraft(null); setConfirmDeleteId((current) => current === product.id ? null : product.id) }} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white text-xs font-semibold text-red-700 transition-colors hover:bg-red-50">
                <Trash2 className="size-4" /> Delete
              </button>
            </div>

            {editingId === product.id && draft && (
              <div className="mt-4 grid gap-3 rounded-xl border border-border bg-secondary/45 p-3">
                <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">Product name<input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} className="min-h-11 rounded-lg border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary" /></label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">Price<input type="number" min="0" value={draft.price} onChange={(event) => setDraft({ ...draft, price: event.target.value })} className="min-h-11 min-w-0 rounded-lg border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary" /></label>
                  <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">Stock<input type="number" min="0" value={draft.stock} onChange={(event) => setDraft({ ...draft, stock: event.target.value })} className="min-h-11 min-w-0 rounded-lg border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary" /></label>
                </div>
                <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground">Status<select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as ProductDraft["status"] })} className="min-h-11 rounded-lg border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary"><option value="PUBLISHED">Published</option><option value="DRAFT">Draft</option><option value="ARCHIVED">Archived</option></select></label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => saveProduct(product)} disabled={busyId === product.id} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground disabled:opacity-70">{busyId === product.id ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}Save</button>
                  <button type="button" onClick={() => { setEditingId(null); setDraft(null) }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-white px-3 text-sm font-semibold text-foreground"><X className="size-4" />Cancel</button>
                </div>
              </div>
            )}

            {confirmDeleteId === product.id && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3">
                <p className="text-sm font-bold text-red-800">Delete {product.name}?</p>
                <p className="mt-1 text-xs text-red-700">This permanently removes the product from the catalogue.</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => deleteProduct(product)} disabled={busyId === product.id} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-destructive px-3 text-sm font-semibold text-destructive-foreground disabled:opacity-70">{busyId === product.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}Delete</button>
                  <button type="button" onClick={() => setConfirmDeleteId(null)} className="min-h-11 rounded-lg border border-border bg-white px-3 text-sm font-semibold text-foreground">Cancel</button>
                </div>
              </div>
            )}
          </article>
        ))}
        {!filtered.length && <p className="px-4 py-12 text-center text-sm text-muted-foreground">No products match your search and filters.</p>}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-y border-border bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((p) => (
              <Fragment key={p.id}>
                <tr className="group transition-colors hover:bg-secondary/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-secondary shadow-sm">
                        <Image src={p.image || "/placeholder.svg"} alt="" fill sizes="40px" className="object-cover transition-transform duration-500 group-hover:scale-110" />
                      </span>
                      <span className="font-medium text-foreground">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.category}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{formatTZS(p.price, currency)}</td>
                  <td className="px-4 py-3 text-foreground">{p.stock}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/product/${p.id}`}
                        className="flex size-11 items-center justify-center rounded-md text-muted-foreground transition-[background-color,color,transform] hover:-translate-y-0.5 hover:bg-secondary hover:text-primary active:translate-y-0 lg:size-9"
                        aria-label={`View ${p.name}`}
                      >
                        <Eye className="size-4" />
                      </Link>
                      <button
                        onClick={() => startEdit(p)}
                        className="flex size-11 items-center justify-center rounded-md text-muted-foreground transition-[background-color,color,transform] hover:-translate-y-0.5 hover:bg-secondary hover:text-primary active:translate-y-0 lg:size-9"
                        aria-label="Edit"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        onClick={() => {
                          setNotice(null)
                          setEditingId(null)
                          setDraft(null)
                          setConfirmDeleteId((current) => (current === p.id ? null : p.id))
                        }}
                        className="flex size-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-red-50 hover:text-destructive lg:size-9"
                        aria-label="Delete"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                {editingId === p.id && draft && (
                  <tr className="bg-secondary/30">
                    <td colSpan={6} className="px-4 py-4">
                      <div className="grid gap-3 lg:grid-cols-[minmax(220px,1.4fr)_120px_100px_150px_auto] lg:items-end">
                        <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
                          Product name
                          <input
                            value={draft.name}
                            onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                            className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
                          />
                        </label>
                        <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
                          Price
                          <input
                            type="number"
                            min="0"
                            value={draft.price}
                            onChange={(event) => setDraft({ ...draft, price: event.target.value })}
                            className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
                          />
                        </label>
                        <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
                          Stock
                          <input
                            type="number"
                            min="0"
                            value={draft.stock}
                            onChange={(event) => setDraft({ ...draft, stock: event.target.value })}
                            className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
                          />
                        </label>
                        <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
                          Status
                          <select
                            value={draft.status}
                            onChange={(event) =>
                              setDraft({ ...draft, status: event.target.value as ProductDraft["status"] })
                            }
                            className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
                          >
                            <option value="PUBLISHED">Published</option>
                            <option value="DRAFT">Draft</option>
                            <option value="ARCHIVED">Archived</option>
                          </select>
                        </label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => saveProduct(p)}
                            disabled={busyId === p.id}
                            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-70"
                          >
                            {busyId === p.id ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(null)
                              setDraft(null)
                            }}
                            className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground"
                          >
                            <X className="size-4" />
                            Cancel
                          </button>
                        </div>
                      </div>
                      <div className="mt-4 grid gap-3 lg:grid-cols-[220px_1fr] lg:items-start">
                        <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-card px-4 py-5 text-center transition-colors hover:bg-secondary">
                          <UploadCloud className="mb-2 size-6 text-muted-foreground" />
                          <span className="text-xs font-semibold text-foreground">Replace product gallery</span>
                          <span className="mt-1 text-[11px] text-muted-foreground">Select multiple images</span>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            multiple
                            className="sr-only"
                            onChange={(event) => handleEditImages(event.target.files)}
                          />
                        </label>
                        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                          {(editImagePreviews.length ? editImagePreviews : p.images.length ? p.images : [p.image]).map((image, index) => (
                            <span key={`${image}-${index}`} className="group/image relative aspect-square overflow-hidden rounded-md border border-white/65 bg-card/55 shadow-sm backdrop-blur">
                              <Image src={image || "/placeholder.svg"} alt="" fill sizes="80px" className="object-cover transition-transform duration-500 group-hover/image:scale-110" unoptimized={image.startsWith("blob:")} />
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                {confirmDeleteId === p.id && (
                  <tr className="bg-red-50/70">
                    <td colSpan={6} className="px-4 py-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-medium text-red-700">Delete {p.name}?</p>
                          <p className="text-xs text-red-600">This removes the product from the database.</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => deleteProduct(p)}
                            disabled={busyId === p.id}
                            className="inline-flex items-center justify-center gap-2 rounded-md bg-destructive px-3 py-2 text-sm font-semibold text-destructive-foreground disabled:opacity-70"
                          >
                            {busyId === p.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                            Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground"
                          >
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
