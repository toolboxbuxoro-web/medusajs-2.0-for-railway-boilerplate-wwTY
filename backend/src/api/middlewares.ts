import { defineMiddlewares } from "@medusajs/medusa"

export default defineMiddlewares({
  routes: [
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
