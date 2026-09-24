"use client"

import { useStoreSettings } from "@/components/store-settings-provider"

export function SiteFooter() {
  const storeSettings = useStoreSettings()
  const socialLinks = [
    { label: "Instagram", href: storeSettings.instagramUrl, icon: "◎" },
    { label: "Facebook", href: storeSettings.facebookUrl, icon: "f" },
  ]

  return (
    <footer className="mt-8 border-t border-[#d9dedf] bg-[#eef1f2] text-[#2f3940]">
      <div className="mx-auto flex min-h-36 max-w-7xl flex-col items-center justify-center gap-6 px-4 py-10 text-center">
        <p className="text-sm sm:text-base">
          Copyright &copy; {new Date().getFullYear()} {storeSettings.storeName}. All Rights Reserved.
        </p>
        <div className="flex items-center gap-5">
          {socialLinks.map((item) =>
            item.href ? (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                aria-label={item.label}
                className="text-[#30383d] transition-[color,transform] hover:-translate-y-0.5 hover:text-primary"
              >
                <span className="text-xl font-black leading-none" aria-hidden="true">{item.icon}</span>
              </a>
            ) : (
              <span
                key={item.label}
                aria-label={`${item.label} link not configured`}
                className="text-[#30383d]/35"
              >
                <span className="text-xl font-black leading-none" aria-hidden="true">{item.icon}</span>
              </span>
            ),
          )}
        </div>
      </div>
    </footer>
  )
}
