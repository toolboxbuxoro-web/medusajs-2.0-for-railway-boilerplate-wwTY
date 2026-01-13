"use client"

import { useRouter } from "next/navigation"
import { MagnifyingGlassMini } from "@medusajs/icons"

import { SEARCH_INDEX_NAME, searchClient } from "@lib/search-client"
import Hit from "@modules/search/components/hit"
import Hits from "@modules/search/components/hits"
import SearchAutocomplete from "@modules/search/components/search-autocomplete"
import { useEffect, useRef, useState } from "react"

export default function SearchModal() {
  const router = useRouter()
  const searchRef = useRef(null)
  const [query, setQuery] = useState("")

  // close modal on outside click
  const handleOutsideClick = (event: MouseEvent) => {
    if (event.target === searchRef.current) {
      router.back()
    }
  }

  useEffect(() => {
    window.addEventListener("click", handleOutsideClick)
    // cleanup
    return () => {
      window.removeEventListener("click", handleOutsideClick)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // disable scroll on body when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [])

  // on escape key press, close modal
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        router.back()
      }
    }
    window.addEventListener("keydown", handleEsc)

    // cleanup
    return () => {
      window.removeEventListener("keydown", handleEsc)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="relative z-[75]">
      <div className="fixed inset-0 bg-opacity-75 backdrop-blur-md opacity-100 h-screen w-screen" />
      <div className="fixed inset-0 px-5 sm:p-0" ref={searchRef}>
        <div className="flex flex-col justify-start w-full h-fit transform p-5 items-center text-left align-middle transition-all max-h-[75vh] bg-transparent shadow-none">
          <div
            className="flex absolute flex-col h-fit w-full sm:w-[600px]"
            data-testid="search-modal-container"
          >
            <div className="w-full flex items-center gap-x-2 p-4 bg-white text-dark shadow-lg rounded-t-lg border-b border-gray-100">
              <MagnifyingGlassMini className="text-gray-400" />
              <input
                autoFocus
                type="search"
                placeholder="Поиск инструментов, товаров..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && query) {
                    router.push(`/search?q=${encodeURIComponent(query)}`)
                  }
                }}
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium"
              />
            </div>
            
            <SearchAutocomplete 
              query={query} 
              onClose={() => router.back()} 
            />
          </div>
        </div>
      </div>
    </div>
  )
}
