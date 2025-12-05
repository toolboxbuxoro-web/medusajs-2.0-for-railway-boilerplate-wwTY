const isEmpty = (val) => val == null || val === "";

const convertToLocale = ({
    amount,
    currency_code,
    minimumFractionDigits,
    maximumFractionDigits,
    locale = "en-US",
}) => {
    if (currency_code && !isEmpty(currency_code)) {
        const formatter = new Intl.NumberFormat(locale, {
            style: "currency",
            currency: currency_code,
        })

        // Get the default fraction digits for the currency to convert cents to units
        // Medusa stores amounts in the smallest currency unit (e.g., cents)
        const { maximumFractionDigits: defaultFractionDigits } =
            formatter.resolvedOptions()

        const value = amount / Math.pow(10, defaultFractionDigits || 0)

        return new Intl.NumberFormat(locale, {
            style: "currency",
            currency: currency_code,
            minimumFractionDigits,
            maximumFractionDigits,
        }).format(value)
    }

    return amount.toString()
}

console.log("UZS 6,000,000 cents ->", convertToLocale({ amount: 6000000, currency_code: "UZS" }));
console.log("USD 1,000 cents ->", convertToLocale({ amount: 1000, currency_code: "USD" }));
console.log("JPY 1,000 units (0 decimals) ->", convertToLocale({ amount: 1000, currency_code: "JPY" }));
