'use client'

import { useState } from 'react'
import { Stage, DROPPED_REASONS } from '@/types'

const STAGE_TEMPLATES: Record<Stage, readonly string[]> = {
  New: [],
  Contacted: [
    'Gọi không nhấc máy',
    'Thuê bao / Sai số',
    'Khách đang bận, hẹn gọi lại',
  ],
  Consulting: [
    'Đã tư vấn lộ trình học',
    'Khách quan tâm học phí',
    'Khách đang cân nhắc thêm',
    'Đã gửi email/Zalo tài liệu',
  ],
  Trial: [
    'Khách đồng ý học thử',
    'Đã gửi link Zoom học thử',
    'Khách không tham gia học thử',
  ],
  Enrolled: [
    'Đã hoàn tất học phí',
    'Đã đóng cọc giữ chỗ',
  ],
  Dropped: DROPPED_REASONS,
}

interface StageTransitionModalProps {
  newStage: Stage
  onConfirm: (reason: string | null) => void
  onCancel: () => void
}

export function StageTransitionModal({ newStage, onConfirm, onCancel }: StageTransitionModalProps) {
  const [note, setNote] = useState('')
  const isDropped = newStage === 'Dropped'
  const templates = STAGE_TEMPLATES[newStage] || []

  const handleConfirm = () => {
    if (isDropped && !note.trim()) {
      alert('Vui lòng chọn hoặc nhập lý do thất bại!')
      return
    }
    onConfirm(note.trim() || null)
  }

  const handleTemplateClick = (t: string) => {
    // Nếu là Dropped, ghi đè luôn. Nếu trạng thái khác, cộng dồn nội dung nếu có nhiều ý.
    if (isDropped) {
      setNote(t)
    } else {
      setNote(prev => prev ? `${prev}\n- ${t}` : `- ${t}`)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#111827] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-lg font-bold text-white mb-2">
          Cập nhật trạng thái thành <span className="text-blue-400">{newStage}</span>
        </h2>
        {isDropped && (
          <p className="text-xs text-red-400 mb-4">* Bắt buộc nhập lý do thất bại</p>
        )}
        {!isDropped && (
          <p className="text-xs text-slate-400 mb-4">Ghi chú nhanh để lưu vào lịch sử hoạt động</p>
        )}

        {templates.length > 0 && (
          <div className="mb-4">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
              Gợi ý chọn nhanh
            </label>
            <div className="flex flex-wrap gap-2">
              {templates.map((t) => (
                <button
                  key={t}
                  onClick={() => handleTemplateClick(t)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-300 hover:bg-blue-500/20 hover:border-blue-500/30 hover:text-white transition-all text-left"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mb-6">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
            Hoặc tự nhập ghi chú
          </label>
          <textarea
            className="w-full bg-[#0a0c10] border border-white/10 rounded-xl p-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors resize-none"
            rows={3}
            placeholder={isDropped ? "Nhập lý do chi tiết..." : "Ví dụ: Khách hẹn gọi lại vào 8h tối thứ 6..."}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm font-semibold text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleConfirm}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all ${
              isDropped && !note.trim()
                ? 'bg-blue-500/50 cursor-not-allowed opacity-50'
                : 'bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/20'
            }`}
          >
            Xác nhận & Lưu
          </button>
        </div>
      </div>
    </div>
  )
}
