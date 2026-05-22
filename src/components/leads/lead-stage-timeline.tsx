import { Lead, StageHistory } from '@/types'
import { Check, X } from 'lucide-react'

interface LeadStageTimelineProps {
  lead: Pick<Lead, 'stage' | 'created_at' | 'updated_at'>
  history: StageHistory[]
}

const STAGES = ['New', 'Contacted', 'Consulting', 'Trial', 'End']

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  }).format(new Date(dateString))
}

export function LeadStageTimeline({ lead, history }: LeadStageTimelineProps) {
  // Xác định index hiện tại
  let currentIndex = STAGES.indexOf(lead.stage)
  if (lead.stage === 'Enrolled' || lead.stage === 'Dropped') {
    currentIndex = 4
  }

  // Lấy record tương ứng với từng bước
  const getStageRecord = (stageName: string, isEnd: boolean = false) => {
    if (stageName === 'New') return null

    // Đảo ngược mảng history để luôn lấy lần cập nhật mới nhất (nếu có lặp lại trạng thái)
    const reversedHistory = [...history].reverse()

    if (isEnd) {
      return reversedHistory.find(h => h.new_stage === 'Enrolled' || h.new_stage === 'Dropped')
    }

    return reversedHistory.find(h => h.new_stage === stageName)
  }

  return (
    <div className="w-full py-4 overflow-x-auto custom-scrollbar">
      <div className="min-w-[600px] flex items-start justify-between relative px-4">
        
        {/* Đường nối background (xám) */}
        <div className="absolute top-5 left-10 right-10 h-0.5 bg-slate-800 z-0"></div>
        
        {/* Đường nối fill (xanh) */}
        <div 
          className="absolute top-5 left-10 h-0.5 bg-blue-500 z-0 transition-all duration-500 ease-in-out"
          style={{ width: `calc(${(currentIndex / (STAGES.length - 1)) * 100}% - 40px)` }}
        ></div>

        {STAGES.map((stage, idx) => {
          const isCompleted = idx <= currentIndex
          const isCurrent = idx === currentIndex
          const isEndNode = idx === 4
          
          let nodeLabel = stage
          let nodeColor = isCompleted ? 'bg-blue-500' : 'bg-slate-700'
          let icon = null

          if (isEndNode) {
            if (isCompleted) {
              if (lead.stage === 'Enrolled') {
                nodeLabel = 'Enrolled'
                nodeColor = 'bg-green-500'
                icon = <Check className="w-4 h-4 text-white" />
              } else if (lead.stage === 'Dropped') {
                nodeLabel = 'Dropped'
                nodeColor = 'bg-red-500'
                icon = <X className="w-4 h-4 text-white" />
              }
            } else {
              nodeLabel = 'Won / Lost'
            }
          }

          let record = getStageRecord(stage, isEndNode)

          // Nếu bước này đã hoàn thành nhưng không có record (do nhảy cóc), 
          // tìm record của bước tiếp theo đã hoàn thành để kế thừa thời gian
          if (isCompleted && !record && stage !== 'New') {
            for (let nextIdx = idx + 1; nextIdx <= currentIndex; nextIdx++) {
              const nextStage = STAGES[nextIdx]
              const nextIsEnd = nextIdx === 4
              const nextRecord = getStageRecord(nextStage, nextIsEnd)
              if (nextRecord) {
                record = nextRecord
                break
              }
            }
          }

          const stageDate = stage === 'New' 
            ? lead.created_at 
            : (record?.changed_at || (isCompleted ? lead.updated_at : undefined))
            
          const changerName = null // Removed user_profiles join constraint

          return (
            <div key={stage} className="relative z-10 flex flex-col items-center group w-24">
              {/* Nút tròn */}
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-[#0f1219] transition-colors duration-300 ${nodeColor}`}
                style={{ 
                  boxShadow: isCurrent ? `0 0 0 2px ${nodeColor.replace('bg-', 'var(--tw-colors-')})` : 'none' 
                }}
              >
                {icon ? icon : (
                  <span className={`text-sm font-bold ${isCompleted ? 'text-white' : 'text-slate-400'}`}>
                    {idx + 1}
                  </span>
                )}
              </div>

              {/* Tên Stage */}
              <div className="mt-3 text-center">
                <p className={`text-[13px] font-semibold tracking-wide ${isCompleted ? 'text-white' : 'text-slate-500'}`}>
                  {nodeLabel}
                </p>
                
                {/* Thời gian */}
                <div className="mt-1 min-h-[16px] flex flex-col items-center">
                  {isCompleted && stageDate ? (
                    <>
                      <p className="text-[11px] text-slate-400 whitespace-nowrap">
                        {formatDate(stageDate)}
                      </p>
                      {changerName && (
                        <p className="text-[10px] text-slate-500 whitespace-nowrap mt-0.5">
                          bởi {changerName.split(' ').pop()}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-[11px] text-slate-600">—</p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
