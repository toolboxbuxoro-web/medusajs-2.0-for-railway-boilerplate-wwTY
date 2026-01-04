"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useState } from "react"
import { useTranslations } from 'next-intl'

import SortProducts, { SortOptions } from "./sort-products"

type RefinementListProps = {
  sortBy: SortOptions
  search?: boolean
  'data-testid'?: string
}

const RefinementList = ({ sortBy, 'data-testid': dataTestId }: RefinementListProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)
  const t = useTranslations('store')

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      params.set(name, value)

      return params.toString()
    },
    [searchParams]
  )

  const setQueryParams = (name: string, value: string) => {
    const query = createQueryString(name, value)
    router.push(`${pathname}?${query}`)
  }

  return (
    <>
      {/* Mobile: Filter Button + Dropdown */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between gap-3 p-3 bg-white rounded-lg border border-gray-200">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 text-sm font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {t('filters_sort')}
          </button>
          <div className="flex-1">
            <SortProducts 
              sortBy={sortBy} 
              setQueryParams={setQueryParams} 
              data-testid={dataTestId}
              compact 
            />
          </div>
        </div>
      </div>

      {/* Desktop: Sidebar */}
      <div className="hidden lg:block bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-4">{t('filters')}</h3>
        <SortProducts 
          sortBy={sortBy} 
          setQueryParams={setQueryParams} 
          data-testid={dataTestId} 
        />
      </div>
    </>
  )
}

export default RefinementList
