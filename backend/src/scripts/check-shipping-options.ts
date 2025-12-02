import { ExecArgs } from "@medusajs/framework/types"

export default async function checkShippingOptions({ container }: ExecArgs) {
  const remoteQuery = container.resolve("remoteQuery")

  console.log("--- Sales Channels ---")
  const salesChannels = await remoteQuery({
    entryPoint: "sales_channels",
    fields: ["id", "name", "stock_locations.id", "stock_locations.name"],
  })
  console.log(JSON.stringify(salesChannels, null, 2))

  console.log("--- Stock Locations -> Fulfillment Sets ---")
  const stockLocations = await remoteQuery({
    entryPoint: "stock_locations",
    fields: ["id", "name", "fulfillment_sets.id", "fulfillment_sets.name", "fulfillment_sets.type"],
  })
  console.log(JSON.stringify(stockLocations, null, 2))

  console.log("--- Fulfillment Sets -> Service Zones -> Shipping Options ---")
  const fulfillmentSets = await remoteQuery({
    entryPoint: "fulfillment_sets",
    fields: [
      "id", 
      "name", 
      "service_zones.id", 
      "service_zones.name", 
      "service_zones.geo_zones.*",
      "service_zones.shipping_options.id",
      "service_zones.shipping_options.name",
      "service_zones.shipping_options.price_type",
      "service_zones.shipping_options.provider_id",
      "service_zones.shipping_options.rules.*"
    ],
  })
  console.log(JSON.stringify(fulfillmentSets, null, 2))
  console.log("--- Shipping Profiles ---")
  const shippingProfiles = await remoteQuery({
    entryPoint: "shipping_profiles",
    fields: ["id", "name", "type", "shipping_options.id", "shipping_options.name"],
  })
  console.log(JSON.stringify(shippingProfiles, null, 2))

  console.log("--- Products -> Shipping Profile ---")
  const products = await remoteQuery({
    entryPoint: "product",
    fields: ["id", "title", "shipping_profile.id", "shipping_profile.name"],
    variables: { take: 5 }
  })
  console.log(JSON.stringify(products, null, 2))
}
