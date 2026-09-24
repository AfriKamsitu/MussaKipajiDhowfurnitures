import { EditorialSiteHeader } from "@/components/editorial-site-header"
import { EditorialSiteFooter } from "@/components/editorial-site-footer"
import { EditorialHome } from "@/components/home/editorial-home"

export default function Home() {
  return (
    <div className="min-h-screen bg-[#11130f] font-sans">
      <EditorialSiteHeader />
      <EditorialHome />
      <EditorialSiteFooter />
    </div>
  )
}