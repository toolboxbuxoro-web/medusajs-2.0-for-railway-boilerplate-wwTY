"use client"

import repeat from "@lib/util/repeat"
import { HttpTypes } from "@medusajs/types"
import { Heading } from "@medusajs/ui"
import { useTranslations } from "next-intl"

import Item from "@modules/cart/components/item"
import SkeletonLineItem from "@modules/skeletons/components/skeleton-line-item"
import ItemCard from "./item-card"

type ItemsTemplateProps = {
  items?: HttpTypes.StoreCartLineItem[]
  selectedItemIds: string[]
  toggleItem: (id: string) => void
  toggleAll: () => void
  handleDeleteSelected: () => void
  isProcessing: boolean
  currencyCode?: string
}

const ItemsTemplate = ({ 
  items, 
  selectedItemIds, 
  toggleItem, 
  toggleAll, 
  handleDeleteSelected,
  isProcessing,
  currencyCode
}: ItemsTemplateProps) => {
  const t = useTranslations("cart")
  const cartId = Math.random().toString(36).substr(2, 9).toUpperCase()
  const itemCount = items?.length || 0
  const allSelected = items && items.length > 0 && selectedItemIds.length === items.length

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <Heading className="text-xl sm:text-2xl font-bold">
            {t("cart_title")} ({itemCount})
          </Heading>
          {items && items.length > 0 && (
            <div className="text-xs sm:text-sm text-gray-500">{t("cart_id")}: {cartId}</div>
          )}
        </div>
      </div>
      
      {/* Quick Add - Hidden on small mobile */}
      <div className="hidden sm:block p-4 sm:p-6 border-b border-gray-200">
        <input
          type="text"
          placeholder={t("quick_add_placeholder")}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
        />
      </div>

      {/* Selection Controls */}
      <div className="px-4 sm:px-6 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500" 
              checked={allSelected}
              onChange={toggleAll}
            />
            <span className="text-xs sm:text-sm font-semibold">{t("select_all")}</span>
          </label>
          <button 
            onClick={handleDeleteSelected}
            disabled={isProcessing || selectedItemIds.length === 0}
            className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-600 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span className="hidden sm:inline">{t("delete_selected")}</span>
            <span className="sm:hidden">{t("delete")}</span>
          </button>
        </div>
      </div>

      {/* Items List */}
      <div className="divide-y divide-gray-200">
        {items
          ? items
              .sort((a, b) => {
                return (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
              })
              .map((item) => {
                return (
                  <ItemCard 
                    key={item.id} 
                    item={item} 
                    selected={selectedItemIds.includes(item.id)}
                    onSelect={() => toggleItem(item.id)}
                    currencyCode={currencyCode}
                  />
                )
              })
          : repeat(3).map((i) => {
              return (
                <div key={i} className="p-4 sm:p-6">
                  <SkeletonLineItem />
                </div>
              )
            })}
      </div>

      {/* Empty State */}
      {items && items.length === 0 && (
        <div className="p-8 sm:p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">{t("empty_cart")}</p>
        </div>
      )}
    </div>
  )
}

export default ItemsTemplate
