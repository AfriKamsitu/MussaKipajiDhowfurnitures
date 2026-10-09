"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, Loader2, Printer } from "lucide-react"
import { AdminPageHeader } from "@/components/admin/admin-ui"
import { formatTZS, prettifyStatus } from "@/lib/admin-data"
import { fetchApi } from "@/lib/api"

type InvoiceOrder = {
  orderNumber: string
  createdAt: string
  payment: string
  paymentStatus: string
  status: string
  subtotal: number
  discount: number
  couponCode: string | null
  delivery: number
  total: number
  customer: string
  address: string
  phone: string
  items: Array<{ name: string; price: number; quantity: number }>
}

/** The store details an invoice needs, from Admin → Settings. */
type InvoiceSeller = {
  storeName: string
  storeEmail: string
  storePhone: string
  currency: string
  timezone: string
  logoUrl: string
  addressLine1: string
  addressLine2: string
  city: string
  country: string
  businessRegistrationNumber: string
  bankTransferEnabled: boolean
  bankName: string
  bankAccountName: string
  bankAccountNumber: string
}

const boxTitle = "text-[10px] font-bold uppercase tracking-[0.18em] text-[#6b2b2b]"

function text(value: unknown) {
  return value == null ? "" : String(value)
}

export default function OrderInvoicePage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<InvoiceOrder | null>(null)
  const [seller, setSeller] = useState<InvoiceSeller | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let active = true
    Promise.all([
      fetchApi<Record<string, unknown>>(`/api/admin/orders/${id}`),
      fetchApi<Record<string, unknown>>("/api/admin/settings"),
    ])
      .then(([raw, settings]) => {
        if (!active) return
        setOrder({
          orderNumber: text(raw.orderNumber ?? raw.id),
          createdAt: text(raw.createdAt),
          payment: text(raw.payment),
          paymentStatus: prettifyStatus(text(raw.paymentStatus)),
          status: prettifyStatus(text(raw.status)),
          subtotal: Number(raw.subtotal ?? 0),
          discount: Number(raw.discount ?? 0),
          couponCode: raw.couponCode ? text(raw.couponCode) : null,
          delivery: Number(raw.delivery ?? 0),
          total: Number(raw.total ?? 0),
          customer: text(raw.customerName),
          address: text(raw.shippingAddress),
          phone: text(raw.phone),
          items: Array.isArray(raw.items)
            ? (raw.items as Record<string, unknown>[]).map((item) => ({
                name: text(item.name),
                price: Number(item.price ?? 0),
                quantity: Number(item.quantity ?? 1),
              }))
            : [],
        })
        setSeller({
          storeName: text(settings.storeName),
          storeEmail: text(settings.storeEmail),
          storePhone: text(settings.storePhone),
          currency: text(settings.currency) || "TZS",
          timezone: text(settings.timezone),
          logoUrl: text(settings.logoUrl),
          addressLine1: text(settings.addressLine1),
          addressLine2: text(settings.addressLine2),
          city: text(settings.city),
          country: text(settings.country),
          businessRegistrationNumber: text(settings.businessRegistrationNumber),
          bankTransferEnabled: Boolean(settings.bankTransferEnabled),
          bankName: text(settings.bankName),
          bankAccountName: text(settings.bankAccountName),
          bankAccountNumber: text(settings.bankAccountNumber),
        })
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "The invoice could not be loaded.")
      })
    return () => {
      active = false
    }
  }, [id])

  // Name the saved PDF after the invoice while this page is open.
  useEffect(() => {
    if (!order || !seller) return
    const previous = document.title
    document.title = `Invoice ${order.orderNumber.replace(/^#/, "")} - ${seller.storeName}`
    return () => {
      document.title = previous
    }
  }, [order, seller])

  if (error) {
    return (
      <div>
        <AdminPageHeader title="Invoice" breadcrumb={["Dashboard", "Orders", "Invoice"]} />
        <p role="alert" className="text-sm text-destructive">{error}</p>
      </div>
    )
  }

  if (!order || !seller) {
    return (
      <div>
        <AdminPageHeader title="Invoice" breadcrumb={["Dashboard", "Orders", "Invoice"]} />
        <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Preparing invoice…
        </p>
      </div>
    )
  }

  const money = (amount: number) => formatTZS(amount, seller.currency)
  const invoiceNumber = `INV-${order.orderNumber.replace(/^#/, "")}`
  const dateOptions: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" }
  const formatDate = (value: string | Date) => {
    const date = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(date.getTime())) return "—"
    try {
      return new Intl.DateTimeFormat("en-GB", { ...dateOptions, timeZone: seller.timezone || undefined }).format(date)
    } catch {
      return new Intl.DateTimeFormat("en-GB", dateOptions).format(date)
    }
  }
  const sellerAddress = [seller.addressLine1, seller.addressLine2, seller.city, seller.country].filter(Boolean)
  const paid = order.paymentStatus.toLowerCase() === "paid"
  const cancelled = order.status.toLowerCase() === "cancelled"
  const showBank =
    !paid && seller.bankTransferEnabled && Boolean(seller.bankName && seller.bankAccountNumber)

  return (
    <div>
      <div data-no-print>
        <AdminPageHeader
          title="Invoice"
          breadcrumb={["Dashboard", "Orders", order.orderNumber, "Invoice"]}
          actions={
            <>
              <Link
                href={`/admin/orders/${id}`}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-secondary"
              >
                <ArrowLeft className="size-4" aria-hidden="true" /> Back to order
              </Link>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              >
                <Printer className="size-4" aria-hidden="true" /> Print or save as PDF
              </button>
            </>
          }
        />
        <p className="-mt-3 mb-5 text-sm text-muted-foreground">
          Only the invoice below is printed. In the print window choose “Save as PDF” to send it to the customer.
        </p>
      </div>

      {/* The print rules live with the page so the invoice always prints alone, on one clean sheet. */}
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 12mm; }
          html, body { background: #ffffff !important; }
          body * { visibility: hidden !important; }
          .invoice-sheet, .invoice-sheet * { visibility: visible !important; }
          #admin-sidebar, .admin-theme > div > header, [data-no-print], nextjs-portal { display: none !important; }
          .admin-theme, .admin-theme > div { display: block !important; min-height: 0 !important; background: #ffffff !important; }
          .admin-theme main { padding: 0 !important; animation: none !important; transform: none !important; }
          .invoice-scroll { overflow: visible !important; }
          .invoice-sheet {
            width: 100% !important;
            max-width: none !important;
            min-height: 250mm !important;
            margin: 0 !important;
            border: 0 !important;
            box-shadow: none !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .invoice-sheet tr, .invoice-keep { break-inside: avoid; }
        }
      `}</style>

      <div className="invoice-scroll overflow-x-auto pb-2">
        <article className="invoice-sheet mx-auto flex min-h-[1060px] w-[760px] flex-col border border-border bg-white text-[13px] leading-[1.55] text-[#2a211b] shadow-sm">
          <div className="h-2 bg-[#6b2b2b]" aria-hidden="true" />

          <div className="flex flex-1 flex-col px-10 pb-8 pt-8">
            {/* Letterhead */}
            <header className="grid grid-cols-[1fr_auto] items-center gap-8">
              <div className="flex items-center gap-4">
                {seller.logoUrl && (
                  <Image
                    src={seller.logoUrl}
                    alt=""
                    width={84}
                    height={84}
                    unoptimized
                    className="size-[84px] shrink-0 rounded-full object-cover"
                  />
                )}
                <div>
                  <p className="text-[22px] font-bold leading-tight">{seller.storeName}</p>
                  {seller.businessRegistrationNumber && (
                    <p className="mt-1 text-[12px] text-black/60">
                      Business reg. no. {seller.businessRegistrationNumber}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-[34px] font-bold uppercase leading-none tracking-[0.14em] text-[#6b2b2b]">
                  Invoice
                </h2>
                <p className="mt-2 text-[15px] font-semibold">{invoiceNumber}</p>
              </div>
            </header>

            {/* Who it is from, who it is for, and the key facts */}
            <section className="mt-8 grid grid-cols-[1.15fr_1fr_1.2fr] border border-black/15">
              <div className="border-r border-black/15 p-4">
                <h3 className={boxTitle}>From</h3>
                <p className="mt-2 font-semibold">{seller.storeName}</p>
                {sellerAddress.map((line) => (
                  <p key={line} className="text-black/70">{line}</p>
                ))}
                {seller.storePhone && <p className="text-black/70">{seller.storePhone}</p>}
                {seller.storeEmail && <p className="break-words text-[12px] text-black/70">{seller.storeEmail}</p>}
              </div>
              <div className="border-r border-black/15 p-4">
                <h3 className={boxTitle}>Bill to</h3>
                <p className="mt-2 font-semibold">{order.customer || "—"}</p>
                {order.phone && <p className="text-black/70">{order.phone}</p>}
                {order.address && <p className="whitespace-pre-line text-black/70">{order.address}</p>}
              </div>
              <div className="p-4">
                <h3 className={boxTitle}>Details</h3>
                <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                  <dt className="text-black/60">Order</dt>
                  <dd className="whitespace-nowrap text-right font-semibold">{order.orderNumber}</dd>
                  <dt className="whitespace-nowrap text-black/60">Order date</dt>
                  <dd className="whitespace-nowrap text-right font-semibold">{formatDate(order.createdAt)}</dd>
                  <dt className="text-black/60">Issued</dt>
                  <dd className="whitespace-nowrap text-right font-semibold">{formatDate(new Date())}</dd>
                  <dt className="text-black/60">Payment</dt>
                  <dd className="text-right font-semibold">{order.payment || "—"}</dd>
                </dl>
              </div>
            </section>

            {/* Items */}
            <table className="mt-8 w-full border-collapse">
              <thead>
                <tr className="bg-[#6b2b2b] text-left text-[11px] uppercase tracking-[0.12em] text-white">
                  <th scope="col" className="w-10 px-3 py-2.5 font-bold">No.</th>
                  <th scope="col" className="px-3 py-2.5 font-bold">Description</th>
                  <th scope="col" className="w-16 px-3 py-2.5 text-center font-bold">Qty</th>
                  <th scope="col" className="w-36 px-3 py-2.5 text-right font-bold">Unit price</th>
                  <th scope="col" className="w-36 px-3 py-2.5 text-right font-bold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, index) => (
                  <tr key={`${item.name}-${index}`} className="border-b border-black/15 align-top">
                    <td className="px-3 py-3 text-black/60">{index + 1}</td>
                    <td className="px-3 py-3 font-medium">{item.name}</td>
                    <td className="px-3 py-3 text-center">{item.quantity}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right">{money(item.price)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right font-semibold">
                      {money(item.price * item.quantity)}
                    </td>
                  </tr>
                ))}
                {order.items.length === 0 && (
                  <tr className="border-b border-black/15">
                    <td colSpan={5} className="px-3 py-4 text-center text-black/60">This order has no items.</td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Payment on the left, totals on the right */}
            <section className="invoice-keep mt-6 grid grid-cols-[1fr_300px] items-start gap-10">
              <div>
                <h3 className={boxTitle}>Payment status</h3>
                <p
                  className={`mt-2 inline-block border-2 px-3 py-1 text-[12px] font-bold uppercase tracking-[0.14em] ${
                    cancelled
                      ? "border-red-700 text-red-700"
                      : paid
                        ? "border-emerald-700 text-emerald-700"
                        : "border-amber-700 text-amber-700"
                  }`}
                >
                  {cancelled ? "Order cancelled" : paid ? "Paid" : "Payment due"}
                </p>
                {showBank && (
                  <div className="mt-5">
                    <h3 className={boxTitle}>Bank details</h3>
                    <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5">
                      <dt className="text-black/60">Bank</dt>
                      <dd className="font-semibold">{seller.bankName}</dd>
                      {seller.bankAccountName && (
                        <>
                          <dt className="text-black/60">Account name</dt>
                          <dd className="font-semibold">{seller.bankAccountName}</dd>
                        </>
                      )}
                      <dt className="text-black/60">Account no.</dt>
                      <dd className="font-semibold">{seller.bankAccountNumber}</dd>
                      <dt className="text-black/60">Reference</dt>
                      <dd className="font-semibold">{invoiceNumber}</dd>
                    </dl>
                  </div>
                )}
              </div>

              <dl>
                <div className="flex justify-between gap-6 px-3 py-1.5">
                  <dt className="text-black/65">Subtotal</dt>
                  <dd className="font-medium">{money(order.subtotal)}</dd>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between gap-6 px-3 py-1.5">
                    <dt className="text-black/65">Discount{order.couponCode ? ` (${order.couponCode})` : ""}</dt>
                    <dd className="font-medium">-{money(order.discount)}</dd>
                  </div>
                )}
                {order.delivery > 0 && (
                  <div className="flex justify-between gap-6 px-3 py-1.5">
                    <dt className="text-black/65">Delivery</dt>
                    <dd className="font-medium">{money(order.delivery)}</dd>
                  </div>
                )}
                <div className="mt-2 flex items-center justify-between gap-6 bg-[#6b2b2b] px-3 py-3 text-[15px] text-white">
                  <dt className="font-bold uppercase tracking-[0.08em]">
                    Total{cancelled ? "" : paid ? " paid" : " due"}
                  </dt>
                  <dd className="whitespace-nowrap font-bold">{money(order.total)}</dd>
                </div>
              </dl>
            </section>

            {/* Pinned to the bottom of the sheet */}
            <footer className="invoice-keep mt-auto pt-12 text-center">
              <p className="border-t border-black/20 pt-5 text-[14px] font-semibold">
                Thank you for choosing {seller.storeName}.
              </p>
              <p className="mt-1 text-[12px] text-black/60">
                {[sellerAddress.join(", "), seller.storePhone, seller.storeEmail].filter(Boolean).join("  ·  ")}
              </p>
            </footer>
          </div>
        </article>
      </div>
    </div>
  )
}
