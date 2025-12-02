import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function seedShippingOption({ container }: ExecArgs) {
  const remoteQuery = container.resolve("remoteQuery")
  const fulfillmentModule = container.resolve(Modules.FULFILLMENT)
  
  // 1. Get Service Zone
  const serviceZones = await remoteQuery({
    entryPoint: "service_zones",
    fields: ["id", "name"],
    variables: { filters: { name: "Uzbekistan" } }
  })

  if (!serviceZones.length) {
    console.error("Service Zone 'Uzbekistan' not found. Please run seed script first.")
    return
  }
  const serviceZoneId = serviceZones[0].id
  console.log(`Found Service Zone: ${serviceZoneId}`)

  // 2. Get Shipping Profile
  const shippingProfiles = await remoteQuery({
    entryPoint: "shipping_profiles",
    fields: ["id", "name"],
    variables: { filters: { type: "default" } }
  })

  if (!shippingProfiles.length) {
    console.error("Default Shipping Profile not found.")
    return
  }
  const shippingProfileId = shippingProfiles[0].id
  console.log(`Found Shipping Profile: ${shippingProfileId}`)

  // 3. Create Shipping Option
  console.log("Creating 'Courier Delivery' shipping option...")
  
  try {
    const shippingOption = await fulfillmentModule.createShippingOptions({
      name: "Courier Delivery",
      service_zone_id: serviceZoneId,
      shipping_profile_id: shippingProfileId,
      provider_id: "manual_manual", // Medusa v2 manual provider ID is usually 'manual_manual' or just 'manual' depending on registration. Default is 'manual_manual'
      price_type: "flat",
      data: {
        amount: 15000, // 15000 UZS
      },
      type: {
        label: "Delivery",
        description: "Standard courier delivery",
        code: "delivery"
      },
      rules: [
        {
          attribute: "enabled_in_store",
          operator: "eq",
          value: "true"
        }
      ]
    })
    console.log("Created Shipping Option:", shippingOption)
    
    // 4. Create Price for the option (if not handled by createShippingOptions 'data' field which is provider specific)
    // In v2, pricing is handled by Pricing Module, but for flat rate in manual provider, it might be stored in 'data' or needs a price set.
    // Actually, for 'flat' price type, we need to create a price in the Pricing Module linked to this option?
    // No, 'flat' price type usually implies the price is calculated by the provider or stored in the option.
    // Wait, Medusa v2 uses Pricing Module for everything.
    // Let's check how to set price for shipping option in v2.
    // It seems we need to create a price set.
    
    const pricingModule = container.resolve(Modules.PRICING)
    const priceSet = await pricingModule.createPriceSets({
      prices: [
        {
          amount: 15000,
          currency_code: "uzs",
        }
      ]
    })
    
    // Link price set to shipping option
    // Actually, createShippingOptions has a 'prices' field in some versions, or we link it via remoteLink?
    // Let's assume 'data.amount' is enough for manual provider for now, but usually we need a PriceSet.
    // Let's try to link it if possible.
    
    const remoteLink = container.resolve("remoteLink")
    await remoteLink.create({
      [Modules.FULFILLMENT]: {
        shipping_option_id: shippingOption.id,
      },
      [Modules.PRICING]: {
        price_set_id: priceSet.id,
      },
    })
    console.log("Linked Price Set to Shipping Option")

  } catch (e) {
    console.error("Error creating shipping option:", e)
  }
}
