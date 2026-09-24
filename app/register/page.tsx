import type { Metadata } from "next"
import { AuthShell } from "@/components/auth/auth-shell"
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
      image="/sofa-chesterfield.png"
      images={[
        "/about-wooden-bed.jpeg",
        "/dining-set.png",
        "/showroom.png",
      ]}
    >
      <RegisterForm />
    </AuthShell>
  )
}
