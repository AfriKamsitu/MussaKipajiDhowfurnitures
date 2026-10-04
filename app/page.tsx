import { HomeView } from "@/components/home/home-view"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { getCatalogProducts } from "@/lib/catalog-server"

export default async function Home() {
  const products = await getCatalogProducts()

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader />
      <HomeView initialProducts={products} />
      <SiteFooter />
    </div>
  )
}
