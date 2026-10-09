"use client"

import { FormEvent, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import {
  ProductImagesField,
  savedImageItems,
  uploadImageItems,
  type ProductImageItem,
} from "@/components/admin/product-images-field"
import { deleteUploadedImages, fetchApi } from "@/lib/api"
import { cn } from "@/lib/utils"
import { useStoreSettings } from "@/components/store-settings-provider"

const labelCls = "mb-1.5 block text-sm font-medium text-foreground"
const inputCls =
  "w-full rounded-lg border border-border bg-card/70 px-3 py-2.5 text-sm outline-none backdrop-blur-xl transition-[border-color,box-shadow,background-color,transform] placeholder:text-muted-foreground focus:-translate-y-px focus:border-ring focus:bg-card focus:ring-2 focus:ring-ring/20"

const FORM_ID = "admin-product-form"

type ProductFormState = {
  name: string
  category: string
  price: string
  oldPrice: string
  sku: string
  stock: string
  shortDescription: string
  description: string
  material: string
  colors: string
  moq: string
  warrantyMonths: string
  deliveryDays: string
  status: "PUBLISHED" | "DRAFT" | "ARCHIVED"
}

const initialState: ProductFormState = {
  name: "",
  category: "",
  price: "",
  oldPrice: "",
  sku: "",
  stock: "0",
  shortDescription: "",
  description: "",
  material: "",
  colors: "",
  moq: "1",
  warrantyMonths: "12",
  deliveryDays: "5",
  status: "PUBLISHED",
}

function FieldCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="admin-panel rounded-xl border border-white/65 p-5">
      <h2 className="mb-4 text-base font-semibold text-foreground">{title}</h2>
      {children}
    </div>
  )
}

/** Create form, or the edit form when `productId` is given. */
export function AddProductForm({ productId }: { productId?: string }) {
  const router = useRouter()
  const { currency } = useStoreSettings()
  const editing = Boolean(productId)
  const [featured, setFeatured] = useState(true)
  const [form, setForm] = useState<ProductFormState>(initialState)
  const [categories, setCategories] = useState<string[]>([])
  const [images, setImages] = useState<ProductImageItem[]>([])
  /** Images the product had when the form opened; ones removed here are deleted from disk after saving. */
  const [originalImages, setOriginalImages] = useState<string[]>([])
  const [supplierId, setSupplierId] = useState<number | null>(null)
  const [loading, setLoading] = useState(editing)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchApi<Record<string, unknown>[]>("/api/admin/categories")
      .then((items) => {
        setCategories(
          items
            .map((item) => String(item.slug ?? item.name ?? "").trim())
            .filter(Boolean),
        )
      })
      .catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    if (!productId) return
    let active = true
    setLoading(true)
    setLoadError(null)
    fetchApi<Record<string, unknown>>(`/api/admin/products/${productId}`)
      .then((product) => {
        if (!active) return
        const status = String(product.status ?? "PUBLISHED").toUpperCase()
        setForm({
          name: String(product.name ?? ""),
          category: String(product.category ?? ""),
          price: product.price != null ? String(product.price) : "",
          oldPrice: product.oldPrice != null ? String(product.oldPrice) : "",
          sku: String(product.sku ?? ""),
          stock: String(product.stock ?? 0),
          shortDescription: String(product.shortDescription ?? ""),
          description: String(product.description ?? ""),
          material: String(product.material ?? ""),
          colors: Array.isArray(product.colors) ? product.colors.join(", ") : "",
          moq: String(product.moq ?? 1),
          warrantyMonths: String(product.warrantyMonths ?? 12),
          deliveryDays: String(product.deliveryDays ?? 5),
          status: status === "DRAFT" || status === "ARCHIVED" ? status : "PUBLISHED",
        })
        setFeatured(Boolean(product.isNew))
        const supplier = product.supplier as { id?: number } | null | undefined
        setSupplierId(supplier?.id ?? null)
        const paths = [
          product.image ? String(product.image) : "",
          ...(Array.isArray(product.images) ? product.images.map(String) : []),
        ]
        const saved = savedImageItems(paths)
        setImages(saved)
        setOriginalImages(saved.map((item) => item.url))
      })
      .catch((err) => {
        if (active) setLoadError(err instanceof Error ? err.message : "The product could not be loaded.")
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [productId])

  function update<K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null
    // "Save Draft" forces a draft; "Publish" on a new product always publishes.
    const status = submitter?.value === "draft" ? "DRAFT" : form.status

    if (!form.name.trim() || !form.category.trim() || !form.price.trim()) {
      setError("Product name, category, and price are required.")
      return
    }

    if (form.oldPrice && Number(form.oldPrice) <= Number(form.price)) {
      setError("Compare price must be higher than the selling price, or left empty.")
      return
    }

    setSaving(true)
    let uploadedImages: string[] = []
    try {
      const result = await uploadImageItems(images)
      uploadedImages = result.uploaded
      const imagePaths = result.paths
      await fetchApi(editing ? `/api/admin/products/${productId}` : "/api/admin/products", {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          category: form.category.trim().toLowerCase().replace(/\s+/g, "-"),
          shortDescription: form.shortDescription.trim() || null,
          description: form.description.trim() || null,
          price: Number(form.price),
          oldPrice: form.oldPrice ? Number(form.oldPrice) : null,
          image: imagePaths[0] ?? null,
          images: imagePaths,
          isNew: featured,
          colors: form.colors
            .split(",")
            .map((color) => color.trim())
            .filter(Boolean),
          material: form.material.trim() || null,
          status,
          stock: form.stock ? Number(form.stock) : 0,
          sku: form.sku.trim() || null,
          moq: form.moq ? Number(form.moq) : 1,
          warrantyMonths: form.warrantyMonths ? Number(form.warrantyMonths) : 12,
          deliveryDays: form.deliveryDays ? Number(form.deliveryDays) : 5,
          supplierId,
        }),
      })
      // Pictures taken out of the gallery are no longer referenced; remove their files.
      const removed = originalImages.filter((saved) => !imagePaths.includes(saved))
      if (removed.length) await deleteUploadedImages(removed).catch(() => undefined)
      setSuccess(editing ? "Product updated successfully." : "Product saved successfully.")
      router.push("/admin/products")
      router.refresh()
    } catch (err) {
      if (uploadedImages.length) {
        await deleteUploadedImages(uploadedImages).catch(() => undefined)
      }
      setError(err instanceof Error ? err.message : "Failed to save product.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div role="status" className="admin-panel flex items-center justify-center gap-2 rounded-xl border border-border p-12 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Loading product…
      </div>
    )
  }

  if (loadError) {
    return (
      <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {loadError}
      </div>
    )
  }

  return (
    <form id={FORM_ID} onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Left column */}
      <div className="space-y-6 lg:col-span-2">
        {(error || success) && (
          <div
            className={cn(
              "rounded-lg border px-4 py-3 text-sm",
              error
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700",
            )}
          >
            {error || success}
          </div>
        )}
        <FieldCard title="Product Information">
          <div className="grid gap-4">
            <div>
              <label className={labelCls}>Product Name <span className="text-destructive">*</span></label>
              <input
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
                className={inputCls}
                placeholder="Enter product name"
                required
              />
            </div>
            <div>
              <label className={labelCls}>Category <span className="text-destructive">*</span></label>
              <input
                value={form.category}
                onChange={(event) => update("category", event.target.value)}
                className={inputCls}
                placeholder="Example: sofas"
                list="admin-product-categories"
                required
              />
              <datalist id="admin-product-categories">
                {categories.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Price ({currency}) <span className="text-destructive">*</span></label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.price}
                  onChange={(event) => update("price", event.target.value)}
                  className={inputCls}
                  placeholder="Enter price"
                  required
                />
              </div>
              <div>
                <label className={labelCls}>Compare Price ({currency})</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.oldPrice}
                  onChange={(event) => update("oldPrice", event.target.value)}
                  className={inputCls}
                  placeholder="Enter compare price (optional)"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>SKU</label>
                <input
                  value={form.sku}
                  onChange={(event) => update("sku", event.target.value)}
                  className={inputCls}
                  placeholder="Auto-generated if empty"
                />
              </div>
              <div>
                <label className={labelCls}>Stock Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(event) => update("stock", event.target.value)}
                  className={inputCls}
                  placeholder="Enter stock quantity"
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>Short Description</label>
              <textarea
                rows={2}
                maxLength={500}
                value={form.shortDescription}
                onChange={(event) => update("shortDescription", event.target.value)}
                className={cn(inputCls, "resize-none")}
                placeholder="Enter short description"
              />
              <p className="mt-1 text-right text-xs text-muted-foreground">{form.shortDescription.length}/500</p>
            </div>
            <div>
              <label className={labelCls}>Full Description</label>
              <textarea
                rows={7}
                maxLength={10000}
                value={form.description}
                onChange={(event) => update("description", event.target.value)}
                className={cn(inputCls, "resize-y")}
                placeholder="Describe the construction, finish, dimensions, care, and intended use."
              />
              <p className="mt-1 text-right text-xs text-muted-foreground">{form.description.length}/10,000</p>
            </div>
          </div>
        </FieldCard>
      </div>

      {/* Right column */}
      <div className="space-y-6">
        <FieldCard title="Product Images">
          <ProductImagesField items={images} onChange={setImages} disabled={saving} />
        </FieldCard>

        <FieldCard title="Product Status">
          <select
            className={cn(inputCls, "appearance-none")}
            value={form.status}
            onChange={(event) => update("status", event.target.value as ProductFormState["status"])}
          >
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <button
            type="button"
            onClick={() => setFeatured((v) => !v)}
            className="mt-4 flex w-full items-center justify-between"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-foreground">
              <span className={cn("flex size-5 items-center justify-center rounded-full border", featured ? "border-primary bg-primary text-primary-foreground" : "border-border")}>
                {featured && <span className="size-2 rounded-full bg-current" />}
              </span>
              Featured Product
            </span>
            <span className={cn("relative h-6 w-11 rounded-full transition-colors", featured ? "bg-primary" : "bg-border")}>
              <span className={cn("absolute top-0.5 size-5 rounded-full bg-card shadow transition-all", featured ? "left-[22px]" : "left-0.5")} />
            </span>
          </button>
        </FieldCard>

        <FieldCard title="Inventory Details">
          <div className="grid gap-4">
            <div>
              <label className={labelCls}>Material</label>
              <input
                value={form.material}
                onChange={(event) => update("material", event.target.value)}
                className={inputCls}
                placeholder="Example: Teak"
              />
            </div>
            <div>
              <label className={labelCls}>Colors</label>
              <input
                value={form.colors}
                onChange={(event) => update("colors", event.target.value)}
                className={inputCls}
                placeholder="#2a211b, Brown, Natural"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>MOQ</label>
                <input
                  type="number"
                  min="1"
                  value={form.moq}
                  onChange={(event) => update("moq", event.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Warranty</label>
                <input
                  type="number"
                  min="0"
                  value={form.warrantyMonths}
                  onChange={(event) => update("warrantyMonths", event.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Delivery</label>
                <input
                  type="number"
                  min="0"
                  value={form.deliveryDays}
                  onChange={(event) => update("deliveryDays", event.target.value)}
                  className={inputCls}
                />
              </div>
            </div>
          </div>
        </FieldCard>
      </div>
      <input type="hidden" name="saving" value={saving ? "true" : "false"} />
    </form>
  )
}

export { FORM_ID as ADD_PRODUCT_FORM_ID }
