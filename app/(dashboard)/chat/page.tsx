'use client'

import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Send, Trash2, Loader2, Bot, User, Sparkles, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

const QUICK_QUESTIONS = [
  'What are my latest blood test results?',
  'Can I eat sweets based on my reports?',
  'What medications am I currently taking?',
  'Are there any abnormal findings in my reports?',
  'What lifestyle changes should I make?',
  "What's my blood group and allergies?",
]

const TypingIndicator = () => (
  <div className="flex items-center gap-1 px-3 py-2">
    <div className="dot-1 w-2 h-2 rounded-full bg-cyan-400" />
    <div className="dot-2 w-2 h-2 rounded-full bg-cyan-400" />
    <div className="dot-3 w-2 h-2 rounded-full bg-cyan-400" />
  </div>
)

export default function ChatPage() {
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get('/api/chat')
        setMessages(res.data.messages || [])
      } catch { } finally { setFetching(false) }
    }
    fetchHistory()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return
    const userMsg = { id: Date.now(), role: 'USER', content: text, createdAt: new Date().toISOString() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await axios.post('/api/chat', { message: text })
      const aiMsg = { id: Date.now() + 1, role: 'ASSISTANT', content: res.data.response, createdAt: new Date().toISOString() }
      setMessages((prev) => [...prev, aiMsg])
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Failed to get response'
      toast.error(errMsg)
      const errorMsg = { id: Date.now() + 1, role: 'ASSISTANT', content: `Sorry, I encountered an error: ${errMsg}`, createdAt: new Date().toISOString() }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setLoading(false)
    }
  }

  const clearChat = async () => {
    try {
      await axios.delete('/api/chat')
      setMessages([])
      toast.success('Chat cleared')
    } catch { toast.error('Failed to clear chat') }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] lg:h-screen max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b flex-shrink-0"
           style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, #10b981, #0ea5e9)' }}>
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">AI Health Assistant</h1>
            <p className="text-xs text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" /> Powered by Gemini · Knows your records
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={clearChat} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-rose-400 transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Trash2 size={12} /> Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-4">
        {fetching ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={24} className="text-slate-500 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center h-full gap-6">
            <div className="text-center">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4"
                   style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(14,165,233,0.2))' }}>
                <Sparkles size={32} className="text-cyan-400" />
              </div>
              <h2 className="text-lg font-bold text-white mb-2">Ask me anything about your health</h2>
              <p className="text-sm text-slate-500 max-w-sm">I have access to your medical reports, medications, and health history to give you personalized answers.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {QUICK_QUESTIONS.map((q) => (
                <motion.button key={q} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={() => sendMessage(q)}
                  className="text-left px-3 py-2.5 rounded-xl text-xs text-slate-300 hover:text-white transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {q}
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          <>
            <AnimatePresence initial={false}>
              {messages.map((msg: any) => (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${msg.role === 'USER' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'USER' ? 'bg-blue-500/20' : 'bg-emerald-500/20'
                  }`}>
                    {msg.role === 'USER' ? <User size={14} className="text-blue-400" /> : <Bot size={14} className="text-emerald-400" />}
                  </div>
                  <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'USER'
                      ? 'text-white rounded-tr-sm'
                      : 'text-slate-200 rounded-tl-sm'
                  }`} style={msg.role === 'USER'
                    ? { background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)' }
                    : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {msg.content}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <Bot size={14} className="text-emerald-400" />
                </div>
                <div className="px-3 py-1 rounded-2xl rounded-tl-sm" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <TypingIndicator />
                </div>
              </motion.div>
            )}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="px-4 md:px-6 pb-4 pt-2 flex-shrink-0 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        {/* Quick suggestions (when chat has messages) */}
        {messages.length > 0 && (
          <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-none">
            {QUICK_QUESTIONS.slice(0, 3).map((q) => (
              <button key={q} onClick={() => sendMessage(q)}
                className="flex-shrink-0 text-xs text-slate-400 hover:text-cyan-300 px-2 py-1 rounded-lg transition-colors"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                {q}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-3 items-end">
          <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
            placeholder="Ask about your health, medications, or reports..."
            rows={1} className="flex-1 px-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-cyan-500 resize-none transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '120px' }}
            onInput={(e: any) => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px' }} />
          <motion.button onClick={() => sendMessage(input)} disabled={!input.trim() || loading}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className="w-11 h-11 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #10b981, #0ea5e9)' }}>
            {loading ? <Loader2 size={16} className="text-white animate-spin" /> : <Send size={16} className="text-white" />}
          </motion.button>
        </div>
        <p className="text-xs text-slate-600 mt-2 text-center">AI responses are informational only. Always consult a doctor for medical decisions.</p>
      </div>
    </div>
  )
}
