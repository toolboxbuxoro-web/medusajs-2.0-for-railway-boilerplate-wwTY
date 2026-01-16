import type { ModuleProviderExports } from '@medusajs/framework/types'
import { ResendNotificationService } from './services/resend'

const services = [ResendNotificationService]

const providerExport: ModuleProviderExports = {
  services,
}

// CommonJS interop for Medusa provider loader (see payment-payme/index.ts).
export = providerExport
