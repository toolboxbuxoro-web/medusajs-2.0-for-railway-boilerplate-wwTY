import { locales, type Locale } from '../i18n';

export function generateStaticParams() {
  return locales.map((locale: Locale) => ({ locale }));
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return children;
}
