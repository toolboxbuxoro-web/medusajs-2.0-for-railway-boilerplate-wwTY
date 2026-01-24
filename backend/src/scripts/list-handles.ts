import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function listHandles({ container }: ExecArgs) {
  const productService = container.resolve(Modules.PRODUCT)
  const [products] = await productService.listProducts({}, { take: 5, select: ["handle"] })
  console.log("HANDLES:", products.map(p => p.handle))
}
