import ManualPaymentProviderService from "./services/manual.js"
import type { ModuleProviderExports } from "@medusajs/framework/types"

const services = [ManualPaymentProviderService]

const providerExport: ModuleProviderExports = {
  services,
}

// IMPORTANT:
// Medusa loads providers via dynamic import from a CommonJS build output (.medusa/server).
// Using `export default` compiles to `exports.default = ...`, which results in a nested default
// when imported (`{ default: { default: { services }}}`) and crashes the loader.
// `export =` compiles to `module.exports = ...`, which matches what Medusa expects.
export = providerExport
