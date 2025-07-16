"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import type { Room, Message } from "@/app/page"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Menu, Send, Users, Clock, ImageIcon, Phone, PhoneOff, UserPlus } from "lucide-react"
import { OnlineMembers } from "@/components/online-members"
import { GroupCallInterface } from "@/components/group-call-interface"
import { useAuth } from "@/components/auth-provider"
import { RoomJoinPrompt } from "@/components/room-join-prompt"
import { realtimeService } from "@/lib/services/realtimeService"
import { webrtcService } from "@/lib/services/webrtcService"

interface ChatRoomProps {
  room: Room
  onMenuClick: () => void
  onActivity: () => void
  isReadOnly?: boolean
  onShowLogin?: () => void
}

interface ChatUser {
  id: string
  name: string
  country: string
  isOnline: boolean
  avatar?: string
}

const sampleUsers: ChatUser[] = [
  { id: "1", name: "Maria", country: "Spain", isOnline: true },
  { id: "2", name: "John", country: "USA", isOnline: true },
  { id: "3", name: "Yuki", country: "Japan", isOnline: true },
  { id: "4", name: "Pierre", country: "France", isOnline: false },
  { id: "5", name: "Anna", country: "Germany", isOnline: true },
  { id: "6", name: "Carlos", country: "Brazil", isOnline: true },
]

const categoryColors = {
  language: "bg-blue-100 text-blue-800",
  culture: "bg-purple-100 text-purple-800",
  technology: "bg-green-100 text-green-800",
  arts: "bg-pink-100 text-pink-800",
  science: "bg-orange-100 text-orange-800",
}

export function ChatRoom({ room, onMenuClick, onActivity, isReadOnly = false, onShowLogin }: ChatRoomProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [currentUser, setCurrentUser] = useState(user?.name || "You")
  const [showMembers, setShowMembers] = useState(false)
  const [isGroupCallActive, setIsGroupCallActive] = useState(false)
  const [groupCallParticipants, setGroupCallParticipants] = useState<string[]>([])
  const [isInCall, setIsInCall] = useState(false)
  const [isLoadingMessages, setIsLoadingMessages] = useState(true)
  const [isJoined, setIsJoined] = useState(false)
  const [isCheckingMembership, setIsCheckingMembership] = useState(true)
  const [roomParticipants, setRoomParticipants] = useState<ChatUser[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Update current user when user changes
  useEffect(() => {
    setCurrentUser(user?.name || "You")
  }, [user])

  // Check if user is a member of the room and fetch participants
  useEffect(() => {
    const checkMembershipAndFetchParticipants = async () => {
      if (!user?.id || !room.id) return
      
      try {
        // Check if user is a member of the room
        const membershipResponse = await fetch(`/api/rooms/${room.id}/participants?userId=${user.id}`)
        if (membershipResponse.ok) {
          const participantsData = await membershipResponse.json()
          const isUserMember = participantsData.some((p: any) => p.userId === user.id)
          setIsJoined(isUserMember)
          
          // Transform participants data
          const transformedParticipants: ChatUser[] = participantsData
            .filter((p: any) => p.user && p.user.id) // Filter out participants with missing user data
            .map((p: any) => ({
              id: p.user.id,
              name: p.user.fullName || p.user.username || 'Unknown User',
              country: p.user.country || 'Unknown',
              isOnline: true, // For now, assume all participants are online
              avatar: p.user.avatarUrl,
            }))
          setRoomParticipants(transformedParticipants)
        } else {
          setIsJoined(false)
          setRoomParticipants([])
        }
      } catch (error) {
        console.error('Error checking room membership:', error)
        setIsJoined(false)
        setRoomParticipants([])
      } finally {
        setIsCheckingMembership(false)
      }
    }

    checkMembershipAndFetchParticipants()
  }, [user?.id, room.id])

  // Fetch messages from database and set up real-time updates
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        console.log(`📥 Fetching initial messages for room: ${room.id}`)
        const response = await fetch(`/api/rooms/${room.id}/messages`)
        if (response.ok) {
          const messagesData = await response.json()
          console.log(`📥 Received ${messagesData.length} initial messages for room ${room.id}`)
          
          // Transform database format to component format
          const transformedMessages: Message[] = messagesData
            .filter((msg: any) => msg && msg.id) // Filter out messages with missing data
            .map((msg: any) => ({
              id: msg.id,
              content: msg.content || '',
              author: msg.sender?.fullName || msg.sender?.username || 'Unknown User',
              timestamp: new Date(msg.createdAt || Date.now()),
              roomId: msg.roomId || room.id,
              country: msg.sender?.country || 'Unknown',
              type: msg.messageType === 'image' ? 'image' : 'text',
            }))
          
          console.log(`📝 Setting ${transformedMessages.length} messages for room ${room.id}`)
          setMessages(transformedMessages)
          
          // Set the last message ID for polling
          if (transformedMessages.length > 0) {
            const lastMessageId = transformedMessages[transformedMessages.length - 1].id
            console.log(`📝 Setting last message ID for polling: ${lastMessageId}`)
            realtimeService.setLastMessageId(`room_${room.id}`, lastMessageId)
          }
        } else {
          console.error(`❌ Failed to fetch initial messages for room ${room.id}:`, response.status)
        }
      } catch (error) {
        console.error('Error fetching messages:', error)
        // Fallback to empty array if API fails
        setMessages([])
      } finally {
        setIsLoadingMessages(false)
      }
    }

    if (room.id && isJoined) {
      fetchMessages()
      
      // Subscribe to real-time messages for this room
      console.log(`🔄 Setting up real-time subscription for room: ${room.id}`)
      realtimeService.subscribeToRoom(room.id, (newMessage: Message) => {
        console.log('📨 Real-time message received in room:', newMessage)
        setMessages(prev => {
          console.log(`📝 Adding message to room ${room.id}, total messages: ${prev.length + 1}`)
          return [...prev, newMessage]
        })
      })
    }

    // Cleanup: unsubscribe when component unmounts or room changes
    return () => {
      if (room.id) {
        console.log(`👋 Unsubscribing from room: ${room.id}`)
        realtimeService.unsubscribeFromRoom(room.id)
      }
    }
  }, [room.id, isJoined])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !user?.id) return

    const messageContent = newMessage.trim()
    setNewMessage("")
    onActivity()

    // Send message via HTTP API (polling will handle real-time updates)
    try {
      const response = await fetch(`/api/rooms/${room.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: messageContent,
          senderId: user.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 403) {
          // User is not a member of the room, try to join first
          try {
            const joinResponse = await fetch(`/api/rooms/${room.id}/join`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId: user.id,
              }),
            })

            if (joinResponse.ok) {
              // Retry sending the message after joining
              const retryResponse = await fetch(`/api/rooms/${room.id}/messages`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  content: messageContent,
                  senderId: user.id,
                }),
              })

              if (!retryResponse.ok) {
                throw new Error('Failed to send message after joining room')
              }
            } else {
              throw new Error('Failed to join room')
            }
          } catch (joinError) {
            console.error('Error joining room:', joinError)
          }
        } else {
          throw new Error(errorData.error || 'Failed to send message')
        }
      }

      console.log('📤 Message sent to room:', room.id)
    } catch (error) {
      console.error('Error sending message via WebSocket:', error)
      
      // Fallback to HTTP API if WebSocket fails
      try {
        const response = await fetch(`/api/rooms/${room.id}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: messageContent,
            senderId: user.id,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          if (response.status === 403) {
            // User is not a member of the room, try to join first
            try {
              const joinResponse = await fetch(`/api/rooms/${room.id}/join`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  userId: user.id,
                }),
              })

              if (joinResponse.ok) {
                // Retry sending the message after joining
                const retryResponse = await fetch(`/api/rooms/${room.id}/messages`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    content: messageContent,
                    senderId: user.id,
                  }),
                })

                if (!retryResponse.ok) {
                  throw new Error('Failed to send message after joining room')
                }
              } else {
                throw new Error('Failed to join room')
              }
            } catch (joinError) {
              console.error('Error joining room:', joinError)
            }
          } else {
            throw new Error(errorData.error || 'Failed to send message')
          }
        }
      } catch (apiError) {
        console.error('Error sending message via API:', apiError)
      }
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && user?.id) {
      // In a real app, you'd upload to a server and get a URL
      const imageUrl = URL.createObjectURL(file)

      const imageMessage: Message = {
        id: Date.now().toString(),
        content: imageUrl,
        author: user.name || currentUser,
        timestamp: new Date(),
        roomId: room.id,
        country: user.country || "Unknown",
        type: "image",
      }

      // Optimistically add message to UI
      setMessages((prev) => [...prev, imageMessage])

      // Send image message to database
      try {
        const response = await fetch(`/api/rooms/${room.id}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: imageUrl,
            messageType: 'image',
            senderId: user.id,
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

  const startGroupCall = async () => {
    if (!user?.id) return
    
    try {
      setIsGroupCallActive(true)
      setGroupCallParticipants([currentUser])
      setIsInCall(true)
      
      // Start the actual WebRTC call
      const success = await webrtcService.startCall(room.id, user.id, user.name || 'Unknown User')
      if (!success) {
        console.error('Failed to start call')
        setIsGroupCallActive(false)
        setIsInCall(false)
        setGroupCallParticipants([])
      }
    } catch (error) {
      console.error('Error starting group call:', error)
      setIsGroupCallActive(false)
      setIsInCall(false)
      setGroupCallParticipants([])
    }
  }

  const joinGroupCall = async () => {
    if (!user?.id) return
    
    try {
      if (!groupCallParticipants.includes(currentUser)) {
        setGroupCallParticipants((prev) => [...prev, currentUser])
      }
      setIsInCall(true)
      
      // Join the actual WebRTC call
      const success = await webrtcService.joinCall(room.id, user.id, user.name || 'Unknown User')
      if (!success) {
        console.error('Failed to join call')
        setIsInCall(false)
        setGroupCallParticipants((prev) => prev.filter((p) => p !== currentUser))
      }
    } catch (error) {
      console.error('Error joining group call:', error)
      setIsInCall(false)
      setGroupCallParticipants((prev) => prev.filter((p) => p !== currentUser))
    }
  }

  const leaveGroupCall = async () => {
    console.log('📞 User leaving group call')
    
    if (user?.id) {
      await webrtcService.leaveCall(room.id, user.id)
    }
    
    setIsInCall(false)
    setGroupCallParticipants((prev) => prev.filter((p) => p !== currentUser))

    if (groupCallParticipants.length <= 1) {
      setIsGroupCallActive(false)
      setGroupCallParticipants([])
      // Force stop all media when call ends
      webrtcService.forceStopAllMedia()
    }
  }

  const handleJoinRoom = async () => {
    if (!user?.id) return
    
    try {
      // Join the room
      const response = await fetch(`/api/rooms/${room.id}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      })

      if (response.ok || response.status === 409) {
        // Update local state to show the room (409 means already a member)
        setIsJoined(true)
        
        // Refresh participants list
        const participantsResponse = await fetch(`/api/rooms/${room.id}/participants`)
        if (participantsResponse.ok) {
          const participantsData = await participantsResponse.json()
          const transformedParticipants: ChatUser[] = participantsData
            .filter((p: any) => p.user && p.user.id) // Filter out participants with missing user data
            .map((p: any) => ({
              id: p.user.id,
              name: p.user.fullName || p.user.username || 'Unknown User',
              country: p.user.country || 'Unknown',
              isOnline: true,
              avatar: p.user.avatarUrl,
            }))
          setRoomParticipants(transformedParticipants)
        }
      } else {
        console.error('Failed to join room')
      }
    } catch (error) {
      console.error('Error joining room:', error)
      // Even on error, try to show the room (user might already be a member)
      setIsJoined(true)
    }
  }

  const handleCancelJoin = () => {
    // Go back to room selection
    window.history.back()
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
      "Your Country": "🌍",
    }
    return flags[country] || "🌍"
  }

  const onlineUsers = roomParticipants.filter((user) => user.isOnline)

  // Show join prompt if user is not a member
  if (!isCheckingMembership && !isJoined && user) {
    return (
      <RoomJoinPrompt
        room={room}
        onJoin={handleJoinRoom}
        onCancel={handleCancelJoin}
      />
    )
  }

  // Show loading while checking membership
  if (isCheckingMembership) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking room access...</p>
        </div>
      </div>
    )
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
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{room.name}</h2>
              <p className="text-sm text-gray-600">{room.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={categoryColors[room.category]}>{room.category}</Badge>

            {/* Group Call Button */}
            {!isGroupCallActive ? (
              <Button onClick={startGroupCall} size="sm" className="bg-green-500 hover:bg-green-600">
                <Phone className="h-4 w-4 mr-1" />
                Start Call
              </Button>
            ) : !isInCall ? (
              <Button onClick={joinGroupCall} size="sm" className="bg-blue-500 hover:bg-blue-600">
                <UserPlus className="h-4 w-4 mr-1" />
                Join Call ({groupCallParticipants.length})
              </Button>
            ) : (
              <Button onClick={leaveGroupCall} size="sm" variant="destructive">
                <PhoneOff className="h-4 w-4 mr-1" />
                Leave Call
              </Button>
            )}

            <Button variant="outline" size="sm" onClick={() => setShowMembers(!showMembers)} className="relative">
              <Users className="h-4 w-4 mr-1" />
              {roomParticipants.length}
              <div className="w-2 h-2 bg-green-500 rounded-full absolute -top-1 -right-1"></div>
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Group Call Interface */}
          {isGroupCallActive && (
            <GroupCallInterface 
              roomId={room.id}
              userId={user?.id || ''}
              userName={user?.name || 'Unknown User'}
              participants={groupCallParticipants} 
              isInCall={isInCall} 
              onLeave={leaveGroupCall} 
            />
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {isLoadingMessages ? (
              <p className="text-center py-8">Loading messages...</p>
            ) : messages.length === 0 ? (
              <p className="text-center py-8">No messages yet in this chat. Be the first to send one!</p>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.author === currentUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`flex max-w-xs lg:max-w-md ${message.author === currentUser ? "flex-row-reverse" : "flex-row"} items-start space-x-2`}
                  >
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarFallback className="text-xs">{getInitials(message.author)}</AvatarFallback>
                    </Avatar>
                    <div className={`${message.author === currentUser ? "mr-2" : "ml-2"}`}>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">{message.author}</span>
                        {message.country && <span className="text-sm">{getCountryFlag(message.country)}</span>}
                        <span className="text-xs text-gray-500 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                      <div
                        className={`rounded-lg p-3 ${
                          message.author === currentUser ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-900"
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
            {isReadOnly ? (
              <div className="flex items-center justify-center space-x-2 p-3 bg-blue-50 rounded-lg">
                <span className="text-blue-700 text-sm">👀 You're in Guest Mode</span>
                {onShowLogin && (
                  <Button onClick={onShowLogin} size="sm" variant="outline">
                    Log in to chat
                  </Button>
                )}
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
                  placeholder={`Message ${room.name}...`}
                  className="flex-1"
                />
                <Button type="submit" disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            )}
          </div>
        </div>

        {/* Online Members Sidebar */}
        {showMembers && (
          <div className="w-64 border-l border-gray-200 bg-white">
            <OnlineMembers
              users={roomParticipants}
              onClose={() => setShowMembers(false)}
              groupCallParticipants={groupCallParticipants}
            />
          </div>
        )}
      </div>
    </div>
  )
}
