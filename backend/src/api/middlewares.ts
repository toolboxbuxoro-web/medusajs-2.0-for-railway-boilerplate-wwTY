import { defineMiddlewares, authenticate } from "@medusajs/medusa"

console.log("[Middlewares] Defining routes and matchers...")

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/products/*/reviews",
      method: "POST",
      middlewares: [
        authenticate("customer", ["session", "bearer"]),
        (req, res, next) => {
          console.log(`[Middleware Check] POST reviews match: ${req.url}`)
          next()
        }
      ],
    },
    {
      matcher: "/store/products/*/can-review",
      method: "GET",
      middlewares: [
        authenticate("customer", ["session", "bearer"]),
      ],
    },
    {
      matcher: "/store/customer/reviews",
      method: "GET",
      middlewares: [
        authenticate("customer", ["session", "bearer"])
      ],
    },
    {
      matcher: "/health",
      method: "GET",
      middlewares: [],
    },
    {
      matcher: "/payme",
      method: "POST",
      middlewares: [],
    },
    {
      matcher: "/click/prepare",
      method: "POST",
      middlewares: [],
    },
    {
      matcher: "/click/complete",
      method: "POST",
      middlewares: [],
    },
    {
      matcher: "/store/customer/reviews",
      method: "GET",
      middlewares: [],
    },
  ],
})
