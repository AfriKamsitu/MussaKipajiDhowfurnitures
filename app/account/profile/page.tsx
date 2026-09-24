import type { Metadata } from "next"
import { AccountShell } from "@/components/account/account-shell"
import { ProfileView } from "@/components/account/profile-view"

export const metadata: Metadata = {
  title: "Profile",
}

export default function ProfilePage() {
  return (
    <AccountShell title="Profile">
      <ProfileView />
    </AccountShell>
  )
}
