import type { Metadata } from "next"
import { AuthShell } from "@/components/auth/auth-shell"
import { Suspense } from "react"
import { RegisterForm } from "@/components/auth/register-form"

export const metadata: Metadata = {
  title: "Create Account",
}

export default function RegisterPage() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="Create an account to save favorites, track orders, and furnish your space."
      placement="Register Background"
      panelClassName="sm:max-w-lg"
      image="/auth/sofa-set.jpg"
      images={[
        "/auth/workshop.jpg",
        "/about-outdoor-seat.jpeg",
        "/paje-dhow-dining-table-hero.jpg",
      ]}
    >
      <Suspense fallback={null}>
        <RegisterForm />
      </Suspense>
    </AuthShell>
  )
}
