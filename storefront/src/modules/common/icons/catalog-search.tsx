import React from "react"
import { IconProps } from "types/icon"

// ============================================
// ВАРИАНТ 1: Текущий стиль (меню слева + лупа справа)
// ============================================
const CatalogIconV1: React.FC<IconProps> = ({
  size = "22",
  color = "currentColor",
  ...attributes
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...attributes}
  >
    {/* Три линии меню слева */}
    <line x1="3" y1="6" x2="10" y2="6" />
    <line x1="3" y1="12" x2="10" y2="12" />
    <line x1="3" y1="18" x2="10" y2="18" />
    {/* Лупа справа */}
    <circle cx="16" cy="11" r="6" />
    <path d="m20 15-2.5-2.5" />
  </svg>
)

// ============================================
// ВАРИАНТ 2: Более компактный (ближе друг к другу)
// ============================================
const CatalogIconV2: React.FC<IconProps> = ({
  size = "22",
  color = "currentColor",
  ...attributes
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...attributes}
  >
    <line x1="3" y1="6" x2="9" y2="6" />
    <line x1="3" y1="12" x2="9" y2="12" />
    <line x1="3" y1="18" x2="9" y2="18" />
    <circle cx="15" cy="11" r="5" />
    <path d="m18.5 14.5-2-2" />
  </svg>
)

// ============================================
// ВАРИАНТ 3: С более толстыми линиями меню
// ============================================
const CatalogIconV3: React.FC<IconProps> = ({
  size = "22",
  color = "currentColor",
  ...attributes
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...attributes}
  >
    <line x1="2" y1="6" x2="11" y2="6" />
    <line x1="2" y1="12" x2="11" y2="12" />
    <line x1="2" y1="18" x2="11" y2="18" />
    <circle cx="17" cy="12" r="5" strokeWidth="2" />
    <path d="m21 16-2.5-2.5" strokeWidth="2" />
  </svg>
)

// ============================================
// ВАРИАНТ 4: С квадратными точками меню (как на фото)
// ============================================
const CatalogIconV4: React.FC<IconProps> = ({
  size = "22",
  color = "currentColor",
  ...attributes
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...attributes}
  >
    {/* Меню слева - три линии разной длины */}
    <line x1="3" y1="6" x2="11" y2="6" />
    <line x1="3" y1="12" x2="9" y2="12" />
    <line x1="3" y1="18" x2="7" y2="18" />
    {/* Лупа справа */}
    <circle cx="16" cy="11" r="6" />
    <path d="m20 15-2.5-2.5" />
  </svg>
)

// ============================================
// ВАРИАНТ 5: С более крупной лупой
// ============================================
const CatalogIconV5: React.FC<IconProps> = ({
  size = "22",
  color = "currentColor",
  ...attributes
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...attributes}
  >
    <line x1="3" y1="6" x2="10" y2="6" />
    <line x1="3" y1="12" x2="10" y2="12" />
    <line x1="3" y1="18" x2="10" y2="18" />
    <circle cx="16.5" cy="11.5" r="6.5" />
    <path d="m21.5 16.5-3-3" />
  </svg>
)

// ============================================
// ВАРИАНТ 6: С закругленными концами линий меню
// ============================================
const CatalogIconV6: React.FC<IconProps> = ({
  size = "22",
  color = "currentColor",
  ...attributes
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...attributes}
  >
    <line x1="3" y1="6" x2="10" y2="6" strokeLinecap="round" />
    <line x1="3" y1="12" x2="10" y2="12" strokeLinecap="round" />
    <line x1="3" y1="18" x2="10" y2="18" strokeLinecap="round" />
    <circle cx="16" cy="11" r="6" />
    <path d="m20 15-2.5-2.5" strokeLinecap="round" />
  </svg>
)

// Экспортируем все варианты
export {
  CatalogIconV1,
  CatalogIconV2,
  CatalogIconV3,
  CatalogIconV4,
  CatalogIconV5,
  CatalogIconV6
}

// Экспортируем по умолчанию вариант 1 (текущий)
export default CatalogIconV1
