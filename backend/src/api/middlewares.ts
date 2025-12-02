import { defineMiddlewares } from "@medusajs/medusa"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/payme",
      method: "POST",
      middlewares: [],
      authenticate: false,
    },
  ],
})
