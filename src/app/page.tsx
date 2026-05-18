import type { CSSProperties, ReactNode } from 'react'
import Link from 'next/link'
import { Users, LayoutGrid, LineChart } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 60

function formatThousands(n: number): string {
  return n.toLocaleString('en-US')
}

import { applyLeadFilter } from '@/lib/data-filters'
import { UserProfile } from '@/types'

async function fetchLandingStats(profile: UserProfile | null) {
  const supabase = await createClient()

  const enrolledQuery = supabase.from('leads').select('*', { count: 'exact', head: true }).eq('stage', 'Enrolled')
  const droppedQuery = supabase.from('leads').select('*', { count: 'exact', head: true }).eq('stage', 'Dropped')
  const leadsQuery = supabase.from('leads').select('*', { count: 'exact', head: true })
  
  // Note: interactions are harder to filter precisely without lead join, 
  // but let's keep it simple for now or skip filtering interactions count if too complex.
  const interactionsQuery = supabase.from('interactions').select('*', { count: 'exact', head: true })

  const [enrolledRes, droppedRes, interactionsRes, leadsRes] = await Promise.all([
    applyLeadFilter(enrolledQuery, profile),
    applyLeadFilter(droppedQuery, profile),
    interactionsQuery,
    applyLeadFilter(leadsQuery, profile),
  ])

  const enrolled = enrolledRes.count ?? 0
  const dropped = droppedRes.count ?? 0
  const denom = enrolled + dropped
  const winRate = denom === 0 ? 0 : (enrolled / denom) * 100

  return {
    winRate,
    interactionCount: interactionsRes.count ?? 0,
    leadCount: leadsRes.count ?? 0,
  }
}

const gridPatternStyle: CSSProperties = {
  backgroundColor: '#0a0c10',
  backgroundImage: `
    linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px)
  `,
  backgroundSize: '40px 40px',
}

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user?.id)
    .single()

  const { winRate, interactionCount, leadCount } = await fetchLandingStats(profile as UserProfile)

  const leadsDisplay = `${formatThousands(leadCount)}+`
  const interactionsDisplay = `${formatThousands(interactionCount)}+`

  return (
    <div className="min-h-screen font-[family-name:var(--font-dm-sans)] text-white">
      {/* NAVBAR */}
      <header
        className="fixed left-0 right-0 top-0 z-50 border-b border-white/[0.06]"
        style={{ background: 'rgba(10,12,16,0.8)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex h-14 items-center justify-between gap-3">
            <Link href="/" className="flex min-w-0 items-center gap-2.5">
              <span
                className="flex h-8 w-8 shrink-0 rounded-md bg-gradient-to-br from-[#3b82f6] to-purple-600 shadow-lg shadow-blue-500/20"
                aria-hidden
              />
              <span className="font-[family-name:var(--font-syne)] text-lg font-bold tracking-tight text-white">
                E17 CRM
              </span>
            </Link>

            <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 md:flex">
              <Link href="/leads" className="text-sm font-medium text-slate-400 transition hover:text-white">
                Leads
              </Link>
              <Link href="/pipeline" className="text-sm font-medium text-slate-400 transition hover:text-white">
                Pipeline
              </Link>
              <Link href="/dashboard" className="text-sm font-medium text-slate-400 transition hover:text-white">
                Dashboard
              </Link>
            </nav>

            <Link
              href="/leads"
              className="shrink-0 rounded-lg bg-[#3b82f6] px-3 py-2 text-xs font-medium text-white transition hover:bg-blue-600 sm:px-4 sm:text-sm"
            >
              Vào hệ thống →
            </Link>
          </div>
          <nav className="-mx-4 flex gap-6 overflow-x-auto border-t border-white/[0.04] px-4 pb-3 pt-2 md:hidden">
            <Link href="/leads" className="whitespace-nowrap text-xs font-medium text-slate-400 hover:text-white">
              Leads
            </Link>
            <Link href="/pipeline" className="whitespace-nowrap text-xs font-medium text-slate-400 hover:text-white">
              Pipeline
            </Link>
            <Link href="/dashboard" className="whitespace-nowrap text-xs font-medium text-slate-400 hover:text-white">
              Dashboard
            </Link>
          </nav>
        </div>
      </header>

      <div
        className="relative overflow-hidden pt-[7rem] md:pt-14"
        style={gridPatternStyle}
      >
        {/* radial glow */}
        <div
          className="pointer-events-none absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full opacity-40 blur-3xl"
          style={{
            background: 'radial-gradient(circle, rgba(59,130,246,0.45) 0%, transparent 70%)',
          }}
          aria-hidden
        />

        {/* HERO */}
        <section className="relative mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-6 sm:pb-28 md:pt-24">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#3b82f6] opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#3b82f6]" />
            </span>
            <span className="text-xs font-medium tracking-wide text-slate-400">
              MCNA · B2C CRM · MVP
            </span>
          </div>

          <h1 className="mt-8 max-w-4xl font-[family-name:var(--font-syne)] text-[2.5rem] font-extrabold leading-[1.1] tracking-tight sm:text-[56px]">
            <span className="text-white">Quản lý</span>
            <br />
            <span className="bg-gradient-to-r from-[#3b82f6] via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Sales Pipeline
            </span>
            <br />
            <span className="text-white">thông minh hơn</span>
          </h1>

          <p className="mt-6 max-w-2xl text-[15px] font-light leading-relaxed text-[#64748b]">
            Theo dõi từng điểm chạm của khách hàng. Tự động tracking conversion rate, sales funnel và
            CAC cho team Data Analyst.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/pipeline"
              className="inline-flex items-center justify-center rounded-lg bg-[#3b82f6] px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-600"
            >
              Xem Pipeline →
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-transparent px-6 py-3 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/[0.04]"
            >
              Xem Dashboard
            </Link>
          </div>
        </section>

        {/* STATS */}
        <section className="relative border-y border-white/[0.06] bg-black/20">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 sm:grid-cols-4 sm:gap-0 sm:px-6 sm:py-12">
            <StatBlock
              value={leadsDisplay}
              label="Leads đang theo dõi"
              showDivider="sm:right"
            />
            <StatBlock
              value={`${winRate.toFixed(1)}%`}
              label="Win Rate hiện tại"
              showDivider="sm:right"
            />
            <StatBlock value="6" label="Stage trong pipeline" showDivider="sm:right" />
            <StatBlock value={interactionsDisplay} label="Interactions ghi nhận" showDivider="none" />
          </div>
        </section>

        {/* FEATURES */}
        <section className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="grid gap-5 md:grid-cols-3">
            <FeatureCard
              iconClass="from-blue-500 to-blue-600"
              icon={<Users className="h-5 w-5 text-white" strokeWidth={1.75} />}
              title="Lead Management"
              description="Tạo, phân loại và theo dõi lead theo nguồn"
            />
            <FeatureCard
              iconClass="from-purple-500 to-violet-600"
              icon={<LayoutGrid className="h-5 w-5 text-white" strokeWidth={1.75} />}
              title="Kanban Pipeline"
              description="Kéo thả lead qua 6 stage, tự động ghi stage_history"
            />
            <FeatureCard
              iconClass="from-emerald-500 to-teal-600"
              icon={<LineChart className="h-5 w-5 text-white" strokeWidth={1.75} />}
              title="Analytics & Export"
              description="Funnel chart, source breakdown và CSV export chuẩn ISO 8601"
            />
          </div>
        </section>
      </div>
    </div>
  )
}

function StatBlock({
  value,
  label,
  showDivider,
}: {
  value: string
  label: string
  showDivider: 'sm:right' | 'none'
}) {
  return (
    <div
      className={`text-center sm:px-6 ${showDivider === 'sm:right' ? 'sm:border-r sm:border-white/[0.06]' : ''}`}
    >
      <p className="font-[family-name:var(--font-syne)] text-2xl font-bold text-white sm:text-3xl">{value}</p>
      <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">{label}</p>
    </div>
  )
}

function FeatureCard({
  iconClass,
  icon,
  title,
  description,
}: {
  iconClass: string
  icon: ReactNode
  title: string
  description: string
}) {
  return (
    <div className="group rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 transition hover:border-white/10 hover:bg-white/[0.05]">
      <div
        className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${iconClass} shadow-lg`}
      >
        {icon}
      </div>
      <h3 className="font-[family-name:var(--font-syne)] text-lg font-bold text-white">{title}</h3>
      <p className="mt-2 text-sm font-normal leading-relaxed text-slate-400">{description}</p>
    </div>
  )
}
