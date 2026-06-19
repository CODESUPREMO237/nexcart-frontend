// Location: app/admin/messages/page.jsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageCircle, Send, Loader2, Users, ArrowLeft } from 'lucide-react'
import { api } from '@/lib/api'

function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function Avatar({ name, className = '' }) {
  return (
    <div className={`rounded-md flex items-center justify-center font-display font-bold shrink-0 ${className}`}>
      {(name || '?')[0].toUpperCase()}
    </div>
  )
}

// ── TicketPane ────────────────────────────────────────────────────────────────

function TicketPane({ ticket, onBack, onReplySent }) {
  const [messages, setMessages] = useState(ticket.messages || [])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)
  const prevCountRef = useRef(ticket.messages?.length || 0)

  // Sync from poll — only auto-scroll when new messages actually arrive
  useEffect(() => {
    const incoming = ticket.messages || []
    const prevCount = prevCountRef.current
    setMessages(incoming)
    if (incoming.length > prevCount) {
      prevCountRef.current = incoming.length
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [ticket.messages])

  // Scroll to bottom immediately when switching to a different ticket
  useEffect(() => {
    prevCountRef.current = ticket.messages?.length || 0
    messagesEndRef.current?.scrollIntoView({ behavior: 'instant' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket.id])

  const handleSend = async () => {
    if (!newMessage.trim()) return
    setSending(true)
    try {
      const res = await api.post('/support/admin/reply/', {
        ticket_id: ticket.id,
        content: newMessage.trim(),
      })
      const newMsg = res.data
      setMessages(prev => {
        const next = [...prev, newMsg]
        prevCountRef.current = next.length
        return next
      })
      setNewMessage('')
      // Scroll to the message we just sent
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      if (onReplySent) onReplySent()
    } catch (e) {
      console.error(e)
    } finally {
      setSending(false)
    }
  }

  const userName = ticket.user
    ? (ticket.user.full_name || ticket.user.email)
    : 'Guest'

  return (
    <>
      <div className="p-4 border-b border-border bg-card flex items-center gap-3">
        <button onClick={onBack} className="lg:hidden text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Avatar name={userName} className="w-9 h-9 text-sm border border-border bg-muted text-foreground" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{userName}</p>
          <p className="text-xs text-muted-foreground capitalize font-mono">{ticket.status}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <MessageCircle className="h-10 w-10 opacity-20" />
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isAgent = msg.sender_type === 'agent'
            const isBot   = msg.sender_type === 'bot'
            const prev = messages[idx - 1]
            const next = messages[idx + 1]
            const isFirst = !prev || prev.sender_type !== msg.sender_type
            const isLast  = !next || next.sender_type !== msg.sender_type
            const mt = isFirst ? 'mt-4' : 'mt-0.5'

            const bubble = isAgent
              ? 'bg-foreground text-background rounded-md'
              : isBot
                ? 'bg-muted text-muted-foreground italic rounded-md'
                : 'bg-background text-foreground border border-border rounded-md'

            return (
              <div key={msg.id} className={`flex ${isAgent ? 'justify-end' : 'justify-start'} ${mt}`}>
                <div className={`max-w-[70%] px-3.5 py-2 text-sm ${bubble}`}>
                  {isFirst && (
                    <p className={`text-[10px] font-mono uppercase tracking-[0.05em] mb-1 ${
                      isAgent ? 'text-background/60' : 'text-muted-foreground'
                    }`}>
                      {isAgent ? 'You' : isBot ? 'Bot' : userName}
                    </p>
                  )}
                  <p className="leading-snug">{msg.content}</p>
                  {isLast && (
                    <p className={`text-[10px] mt-1 text-right ${isAgent ? 'text-background/60' : 'text-muted-foreground'}`}>
                      {fmtTime(msg.created_at)}
                    </p>
                  )}
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-border bg-card">
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={`Reply to ${userName}…`}
            className="flex-1 px-4 py-2.5 text-sm border border-border rounded-md bg-muted/40 focus:bg-background focus:ring-1 focus:ring-accent/50 outline-none transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={sending || !newMessage.trim()}
            className="p-2.5 rounded-md bg-foreground hover:bg-foreground/90 disabled:opacity-50 transition-colors btn-press"
          >
            {sending
              ? <Loader2 className="h-4 w-4 animate-spin text-background" />
              : <Send className="h-4 w-4 text-background" />}
          </button>
        </div>
      </div>
    </>
  )
}

// ── AdminMessagesPage ─────────────────────────────────────────────────────────

export default function AdminMessagesPage() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState(null)

  const load = async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await api.get('/support/admin/tickets/')
      setTickets(res.data?.results || res.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const interval = setInterval(() => load(true), 6000)
    return () => clearInterval(interval)
  }, [])

  const active = tickets.find(t => t.id === activeId) || null

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-12">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    )
  }

  return (
    <div className="flex h-full">

      {/* Sidebar */}
      <div className={`w-80 border-r border-border bg-card flex flex-col ${activeId ? 'hidden lg:flex' : 'flex'}`}>
        <div className="p-4 border-b border-border">
          <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-accent mb-1">Support</p>
          <h1 className="text-lg font-display font-bold flex items-center gap-2 text-foreground">
            <MessageCircle className="h-5 w-5 text-accent" />
            Messages
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto">
          {tickets.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No messages yet</p>
            </div>
          ) : (
            tickets.map((ticket) => {
              const userName = ticket.user
                ? (ticket.user.full_name || ticket.user.email)
                : 'Guest'
              const lastUserMsg = [...(ticket.messages || [])]
                .reverse()
                .find(m => m.sender_type === 'user' || m.sender_type === 'agent')
              const lastMsg = ticket.messages?.at(-1)
              const isActive = activeId === ticket.id

              return (
                <button
                  key={ticket.id}
                  onClick={() => setActiveId(ticket.id)}
                  className={`w-full px-4 py-3 flex items-center gap-3 border-b border-border text-left transition-colors ${
                    isActive
                      ? 'bg-accent/5 border-l-[3px] border-l-accent'
                      : 'border-l-[3px] border-l-transparent hover:bg-muted/40'
                  }`}
                >
                  <Avatar name={userName} className="w-10 h-10 text-sm border border-border bg-muted text-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-1">
                      <p className="text-sm font-medium text-foreground truncate">{userName}</p>
                      {lastMsg && (
                        <span className="text-[10px] text-muted-foreground shrink-0">{fmtTime(lastMsg.created_at)}</span>
                      )}
                    </div>
                    {lastUserMsg && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{lastUserMsg.content}</p>
                    )}
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Pane */}
      <div className={`flex-1 flex flex-col bg-background ${activeId ? 'flex' : 'hidden lg:flex'}`}>
        {active ? (
          <TicketPane
            key={active.id}
            ticket={active}
            onBack={() => setActiveId(null)}
            onReplySent={() => load(true)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Select a message</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
