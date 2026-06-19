// Location: app/messages/page.jsx
// Buyer <-> Seller conversations only (from the ChatWidget on product pages).
// Support tickets are handled separately via the SupportChat widget.
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MessageCircle, Send, Loader2, ArrowLeft, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'
import { useRequireAuth } from '@/hooks/useAuth'
import useAuthStore from '@/store/authStore'

function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function Avatar({ name, className = '' }) {
  return (
    <div className={`rounded-full flex items-center justify-center font-bold shrink-0 text-sm ${className}`}>
      {(name || '?')[0].toUpperCase()}
    </div>
  )
}

// ─── ConversationPane ─────────────────────────────────────────────────────────

function ConversationPane({ conv, currentUserId, onBack }) {
  const [messages, setMessages]     = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading]       = useState(true)
  const [sending, setSending]       = useState(false)
  const messagesEndRef = useRef(null)
  const prevCountRef   = useRef(0)

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await api.get(`/chat/conversations/${conv.id}/messages/`)
      const incoming = res.data?.results || res.data || []
      const prevCount = prevCountRef.current
      setMessages(incoming)
      // Only scroll when new messages actually arrive
      if (incoming.length > prevCount) {
        prevCountRef.current = incoming.length
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      }
    } catch (e) {
      console.error(e)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [conv.id])

  // On conversation switch: reset, load, scroll to bottom instantly
  useEffect(() => {
    prevCountRef.current = 0
    setMessages([])
    setLoading(true)
    load().then(() => {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'instant' }), 50)
    })
  }, [conv.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Poll every 6 seconds for new replies
  useEffect(() => {
    const interval = setInterval(() => load(true), 6000)
    return () => clearInterval(interval)
  }, [load])

  const handleSend = async () => {
    if (!newMessage.trim()) return
    const text = newMessage.trim()
    setSending(true)
    setNewMessage('')
    try {
      const res = await api.post('/chat/send/', {
        conversation_id: conv.id,
        content: text,
      })
      setMessages(prev => {
        const next = [...prev, res.data]
        prevCountRef.current = next.length
        return next
      })
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    } catch (e) {
      console.error(e)
      setNewMessage(text)
    } finally {
      setSending(false)
    }
  }

  const otherName = currentUserId === conv.buyer
    ? (conv.seller_name || conv.seller_email || 'Seller')
    : (conv.buyer_name  || conv.buyer_email  || 'Buyer')

  return (
    <>
      {/* Header */}
      <div className="p-4 border-b bg-white flex items-center gap-3 shrink-0">
        <button onClick={onBack} className="sm:hidden text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Avatar name={otherName} className="w-9 h-9 bg-primary/10 text-primary" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{otherName}</p>
          {conv.product_name && (
            <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
              <ShoppingBag className="h-3 w-3 shrink-0" />
              {conv.product_name}
            </p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex justify-center pt-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center py-12">
            <MessageCircle className="h-10 w-10 mb-3 opacity-20" />
            <p className="text-sm">No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe    = msg.sender === currentUserId
            const prev    = messages[idx - 1]
            const next    = messages[idx + 1]
            const isFirst = !prev || prev.sender !== msg.sender
            const isLast  = !next || next.sender !== msg.sender
            const mt      = isFirst ? 'mt-4' : 'mt-0.5'

            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${mt}`}>
                <div className={`max-w-[75%] px-3.5 py-2 text-sm ${
                  isMe
                    ? `bg-primary text-primary-foreground ${isLast ? 'rounded-2xl rounded-br-sm' : 'rounded-2xl'}`
                    : `bg-white text-gray-900 shadow-sm border ${isLast ? 'rounded-2xl rounded-bl-sm' : 'rounded-2xl'}`
                }`}>
                  {isFirst && !isMe && (
                    <p className="text-[10px] font-semibold mb-1 text-primary">{msg.sender_name || otherName}</p>
                  )}
                  <p className="leading-snug">{msg.content}</p>
                  {isLast && (
                    <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-primary-foreground/60' : 'text-gray-400'}`}>
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

      {/* Input */}
      <div className="p-3 border-t bg-white shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={`Message ${otherName}…`}
            className="flex-1 px-4 py-2.5 text-sm border rounded-full bg-gray-50 focus:ring-2 focus:ring-primary/30 outline-none"
          />
          <Button size="icon" onClick={handleSend} disabled={sending || !newMessage.trim()} className="rounded-full">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </>
  )
}

// ─── MessagesPage ─────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const { isLoading: authLoading, isAuthorized } = useRequireAuth()
  const { user } = useAuthStore()                            // get user from store directly
  const [conversations, setConversations] = useState([])
  const [activeId, setActiveId]           = useState(null)
  const [loading, setLoading]             = useState(true)

  const loadConversations = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await api.get('/chat/conversations/')
      setConversations(res.data?.results || res.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isAuthorized) { if (!authLoading) setLoading(false); return }
    loadConversations()
    const interval = setInterval(() => loadConversations(true), 10000)
    return () => clearInterval(interval)
  }, [isAuthorized, authLoading, loadConversations])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }
  if (!isAuthorized) return null

  const currentUserId = user?.id
  const active = conversations.find(c => c.id === activeId) || null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto h-screen flex flex-col">
        <div className="flex flex-1 overflow-hidden border-x bg-white">

          {/* ── Sidebar ── */}
          <div className={`w-full sm:w-80 border-r flex flex-col bg-white shrink-0 ${activeId ? 'hidden sm:flex' : 'flex'}`}>
            <div className="p-4 border-b shrink-0">
              <h1 className="text-lg font-bold flex items-center gap-2 text-gray-900">
                <MessageCircle className="h-5 w-5 text-primary" />
                Messages
              </h1>
            </div>

            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center p-8">
                  <ShoppingBag className="h-10 w-10 mb-3 opacity-20" />
                  <p className="text-sm font-medium">No conversations yet</p>
                  <p className="text-xs mt-1 opacity-70">
                    Messages with sellers appear here when you chat on a product page.
                  </p>
                </div>
              ) : (
                conversations.map((conv) => {
                  const otherName = currentUserId === conv.buyer
                    ? (conv.seller_name || conv.seller_email || 'Seller')
                    : (conv.buyer_name  || conv.buyer_email  || 'Buyer')
                  const isActive = activeId === conv.id

                  return (
                    <button
                      key={conv.id}
                      onClick={() => setActiveId(conv.id)}
                      className={`w-full px-4 py-3 flex items-center gap-3 border-b border-gray-100 text-left transition-colors ${
                        isActive
                          ? 'bg-primary/5 border-l-[3px] border-l-primary'
                          : 'border-l-[3px] border-l-transparent hover:bg-gray-50'
                      }`}
                    >
                      <Avatar name={otherName} className="w-10 h-10 bg-primary/10 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-1">
                          <p className="text-sm font-semibold text-gray-900 truncate">{otherName}</p>
                          {conv.last_message && (
                            <span className="text-[10px] text-gray-400 shrink-0">
                              {fmtTime(conv.last_message.created_at)}
                            </span>
                          )}
                        </div>
                        {conv.product_name && (
                          <p className="text-[11px] text-primary truncate">Re: {conv.product_name}</p>
                        )}
                        {conv.last_message && (
                          <p className="text-xs text-gray-400 truncate mt-0.5">{conv.last_message.content}</p>
                        )}
                        {conv.unread_count > 0 && (
                          <span className="inline-block mt-1 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                            {conv.unread_count} new
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* ── Chat pane ── */}
          <div className={`flex-1 flex flex-col bg-gray-50 overflow-hidden ${activeId ? 'flex' : 'hidden sm:flex'}`}>
            {active ? (
              <ConversationPane
                key={active.id}
                conv={active}
                currentUserId={currentUserId}
                onBack={() => setActiveId(null)}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Select a conversation</p>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
