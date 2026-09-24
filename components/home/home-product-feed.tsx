import { EditorialProductCollection } from "@/components/home/editorial-product-collection"

export function HomeProductFeed() {
  return (
    <section className="bg-white px-5 py-20 text-[#11130f] sm:px-10 lg:px-[60px]">
      <div className="mx-auto max-w-[1320px]">
        <EditorialProductCollection />
      </div>
    </section>
  )
}