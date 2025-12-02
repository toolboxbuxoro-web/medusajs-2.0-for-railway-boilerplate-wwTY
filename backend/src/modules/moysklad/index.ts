import MoySkladService from "./service"
import { Module } from "@medusajs/framework/utils"

export const MOYSKLAD_MODULE = "moysklad"

export default Module(MOYSKLAD_MODULE, {
  service: MoySkladService,
})
