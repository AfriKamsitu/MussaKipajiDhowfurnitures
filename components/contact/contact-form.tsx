"use client"

import { useEffect, useState } from "react"
import { CheckCircle2 } from "lucide-react"
import { WhatsAppGlyph } from "@/components/whatsapp-glyph"
import { openWhatsApp } from "@/lib/whatsapp"

const inputClass =
  "w-full rounded-md border border-input bg-background px-3.5 py-3 text-sm text-foreground outline-none transition-[border-color,box-shadow,background-color] placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/20"

const subjects = [
  "Product question",
  "Custom furniture",
  "Existing order",
  "Workshop visit",
  "Trade or hospitality project",
]

export function ContactForm() {
  const [sent, setSent] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [subject, setSubject] = useState(subjects[0])
  const [message, setMessage] = useState("")

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("request")?.trim()
    if (requested) {
      setSubject("Custom furniture")
      setMessage(requested.slice(0, 800))
    }
  }, [])

  function buildMessage() {
    return [
      "Hello Kipaji Dhow Furniture,",
      name && `Name: ${name}`,
      email && `Email: ${email}`,
      phone && `Phone: ${phone}`,
      subject && `Subject: ${subject}`,
      message && `\n${message}`,
    ]
      .filter(Boolean)
      .join("\n")
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    openWhatsApp(buildMessage())
    setSent(true)
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5" aria-label="Contact form">
      {sent && (
        <div
          className="flex items-start gap-3 rounded-md border border-brand-sage/30 bg-brand-sage/10 px-4 py-3 text-sm"
          role="status"
        >
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-brand-sage" />
          <div>
            <p className="font-semibold text-foreground">Your message is ready in WhatsApp.</p>
            <button
              type="button"
              onClick={() => openWhatsApp(buildMessage())}
              className="mt-0.5 font-medium text-primary hover:underline"
            >
              Open it again
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="mb-1.5 block text-sm font-semibold text-foreground">
            Name
          </label>
          <input
            id="contact-name"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="Your full name"
          />
        </div>
        <div>
          <label htmlFor="contact-email" className="mb-1.5 block text-sm font-semibold text-foreground">
            Email <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <input
            id="contact-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            placeholder="you@example.com"
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-phone" className="mb-1.5 block text-sm font-semibold text-foreground">
            Phone <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <input
            id="contact-phone"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputClass}
            placeholder="+255 7xx xxx xxx"
          />
        </div>
        <div>
          <label htmlFor="contact-subject" className="mb-1.5 block text-sm font-semibold text-foreground">
            Topic
          </label>
          <select
            id="contact-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className={inputClass}
          >
            {subjects.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <label htmlFor="contact-message" className="block text-sm font-semibold text-foreground">
            Message
          </label>
          <span className="text-xs text-muted-foreground">{message.length}/800</span>
        </div>
        <textarea
          id="contact-message"
          required
          rows={6}
          maxLength={800}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={`${inputClass} resize-y`}
          placeholder="Tell us what you would like us to make or help you find."
        />
      </div>

      <button
        type="submit"
        className="interactive-press inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-accent sm:w-auto sm:justify-self-start sm:px-8"
      >
        <WhatsAppGlyph className="size-4" /> Send via WhatsApp
      </button>
    </form>
  )
}
