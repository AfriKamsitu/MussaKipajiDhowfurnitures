import type { Metadata } from "next"
import { Suspense } from "react"
import { AuthShell } from "@/components/auth/auth-shell"
import { LoginForm } from "@/components/auth/login-form"

export const metadata: Metadata = {
  title: "Sign In",
}

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue exploring handcrafted furniture for your space."
      placement="Login Background"
      image="/hero-living-room.png"
      images={[
        "/paje-dhow-dining-table-hero.jpg",
        "/sofa-lshaped.png",
        "/about-outdoor-seat.jpeg",
      ]}
    >
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  )
}
