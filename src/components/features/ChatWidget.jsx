'use client'

import { useState } from 'react'
import { MessageCircle, X, Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'

export default function ChatWidget({ sellerId, sellerName, productId, vendorId }) {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setSending] = useState(false)
  const [conversationId, setConversationId] = useState(null)

  const sendMessage = async () => {
    if (!message.trim()) return
    setSending(true)

    const newMsg = { content: message, sender_name: 'You', created_at: new Date().toISOString(), isMine: true }
    setMessages(prev => [...prev, newMsg])
    setMessage('')

    try {
      const payload = { content: message.trim() }
      if (conversationId) {
        payload.conversation_id = conversationId
      } else {
        payload.seller_id = sellerId
        payload.product_id = productId
        payload.vendor_id = vendorId
      }

      const response = await api.post('/chat/send/', payload)
      if (response.data?.conversation) {
        setConversationId(response.data.conversation)
      }
    } catch (e) {
      console.error('Send failed:', e)
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2"
      >
        <MessageCircle className="h-4 w-4" />
        Message {sellerName || 'Seller'}
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-background rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md h-[80vh] sm:h-[500px] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-primary/5 rounded-t-2xl">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <MessageCircle className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{sellerName || 'Seller'}</p>
                  <p className="text-[10px] text-muted-foreground">Usually replies within 1 hour</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-12">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p>Start a conversation</p>
                  <p className="text-xs mt-1">Ask about the product, shipping, etc.</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                    msg.isMine
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted rounded-bl-md'
                  }`}>
                    {msg.content}
                    <div className={`text-[10px] mt-1 ${msg.isMine ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="p-3 border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 text-sm border rounded-full bg-background focus:ring-2 focus:ring-primary/30 outline-none"
                />
                <Button
                  size="icon"
                  onClick={sendMessage}
                  disabled={loading || !message.trim()}
                  className="rounded-full h-9 w-9 shrink-0"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
