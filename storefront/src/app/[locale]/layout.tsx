import "styles/globals.css"
import { retrieveCart } from "@lib/data/cart"
import { NextIntlClientProvider } from 'next-intl';
import { locales, type Locale, defaultLocale } from '../../i18n';
import { FavoritesProvider } from "@lib/context/favorites-context"
import { AuthProvider } from "@lib/context/auth-context"
import { PickupPointProvider } from "@lib/context/pickup-point-context"
import { CitySearchProvider } from "@lib/context/city-search-context"

import { Metadata } from 'next';

import { getCustomer } from "@lib/data/customer"

export const metadata: Metadata = {
  icons: {
    icon: [
      { url: '/toolbox-icon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
  },
}

export default async function LocaleLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { children } = props;
  const params = await props.params;
  const { locale } = params;
  // Validate locale - use defaultLocale as fallback instead of notFound()
  // This prevents 404 during build-time static generation
  const validLocale = locales.includes(locale as Locale) ? locale : defaultLocale;
  
  // Load messages for the locale - use defaultLocale messages as fallback
  let messages;
  try {
    messages = (await import(`../../../messages/${validLocale}.json`)).default;
  } catch (error) {
    // Fallback to default locale messages instead of calling notFound()
    // This prevents 404 if message files are temporarily unavailable
    try {
      messages = (await import(`../../../messages/${defaultLocale}.json`)).default;
    } catch (fallbackError) {
      // Last resort: return empty messages object
      console.warn(`[LocaleLayout] Failed to load messages for ${validLocale} and ${defaultLocale}. Using empty messages.`);
      messages = {};
    }
  }
  
  const customer = await getCustomer()
  const cart = await retrieveCart() // Fetch cart
  
  return (
    <html lang={validLocale} data-mode="light" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <NextIntlClientProvider locale={validLocale} messages={messages}>
          <AuthProvider initialCustomer={customer}>
            <FavoritesProvider>
              <PickupPointProvider 
                cartId={cart?.id} 
                initialData={(cart?.metadata as any)?.bts_delivery}
              >
                <CitySearchProvider>
                  <main className="relative">{children}</main>
                </CitySearchProvider>
              </PickupPointProvider>
            </FavoritesProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
