import { ClickPaymentProviderService, ClickPayByCardProviderService } from "./services/click"
import { ModuleProviderExports } from "@medusajs/framework/types"

const services = [ClickPaymentProviderService, ClickPayByCardProviderService]

const providerExport: ModuleProviderExports = {
  services,
}

export default providerExport
