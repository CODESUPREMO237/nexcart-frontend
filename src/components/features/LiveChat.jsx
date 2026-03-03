'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { 
  MessageCircle, 
  Send, 
  X, 
  Minimize2, 
  Maximize2,
  Bot,
  User,
  Phone,
  Mail
} from 'lucide-react'
import useAuthStore from '@/store/authStore'
import api from '@/lib/api'

export default function LiveChat() {
  const { user, isAuthenticated } = useAuthStore()
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hi! 👋 Welcome to NexCart! How can I help you today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const chatRef = useRef(null)
  const messageIdRef = useRef(1)

  const getNextMessageId = () => {
    messageIdRef.current += 1
    return messageIdRef.current
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])


  const unreadCount = isOpen
    ? 0
    : messages.filter((message) => message.sender === 'bot' || message.sender === 'support').length

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!inputMessage.trim()) return

    const newMessage = {
      id: getNextMessageId(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, newMessage])
    setInputMessage('')
    setIsTyping(true)

    // Simulate bot response (replace with actual API call)
    setTimeout(() => {
      const botResponse = getBotResponse(inputMessage)
      setMessages(prev => [...prev, {
        id: getNextMessageId(),
        text: botResponse,
        sender: 'bot',
        timestamp: new Date()
      }])
      setIsTyping(false)
    }, 1000)
  }

  const getBotResponse = (message) => {
    const lowerMessage = message.toLowerCase()
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return "Hello! 👋 How can I assist you today?"
    } else if (lowerMessage.includes('order') || lowerMessage.includes('track')) {
      return "I can help you track your order! Please provide your order number."
    } else if (lowerMessage.includes('product') || lowerMessage.includes('item')) {
      return "I'd be happy to help you find products! What are you looking for?"
    } else if (lowerMessage.includes('payment') || lowerMessage.includes('pay')) {
      return "We accept MTN Mobile Money, Orange Money, and card payments via MeSomb."
    } else if (lowerMessage.includes('shipping') || lowerMessage.includes('delivery')) {
      return "We offer free shipping on orders over 50,000 XAF! Delivery usually takes 2-5 business days."
    } else if (lowerMessage.includes('return') || lowerMessage.includes('refund')) {
      return "We have a 30-day return policy. Would you like to speak with a support agent?"
    } else if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
      return "I'm here to help! You can also reach our support team at support@nexcart.cm or call +237 652 314 994"
    } else {
      return "I understand! Let me connect you with a support agent who can better assist you. Please hold on..."
    }
  }

  const quickReplies = [
    "Track my order",
    "Product inquiry",
    "Payment methods",
    "Shipping info",
    "Talk to human"
  ]

  const handleQuickReply = (reply) => {
    setInputMessage(reply)
  }

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="lg"
          className="rounded-full h-16 w-16 shadow-lg relative"
          onClick={() => setIsOpen(true)}
        >
          <MessageCircle className="h-6 w-6" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center p-0"
              variant="destructive"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </div>
    )
  }

  return (
    <div 
      ref={chatRef}
      className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
        isMinimized ? 'w-80' : 'w-96'
      }`}
    >
      <Card className={`shadow-2xl ${isMinimized ? 'h-16' : 'h-[600px]'} flex flex-col`}>
        {/* Header */}
        <CardHeader className="border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="bg-white">
                  <Bot className="text-blue-600" />
                </Avatar>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
              </div>
              <div>
                <CardTitle className="text-lg">NexCart Support</CardTitle>
                <p className="text-xs text-blue-100">We&apos;re online • Reply in ~1 min</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <>
            {/* Messages */}
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-2 ${
                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.sender !== 'user' && (
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <Bot className="text-blue-600" />
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.sender === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-200'
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                  {message.sender === 'user' && (
                    <Avatar className="w-8 h-8 flex-shrink-0 bg-gradient-to-br from-purple-600 to-blue-600">
                      <User className="text-white" />
                    </Avatar>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-2 justify-start">
                  <Avatar className="w-8 h-8">
                    <Bot className="text-blue-600" />
                  </Avatar>
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </CardContent>

            {/* Quick Replies */}
            {messages.length <= 2 && (
              <div className="border-t p-3 bg-white">
                <p className="text-xs text-gray-600 mb-2">Quick replies:</p>
                <div className="flex flex-wrap gap-2">
                  {quickReplies.map((reply) => (
                    <Button
                      key={reply}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickReply(reply)}
                      className="text-xs"
                    >
                      {reply}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <CardFooter className="border-t p-3">
              <form onSubmit={handleSendMessage} className="flex gap-2 w-full">
                <Input
                  type="text"
                  placeholder="Type your message..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </CardFooter>

            {/* Contact Options */}
            <div className="border-t p-3 bg-gray-50">
              <p className="text-xs text-gray-600 mb-2">Other ways to reach us:</p>
              <div className="flex gap-3">
                <Button variant="outline" size="sm" className="flex-1">
                  <Phone className="h-3 w-3 mr-1" />
                  Call
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Mail className="h-3 w-3 mr-1" />
                  Email
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}



