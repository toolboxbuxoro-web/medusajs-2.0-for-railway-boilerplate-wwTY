import React from "react"

import Footer from "@modules/layout/templates/footer"
import Nav from "@modules/layout/templates/nav"

const Layout: React.FC<{
  children: React.ReactNode
  locale: string
}> = ({ children, locale }) => {
  return (
    <div>
      <Nav locale={locale} />
      <main className="relative">{children}</main>
      <Footer />
    </div>
  )
}

export default Layout
