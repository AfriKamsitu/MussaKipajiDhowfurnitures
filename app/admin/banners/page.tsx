"use client"

import { Fragment, useEffect, useState } from "react"
import Image from "next/image"
import { Loader2, Pencil, Plus, Trash2, UploadCloud, X } from "lucide-react"
import { AdminPageHeader, PrimaryButton, StatusBadge } from "@/components/admin/admin-ui"
import { deleteUploadedImages, fetchApi, uploadImage } from "@/lib/api"
import { formatTZS, prettifyStatus } from "@/lib/admin-data"
import { useStoreSettings } from "@/components/store-settings-provider"

type BannerRow = {
  id: string
  title: string
  location: string
  image: string
  headline: string
  description: string
  ctaLabel: string
  price: number | null
  discountPercentage: number | null
  sortOrder: number
  status: string
}

export default function AdminBannersPage() {
  const { currency } = useStoreSettings()
  const [banners, setBanners] = useState<BannerRow[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: "",
    location: "",
    image: "",
    headline: "",
    description: "",
    ctaLabel: "",
    price: "",
    discountPercentage: "",
    sortOrder: "0",
    status: "ACTIVE",
  })
  const imageOnlyPlacement = [
    "Homepage Hero",
    "Login Background",
    "Register Background",
  ].includes(form.location)

  function loadBanners() {
    fetchApi<Record<string, unknown>[]>("/api/admin/banners")
      .then((payload) => {
        const list = Array.isArray(payload) ? payload : []
        setBanners(
          list.map((b) => ({
            id: String(b.id),
            title: String(b.title ?? ""),
            location: String(b.location ?? ""),
            image: String(b.image ?? "/placeholder.svg"),
            headline: String(b.headline ?? ""),
            description: String(b.description ?? ""),
            ctaLabel: String(b.ctaLabel ?? ""),
            price: b.price == null ? null : Number(b.price),
            discountPercentage: b.discountPercentage == null ? null : Number(b.discountPercentage),
            sortOrder: Number(b.sortOrder ?? 0),
            status: prettifyStatus(String(b.status ?? "Active")),
          })),
        )
      })
      .catch(() => setBanners([]))
  }

  useEffect(() => {
    loadBanners()
  }, [])

  async function saveBanner(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    let uploadedImage: string | null = null
    try {
      let image = form.image
      if (imageFile) {
        image = await uploadImage(imageFile, "banners")
        uploadedImage = image
      }
      const payload = {
        ...form,
        image,
        price: form.price.trim() ? Number(form.price) : null,
        discountPercentage: form.discountPercentage.trim() ? Number(form.discountPercentage) : null,
        sortOrder: Number(form.sortOrder || 0),
      }
      await fetchApi(editingId ? `/api/admin/banners/${editingId}` : "/api/admin/banners", {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(payload),
      })
      setForm({
        title: "",
        location: "",
        image: "",
        headline: "",
        description: "",
        ctaLabel: "",
        price: "",
        discountPercentage: "",
        sortOrder: "0",
        status: "ACTIVE",
      })
      setImageFile(null)
      setImagePreview(null)
      setEditingId(null)
      setShowForm(false)
      setNotice({ type: "success", text: editingId ? "Banner updated successfully." : "Banner created successfully." })
      loadBanners()
    } catch (err) {
      if (uploadedImage) {
        await deleteUploadedImages([uploadedImage]).catch(() => undefined)
      }
      setError(err instanceof Error ? err.message : "Failed to save banner.")
    } finally {
      setSaving(false)
    }
  }

  function startEdit(banner: BannerRow) {
    setEditingId(banner.id)
    setNotice(null)
    setConfirmDeleteId(null)
    setForm({
      title: banner.title,
      location: banner.location,
      image: banner.image === "/placeholder.svg" ? "" : banner.image,
      headline: banner.headline,
      description: banner.description,
      ctaLabel: banner.ctaLabel,
      price: banner.price == null ? "" : String(banner.price),
      discountPercentage: banner.discountPercentage == null ? "" : String(banner.discountPercentage),
      sortOrder: String(banner.sortOrder),
      status: banner.status.toUpperCase(),
    })
    setImageFile(null)
    setImagePreview(null)
    setShowForm(true)
  }

  function handleImageChange(file: File | null) {
    setImageFile(file)
    setImagePreview(file ? URL.createObjectURL(file) : null)
  }

  async function deleteBanner(banner: BannerRow) {
    setBusyId(banner.id)
    setNotice(null)
    try {
      await fetchApi(`/api/admin/banners/${banner.id}`, { method: "DELETE" })
      await deleteUploadedImages([banner.image]).catch(() => undefined)
      setBanners((current) => current.filter((item) => item.id !== banner.id))
      setConfirmDeleteId(null)
      setNotice({ type: "success", text: "Banner deleted from the database." })
      loadBanners()
    } catch (err) {
      setNotice({ type: "error", text: err instanceof Error ? err.message : "Failed to delete banner." })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Slider images"
        breadcrumb={["Dashboard", "Slider images"]}
        actions={
          <PrimaryButton onClick={() => setShowForm((value) => !value)}>
            <Plus className="size-4" />
            Add image
          </PrimaryButton>
        }
      />

      {showForm && (
        <form onSubmit={saveBanner} className="mb-5 rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-5 rounded-lg border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">Choose where this image will appear</p>
            <p className="mt-1">
              Add several images to the same placement and use slide order to control their sequence.
              Homepage, login, and registration images will rotate automatically.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <input
              required
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="Internal image title"
              className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-ring"
            />
            <select
              required
              value={form.location}
              onChange={(event) => {
                const location = event.target.value
                const imageOnly = [
                  "Homepage Hero",
                  "Login Background",
                  "Register Background",
                ].includes(location)
                setForm((current) => ({
                  ...current,
                  location,
                  ...(imageOnly
                    ? {
                        headline: "",
                        description: "",
                        ctaLabel: "",
                        price: "",
                        discountPercentage: "",
                      }
                    : {}),
                }))
              }}
              className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-ring"
            >
              <option value="">Select placement</option>
              <option value="Homepage Hero">Homepage - image-only slider</option>
              <option value="Login Background">Login page - rotating background</option>
              <option value="Register Background">Register page - rotating background</option>
              <option value="Hot Picks">Hot Picks - homepage sliding images</option>
              <option value="Summer Sale">Summer Sale image</option>
              <option value="Offers Page">Offers Page - price and discount slider</option>
              <option value="Homepage">Homepage</option>
              <option value="Shop Page">Shop Page</option>
            </select>
            <div className="md:col-span-2">
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-secondary/40 px-4 py-7 text-center transition-colors hover:bg-secondary">
                <UploadCloud className="mb-2 size-7 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Choose banner image from computer</span>
                <span className="mt-1 text-xs text-muted-foreground">PNG, JPG, WEBP up to 5MB</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  required={!editingId && !form.image}
                  className="sr-only"
                  onChange={(event) => handleImageChange(event.target.files?.[0] ?? null)}
                />
              </label>
              {imagePreview && (
                <div className="mt-3 overflow-hidden rounded-lg border border-border bg-secondary">
                  <Image src={imagePreview} alt="Selected banner preview" width={900} height={300} className="h-44 w-full object-cover" unoptimized />
                </div>
              )}
            </div>
            {!imageOnlyPlacement && (
              <>
                <input
                  value={form.headline}
                  onChange={(event) => setForm((current) => ({ ...current, headline: event.target.value }))}
                  placeholder="Large headline, e.g. Up to 30% Off"
                  className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-ring"
                />
                <input
                  value={form.ctaLabel}
                  onChange={(event) => setForm((current) => ({ ...current, ctaLabel: event.target.value }))}
                  placeholder="Button text, e.g. Shop the Sale"
                  className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-ring"
                />
                <textarea
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Supporting text, e.g. Refresh your home with our summer collection."
                  className="md:col-span-2 rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-ring"
                />
                <label className="grid gap-1.5 text-sm font-medium text-foreground">
                  Offer price ({currency}) <span className="font-normal text-muted-foreground">(optional)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
                    placeholder="e.g. 450000"
                    className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-normal outline-none focus:border-ring"
                  />
                </label>
                <label className="grid gap-1.5 text-sm font-medium text-foreground">
                  Discount percentage <span className="font-normal text-muted-foreground">(optional)</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.discountPercentage}
                    onChange={(event) => setForm((current) => ({ ...current, discountPercentage: event.target.value }))}
                    placeholder="e.g. 30"
                    className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-normal outline-none focus:border-ring"
                  />
                </label>
              </>
            )}
            <input
              type="number"
              min="0"
              value={form.sortOrder}
              onChange={(event) => setForm((current) => ({ ...current, sortOrder: event.target.value }))}
              placeholder="Slide order, e.g. 1"
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
            <PrimaryButton type="submit" disabled={saving}>{saving ? "Saving..." : editingId ? "Update image" : "Save image"}</PrimaryButton>
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
        <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
          <div>
            <h2 className="font-semibold text-foreground">Banner collection</h2>
            <p className="text-xs text-muted-foreground">Create any number of slides and control their order.</p>
          </div>
          <span className="shrink-0 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-foreground">
            {banners.length} {banners.length === 1 ? "banner" : "banners"}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Banner</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Discount</th>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {banners.map((b) => (
                <Fragment key={b.id}>
                  <tr className="transition-colors hover:bg-secondary/40">
                    <td className="px-4 py-3">
                      <span className="relative block h-12 w-20 overflow-hidden rounded-lg bg-secondary">
                        <Image src={b.image || "/placeholder.svg"} alt={b.title} fill sizes="80px" className="object-cover" />
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">{b.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">{b.location}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{b.price == null ? "-" : formatTZS(b.price, currency)}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {b.discountPercentage == null ? "-" : `${b.discountPercentage}%`}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{b.sortOrder}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => startEdit(b)}
                          className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
                          aria-label="Edit"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          onClick={() => {
                            setNotice(null)
                            setConfirmDeleteId((current) => (current === b.id ? null : b.id))
                          }}
                          className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-red-50 hover:text-destructive"
                          aria-label="Delete"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {confirmDeleteId === b.id && (
                    <tr className="bg-red-50/70">
                      <td colSpan={8} className="px-4 py-3">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-medium text-red-700">Delete {b.title}?</p>
                            <p className="text-xs text-red-600">This removes the banner from the database.</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => deleteBanner(b)}
                              disabled={busyId === b.id}
                              className="inline-flex items-center justify-center gap-2 rounded-md bg-destructive px-3 py-2 text-sm font-semibold text-destructive-foreground disabled:opacity-70"
                            >
                              {busyId === b.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
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
    </div>
  )
}
