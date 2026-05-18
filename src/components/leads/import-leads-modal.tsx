'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { generateUuidV4 } from '@/lib/uuid'
import { SOURCES } from '@/types'
import { useRouter } from 'next/navigation'

const phoneRegex = /^0[0-9]{9}$/
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

async function fetchWithTimeout<T>(promise: PromiseLike<T>, timeoutMs: number = 8000): Promise<T> {
  let timeoutId: NodeJS.Timeout
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Kết nối đến máy chủ quá hạn (Timeout). Vui lòng F5 tải lại trang.')), timeoutMs)
  })
  return Promise.race([Promise.resolve(promise), timeoutPromise]).finally(() => clearTimeout(timeoutId))
}
import { X, Upload, FileType, CheckCircle, AlertCircle, Download, Loader2 } from 'lucide-react'
import Papa from 'papaparse'

interface RawRow {
  Name?: string
  Phone?: string
  Email?: string
  'Course Interest'?: string
  Source?: string
}

interface ValidRow {
  id: string
  name: string
  phone: string
  email: string
  course_interest: string
  source: string
  stage: string
}

interface InvalidRow extends RawRow {
  _error: string
}

interface ProcessedRow {
  rowNum: number
  raw: RawRow
  name: string
  phone: string
  email: string
  course_interest: string
  source: string
  errors: Record<string, string>
  isValid: boolean
}

export function ImportLeadsModal() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<'upload' | 'validating' | 'preview' | 'importing' | 'success'>('upload')
  const [validRows, setValidRows] = useState<ValidRow[]>([])
  const [invalidRows, setInvalidRows] = useState<InvalidRow[]>([])
  const [processedData, setProcessedData] = useState<ProcessedRow[]>([])
  const [previewPage, setPreviewPage] = useState(1)
  const [errorMsg, setErrorMsg] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const resetState = () => {
    setStep('upload')
    setValidRows([])
    setInvalidRows([])
    setProcessedData([])
    setPreviewPage(1)
    setErrorMsg('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleOpen = () => {
    resetState()
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    resetState()
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setErrorMsg('Vui lòng chọn file định dạng .CSV')
      return
    }

    setStep('validating')
    setErrorMsg('')

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rawRows = results.data as RawRow[]
          const phones = Array.from(new Set(rawRows.map(r => r.Phone?.trim()).filter(Boolean))) as string[]
          const emails = Array.from(new Set(rawRows.map(r => r.Email?.trim()).filter(Boolean))) as string[]

          const supabase = createClient()
          
          const existingPhones = new Set<string>()
          const existingEmails = new Set<string>()

          // Check DB for duplicates in chunks to avoid URI Too Long error
          const CHUNK_SIZE = 100

          if (phones.length > 0) {
            const phoneChunks = chunkArray(phones, CHUNK_SIZE)
            for (const chunk of phoneChunks) {
              const { data: pData, error: pErr } = await fetchWithTimeout(
                supabase.from('leads').select('phone').in('phone', chunk)
              )
              if (pErr) throw new Error(pErr.message)
              if (pData) (pData as { phone: string | null }[]).forEach((d) => { if (d.phone) existingPhones.add(d.phone) })
            }
          }
          
          if (emails.length > 0) {
            const emailChunks = chunkArray(emails, CHUNK_SIZE)
            for (const chunk of emailChunks) {
              const { data: eData, error: eErr } = await fetchWithTimeout(
                supabase.from('leads').select('email').in('email', chunk)
              )
              if (eErr) throw new Error(eErr.message)
              if (eData) (eData as { email: string | null }[]).forEach((d) => { if (d.email) existingEmails.add(d.email) })
            }
          }

          const valid: ValidRow[] = []
          const invalid: InvalidRow[] = []
          const allProcessedRows: ProcessedRow[] = []

          rawRows.forEach((row, index) => {
            const name = row.Name?.trim()
            const phone = row.Phone?.trim()
            const email = row.Email?.trim()
            const course = row['Course Interest']?.trim()
            const source = row.Source?.trim()

            const fieldErrors: Record<string, string> = {}

            if (!name) fieldErrors.name = 'Thiếu Tên'
            
            if (!phone) {
               fieldErrors.phone = 'Thiếu SĐT'
            } else if (!phoneRegex.test(phone)) {
               fieldErrors.phone = 'SĐT không hợp lệ'
            } else if (existingPhones.has(phone)) {
               fieldErrors.phone = 'SĐT đã tồn tại'
            }

            if (!email) {
               fieldErrors.email = 'Thiếu Email'
            } else if (!emailRegex.test(email)) {
               fieldErrors.email = 'Email không hợp lệ'
            } else if (existingEmails.has(email)) {
               fieldErrors.email = 'Email đã tồn tại'
            }

            if (!course) fieldErrors.course_interest = 'Thiếu Khóa học'

            if (source && !(SOURCES as readonly string[]).includes(source)) {
               fieldErrors.source = 'Nguồn không hợp lệ'
            }

            const isValid = Object.keys(fieldErrors).length === 0
            
            const processedRow: ProcessedRow = {
               rowNum: index + 1,
               raw: row,
               name: name || '',
               phone: phone || '',
               email: email || '',
               course_interest: course || '',
               source: source || 'Other',
               errors: fieldErrors,
               isValid
            }

            allProcessedRows.push(processedRow)

            if (isValid) {
              valid.push({
                id: generateUuidV4(),
                name: name!,
                phone: phone!,
                email: email!,
                course_interest: course!,
                source: source || 'Other',
                stage: 'New'
              })
            } else {
              invalid.push({
                ...row,
                _error: Object.values(fieldErrors).join(', ')
              })
            }
          })

          if (allProcessedRows.length === 0) {
            setErrorMsg('File trống hoặc không đúng định dạng cột.')
            setStep('upload')
            return
          }

          setValidRows(valid)
          setInvalidRows(invalid)
          setProcessedData(allProcessedRows)
          setStep('preview')
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : String(err)
          setErrorMsg('Lỗi kiểm tra dữ liệu: ' + errorMessage)
          setStep('upload')
        }
      },
      error: (err) => {
        setErrorMsg('Lỗi đọc file: ' + err.message)
        setStep('upload')
      }
    })
  }

  const handleDownloadErrors = () => {
    const exportData = invalidRows.map(({ _error, ...rest }) => ({
      ...rest,
      'Lý do lỗi': _error
    }))
    
    const csv = '\uFEFF' + Papa.unparse(exportData)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'leads_errors.csv'
    link.click()
  }

  const handleImport = async () => {
    if (validRows.length === 0) return
    setStep('importing')

    try {
      const supabase = createClient()
      const { error } = await supabase.from('leads').insert(validRows)
      if (error) throw new Error(error.message)
      
      setStep('success')
      router.refresh()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      setStep('preview')
      setErrorMsg('Lỗi hệ thống: ' + errorMessage)
    }
  }

  const renderCell = (value: string, error?: string) => {
    if (error) {
      return (
        <td className="px-4 py-3 align-top">
          <div className="flex flex-col">
             <span className="text-red-300 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20 w-fit">
                {value || '(Trống)'}
             </span>
             <span className="text-[11px] text-red-500 font-medium mt-1">{error}</span>
          </div>
        </td>
      )
    }
    return <td className="px-4 py-3 align-top text-slate-300">{value}</td>
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 transition-colors"
      >
        ↑ Import Leads
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
          
          <div className="relative w-full max-w-4xl rounded-2xl bg-[#0f1219] p-6 shadow-2xl border border-slate-800 flex flex-col max-h-[90vh]">
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="mb-2 text-xl font-bold text-white shrink-0">Import Leads</h2>
            
            {step === 'upload' && (
              <div className="flex-1 overflow-y-auto">
                <p className="text-sm text-slate-400 mb-6">Tải lên file CSV chứa danh sách khách hàng tiềm năng.</p>
                
                <div className="mb-6 rounded-xl border border-dashed border-slate-700 bg-slate-800/30 p-8 text-center">
                  <div className="mx-auto h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                    <Upload className="h-6 w-6 text-blue-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1">Click để tải file lên</h3>
                  <p className="text-xs text-slate-500 mb-4">Chỉ hỗ trợ định dạng .CSV</p>
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 transition-colors"
                  >
                    Chọn file
                  </button>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="text-slate-400">
                    <span className="text-orange-400 text-xs">Lưu ý:</span> Cột Source nếu để trống sẽ tự động nhận giá trị &quot;Other&quot;.
                  </div>
                  <a
                    href="/leads_template.csv"
                    download
                    className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <FileType className="h-4 w-4" />
                    Tải file mẫu
                  </a>
                </div>

                {errorMsg && (
                  <div className="mt-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-400 flex gap-2 items-center">
                    <AlertCircle className="h-4 w-4" />
                    {errorMsg}
                  </div>
                )}
              </div>
            )}

            {step === 'validating' && (
              <div className="py-20 text-center flex-1">
                <Loader2 className="mx-auto h-10 w-10 animate-spin text-blue-500 mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Đang kiểm tra dữ liệu...</h3>
                <p className="text-slate-400 text-sm">Hệ thống đang quét các số điện thoại và email trùng lặp.</p>
              </div>
            )}

            {step === 'preview' && (
              <div className="flex flex-col flex-1 min-h-0 mt-4">
                <div className="grid grid-cols-2 gap-4 shrink-0">
                  <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4 text-center">
                    <div className="text-2xl font-bold text-green-400">{validRows.length}</div>
                    <div className="text-sm font-medium text-green-500">Dòng hợp lệ</div>
                    <p className="text-xs text-slate-400 mt-1">Sẵn sàng thêm vào hệ thống</p>
                  </div>
                  
                  <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-center relative">
                    <div className="text-2xl font-bold text-red-400">{invalidRows.length}</div>
                    <div className="text-sm font-medium text-red-500">Dòng lỗi</div>
                    <p className="text-xs text-slate-400 mt-1">Trùng lặp hoặc thiếu thông tin</p>
                    
                    {invalidRows.length > 0 && (
                      <button
                        onClick={handleDownloadErrors}
                        className="absolute bottom-2 right-2 text-xs flex items-center gap-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 px-2 py-1 rounded transition-colors"
                      >
                        <Download className="h-3 w-3" /> Tải file lỗi
                      </button>
                    )}
                  </div>
                </div>

                {/* Data Table */}
                <div className="mt-6 flex-1 flex flex-col min-h-0">
                  <div className="flex-1 overflow-auto rounded-xl border border-slate-700 bg-slate-800/30 relative custom-scrollbar min-h-[250px]">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="sticky top-0 bg-[#0f1219] text-xs font-semibold uppercase text-slate-400 shadow z-10">
                        <tr>
                          <th className="px-4 py-3 border-b border-slate-700">#</th>
                          <th className="px-4 py-3 border-b border-slate-700">Name</th>
                          <th className="px-4 py-3 border-b border-slate-700">Phone</th>
                          <th className="px-4 py-3 border-b border-slate-700">Email</th>
                          <th className="px-4 py-3 border-b border-slate-700">Course</th>
                          <th className="px-4 py-3 border-b border-slate-700">Source</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/50">
                        {(() => {
                          const ITEMS_PER_PAGE = 100
                          const paginatedData = processedData.slice((previewPage - 1) * ITEMS_PER_PAGE, previewPage * ITEMS_PER_PAGE)
                          
                          return paginatedData.map((row) => (
                            <tr key={row.rowNum} className={`hover:bg-slate-700/20 transition-colors ${!row.isValid ? 'bg-red-500/5' : ''}`}>
                              <td className="px-4 py-3 text-slate-500 align-top">{row.rowNum}</td>
                              {renderCell(row.name, row.errors.name)}
                              {renderCell(row.phone, row.errors.phone)}
                              {renderCell(row.email, row.errors.email)}
                              {renderCell(row.course_interest, row.errors.course_interest)}
                              <td className="px-4 py-3 align-top">
                                {row.source === 'Other' && !row.raw.Source ? (
                                  <div className="flex flex-col">
                                    <span className="text-orange-400" title="Trống, mặc định là Other">Other</span>
                                    <span className="text-[10px] text-orange-500 mt-1">Mặc định</span>
                                  </div>
                                ) : (
                                  <span className="text-slate-300">{row.source}</span>
                                )}
                              </td>
                            </tr>
                          ))
                        })()}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  {Math.ceil(processedData.length / 100) > 1 && (
                    <div className="flex items-center justify-between mt-4 px-2 shrink-0">
                      <span className="text-xs text-slate-500">
                        Hiển thị {(previewPage - 1) * 100 + 1} - {Math.min(previewPage * 100, processedData.length)} trong tổng số {processedData.length} dòng
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setPreviewPage(p => Math.max(1, p - 1))}
                          disabled={previewPage === 1}
                          className="px-3 py-1.5 rounded-md bg-slate-800 text-slate-300 text-xs font-medium disabled:opacity-50 hover:bg-slate-700 transition-colors"
                        >
                          Trước
                        </button>
                        <span className="px-3 py-1 text-xs text-slate-400">
                          Trang {previewPage} / {Math.ceil(processedData.length / 100)}
                        </span>
                        <button
                          onClick={() => setPreviewPage(p => Math.min(Math.ceil(processedData.length / 100), p + 1))}
                          disabled={previewPage === Math.ceil(processedData.length / 100)}
                          className="px-3 py-1.5 rounded-md bg-slate-800 text-slate-300 text-xs font-medium disabled:opacity-50 hover:bg-slate-700 transition-colors"
                        >
                          Sau
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {errorMsg && (
                  <div className="mt-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-400 flex gap-2 items-center shrink-0">
                    <AlertCircle className="h-4 w-4" />
                    {errorMsg}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-slate-800 shrink-0">
                  <button
                    onClick={resetState}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                  >
                    Hủy & Tải file khác
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={validRows.length === 0}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Import {validRows.length} dòng
                  </button>
                </div>
              </div>
            )}

            {step === 'importing' && (
              <div className="py-20 text-center flex-1">
                <Loader2 className="mx-auto h-10 w-10 animate-spin text-blue-500 mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Đang Import dữ liệu...</h3>
                <p className="text-slate-400 text-sm">Vui lòng không đóng cửa sổ này.</p>
              </div>
            )}

            {step === 'success' && (
              <div className="py-12 text-center flex-1">
                <div className="mx-auto h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mb-6">
                  <CheckCircle className="h-8 w-8 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Import thành công!</h3>
                <p className="text-slate-400 mb-8">Đã thêm {validRows.length} khách hàng mới vào hệ thống.</p>
                <button
                  onClick={handleClose}
                  className="rounded-lg bg-slate-800 px-8 py-2.5 text-sm font-medium text-white hover:bg-slate-700 transition-colors"
                >
                  Hoàn tất
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
