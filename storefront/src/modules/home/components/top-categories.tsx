import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"

export default function TopCategories({ 
  locale, 
  collections 
}: { 
  locale: string
  collections: HttpTypes.StoreCollection[] 
}) {
  // Map some common handles to specific icons if possible, otherwise use a default
  const getIconForCollection = (handle: string) => {
    if (handle.includes("drill")) {
      return (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21 7-3-3"/><path d="m11 13 8-8"/><path d="m10 16 7-7"/><path d="M8 20c-4.4 0-6-1.6-6-6s1.6-6 6-6 6 1.6 6 6-1.6 6-6 6Z"/><path d="M12 14c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2Z"/></svg>
      )
    }
    if (handle.includes("bolgarki") || handle.includes("grinder")) {
      return (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/></svg>
      )
    }
    if (handle.includes("svarka") || handle.includes("weld")) {
      return (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>
      )
    }
    if (handle.includes("sad") || handle.includes("garden")) {
      return (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8a7 7 0 0 1-10 10Z"/><path d="M19 21c-3 0-5.6-2.4-5.6-5.4"/><path d="M5 21v-3.9a4.24 4.24 0 0 1 1.5-3.2l2.3-1.9"/></svg>
      )
    }
    // Default tool-like icon
    return (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 5 4 4"/><path d="M19 9 12 16l-4-4 7-7Z"/><path d="m2 11 7 7"/><path d="m9 18 5 5 5-5-5-5Z"/><path d="M18 5.74V2h3.74"/></svg>
    )
  }

  // Only show first 6 collections if there are many
  const displayCollections = collections.slice(0, 6)

  return (
    <div className="bg-white py-10 sm:py-16 border-b border-gray-100">
      <div className="content-container">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
          {displayCollections.map((collection) => (
            <LocalizedClientLink
              key={collection.id}
              href={`/collections/${collection.handle}`}
              className="group flex flex-col items-center p-6 sm:p-8 bg-gray-50/50 rounded-3xl hover:bg-white hover:shadow-xl hover:shadow-black/5 hover:border-red-100 border border-transparent transition-all duration-500 ease-out"
            >
              <div className="text-red-500 mb-5 group-hover:scale-110 group-hover:-translate-y-1 transition-transform duration-500 ease-out">
                {getIconForCollection(collection.handle)}
              </div>
              <span className="text-sm sm:text-base font-bold text-center text-gray-900 group-hover:text-red-600 transition-colors duration-300 leading-tight">
                {collection.title}
              </span>
            </LocalizedClientLink>
          ))}
        </div>
      </div>
    </div>
  )
}
