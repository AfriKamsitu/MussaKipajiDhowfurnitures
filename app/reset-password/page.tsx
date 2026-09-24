import type { Metadata } from "next"
import { AuthShell } from "@/components/auth/auth-shell"
import { ResetForm } from "@/components/auth/reset-form"

export const metadata: Metadata = {
  title: "Reset Password",
}

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your email and we'll send you a link to reset it."
      image="/sofa-lshaped.png"
    >
      <ResetForm />
    </AuthShell>
  )
}
