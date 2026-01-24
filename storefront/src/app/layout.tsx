/**
 * Root Layout for Next.js App Router
 * 
 * IMPORTANT: This layout does NOT have params, so generateStaticParams() 
 * should NOT be here. It belongs in [locale]/layout.tsx instead.
 * 
 * This layout simply passes through children to the locale-specific layout.
 */
export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return children;
}
