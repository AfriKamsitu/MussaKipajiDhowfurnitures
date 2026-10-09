import { AdminPageHeader, PrimaryButton } from "@/components/admin/admin-ui"
import { ADD_PRODUCT_FORM_ID, AddProductForm } from "@/components/admin/add-product-form"

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  return (
    <div>
      <AdminPageHeader
        title="Edit Product"
        breadcrumb={["Dashboard", "Products", "Edit Product"]}
        actions={<PrimaryButton type="submit" form={ADD_PRODUCT_FORM_ID}>Save Changes</PrimaryButton>}
      />
      <AddProductForm key={id} productId={id} />
    </div>
  )
}
