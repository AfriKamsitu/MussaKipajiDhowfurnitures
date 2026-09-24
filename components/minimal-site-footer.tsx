"use client"

import { useStoreSettings } from "@/components/store-settings-provider"
import { MobileBuyerNav } from "@/components/mobile-buyer-nav"

export function SiteFooter() {
  const settings = useStoreSettings()

  return (
    <>
    <footer className="mt-8 hidden border-t border-[#d9dedf] bg-[#eef1f2] text-[#586168] sm:mt-10 md:block">
      <div className="mx-auto flex min-h-20 max-w-[1400px] items-center justify-center px-4 py-5 text-center sm:px-6 lg:px-8">
        <p className="text-[11px] font-medium tracking-[0.01em] sm:text-xs">
          Copyright &copy; {new Date().getFullYear()} {settings.storeName}. All Rights Reserved.
        </p>
      </div>
    </footer>
    <MobileBuyerNav />
    </>
  )
}
