'use client'

import { useState } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

export interface PerformanceRow {
  id: string
  name: string
  assigned: number
  contacted: number
  consulting: number
  trial: number
  enrolled: number
  dropped: number
  conversionRate: number
  estimatedRevenue: number
}

interface PerformanceTableProps {
  data: PerformanceRow[]
}

type SortKey = keyof Omit<PerformanceRow, 'id'>

export function PerformanceTable({ data }: PerformanceTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('enrolled')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  if (!data || data.length === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center rounded-xl bg-[#0f1219] border border-dashed border-slate-800 text-sm text-slate-500">
        Không có dữ liệu hiệu suất
      </div>
    )
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortOrder('desc')
    }
  }

  const sortedData = [...data].sort((a, b) => {
    let aVal = a[sortKey]
    let bVal = b[sortKey]

    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase()
      bVal = (bVal as string).toLowerCase()
    }

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
    return 0
  })

  // Compute Totals
  const totalAssigned = data.reduce((sum, r) => sum + r.assigned, 0)
  const totalContacted = data.reduce((sum, r) => sum + r.contacted, 0)
  const totalConsulting = data.reduce((sum, r) => sum + r.consulting, 0)
  const totalTrial = data.reduce((sum, r) => sum + r.trial, 0)
  const totalEnrolled = data.reduce((sum, r) => sum + r.enrolled, 0)
  const totalDropped = data.reduce((sum, r) => sum + r.dropped, 0)
  const totalRevenue = totalEnrolled * 15000000

  const totalDenom = totalEnrolled + totalDropped
  const avgConversionRate = totalDenom > 0 ? (totalEnrolled / totalDenom) * 100 : 0

  const formatVND = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value)
  }

  const getConvRateColorClass = (rate: number) => {
    if (rate >= 50) return 'text-emerald-400 font-semibold'
    if (rate >= 25) return 'text-amber-400 font-semibold'
    return 'text-red-400 font-semibold'
  }

  const renderSortIcon = (key: SortKey) => {
    if (sortKey !== key) {
      return <ArrowUpDown className="ml-1 h-3.5 w-3.5 opacity-40 group-hover:opacity-80 transition-opacity" />
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="ml-1 h-3.5 w-3.5 text-blue-400" />
    ) : (
      <ArrowDown className="ml-1 h-3.5 w-3.5 text-blue-400" />
    )
  }

  return (
    <div className="h-[220px] overflow-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
      <table className="w-full text-left text-xs border-collapse">
        <thead className="sticky top-0 bg-[#0f1219] z-10">
          <tr className="border-b border-white/[0.04] text-slate-500 font-semibold uppercase tracking-wider">
            <th
              className="py-2.5 px-3 cursor-pointer select-none group"
              onClick={() => handleSort('name')}
            >
              <div className="flex items-center">
                Nhân viên {renderSortIcon('name')}
              </div>
            </th>
            <th
              className="py-2.5 px-2 text-right cursor-pointer select-none group"
              onClick={() => handleSort('assigned')}
            >
              <div className="flex items-center justify-end">
                Giao {renderSortIcon('assigned')}
              </div>
            </th>
            <th
              className="py-2.5 px-2 text-right cursor-pointer select-none group"
              onClick={() => handleSort('contacted')}
            >
              <div className="flex items-center justify-end">
                Contacted {renderSortIcon('contacted')}
              </div>
            </th>
            <th
              className="py-2.5 px-2 text-right cursor-pointer select-none group"
              onClick={() => handleSort('consulting')}
            >
              <div className="flex items-center justify-end">
                Consulting {renderSortIcon('consulting')}
              </div>
            </th>
            <th
              className="py-2.5 px-2 text-right cursor-pointer select-none group"
              onClick={() => handleSort('trial')}
            >
              <div className="flex items-center justify-end">
                Trial {renderSortIcon('trial')}
              </div>
            </th>
            <th
              className="py-2.5 px-2 text-right cursor-pointer select-none group"
              onClick={() => handleSort('enrolled')}
            >
              <div className="flex items-center justify-end">
                Enrolled {renderSortIcon('enrolled')}
              </div>
            </th>
            <th
              className="py-2.5 px-2 text-right cursor-pointer select-none group"
              onClick={() => handleSort('conversionRate')}
            >
              <div className="flex items-center justify-end">
                Tỷ lệ {renderSortIcon('conversionRate')}
              </div>
            </th>
            <th
              className="py-2.5 px-3 text-right cursor-pointer select-none group"
              onClick={() => handleSort('estimatedRevenue')}
            >
              <div className="flex items-center justify-end">
                Doanh thu {renderSortIcon('estimatedRevenue')}
              </div>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.02] text-slate-300">
          {sortedData.map((row) => (
            <tr
              key={row.id}
              className="hover:bg-white/[0.02] transition-colors"
            >
              <td className="py-2 px-3 text-white font-medium truncate max-w-[110px]">
                {row.name}
              </td>
              <td className="py-2 px-2 text-right font-semibold font-syne">{row.assigned}</td>
              <td className="py-2 px-2 text-right font-syne">{row.contacted}</td>
              <td className="py-2 px-2 text-right font-syne">{row.consulting}</td>
              <td className="py-2 px-2 text-right font-syne">{row.trial}</td>
              <td className="py-2 px-2 text-right text-emerald-400 font-semibold font-syne">
                {row.enrolled}
              </td>
              <td className={`py-2 px-2 text-right ${getConvRateColorClass(row.conversionRate)}`}>
                {row.conversionRate.toFixed(1)}%
              </td>
              <td className="py-2 px-3 text-right font-semibold text-amber-400 font-syne">
                {formatVND(row.estimatedRevenue)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="sticky bottom-0 bg-[#0f1219] border-t-2 border-white/[0.06] font-bold text-white">
          <tr>
            <td className="py-2 px-3">TỔNG CỘNG</td>
            <td className="py-2 px-2 text-right font-syne">{totalAssigned}</td>
            <td className="py-2 px-2 text-right font-syne">{totalContacted}</td>
            <td className="py-2 px-2 text-right font-syne">{totalConsulting}</td>
            <td className="py-2 px-2 text-right font-syne">{totalTrial}</td>
            <td className="py-2 px-2 text-right text-emerald-400 font-syne">{totalEnrolled}</td>
            <td className={`py-2 px-2 text-right ${getConvRateColorClass(avgConversionRate)}`}>
              {avgConversionRate.toFixed(1)}%
            </td>
            <td className="py-2 px-3 text-right text-amber-400 font-syne">
              {formatVND(totalRevenue)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
