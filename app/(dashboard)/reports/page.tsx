'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Filter, ChevronDown, ChevronUp, ExternalLink, AlertCircle, CheckCircle, Lightbulb, Calendar, Search } from 'lucide-react'
import { formatDate, RECORD_TYPE_LABELS, RECORD_TYPE_COLORS } from '@/lib/utils'

const FILTERS = ['ALL', 'BLOOD_REPORT', 'PRESCRIPTION', 'XRAY', 'MRI', 'ECG', 'OTHER']

export default function ReportsPage() {
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const res = await axios.get('/api/reports')
        setRecords(res.data.records || [])
      } catch { } finally { setLoading(false) }
    }
    fetchRecords()
  }, [])

  const filtered = records.filter((r) => {
    const matchType = filter === 'ALL' || r.type === filter
    const matchSearch = !search || r.title.toLowerCase().includes(search.toLowerCase())
    return matchType && matchSearch
  })

  if (loading) return (
    <div className="p-6 space-y-4">
      <div className="skeleton h-8 w-48 rounded-lg" />
      {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
    </div>
  )

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Medical Timeline</h1>
        <p className="text-slate-400 text-sm mt-1">{records.length} reports in your health history</p>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search reports..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-cyan-500"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === f ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
              }`}
              style={filter !== f ? { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' } : {}}>
              {f === 'ALL' ? 'All' : RECORD_TYPE_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      {filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <FileText size={24} className="text-slate-600" />
          </div>
          <p className="text-slate-400">No reports found</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 md:left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-500/50 via-blue-500/30 to-transparent" />
          <div className="space-y-4 pl-10 md:pl-12">
            {filtered.map((record: any, idx: number) => (
              <motion.div key={record.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }} className="relative">
                {/* Timeline dot */}
                <div className="absolute -left-7 md:-left-8 top-4 w-3 h-3 rounded-full border-2 flex-shrink-0"
                     style={{ borderColor: '#0ea5e9', background: '#060b14', boxShadow: '0 0 8px rgba(14,165,233,0.5)' }} />

                <div className="glass-card overflow-hidden">
                  {/* Header */}
                  <button onClick={() => setExpanded(expanded === record.id ? null : record.id)}
                    className="w-full p-4 text-left flex items-start gap-3 hover:bg-white/2 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0">
                      <FileText size={16} className="text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-white truncate">{record.title}</h3>
                        <span className={`text-xs px-1.5 py-0.5 rounded-md border ${RECORD_TYPE_COLORS[record.type]}`}>
                          {RECORD_TYPE_LABELS[record.type]}
                        </span>
                        {record.isAnalyzed && <CheckCircle size={13} className="text-emerald-400" />}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar size={11} className="text-slate-500" />
                        <p className="text-xs text-slate-500">{formatDate(record.reportDate)}</p>
                      </div>
                      {record.aiSummary && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{record.aiSummary}</p>
                      )}
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-2 ml-2">
                      {record.abnormalFindings?.length > 0 && (
                        <span className="flex items-center gap-1 text-xs text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                          <AlertCircle size={10} /> {record.abnormalFindings.length}
                        </span>
                      )}
                      {expanded === record.id ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
                    </div>
                  </button>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {expanded === record.id && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                        className="overflow-hidden border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                        <div className="p-4 space-y-4">
                          {!record.isAnalyzed && (
                            <p className="text-sm text-slate-500 italic">This report hasn't been analyzed yet. Go to Upload page to re-analyze.</p>
                          )}

                          {record.aiSummary && (
                            <div>
                              <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2">AI Summary</h4>
                              <p className="text-sm text-slate-300 leading-relaxed">{record.aiSummary}</p>
                            </div>
                          )}

                          {record.abnormalFindings?.length > 0 && (
                            <div>
                              <h4 className="text-xs font-semibold text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                <AlertCircle size={11} /> Abnormal Findings
                              </h4>
                              <ul className="space-y-1">
                                {record.abnormalFindings.map((f: string, i: number) => (
                                  <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 flex-shrink-0" />{f}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {record.suggestions?.length > 0 && (
                            <div>
                              <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                <Lightbulb size={11} /> Suggestions
                              </h4>
                              <ul className="space-y-1">
                                {record.suggestions.map((s: string, i: number) => (
                                  <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                                    <CheckCircle size={12} className="text-emerald-400 mt-0.5 flex-shrink-0" />{s}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <a href={record.fileUrl} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                            <ExternalLink size={12} /> View Original File
                          </a>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
