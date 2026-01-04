module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
        "./app/**/*.{js,jsx,ts,tsx}"
    ],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#DC2626', // Toolbox Red
                    dark: '#B91C1C',
                },
                dark: {
                    DEFAULT: '#111827', // Graphite Black
                    light: '#1F2937', // Charcoal
                    lighter: '#374151',
                },
                gray: {
                    50: '#F9FAFB',
                    100: '#F3F4F6',
                    200: '#E5E7EB',
                    300: '#D1D5DB',
                    400: '#9CA3AF',
                    500: '#6B7280',
                    800: '#1F2937',
                    900: '#111827',
                }
            },
            borderRadius: {
                'sm': '2px',
                'md': '4px',
                'lg': '8px',
                'xl': '12px',
                '2xl': '16px',
            }
        },
    },
    plugins: [],
}
