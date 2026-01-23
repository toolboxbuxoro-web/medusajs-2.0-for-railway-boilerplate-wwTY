"use client"

import React from "react"
import { ReviewFilters, SortOption } from "@lib/hooks/use-infinite-reviews"
import FilterChip from "./filter-chip"
import { useTranslations } from "next-intl"
import { ChevronDownMini } from "@medusajs/icons"

interface ReviewsFiltersProps {
  filters: ReviewFilters
  sort: SortOption
  onFiltersChange: (filters: ReviewFilters) => void
  onSortChange: (sort: SortOption) => void
  total: number
}

const ReviewsFilters: React.FC<ReviewsFiltersProps> = ({
  filters,
  sort,
  onFiltersChange,
  onSortChange,
  total,
}) => {
  const t = useTranslations("product")
  const [isSortOpen, setIsSortOpen] = React.useState(false)

  const hasActiveFilters = filters.rating !== undefined || filters.withPhotos === true

  const handleRatingFilter = (rating: number | undefined) => {
    onFiltersChange({ ...filters, rating: rating === filters.rating ? undefined : rating })
  }

  const handlePhotosFilter = () => {
    onFiltersChange({ ...filters, withPhotos: filters.withPhotos ? undefined : true })
  }

  const resetFilters = () => {
    onFiltersChange({})
  }

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "newest", label: t("sort_newest") || "Сначала новые" },
    { value: "oldest", label: t("sort_oldest") || "Сначала старые" },
    { value: "rating_desc", label: t("sort_rating_desc") || "Высокий рейтинг" },
    { value: "rating_asc", label: t("sort_rating_asc") || "Низкий рейтинг" },
  ]

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* Mobile: Horizontal Scroll */}
      <div className="lg:hidden">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">
            {t("filter_by_rating") || "Рейтинг"}:
          </span>
          {[5, 4, 3, 2, 1].map((rating) => (
            <FilterChip
              key={rating}
              active={filters.rating === rating}
              onClick={() => handleRatingFilter(rating)}
              label={`${rating} ★`}
            />
          ))}
          <FilterChip
            active={filters.withPhotos === true}
            onClick={handlePhotosFilter}
            label={t("with_photos") || "С фото"}
          />
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-xs text-red-600 hover:text-red-700 font-medium whitespace-nowrap px-2 py-1"
            >
              {t("reset_filters") || "Сбросить"}
            </button>
          )}
        </div>

        {/* Sort Dropdown Mobile */}
        <div className="relative">
          <button
            onClick={() => setIsSortOpen(!isSortOpen)}
            className="w-full flex items-center justify-between px-3 py-2 border border-gray-200 rounded-xl bg-white text-sm font-medium text-gray-700 hover:border-gray-300 transition-colors"
          >
            <span>
              {t("sort") || "Сортировка"}: {sortOptions.find((o) => o.value === sort)?.label}
            </span>
            <ChevronDownMini
              className={isSortOpen ? "rotate-180 transition-transform" : "transition-transform"}
            />
          </button>
          {isSortOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onSortChange(option.value)
                    setIsSortOpen(false)
                  }}
                  className={`
                    w-full text-left px-4 py-2.5 text-sm transition-colors
                    ${sort === option.value
                      ? "bg-red-50 text-red-600 font-medium"
                      : "text-gray-700 hover:bg-gray-50"}
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Desktop: Vertical Sidebar */}
      <div className="hidden lg:block">
        <div className="bg-gray-50 rounded-2xl p-4 sm:p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 text-sm">
              {t("filters") || "Фильтры"}
            </h3>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-xs text-red-600 hover:text-red-700 font-medium"
              >
                {t("reset") || "Сбросить"}
              </button>
            )}
          </div>

          {/* Rating Filters */}
          <div className="mb-6">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">
              {t("filter_by_rating") || "Рейтинг"}
            </label>
            <div className="flex flex-col gap-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <FilterChip
                  key={rating}
                  active={filters.rating === rating}
                  onClick={() => handleRatingFilter(rating)}
                  label={`${rating} ★`}
                  fullWidth
                />
              ))}
            </div>
          </div>

          {/* Photos Filter */}
          <div className="mb-6">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">
              {t("other_filters") || "Другие"}
            </label>
            <FilterChip
              active={filters.withPhotos === true}
              onClick={handlePhotosFilter}
              label={t("with_photos") || "Только с фото"}
              fullWidth
            />
          </div>

          {/* Sort */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">
              {t("sort") || "Сортировка"}
            </label>
            <div className="space-y-1">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onSortChange(option.value)}
                  className={`
                    w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
                    ${sort === option.value
                      ? "bg-red-50 text-red-600 font-medium border border-red-200"
                      : "text-gray-700 hover:bg-gray-100 border border-transparent"}
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              {total} {total === 1 ? t("review_single") : total < 5 ? t("reviews_few") : t("reviews_many")}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReviewsFilters
