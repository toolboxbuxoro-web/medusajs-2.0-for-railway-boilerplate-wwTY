import MoySkladService from "./service"
import { Module } from "@medusajs/framework/utils"
import { MOYSKLAD_MODULE } from "./constants"

const moduleExport = Module(MOYSKLAD_MODULE, {
  service: MoySkladService,
})

// CommonJS interop for Medusa module loader (same issue as providers).
export = moduleExport
