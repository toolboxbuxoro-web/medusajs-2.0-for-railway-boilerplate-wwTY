import type { ModuleProviderExports } from "@medusajs/framework/types"
import { EskizNotificationService } from "./service"

const services = [EskizNotificationService]

const providerExport: ModuleProviderExports = {
  services,
}

// CommonJS interop for Medusa provider loader
export = providerExport

