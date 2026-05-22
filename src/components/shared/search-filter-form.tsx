'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Search } from 'lucide-react'

export interface FilterOption {
  paramKey: string
  title: string // Title above the dropdown/input
  type?: 'select' | 'text' // Defaults to 'select'
  label?: string // Default option label (e.g., "All Stages") for select
  options?: { label: string; value: string }[] // For select
  placeholder?: string // For text
}

interface SearchFilterFormProps {
  searchTitle: string
  searchPlaceholder: string
  filters: FilterOption[]
}

export function SearchFilterForm({ searchTitle, searchPlaceholder, filters }: SearchFilterFormProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [filterValues, setFilterValues] = useState<Record<string, string>>(() => {
    const vals: Record<string, string> = {}
    filters.forEach((f) => {
      vals[f.paramKey] = searchParams.get(f.paramKey) || ''
    })
    return vals
  })

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams)

    if (query) params.set('q', query)
    else params.delete('q')

    Object.entries(filterValues).forEach(([key, val]) => {
      if (val) params.set(key, val)
      else params.delete(key)
    })

    params.delete('page') // Reset page on new search
    
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleClear = () => {
    setQuery('')
    const emptyVals: Record<string, string> = {}
    filters.forEach(f => {
      emptyVals[f.paramKey] = ''
    })
    setFilterValues(emptyVals)
    router.push(pathname)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4 w-full">
      {/* Search Input */}
      <div className="flex-1 min-w-[200px] max-w-sm">
        <label className="block text-xs font-medium text-slate-400 mb-1.5">{searchTitle}</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full rounded-lg border border-slate-700 bg-[#0f1219] py-2 pl-10 pr-3 text-sm text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
            placeholder={searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Filters */}
      {filters.map((filter) => (
        <div key={filter.paramKey} className="min-w-[140px] flex-1 sm:flex-none">
          <label className="block text-xs font-medium text-slate-400 mb-1.5">{filter.title}</label>
          {filter.type === 'text' ? (
            <input
              type="text"
              value={filterValues[filter.paramKey]}
              onChange={(e) => handleFilterChange(filter.paramKey, e.target.value)}
              className="block w-full rounded-lg border border-slate-700 bg-[#0f1219] py-2 px-3 text-sm text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              placeholder={filter.placeholder}
            />
          ) : (
            <select
              value={filterValues[filter.paramKey]}
              onChange={(e) => handleFilterChange(filter.paramKey, e.target.value)}
              className="block w-full rounded-lg border border-slate-700 bg-[#0f1219] py-2 px-3 text-sm text-slate-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors appearance-none cursor-pointer hover:bg-[#1a1f2e]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 0.5rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em',
                paddingRight: '2.5rem',
              }}
            >
              <option value="">{filter.label}</option>
              {filter.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}
        </div>
      ))}

      {/* Buttons */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleClear}
          className="rounded-lg bg-slate-800 border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-slate-500 transition-colors"
        >
          Xóa
        </button>
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#0a0c10] transition-colors"
        >
          Tìm kiếm
        </button>
      </div>
    </form>
  )
}
