import { ModuleProviderExports } from "@medusajs/framework/types"
import {
  ClickPaymentProviderService,
  ClickPayByCardProviderService,
} from "./services/click"

const services = [ClickPaymentProviderService, ClickPayByCardProviderService]

const providerExport: ModuleProviderExports = {
  services,
}

export default providerExport



