import type { ModuleProviderExports } from '@medusajs/framework/types'
import MinioFileProviderService from './service'

const services = [MinioFileProviderService]

const providerExport: ModuleProviderExports = {
  services,
}

// CommonJS interop for Medusa provider loader (see payment-payme/index.ts).
export = providerExport
