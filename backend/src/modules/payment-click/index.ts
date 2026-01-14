import { ClickPaymentProviderService, ClickPayByCardProviderService } from "./services/click.js"
import type { ModuleProviderExports } from "@medusajs/framework/types"

const services = [ClickPaymentProviderService, ClickPayByCardProviderService]

const providerExport: ModuleProviderExports = {
  services,
}

// See payment-payme/index.ts for why we use `export =` here (CommonJS interop with Medusa loader).
export = providerExport
