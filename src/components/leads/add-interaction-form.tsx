'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function AddInteractionForm({ leadId }: { leadId: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!note.trim()) {
      setError('Vui lòng nhập nội dung ghi chú.')
      return
    }

    setSubmitting(true)
    setError(null)
    const { error: insertError } = await supabase.from('interactions').insert({
      lead_id: leadId,
      note: note.trim(),
    })
    setSubmitting(false)

    if (insertError) {
      setError(insertError.message)
      return
    }

    setNote('')
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={4}
        placeholder="Nhập ghi chú tư vấn..."
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
      />
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {submitting ? 'Đang lưu...' : 'Thêm ghi chú'}
        </button>
      </div>
    </form>
  )
}
