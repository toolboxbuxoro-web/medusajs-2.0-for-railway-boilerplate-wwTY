import "styles/globals.css"
import { NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';
import { locales, type Locale } from '../../i18n';
import { FavoritesProvider } from "@lib/context/favorites-context"

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
    <html lang={locale} data-mode="light">
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <FavoritesProvider>
            <main className="relative">{children}</main>
          </FavoritesProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
