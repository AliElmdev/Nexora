"use client"

import { useState, useEffect } from "react"
import type { Friend } from "@/app/page"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Menu, Search, UserPlus, MessageCircle, Check, X } from "lucide-react"
import { useAuth } from "@/components/auth-provider"

interface FriendsListProps {
  friends: Friend[]
  onMenuClick: () => void
  onAddFriend: (friendId: string) => void
  onFriendSelect: (friend: Friend) => void
  onFriendsUpdate?: () => void
}

interface UserSuggestion {
  id: string
  username: string
  fullName: string | null
  avatarUrl: string | null
  country: string | null
  language: string | null
}

interface PendingRequest {
  id: string
  requester: {
    id: string
    username: string
    fullName: string | null
    avatarUrl: string | null
    country: string | null
    language: string | null
  }
}

export function FriendsList({ friends, onMenuClick, onAddFriend, onFriendSelect, onFriendsUpdate }: FriendsListProps) {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState<"friends" | "requests" | "suggestions">("friends")
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([])
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([])
  const [loading, setLoading] = useState(false)

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
      China: "🇨🇳",
      Italy: "🇮🇹",
    }
    return flags[country] || "🌍"
  }

  // Show only accepted friends (both online and offline)
  const acceptedFriends = friends.filter((f) => f.status === "accepted")
  
  // Separate online and offline friends for better organization
  const onlineFriends = acceptedFriends.filter((f) => f.isOnline)
  const offlineFriends = acceptedFriends.filter((f) => !f.isOnline)

  // Handler functions
  const handleSendRequest = async (receiverId: string) => {
    if (!user?.id) return
    
    try {
      const response = await fetch('/api/friendships', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requesterId: user.id,
          receiverId,
        }),
      })

      if (response.ok) {
        // Remove from suggestions and refresh
        setSuggestions(prev => prev.filter(s => s.id !== receiverId))
        // Refresh pending requests
        const requestsResponse = await fetch(`/api/friendships?userId=${user.id}&type=pending`)
        if (requestsResponse.ok) {
          const requestsData = await requestsResponse.json()
          setPendingRequests(requestsData)
        }
      }
    } catch (error) {
      console.error('Error sending friend request:', error)
    }
  }

  const handleAcceptRequest = async (friendshipId: string) => {
    if (!user?.id) return
    
    try {
      console.log('Accepting friend request:', friendshipId, 'for user:', user.id)
      const response = await fetch('/api/friendships', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          friendshipId,
          userId: user.id,
          action: 'accept',
        }),
      })

      if (response.ok) {
        console.log('Friend request accepted successfully')
        const result = await response.json()
        console.log('Accept result:', result)
        
        // Remove from pending requests
        setPendingRequests(prev => prev.filter(r => r.id !== friendshipId))
        
        // Refresh friends list from parent
        if (onFriendsUpdate) {
          console.log('Calling onFriendsUpdate to refresh friends list')
          onFriendsUpdate()
        }
        
        // Also refresh suggestions to remove the accepted user
        const suggestionsResponse = await fetch(`/api/users/suggestions?userId=${user.id}`)
        if (suggestionsResponse.ok) {
          const suggestionsData = await suggestionsResponse.json()
          setSuggestions(suggestionsData)
        }
        
        // Force a page refresh to ensure the friends list is updated
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        console.error('Failed to accept friend request:', response.status)
        const errorData = await response.json()
        console.error('Error details:', errorData)
      }
    } catch (error) {
      console.error('Error accepting friend request:', error)
    }
  }

  const handleRejectRequest = async (friendshipId: string) => {
    if (!user?.id) return
    
    try {
      const response = await fetch('/api/friendships', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          friendshipId,
          userId: user.id,
          action: 'reject',
        }),
      })

      if (response.ok) {
        // Remove from pending requests
        setPendingRequests(prev => prev.filter(r => r.id !== friendshipId))
      }
    } catch (error) {
      console.error('Error rejecting friend request:', error)
    }
  }

  // Fetch suggestions and pending requests
  useEffect(() => {
    if (!user?.id) return

    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch suggestions
        const suggestionsResponse = await fetch(`/api/users/suggestions?userId=${user.id}`)
        if (suggestionsResponse.ok) {
          const suggestionsData = await suggestionsResponse.json()
          setSuggestions(suggestionsData)
        }

        // Fetch pending requests
        const requestsResponse = await fetch(`/api/friendships?userId=${user.id}&type=pending`)
        if (requestsResponse.ok) {
          const requestsData = await requestsResponse.json()
          setPendingRequests(requestsData)
        }
      } catch (error) {
        console.error('Error fetching friends data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user?.id])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" className="lg:hidden" onClick={onMenuClick}>
              <Menu className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Friends</h2>
              <p className="text-sm text-gray-600">Manage your connections</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-4 bg-gray-100 rounded-lg p-1">
          <Button
            variant={activeTab === "friends" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("friends")}
            className="flex-1"
          >
            Friends ({acceptedFriends.length})
            {onlineFriends.length > 0 && (
              <div className="ml-1 w-2 h-2 bg-green-500 rounded-full"></div>
            )}
          </Button>
          <Button
            variant={activeTab === "requests" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("requests")}
            className="flex-1 relative"
          >
            Requests
            {pendingRequests.length > 0 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {pendingRequests.length}
              </div>
            )}
          </Button>
          <Button
            variant={activeTab === "suggestions" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("suggestions")}
            className="flex-1"
          >
            Suggestions ({suggestions.length})
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search friends..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "friends" && (
          <div className="space-y-6">
            {/* Online Friends Section */}
            {onlineFriends.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-green-600 mb-3 flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Online Friends ({onlineFriends.length})
                </h3>
                <div className="space-y-3">
                  {onlineFriends.map((friend) => (
                    <Card key={friend.id} className="hover:shadow-md transition-shadow border-l-4 border-l-green-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              <Avatar className="w-12 h-12">
                                <AvatarFallback>{getInitials(friend.name)}</AvatarFallback>
                              </Avatar>
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">{friend.name}</h3>
                              <p className="text-sm text-gray-600">
                                {getCountryFlag(friend.country)} {friend.country}
                              </p>
                              <p className="text-xs text-green-600 font-medium">Online</p>
                            </div>
                          </div>
                          <Button onClick={() => onFriendSelect(friend)} size="sm">
                            <MessageCircle className="h-4 w-4 mr-1" />
                            Chat
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Offline Friends Section */}
            {offlineFriends.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                  Offline Friends ({offlineFriends.length})
                </h3>
                <div className="space-y-3">
                  {offlineFriends.map((friend) => (
                    <Card key={friend.id} className="hover:shadow-md transition-shadow opacity-75">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              <Avatar className="w-12 h-12">
                                <AvatarFallback>{getInitials(friend.name)}</AvatarFallback>
                              </Avatar>
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gray-400 rounded-full border-2 border-white" />
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">{friend.name}</h3>
                              <p className="text-sm text-gray-600">
                                {getCountryFlag(friend.country)} {friend.country}
                              </p>
                              <p className="text-xs text-gray-500">
                                Last seen {friend.lastSeen?.toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                          <Button onClick={() => onFriendSelect(friend)} size="sm" variant="outline">
                            <MessageCircle className="h-4 w-4 mr-1" />
                            Chat
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* No Friends Message */}
            {acceptedFriends.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No friends yet. Check the Suggestions tab to find people to connect with!</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "requests" && (
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                <p>Loading requests...</p>
              </div>
            ) : (
              <>
                {pendingRequests.map((request) => (
                  <Card key={request.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-12 h-12">
                            <AvatarFallback>{getInitials(request.requester.fullName || request.requester.username)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium text-gray-900">{request.requester.fullName || request.requester.username}</h3>
                            <p className="text-sm text-gray-600">
                              {getCountryFlag(request.requester.country || 'Unknown')} {request.requester.country || 'Unknown'}
                            </p>
                            <Badge variant="outline" className="text-xs mt-1">
                              Friend Request
                            </Badge>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => handleAcceptRequest(request.id)}
                            size="sm"
                            className="bg-green-500 hover:bg-green-600"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button 
                            onClick={() => handleRejectRequest(request.id)}
                            variant="outline" 
                            size="sm"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {pendingRequests.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No pending friend requests</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === "suggestions" && (
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                <p>Loading suggestions...</p>
              </div>
            ) : (
              <>
                {suggestions.map((user) => (
                  <Card key={user.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-12 h-12">
                            <AvatarFallback>{getInitials(user.fullName || user.username)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium text-gray-900">{user.fullName || user.username}</h3>
                            <p className="text-sm text-gray-600">
                              {getCountryFlag(user.country || 'Unknown')} {user.country || 'Unknown'}
                            </p>
                            <p className="text-xs text-gray-500">Suggested based on interests</p>
                          </div>
                        </div>
                        <Button 
                          onClick={() => handleSendRequest(user.id)}
                          size="sm" 
                          variant="outline"
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          Add Friend
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {suggestions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No suggestions available</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
