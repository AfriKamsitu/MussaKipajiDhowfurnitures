import type { Metadata } from "next"
import Image from "next/image"

import { CheckoutView } from "@/components/checkout/checkout-view"
import { PurchaseSteps } from "@/components/checkout/purchase-steps"
import { Breadcrumb, PageShell } from "@/components/page-shell"

export const metadata: Metadata = {
  title: "Checkout",
}

export default function CheckoutPage() {
  return (
    <PageShell>
      <div className="mb-7">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Cart", href: "/cart" },
            { label: "Checkout" },
          ]}
        />
      </div>

      <section className="buyer-cinematic-banner relative isolate -mx-5 mb-12 min-h-[330px] overflow-hidden bg-[#11130f] text-[#f1eee6] sm:-mx-8 sm:min-h-[390px] lg:-mx-10">
        <Image
          src="/reference-site/table.jpg"
          alt="A handcrafted table ready for delivery"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(17,19,15,0.95),rgba(17,19,15,0.62)_58%,rgba(17,19,15,0.2)),linear-gradient(0deg,rgba(17,19,15,0.86),transparent_70%)]" />
        <div className="relative flex min-h-[330px] flex-col justify-between px-5 py-8 sm:min-h-[390px] sm:px-10 sm:py-11 lg:px-14">
          <div className="flex items-center justify-between gap-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#c5a274]">
              Order details
            </p>
            <span className="hidden text-[9px] uppercase tracking-[0.18em] text-white/55 sm:block">
              Delivery confirmed with the workshop
            </span>
          </div>
          <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="max-w-[10ch] text-[clamp(3.3rem,7vw,6.4rem)] font-medium leading-[0.87] tracking-[-0.075em]">
                Finish your
                <br />
                <span className="font-light italic text-[#c5a274]">order.</span>
              </h1>
              <p className="mt-5 max-w-lg text-[14px] font-light leading-7 text-white/68 sm:text-base">
                Add your delivery details, check the furniture in your cart, and send the order to
                our team on WhatsApp.
              </p>
            </div>
            <PurchaseSteps current="details" />
          </div>
        </div>
      </section>

      <CheckoutView />
    </PageShell>
  )
}
