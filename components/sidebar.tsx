"use client"

import { useState, useEffect } from "react"
import type { Room, Friend } from "@/app/page"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Users, Plus, X, Phone, UserPlus } from "lucide-react"
import { CreateRoomModal } from "@/components/create-room-modal"
import { ProfileDropdown } from "@/components/profile-dropdown"

interface SidebarProps {
  rooms: Room[]
  friends: Friend[]
  selectedRoom: Room | null
  selectedFriend: Friend | null
  onRoomSelect: (room: Room) => void
  onFriendSelect: (friend: Friend) => void
  onClose: () => void
  onVoiceCallClick: () => void
  onFriendsClick: () => void
  onShowWelcome: () => void
  onAddRoom: (room: Omit<Room, "id" | "createdAt" | "lastActivity">) => Promise<void>
  currentView: "chat" | "voice" | "private" | "friends"
}

const categoryColors = {
  language: "bg-blue-100 text-blue-800",
  culture: "bg-purple-100 text-purple-800",
  technology: "bg-green-100 text-green-800",
  arts: "bg-pink-100 text-pink-800",
  science: "bg-orange-100 text-orange-800",
}

export function Sidebar({
  rooms,
  friends,
  selectedRoom,
  selectedFriend,
  onRoomSelect,
  onFriendSelect,
  onClose,
  onVoiceCallClick,
  onFriendsClick,
  onShowWelcome,
  onAddRoom,
  currentView,
}: SidebarProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [activeTab, setActiveTab] = useState<"rooms" | "friends">("rooms")
  const [showCreateRoom, setShowCreateRoom] = useState(false)
  const [localFriends, setLocalFriends] = useState(friends)

  // Listen for friend updates
  useEffect(() => {
    const handleFriendsUpdate = (event: CustomEvent) => {
      console.log('Sidebar received friends update:', event.detail)
      setLocalFriends(event.detail)
    }

    window.addEventListener('friendsUpdated', handleFriendsUpdate as EventListener)
    
    return () => {
      window.removeEventListener('friendsUpdated', handleFriendsUpdate as EventListener)
    }
  }, [])

  // Update local friends when props change
  useEffect(() => {
    setLocalFriends(friends)
  }, [friends])

  const filteredRooms = (rooms || []).filter((room) => {
    if (!room || !room.name || !room.topic) return false
    const matchesSearch =
      room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.topic.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || room.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const filteredFriends = (localFriends || []).filter((friend) => {
    if (!friend || !friend.name) return false
    return friend.name.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const categories = ["all", "language", "culture", "technology", "arts", "science"]
  const onlineFriends = localFriends.filter((f) => f.isOnline && f.status === "accepted")

  const getInitials = (name: string) => {
    if (!name || name.trim().length === 0) {
      return "U"
    }
    
    const trimmedName = name.trim()
    if (trimmedName.length === 1) {
      return trimmedName.toUpperCase()
    }
    
    return trimmedName
      .split(" ")
      .map((n) => n && n.length > 0 ? n[0] : "")
      .filter((letter) => letter.length > 0)
      .join("")
      .toUpperCase()
      .slice(0, 2) // Limit to 2 characters max
  }

  const getCountryFlag = (country: string) => {
    if (!country || country === "Unknown" || country.trim().length === 0) {
      return "🌍"
    }
    
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
    <div className="h-full bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900">Cultural Exchange</h1>
          <div className="flex items-center space-x-2">
            <ProfileDropdown />
            <Button variant="ghost" size="sm" className="lg:hidden" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-4 bg-gray-100 rounded-lg p-1">
          <Button
            variant={activeTab === "rooms" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("rooms")}
            className="flex-1"
          >
            Rooms
          </Button>
          <Button
            variant={activeTab === "friends" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("friends")}
            className="flex-1 relative"
          >
            Friends
            {onlineFriends.length > 0 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 text-white text-xs rounded-full flex items-center justify-center">
                {onlineFriends.length}
              </div>
            )}
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category filters (only for rooms) */}
        {activeTab === "rooms" && (
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedCategory(category)
                  if (category === "all") {
                    onShowWelcome()
                  }
                }}
                className="text-xs"
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {activeTab === "rooms"
          ? // Rooms List
            (filteredRooms || []).map((room) => (
              <Card
                key={room.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedRoom?.id === room.id ? "ring-2 ring-blue-500 bg-blue-50" : ""
                }`}
                onClick={() => onRoomSelect(room)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-sm font-medium line-clamp-2">{room.name}</CardTitle>
                    {room.isActive && <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 mt-1" />}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-gray-600 mb-2 line-clamp-2">{room.description}</p>
                  <div className="flex items-center justify-between">
                    <Badge className={`text-xs ${categoryColors[room.category]}`}>{room.category}</Badge>
                    <div className="flex items-center text-xs text-gray-500">
                      <Users className="h-3 w-3 mr-1" />
                      {room.memberCount}/{room.maxMembers}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          : // Friends List
            (filteredFriends || []).map((friend) => (
              <Card
                key={friend.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedFriend?.id === friend.id ? "ring-2 ring-blue-500 bg-blue-50" : ""
                }`}
                onClick={() => onFriendSelect(friend)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium">{getInitials(friend.name)}</span>
                      </div>
                      <div
                        className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                          friend.isOnline ? "bg-green-500" : "bg-gray-400"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                        {friend.name && friend.name.trim().length > 0 ? friend.name : "Unknown User"}
                      </p>
                        {friend.status === "pending" && (
                          <Badge variant="outline" className="text-xs">
                            Pending
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {getCountryFlag(friend.country)} {friend.country}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Navigation buttons */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        <Button
          className={`w-full ${currentView === "voice" ? "bg-blue-500 text-white" : "bg-transparent"}`}
          variant={currentView === "voice" ? "default" : "outline"}
          onClick={onVoiceCallClick}
        >
          <Phone className="h-4 w-4 mr-2" />
          Voice Chat
        </Button>

        <Button
          className={`w-full ${currentView === "friends" ? "bg-purple-500 text-white" : "bg-transparent"}`}
          variant={currentView === "friends" ? "default" : "outline"}
          onClick={onFriendsClick}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Manage Friends
        </Button>

                    <Button 
              className="w-full bg-transparent" 
              variant="outline" 
              onClick={() => {
                console.log('=== SIDEBAR: CREATE ROOM BUTTON CLICKED ===')
                setShowCreateRoom(true)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Room
            </Button>
      </div>

      {/* Create Room Modal */}
      <CreateRoomModal isOpen={showCreateRoom} onClose={() => setShowCreateRoom(false)} onCreateRoom={onAddRoom} />
    </div>
  )
}
