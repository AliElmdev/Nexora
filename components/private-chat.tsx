"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import type { Friend, PrivateMessage } from "@/app/page"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Menu, Send, ImageIcon, Clock, Phone, Video } from "lucide-react"
import { useAuth } from "@/components/auth-provider"

interface PrivateChatProps {
  friend: Friend
  onMenuClick: () => void
}

const sampleMessages: PrivateMessage[] = [
  {
    id: "1",
    content: "Hey! How's your Spanish practice going?",
    senderId: "1",
    receiverId: "you",
    timestamp: new Date(Date.now() - 1000 * 60 * 10),
    isRead: true,
  },
  {
    id: "2",
    content: "It's going well! I've been practicing with the conversation groups. How about your English?",
    senderId: "you",
    receiverId: "1",
    timestamp: new Date(Date.now() - 1000 * 60 * 8),
    isRead: true,
  },
  {
    id: "3",
    content: "Much better! Would you like to have a voice call later to practice together?",
    senderId: "1",
    receiverId: "you",
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    isRead: true,
  },
]

export function PrivateChat({ friend, onMenuClick }: PrivateChatProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<PrivateMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoadingMessages, setIsLoadingMessages] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch private messages from database
  useEffect(() => {
    const fetchMessages = async () => {
      if (!user?.id || !friend.id) return
      
      console.log('Fetching messages between:', { userId: user.id, friendId: friend.id })
      
      try {
        const response = await fetch(`/api/messages/private?userId1=${user.id}&userId2=${friend.id}`)
        if (response.ok) {
          const messagesData = await response.json()
          console.log('Received messages from API:', messagesData)
          
          // Transform database format to component format
          const transformedMessages: PrivateMessage[] = messagesData.map((msg: any) => ({
            id: msg.id,
            content: msg.content,
            senderId: msg.senderId,
            receiverId: msg.receiverId,
            timestamp: new Date(msg.createdAt),
            isRead: msg.isRead,
            type: msg.messageType === 'image' ? 'image' : 'text',
          }))
          console.log('Transformed messages:', transformedMessages)
          setMessages(transformedMessages)
        } else {
          console.error('Failed to fetch messages:', response.status, response.statusText)
        }
      } catch (error) {
        console.error('Error fetching private messages:', error)
        setMessages([])
      } finally {
        setIsLoadingMessages(false)
      }
    }

    fetchMessages()
  }, [user?.id, friend.id])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !user?.id) return

    const message: PrivateMessage = {
      id: Date.now().toString(),
      content: newMessage,
      senderId: user.id,
      receiverId: friend.id,
      timestamp: new Date(),
      isRead: false,
    }

    // Optimistically add message to UI
    setMessages((prev) => [...prev, message])
    setNewMessage("")

    // Send message to database
    try {
      console.log('Sending message to database:', {
        content: newMessage,
        senderId: user.id,
        receiverId: friend.id,
      })
      
      const response = await fetch('/api/messages/private', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage,
          senderId: user.id,
          receiverId: friend.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Failed to save message:', errorData)
        throw new Error('Failed to save private message to database')
      }

      const savedMessage = await response.json()
      console.log('Private message saved successfully:', savedMessage)
    } catch (error) {
      console.error('Error sending private message:', error)
      // Optionally remove the optimistic message if save failed
      // setMessages((prev) => prev.filter(m => m.id !== message.id))
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && user?.id) {
      const imageUrl = URL.createObjectURL(file)

      const imageMessage: PrivateMessage = {
        id: Date.now().toString(),
        content: imageUrl,
        senderId: user.id,
        receiverId: friend.id,
        timestamp: new Date(),
        type: "image",
        isRead: false,
      }

      // Optimistically add message to UI
      setMessages((prev) => [...prev, imageMessage])

      // Send image message to database
      try {
        const response = await fetch('/api/messages/private', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: imageUrl,
            messageType: 'image',
            senderId: user.id,
            receiverId: friend.id,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to save image message to database')
        }

        const savedMessage = await response.json()
        console.log('Image message saved successfully:', savedMessage)
      } catch (error) {
        console.error('Error sending image message:', error)
      }
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const getCountryFlag = (country: string) => {
    const flags: { [key: string]: string } = {
      Spain: "🇪🇸",
      USA: "🇺🇸",
      Japan: "🇯🇵",
      France: "🇫🇷",
      Germany: "🇩🇪",
      Brazil: "🇧🇷",
    }
    return flags[country] || "🌍"
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" className="lg:hidden" onClick={onMenuClick}>
              <Menu className="h-4 w-4" />
            </Button>
            <div className="relative">
              <Avatar className="w-10 h-10">
                <AvatarFallback>{getInitials(friend.name)}</AvatarFallback>
              </Avatar>
              <div
                className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                  friend.isOnline ? "bg-green-500" : "bg-gray-400"
                }`}
              />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{friend.name}</h2>
              <p className="text-sm text-gray-600">
                {getCountryFlag(friend.country)} {friend.country} •{" "}
                {friend.isOnline ? "Online" : `Last seen ${friend.lastSeen?.toLocaleTimeString()}`}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm">
              <Video className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoadingMessages ? (
          <p className="text-center py-8">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-center py-8">No messages yet. Start the conversation!</p>
        ) : (
          messages.map((message) => (
                      <div key={message.id} className={`flex ${message.senderId === user?.id ? "justify-end" : "justify-start"}`}>
              <div
                className={`flex max-w-xs lg:max-w-md ${message.senderId === user?.id ? "flex-row-reverse" : "flex-row"} items-start space-x-2`}
              >
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback className="text-xs">
                    {message.senderId === user?.id ? "You" : getInitials(friend.name)}
                  </AvatarFallback>
                </Avatar>
                <div className={`${message.senderId === user?.id ? "mr-2" : "ml-2"}`}>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs text-gray-500 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                  <div
                    className={`rounded-lg p-3 ${
                      message.senderId === user?.id ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    {message.type === "image" ? (
                      <img
                        src={message.content || "/placeholder.svg"}
                        alt="Shared image"
                        className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(message.content, "_blank")}
                      />
                    ) : (
                      <p className="text-sm">{message.content}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="bg-white border-t border-gray-200 p-4">
        {!user?.id ? (
          <div className="flex items-center justify-center space-x-2 p-3 bg-blue-50 rounded-lg">
            <span className="text-blue-700 text-sm">👀 You need to log in to send private messages</span>
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
            <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <ImageIcon className="h-4 w-4" />
            </Button>
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Message ${friend.name}...`}
              className="flex-1"
            />
            <Button type="submit" disabled={!newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
