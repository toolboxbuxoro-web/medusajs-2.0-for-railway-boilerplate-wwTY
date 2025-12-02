import { PaymePaymentProviderService } from "./services/payme"
import { ModuleProviderExports } from "@medusajs/framework/types"

const services = [PaymePaymentProviderService]

const providerExport: ModuleProviderExports = {
  services,
}

export default providerExport
