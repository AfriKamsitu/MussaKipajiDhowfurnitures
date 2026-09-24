import { AdminPageHeader, PrimaryButton } from "@/components/admin/admin-ui"
import { ADD_PRODUCT_FORM_ID, AddProductForm } from "@/components/admin/add-product-form"

export default function AddProductPage() {
  return (
    <div>
      <AdminPageHeader
        title="Add New Product"
        breadcrumb={["Dashboard", "Products", "Add New Product"]}
        actions={
          <>
            <button
              type="submit"
              form={ADD_PRODUCT_FORM_ID}
              name="intent"
              value="draft"
              className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-secondary"
            >
              Save Draft
            </button>
            <PrimaryButton type="submit" form={ADD_PRODUCT_FORM_ID}>Publish Product</PrimaryButton>
          </>
        }
      />
      <AddProductForm />
    </div>
  )
}
