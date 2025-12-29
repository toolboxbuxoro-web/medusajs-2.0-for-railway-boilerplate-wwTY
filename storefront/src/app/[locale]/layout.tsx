import "styles/globals.css"
import { NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';
import { locales, type Locale } from '../../i18n';
import { FavoritesProvider } from "@lib/context/favorites-context"


import { Metadata } from 'next';

export const metadata: Metadata = {
  icons: {
    icon: [
      { url: '/favicon-16x16.png?v=4', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png?v=4', sizes: '32x32', type: 'image/png' },
      { url: '/toolbox-icon.ico?v=4', sizes: 'any' },
    ],
    apple: '/icon.png?v=4',
  },
}

export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  // Validate locale
  if (!locales.includes(locale as Locale)) {
    notFound();
  }
  
  // Load messages for the locale
  let messages;
  try {
    messages = (await import(`../../../messages/${locale}.json`)).default;
  } catch (error) {
    notFound();
  }
  
  return (
    <html lang={locale} data-mode="light" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <FavoritesProvider>
            <main className="relative">{children}</main>
          </FavoritesProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
