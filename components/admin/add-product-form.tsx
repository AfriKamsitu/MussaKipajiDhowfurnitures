"use client"

import { FormEvent, useEffect, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  UploadCloud,
} from "lucide-react"
import { deleteUploadedImages, fetchApi, uploadImage } from "@/lib/api"
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
  image: string
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
  image: "",
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

export function AddProductForm() {
  const router = useRouter()
  const { currency } = useStoreSettings()
  const [featured, setFeatured] = useState(true)
  const [form, setForm] = useState<ProductFormState>(initialState)
  const [categories, setCategories] = useState<string[]>([])
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
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

  function update<K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function handleImageChange(files: FileList | null) {
    const list = files ? Array.from(files) : []
    setImageFiles(list)
    if (!list.length) {
      setImagePreviews([])
      update("image", "")
      return
    }
    setImagePreviews(list.map((file) => URL.createObjectURL(file)))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null
    const status = submitter?.value === "draft" ? "DRAFT" : form.status

    if (!form.name.trim() || !form.category.trim() || !form.price.trim()) {
      setError("Product name, category, and price are required.")
      return
    }

    setSaving(true)
    const uploadedImages: string[] = []
    try {
      for (const imageFile of imageFiles) {
        uploadedImages.push(await uploadImage(imageFile))
      }
      const imagePaths = uploadedImages.length
        ? uploadedImages
        : form.image.trim()
          ? [form.image.trim()]
          : []
      await fetchApi("/api/admin/products", {
        method: "POST",
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
        }),
      })
      setSuccess("Product saved successfully.")
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
          <label className={labelCls}>Product Images</label>
          <label className="group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card/45 px-4 py-8 text-center backdrop-blur-xl transition-[background-color,border-color,transform] hover:-translate-y-0.5 hover:border-primary/45 hover:bg-card/75">
            <UploadCloud className="mb-2 size-8 text-muted-foreground transition-[color,transform] duration-300 group-hover:-translate-y-1 group-hover:scale-105 group-hover:text-primary" />
            <span className="text-sm font-medium text-foreground">Choose images from computer</span>
            <span className="mt-1 text-xs text-muted-foreground">Select more than one PNG, JPG, or WEBP</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              className="sr-only"
              onChange={(event) => handleImageChange(event.target.files)}
            />
          </label>
          {imagePreviews.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {imagePreviews.map((preview, index) => (
                <div key={preview} className="group overflow-hidden rounded-lg border border-white/65 bg-card/55 shadow-soft backdrop-blur-xl">
                  <Image
                    src={preview}
                    alt={`Selected product preview ${index + 1}`}
                    width={240}
                    height={180}
                    className="h-28 w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    unoptimized
                  />
                </div>
              ))}
            </div>
          )}
          {form.image && imagePreviews.length === 0 && (
            <p className="mt-2 rounded-md bg-secondary px-3 py-2 text-xs text-muted-foreground">{form.image}</p>
          )}
          <div className="mt-3">
            <label className={labelCls}>Saved Image Path</label>
            <input value={form.image} readOnly className={inputCls} placeholder="Path appears after upload" />
          </div>
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
