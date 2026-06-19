'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { MessageCircle, X, Send, HeadphonesIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'

const QUICK_REPLIES = [
  'How do I track my order?',
  'I need help with payment',
  'How to return a product?',
  'Delivery takes too long',
  'I want to become a seller',
]

function getSessionKey() {
  if (typeof window === 'undefined') return null
  let key = localStorage.getItem('nexcart_support_session')
  if (!key) {
    key = 'guest_' + Math.random().toString(36).substring(2) + Date.now().toString(36)
    localStorage.setItem('nexcart_support_session', key)
  }
  return key
}

export default function SupportChat() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => { setMounted(true) }, [])

  const loadHistory = useCallback(async () => {
    try {
      const sessionKey = getSessionKey()
      const res = await api.get(`/support/messages/?session_key=${sessionKey}`)
      const data = res.data
      if (data.messages && data.messages.length > 0) {
        setMessages(data.messages.map(m => ({
          id: m.id,
          content: m.content,
          sender: m.sender_type,
          time: m.created_at,
        })))
      } else {
        setMessages([])
      }
    } catch {
      setMessages([])
    }
    setLoaded(true)
  }, [])

  const pollHistory = useCallback(async () => {
    try {
      const sessionKey = getSessionKey()
      const res = await api.get(`/support/messages/?session_key=${sessionKey}`)
      const data = res.data
      if (data.messages) {
        setMessages(data.messages.map(m => ({
          id: m.id,
          content: m.content,
          sender: m.sender_type,
          time: m.created_at,
        })))
      }
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    if (isOpen && !loaded) loadHistory()
  }, [isOpen, loaded, loadHistory])

  useEffect(() => {
    if (!isOpen || !loaded) return
    const interval = setInterval(pollHistory, 8000)
    return () => clearInterval(interval)
  }, [isOpen, loaded, pollHistory])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  useEffect(() => {
    if (isOpen && loaded) inputRef.current?.focus()
  }, [isOpen, loaded])

  const sendMessage = async (text) => {
    const content = text || input.trim()
    if (!content || sending) return

    const tempId = 'u_' + Date.now()
    const userMsg = { id: tempId, content, sender: 'user', time: new Date().toISOString() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setSending(true)

    try {
      const sessionKey = getSessionKey()
      const res = await api.post('/support/send/', { content, session_key: sessionKey })
      const data = res.data
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== tempId)
        const next = [
          ...filtered,
          { id: data.user_message.id, content: data.user_message.content, sender: 'user', time: data.user_message.created_at },
        ]
        if (data.bot_reply) {
          next.push({ id: data.bot_reply.id, content: data.bot_reply.content, sender: 'bot', time: data.bot_reply.created_at })
        }
        return next
      })
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempId))
      setMessages(prev => [...prev, {
        id: 'err_' + Date.now(),
        content: 'Failed to send. Please check your connection and try again.',
        sender: 'bot',
        time: new Date().toISOString(),
      }])
    }
    setSending(false)
  }

  if (!mounted || pathname?.startsWith('/admin')) return null

  return (
    <>
      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-[80] w-[360px] max-w-[calc(100vw-2rem)] h-[500px] max-h-[70vh]">
          <div className="bg-background border border-border rounded-md shadow-2xl h-full flex flex-col overflow-hidden">

            {/* Header — ink background, copper online dot */}
            <div className="bg-foreground px-4 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md border border-background/20 bg-background/10 flex items-center justify-center shrink-0">
                  <HeadphonesIcon className="h-4 w-4 text-background" />
                </div>
                <div>
                  <p className="text-sm font-semibold font-display text-background leading-tight">NexCart Support</p>
                  <p className="text-[10px] text-background/50 flex items-center gap-1.5 font-mono uppercase tracking-[0.1em] mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
                    Online
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-background/10 rounded-md transition-colors"
                aria-label="Close support chat"
              >
                <X className="h-4 w-4 text-background" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-muted/20">
              {messages.length === 0 && !sending && (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <div className="w-12 h-12 rounded-md border border-border bg-card flex items-center justify-center mb-3">
                    <HeadphonesIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">How can we help?</p>
                  <p className="text-xs text-muted-foreground mt-1">Send a message or pick a topic below</p>
                </div>
              )}

              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-md px-3.5 py-2 text-[13px] leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-foreground text-background'
                      : 'bg-background border border-border shadow-sm text-foreground'
                  }`}>
                    {msg.content.split('\n').map((line, i, arr) => (
                      <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
                    ))}
                  </div>
                </div>
              ))}

              {sending && (
                <div className="flex justify-start">
                  <div className="bg-background border border-border rounded-md px-4 py-2.5 shadow-sm">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick replies — only when no messages */}
            {messages.length === 0 && !sending && (
              <div className="px-3 py-2 border-t border-border flex flex-wrap gap-1.5 bg-background">
                {QUICK_REPLIES.map((reply) => (
                  <button
                    key={reply}
                    onClick={() => sendMessage(reply)}
                    className="px-2.5 py-1.5 text-[11px] rounded-md border border-border text-foreground hover:bg-muted hover:border-accent/50 transition-colors font-mono"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t border-border bg-background shrink-0">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type your message…"
                  className="flex-1 px-3 py-2 text-sm border border-border rounded-md bg-muted/40 focus:bg-background focus:ring-1 focus:ring-accent/50 outline-none transition-colors"
                  disabled={sending}
                />
                <Button
                  size="icon"
                  onClick={() => sendMessage()}
                  disabled={sending || !input.trim()}
                  className="rounded-md h-9 w-9 shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FAB — ink square, no gradient */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-[80] w-14 h-14 rounded-md shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105 btn-press ${
          isOpen
            ? 'bg-muted border border-border text-foreground'
            : 'bg-foreground text-background hover:bg-foreground/90'
        }`}
        aria-label="Support chat"
      >
        {isOpen ? <X className="h-5 w-5" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </>
  )
}
