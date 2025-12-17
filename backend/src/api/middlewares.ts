import { defineMiddlewares } from "@medusajs/medusa"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/health",
      method: "GET",
      middlewares: [],
      authenticate: false,
    },
    {
      matcher: "/payme",
      method: "POST",
      middlewares: [],
      authenticate: false,
    },
    {
      matcher: "/click/prepare",
      method: "POST",
      middlewares: [],
      authenticate: false,
    },
    {
      matcher: "/click/complete",
      method: "POST",
      middlewares: [],
      authenticate: false,
    },
  ],
})
