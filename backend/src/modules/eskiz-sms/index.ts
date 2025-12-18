import { ModuleProviderExports } from "@medusajs/framework/types"
import { EskizNotificationService } from "./service"

const services = [EskizNotificationService]

const providerExports: ModuleProviderExports = {
  services,
}

export default providerExports
