"use client"

import { WhatsAppGlyph } from "@/components/whatsapp-glyph"
import { whatsappUrl } from "@/lib/whatsapp"

export function WhatsAppContactIcon() {
  return (
    <a
      href={whatsappUrl("Hello Kipaji Dhow Furniture, I would like help choosing furniture.")}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with Kipaji Dhow Furniture on WhatsApp"
      title="Chat on WhatsApp"
      className="fixed bottom-24 right-4 z-40 flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-elevated transition-[background-color,transform,box-shadow] duration-300 hover:-translate-y-1 hover:scale-105 hover:bg-[#20bd5a] hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366] sm:bottom-24 sm:right-6 md:bottom-6"
    >
      <WhatsAppGlyph className="size-7" />
    </a>
  )
}
