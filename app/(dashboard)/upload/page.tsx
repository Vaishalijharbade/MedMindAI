'use client'

import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2, Brain, Sparkles, Image } from 'lucide-react'
import toast from 'react-hot-toast'
import { createWorker } from 'tesseract.js'

const REPORT_TYPES = [
  { value: 'BLOOD_REPORT', label: '🩸 Blood Report' },
  { value: 'PRESCRIPTION', label: '💊 Prescription' },
  { value: 'XRAY', label: '🫁 X-Ray' },
  { value: 'MRI', label: '🧠 MRI Scan' },
  { value: 'ECG', label: '❤️ ECG' },
  { value: 'OTHER', label: '📄 Other' },
]

type Step = 'idle' | 'uploading' | 'ocr' | 'analyzing' | 'done' | 'error'

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [type, setType] = useState('BLOOD_REPORT')
  const [reportDate, setReportDate] = useState('2026-07-25')

  useEffect(() => {
    setReportDate(new Date().toISOString().split('T')[0])
  }, [])
  const [step, setStep] = useState<Step>('idle')
  const [ocrProgress, setOcrProgress] = useState(0)
  const [analysis, setAnalysis] = useState<any>(null)
  const [error, setError] = useState('')

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const f = acceptedFiles[0]
    if (!f) return
    setFile(f)
    if (!title) setTitle(f.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '))
    setStep('idle')
    setAnalysis(null)
    setError('')
  }, [title])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'], 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  })

  const handleAnalyze = async () => {
    if (!file || !title) return toast.error('Please select a file and enter a title')

    try {
      setError('')
      setAnalysis(null)

      // Step 1: Upload to Cloudinary
      setStep('uploading')
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', title)
      formData.append('type', type)
      formData.append('reportDate', reportDate)
      const uploadRes = await axios.post('/api/reports', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const recordId = uploadRes.data.record.id

      // Step 2: OCR
      setStep('ocr')
      let extractedText = ''
      if (file.type === 'application/pdf') {
        // For PDF, try to extract text directly
        extractedText = `[PDF Report - ${title}]\nType: ${type}\nDate: ${reportDate}`
      } else {
        const worker = await createWorker('eng', 1, {
          logger: (m: any) => {
            if (m.status === 'recognizing text') setOcrProgress(Math.round(m.progress * 100))
          }
        })
        const { data: { text } } = await worker.recognize(file)
        await worker.terminate()
        extractedText = text || `[Image Report - ${title}]`
      }

      // Step 3: Gemini AI Analysis
      setStep('analyzing')
      const analysisRes = await axios.post('/api/analyze', { recordId, extractedText })
      setAnalysis(analysisRes.data.analysis)
      setStep('done')
      toast.success('Report analyzed successfully! 🎉')
    } catch (err: any) {
      setStep('error')
      const msg = err.response?.data?.error || err.message || 'Analysis failed'
      setError(msg)
      toast.error(msg)
    }
  }

  const reset = () => {
    setFile(null)
    setTitle('')
    setType('BLOOD_REPORT')
    setReportDate(new Date().toISOString().split('T')[0])
    setStep('idle')
    setAnalysis(null)
    setError('')
    setOcrProgress(0)
  }

  const StepIndicator = ({ current, label, icon: Icon, stepKey }: any) => {
    const isActive = current === stepKey
    const isDone = ['uploading', 'ocr', 'analyzing', 'done'].indexOf(current) >
      ['uploading', 'ocr', 'analyzing', 'done'].indexOf(stepKey)
    return (
      <div className={`flex items-center gap-2 text-sm ${isActive ? 'text-cyan-400' : isDone ? 'text-emerald-400' : 'text-slate-600'}`}>
        {isDone ? <CheckCircle size={16} /> : isActive ? <Loader2 size={16} className="animate-spin" /> : <Icon size={16} />}
        {label}
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Upload Medical Report</h1>
        <p className="text-slate-400 text-sm mt-1">Upload any medical document and get AI-powered insights instantly</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Form */}
        <div className="space-y-4">
          {/* Drop Zone */}
          <div {...getRootProps()} className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${
            isDragActive ? 'border-cyan-400 bg-cyan-400/5' : file ? 'border-emerald-400/50 bg-emerald-400/5' : 'border-slate-700 hover:border-slate-500 hover:bg-white/2'
          }`}>
            <input {...getInputProps()} />
            <AnimatePresence mode="wait">
              {file ? (
                <motion.div key="file" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                    {file.type.startsWith('image/') ? <Image size={24} className="text-emerald-400" /> : <FileText size={24} className="text-emerald-400" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white truncate max-w-48">{file.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setFile(null) }}
                    className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1">
                    <X size={12} /> Remove
                  </button>
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center">
                    <Upload size={24} className="text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-300">{isDragActive ? 'Drop your file here' : 'Drag & drop your report'}</p>
                    <p className="text-xs text-slate-500 mt-1">or click to browse · JPG, PNG, PDF up to 10MB</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Form Fields */}
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block font-medium">Report Title *</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Complete Blood Count - June 2025"
                className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-cyan-500 transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block font-medium">Report Type *</label>
              <select value={type} onChange={(e) => setType(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none focus:ring-1 focus:ring-cyan-500 transition-all appearance-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                {REPORT_TYPES.map((t) => <option key={t.value} value={t.value} style={{ background: '#0f172a' }}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block font-medium">Report Date</label>
              <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none focus:ring-1 focus:ring-cyan-500 transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', colorScheme: 'dark' }} />
            </div>
          </div>

          {/* Progress Steps */}
          {step !== 'idle' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="glass-card p-4 space-y-2">
              <StepIndicator current={step} stepKey="uploading" label="Uploading to secure storage" icon={Upload} />
              <StepIndicator current={step} stepKey="ocr" label={`Extracting text with OCR ${step === 'ocr' ? `(${ocrProgress}%)` : ''}`} icon={FileText} />
              <StepIndicator current={step} stepKey="analyzing" label="Analyzing with Gemini AI" icon={Brain} />
              {step === 'done' && (
                <div className="flex items-center gap-2 text-sm text-emerald-400 font-medium">
                  <CheckCircle size={16} /> Analysis complete!
                </div>
              )}
              {step === 'error' && (
                <div className="flex items-center gap-2 text-sm text-rose-400">
                  <AlertCircle size={16} /> {error}
                </div>
              )}
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <motion.button onClick={handleAnalyze}
              disabled={!file || !title || (step !== 'idle' && step !== 'error' && step !== 'done')}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)' }}>
              {step === 'analyzing' || step === 'ocr' || step === 'uploading'
                ? <><Loader2 size={16} className="animate-spin" /> Processing...</>
                : <><Sparkles size={16} /> Analyze with AI</>}
            </motion.button>
            {(step === 'done' || step === 'error') && (
              <button onClick={reset} className="px-4 py-3 rounded-xl text-sm text-slate-400 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                Reset
              </button>
            )}
          </div>
        </div>

        {/* AI Analysis Results */}
        <div>
          <AnimatePresence>
            {analysis ? (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-cyan-400" />
                  <h2 className="text-sm font-semibold text-white">AI Analysis Results</h2>
                </div>

                {/* Summary */}
                <div className="glass-card p-4">
                  <h3 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2">Summary</h3>
                  <p className="text-sm text-slate-300 leading-relaxed">{analysis.summary}</p>
                </div>

                {/* Abnormal Findings */}
                {analysis.abnormalFindings?.length > 0 && (
                  <div className="glass-card p-4" style={{ borderColor: 'rgba(244,63,94,0.2)' }}>
                    <h3 className="text-xs font-semibold text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <AlertCircle size={12} /> Abnormal Findings
                    </h3>
                    <ul className="space-y-1.5">
                      {analysis.abnormalFindings.map((f: string, i: number) => (
                        <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-2 flex-shrink-0" />{f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Lifestyle Suggestions */}
                {analysis.lifestyleSuggestions?.length > 0 && (
                  <div className="glass-card p-4" style={{ borderColor: 'rgba(16,185,129,0.2)' }}>
                    <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">Lifestyle Suggestions</h3>
                    <ul className="space-y-1.5">
                      {analysis.lifestyleSuggestions.map((s: string, i: number) => (
                        <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                          <CheckCircle size={12} className="text-emerald-400 mt-0.5 flex-shrink-0" />{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Follow Ups */}
                {analysis.followUpRecommendations?.length > 0 && (
                  <div className="glass-card p-4" style={{ borderColor: 'rgba(245,158,11,0.2)' }}>
                    <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">Follow-up Recommendations</h3>
                    <ul className="space-y-1.5">
                      {analysis.followUpRecommendations.map((r: string, i: number) => (
                        <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 flex-shrink-0" />{r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="glass-card p-8 text-center h-full flex flex-col items-center justify-center min-h-64">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                     style={{ background: 'linear-gradient(135deg, rgba(14,165,233,0.15), rgba(59,130,246,0.15))' }}>
                  <Brain size={28} className="text-cyan-400" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-2">AI Analysis Ready</h3>
                <p className="text-xs text-slate-500 max-w-48">Upload a report and click "Analyze with AI" to get instant insights</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
