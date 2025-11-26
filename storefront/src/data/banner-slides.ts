export type BannerSlide = {
  id: string
  title: string
  subtitle: string
  description: string
  background: string
  cta: string
  href: string
}

export const bannerSlides: BannerSlide[] = [
  {
    id: "bf",
    title: "🔥 ЧЁРНАЯ ПЯТНИЦА",
    subtitle: "ИНТЕРСКОЛ — Основа вашего успеха",
    description: "Аккумуляторные решения со скидкой до 25%, доставка по Узбекистану за 1–2 дня.",
    background: "linear-gradient(135deg, #fef3f3 0%, #fee2e2 60%, #fb7185 100%)",
    cta: "Купить сейчас",
    href: "/store",
  },
  {
    id: "pro",
    title: "Toolbox PRO",
    subtitle: "Профессиональные наборы",
    description: "Сделайте проект быстрее: продуманные наборы с гарантией и сервисной поддержкой.",
    background: "linear-gradient(135deg, #ecfeff 0%, #bae6fd 50%, #0ea5e9 100%)",
    cta: "Показать подборку",
    href: "/collections/pro",
  },
  {
    id: "delivery",
    title: "Быстрая доставка",
    subtitle: "Минск → Ташкент",
    description: "Отгружаем в тот же день, оплачиваем при получении, отслеживаем каждый заказ.",
    background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 60%, #9ca3af 100%)",
    cta: "Условия доставки",
    href: "/delivery",
  },
]

