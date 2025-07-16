"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { LoginScreen } from "@/components/login-screen"
import { Sidebar } from "@/components/sidebar"
import { ChatRoom } from "@/components/chat-room"
import { WelcomeScreen } from "@/components/welcome-screen"
import { VoiceCall } from "@/components/voice-call"
import { PrivateChat } from "@/components/private-chat"
import { FriendsList } from "@/components/friends-list"
import { Loader2 } from "lucide-react"

export interface Room {
  id: string
  name: string
  topic: string
  category: "language" | "culture" | "technology" | "arts" | "science"
  description: string
  memberCount: number
  maxMembers: number
  isActive: boolean
  createdBy: string
  createdAt: Date
  lastActivity: Date
}

export interface Message {
  id: string
  content: string
  author: string
  timestamp: Date
  roomId: string
  country?: string
  type?: "text" | "image"
}

export interface Friend {
  id: string
  name: string
  country: string
  isOnline: boolean
  avatar?: string
  status: "pending" | "accepted" | "blocked"
  lastSeen?: Date
}

export interface PrivateMessage {
  id: string
  content: string
  senderId: string
  receiverId: string
  timestamp: Date
  type?: "text" | "image"
  isRead: boolean
}

export default function HomePage() {
  console.log('=== HOMEPAGE COMPONENT RENDERING ===')
  
  try {
    const { user, isLoading } = useAuth()
    console.log('Auth state:', { user: user?.id, isLoading })
    
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
    const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null)
    const [rooms, setRooms] = useState<Room[]>([])
    const [friends, setFriends] = useState<Friend[]>([])
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [currentView, setCurrentView] = useState<"chat" | "voice" | "private" | "friends">("chat")
    const [isLoadingData, setIsLoadingData] = useState(true)
    const [showGuestMode, setShowGuestMode] = useState(false)
    
    console.log('Initial state:', { rooms: rooms.length, friends: friends.length, isLoadingData, showGuestMode })

  // Fetch data from database
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch rooms
        console.log('=== STARTING ROOMS FETCH ===')
        const roomsResponse = await fetch('/api/rooms')
        console.log('Rooms API response status:', roomsResponse.status)
        
        if (roomsResponse.ok) {
          const roomsData = await roomsResponse.json()
          console.log('=== RAW ROOMS DATA FROM API ===')
          console.log('Type of roomsData:', typeof roomsData)
          console.log('Is Array:', Array.isArray(roomsData))
          console.log('Length:', roomsData?.length)
          console.log('Raw rooms data from API:', JSON.stringify(roomsData, null, 2))
          
          // Transform database format to component format
          console.log('=== STARTING ROOMS FILTERING ===')
          const transformedRooms: Room[] = roomsData
            .filter((room: any, index: number) => {
              console.log(`=== FILTERING ROOM ${index} ===`)
              console.log('Room object:', JSON.stringify(room, null, 2))
              console.log('Room type:', typeof room)
              console.log('Room is null:', room === null)
              console.log('Room is undefined:', room === undefined)
              
              if (!room || !room.id) {
                console.warn(`❌ Skipping room ${index} with missing data:`, room)
                return false
              }
              console.log(`✅ Room ${index} has valid ID:`, room.id)
              console.log(`✅ Room ${index} PASSED FILTER`)
              return true
            })
            .map((room: any, index: number) => {
              console.log(`=== MAPPING ROOM ${index} ===`)
              try {
                const transformedRoom = {
                  id: room.id,
                  name: room.name || 'Unnamed Room',
                  topic: room.description || 'Cultural Exchange',
                  category: 'culture' as const, // Default category
                  description: room.description || '',
                  memberCount: Array.isArray(room.participants) ? room.participants.length : 0,
                  maxMembers: room.maxParticipants || 50,
                  isActive: true,
                  createdBy: room.createdBy?.fullName || room.createdBy?.username || 'Unknown',
                  createdAt: new Date(room.createdAt || Date.now()),
                  lastActivity: new Date(room.updatedAt || room.createdAt || Date.now()),
                }
                console.log(`✅ Created room object ${index}:`, JSON.stringify(transformedRoom, null, 2))
                return transformedRoom
              } catch (error) {
                console.error(`❌ Error processing room ${index}:`, room, error)
                console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
                return null
              }
            })
            .filter((room: Room | null, index: number): room is Room => {
              if (room === null) {
                console.log(`❌ Filtering out null room at index ${index}`)
                return false
              }
              console.log(`✅ Keeping room at index ${index}:`, room.id)
              return true
            })
          
          console.log('=== FINAL TRANSFORMED ROOMS ===')
          console.log('Final rooms array:', JSON.stringify(transformedRooms, null, 2))
          console.log('Final rooms count:', transformedRooms.length)
          
          setRooms(transformedRooms)
        }

        // Only fetch actual friends if logged in
        if (user) {
          console.log('=== STARTING FRIENDS FETCH ===')
          console.log('Current user:', user)
          
          const friendsResponse = await fetch(`/api/friendships?userId=${user.id}&type=accepted`)
          console.log('Friends API response status:', friendsResponse.status)
          
          if (friendsResponse.ok) {
            const friendsData = await friendsResponse.json()
            // Transform to friends format
            console.log('=== RAW FRIENDS DATA FROM API ===')
            console.log('Type of friendsData:', typeof friendsData)
            console.log('Is Array:', Array.isArray(friendsData))
            console.log('Length:', friendsData?.length)
            console.log('Raw friends data from API:', JSON.stringify(friendsData, null, 2))
            
            console.log('=== STARTING FRIENDSHIP FILTERING ===')
            const transformedFriends: Friend[] = friendsData
              .filter((friendship: any, index: number) => {
                console.log(`=== FILTERING FRIENDSHIP ${index} ===`)
                console.log('Friendship object:', JSON.stringify(friendship, null, 2))
                console.log('Friendship type:', typeof friendship)
                console.log('Friendship is null:', friendship === null)
                console.log('Friendship is undefined:', friendship === undefined)
                
                // Filter out friendships with missing data
                if (!friendship || !friendship.id) {
                  console.warn(`❌ Skipping friendship ${index} with missing ID:`, friendship)
                  return false
                }
                console.log(`✅ Friendship ${index} has ID:`, friendship.id)
                
                if (!friendship.requester || !friendship.receiver) {
                  console.warn(`❌ Skipping friendship ${index} with missing requester/receiver:`, friendship.id, friendship)
                  return false
                }
                console.log(`✅ Friendship ${index} has requester and receiver`)
                
                if (!friendship.requester.id || !friendship.receiver.id) {
                  console.warn(`❌ Skipping friendship ${index} with missing user IDs:`, friendship.id, friendship)
                  return false
                }
                console.log(`✅ Friendship ${index} has valid user IDs`)
                console.log(`✅ Friendship ${index} PASSED FILTER`)
                return true
              })
              .map((friendship: any, index: number) => {
                console.log(`=== MAPPING FRIENDSHIP ${index} ===`)
                try {
                  console.log('Processing friendship ID:', friendship.id)
                  console.log('Current user ID:', user.id)
                  console.log('Requester object:', JSON.stringify(friendship.requester, null, 2))
                  console.log('Receiver object:', JSON.stringify(friendship.receiver, null, 2))
                  
                  // Determine which user is the friend (not the current user)
                  const friendUser = friendship.requester.id === user.id ? friendship.receiver : friendship.requester
                  console.log('Selected friend user object:', JSON.stringify(friendUser, null, 2))
                  console.log('Friend user ID:', friendUser?.id)
                  console.log('Friend user type:', typeof friendUser)
                  
                  // Add additional safety checks
                  if (!friendUser || !friendUser.id) {
                    console.error(`❌ Invalid friend user data for friendship ${index}:`, friendUser)
                    return null
                  }
                  
                  console.log(`✅ Friend user ${index} is valid, creating friend object...`)
                  
                  const friend: Friend = {
                    id: friendUser.id,
                    name: friendUser.fullName || friendUser.username || 'Unknown User',
                    country: friendUser.country || 'Unknown',
                    isOnline: friendUser.isOnline || false,
                    status: 'accepted' as const,
                    lastSeen: friendUser.lastSeenAt ? new Date(friendUser.lastSeenAt) : new Date(),
                  }
                  
                  console.log(`✅ Created friend object ${index}:`, JSON.stringify(friend, null, 2))
                  return friend
                } catch (error) {
                  console.error(`❌ Error processing friendship ${index}:`, friendship, error)
                  console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
                  return null
                }
              })
              .filter((friend: Friend | null, index: number): friend is Friend => {
                if (friend === null) {
                  console.log(`❌ Filtering out null friend at index ${index}`)
                  return false
                }
                console.log(`✅ Keeping friend at index ${index}:`, friend.id)
                return true
              }) // Remove null entries
            
            console.log('=== FINAL TRANSFORMED FRIENDS ===')
            console.log('Final friends array:', JSON.stringify(transformedFriends, null, 2))
            console.log('Final friends count:', transformedFriends.length)
            
            setFriends(transformedFriends)
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        // Fallback to empty arrays if API fails
        setRooms([])
        setFriends([])
      } finally {
        setIsLoadingData(false)
      }
    }

    // Always fetch rooms, but only fetch users if logged in
    fetchData()
  }, [user])

  // Show loading screen only briefly while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Loading Cultural Exchange...</p>
        </div>
      </div>
    )
  }

  // Show login screen as default, unless user is logged in or guest mode is active
  if (!user && !showGuestMode) {
    return <LoginScreen onGuestMode={() => setShowGuestMode(true)} />
  }

  const showWelcomeScreen = () => {
    setSelectedRoom(null)
    setSelectedFriend(null)
    setCurrentView("chat")
  }

  const handleRoomSelect = (room: Room) => {
    setSelectedRoom(room)
    setSelectedFriend(null)
    setCurrentView("chat")
  }

  const handleFriendSelect = (friend: Friend) => {
    setSelectedFriend(friend)
    setSelectedRoom(null)
    setCurrentView("private")
  }

  const addRoom = async (newRoom: Omit<Room, "id" | "createdAt" | "lastActivity">) => {
    console.log('=== FRONTEND: ADD ROOM STARTED ===')
    console.log('New room data:', JSON.stringify(newRoom, null, 2))
    
    if (!user) {
      console.error('❌ Cannot create room: user not authenticated')
      return
    }

    console.log('✅ User authenticated:', { id: user.id, name: user.name })

    try {
      const requestBody = {
        name: newRoom.name,
        description: newRoom.description,
        isPrivate: false,
        maxParticipants: newRoom.maxMembers,
        createdById: user.id,
      }
      
      console.log('✅ Sending request to /api/rooms with body:', JSON.stringify(requestBody, null, 2))

      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      console.log('✅ Response received:', { status: response.status, ok: response.ok })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ Failed to create room:', errorData)
        throw new Error(`Failed to create room: ${errorData.error || 'Unknown error'}`)
      }

      const createdRoom = await response.json()
      console.log('✅ Room created successfully in backend:', JSON.stringify(createdRoom, null, 2))

      // Transform the database room format to component format
      const transformedRoom: Room = {
        id: createdRoom.id,
        name: createdRoom.name,
        topic: createdRoom.description || 'Cultural Exchange',
        category: newRoom.category, // Keep the category from the form
        description: createdRoom.description || '',
        memberCount: createdRoom.participants?.length || 1,
        maxMembers: createdRoom.maxParticipants || 50,
        isActive: true,
        createdBy: createdRoom.createdBy?.fullName || createdRoom.createdBy?.username || 'You',
        createdAt: new Date(createdRoom.createdAt),
        lastActivity: new Date(createdRoom.updatedAt),
      }

      console.log('✅ Transformed room for frontend:', JSON.stringify(transformedRoom, null, 2))

      // Add the new room to the local state
      setRooms((prev) => {
        const newRooms = [...prev, transformedRoom]
        console.log('✅ Updated rooms state:', newRooms.length, 'rooms total')
        return newRooms
      })
      
      // Select the newly created room
      setSelectedRoom(transformedRoom)
      setCurrentView("chat")
      
      console.log('✅ Room added to state and selected:', transformedRoom.id)
      console.log('=== FRONTEND: ADD ROOM COMPLETED ===')
    } catch (error) {
      console.error('❌ Error creating room:', error)
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
      // You might want to show a toast notification here
    }
  }

  const addFriend = (friendId: string) => {
    // This function is called when accepting a friend request
    // The friends list will be refreshed automatically by the FriendsList component
    // So we don't need to manually update it here
  }

  const refreshFriends = async () => {
    if (!user) return
    
    try {
      console.log('=== REFRESHING FRIENDS ===')
      console.log('Refreshing friends for user:', user.id)
      const friendsResponse = await fetch(`/api/friendships?userId=${user.id}&type=accepted`)
      console.log('Refresh API response status:', friendsResponse.status)
      
      if (friendsResponse.ok) {
        const friendsData = await friendsResponse.json()
        console.log('=== REFRESH RAW FRIENDS DATA ===')
        console.log('Type of friendsData:', typeof friendsData)
        console.log('Is Array:', Array.isArray(friendsData))
        console.log('Length:', friendsData?.length)
        console.log('Raw friends data:', JSON.stringify(friendsData, null, 2))
        console.log('Raw friends data from refresh:', friendsData)
        
        console.log('=== REFRESH STARTING FRIENDSHIP FILTERING ===')
        const transformedFriends: Friend[] = friendsData
          .filter((friendship: any, index: number) => {
            console.log(`=== REFRESH FILTERING FRIENDSHIP ${index} ===`)
            console.log('Friendship object:', JSON.stringify(friendship, null, 2))
            console.log('Friendship type:', typeof friendship)
            console.log('Friendship is null:', friendship === null)
            console.log('Friendship is undefined:', friendship === undefined)
            
            // Filter out friendships with missing data
            if (!friendship || !friendship.id) {
              console.warn(`❌ Refresh: Skipping friendship ${index} with missing ID:`, friendship)
              return false
            }
            console.log(`✅ Refresh: Friendship ${index} has ID:`, friendship.id)
            
            if (!friendship.requester || !friendship.receiver) {
              console.warn(`❌ Refresh: Skipping friendship ${index} with missing requester/receiver:`, friendship.id, friendship)
              return false
            }
            console.log(`✅ Refresh: Friendship ${index} has requester and receiver`)
            
            if (!friendship.requester.id || !friendship.receiver.id) {
              console.warn(`❌ Refresh: Skipping friendship ${index} with missing user IDs:`, friendship.id, friendship)
              return false
            }
            console.log(`✅ Refresh: Friendship ${index} has valid user IDs`)
            console.log(`✅ Refresh: Friendship ${index} PASSED FILTER`)
            return true
          })
          .map((friendship: any, index: number) => {
            console.log(`=== REFRESH MAPPING FRIENDSHIP ${index} ===`)
            try {
              const friendUser = friendship.requester.id === user.id ? friendship.receiver : friendship.requester
              console.log('Processing friendship in refresh:', friendship.id, 'friendUser:', JSON.stringify(friendUser, null, 2))
              console.log('Friend user ID:', friendUser?.id)
              console.log('Friend user type:', typeof friendUser)
              
              // Add additional safety checks
              if (!friendUser || !friendUser.id) {
                console.error(`❌ Refresh: Invalid friend user data for friendship ${index}:`, friendUser)
                return null
              }
              
              console.log(`✅ Refresh: Friend user ${index} is valid, creating friend object...`)
              
              const friend: Friend = {
                id: friendUser.id,
                name: friendUser.fullName || friendUser.username || 'Unknown User',
                country: friendUser.country || 'Unknown',
                isOnline: friendUser.isOnline || false,
                status: 'accepted' as const,
                lastSeen: friendUser.lastSeenAt ? new Date(friendUser.lastSeenAt) : new Date(),
              }
              
              console.log(`✅ Refresh: Created friend object ${index}:`, JSON.stringify(friend, null, 2))
              return friend
            } catch (error) {
              console.error(`❌ Refresh: Error processing friendship ${index}:`, friendship, error)
              console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
              return null
            }
          })
          .filter((friend: Friend | null, index: number): friend is Friend => {
            if (friend === null) {
              console.log(`❌ Refresh: Filtering out null friend at index ${index}`)
              return false
            }
            console.log(`✅ Refresh: Keeping friend at index ${index}:`, friend.id)
            return true
          }) // Remove null entries
        
        console.log('=== REFRESH FINAL TRANSFORMED FRIENDS ===')
        console.log('Final friends array:', JSON.stringify(transformedFriends, null, 2))
        console.log('Final friends count:', transformedFriends.length)
        
        setFriends(transformedFriends)
        
        // Also refresh the sidebar friends list
        setTimeout(() => {
          const event = new CustomEvent('friendsUpdated', { detail: transformedFriends })
          window.dispatchEvent(event)
        }, 100)
      } else {
        console.error('Failed to fetch friends:', friendsResponse.status)
      }
    } catch (error) {
      console.error('Error refreshing friends:', error)
    }
  }

  const updateRoomActivity = (roomId: string) => {
    setRooms((prev) => prev.map((room) => (room.id === roomId ? { ...room, lastActivity: new Date() } : room)))
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Guest Mode Header */}
      {!user && showGuestMode && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-blue-50 border-b border-blue-200 p-3 text-center">
          <div className="flex items-center justify-center space-x-4">
            <span className="text-blue-700 text-sm">👀 You're browsing in Guest Mode</span>
            <button
              onClick={() => setShowGuestMode(false)}
              className="text-blue-600 hover:text-blue-800 underline text-sm font-medium"
            >
              Log in for full access
            </button>
          </div>
        </div>
      )}

      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed lg:static inset-y-0 left-0 z-50 w-80 transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        ${!user && showGuestMode ? 'top-12' : ''}
      `}
      >
        <Sidebar
          rooms={rooms}
          friends={user ? friends : []} // Only show friends if logged in
          selectedRoom={selectedRoom}
          selectedFriend={selectedFriend}
          onRoomSelect={handleRoomSelect}
          onFriendSelect={handleFriendSelect}
          onClose={() => setIsSidebarOpen(false)}
          onVoiceCallClick={() => setCurrentView("voice")}
          onFriendsClick={() => setCurrentView("friends")}
          onShowWelcome={showWelcomeScreen}
          onAddRoom={addRoom}
          currentView={currentView}
        />
      </div>

      {/* Main content */}
      <div className={`flex-1 flex flex-col min-w-0 ${!user && showGuestMode ? 'mt-12' : ''}`}>
        {currentView === "voice" ? (
          <VoiceCall onMenuClick={() => setIsSidebarOpen(true)} onBackToChat={() => setCurrentView("chat")} />
        ) : currentView === "private" && selectedFriend && user ? (
          <PrivateChat friend={selectedFriend} onMenuClick={() => setIsSidebarOpen(true)} />
        ) : currentView === "friends" && user ? (
          <FriendsList
            friends={friends}
            onMenuClick={() => setIsSidebarOpen(true)}
            onAddFriend={addFriend}
            onFriendSelect={handleFriendSelect}
            onFriendsUpdate={refreshFriends}
          />
        ) : selectedRoom ? (
          <ChatRoom
            room={selectedRoom}
            onMenuClick={() => setIsSidebarOpen(true)}
            onActivity={() => updateRoomActivity(selectedRoom.id)}
            isReadOnly={!user} // Make chat read-only for guests
            onShowLogin={() => setShowGuestMode(false)}
          />
        ) : (
          <WelcomeScreen onMenuClick={() => setIsSidebarOpen(true)} />
        )}
      </div>
    </div>
  )
  } catch (error) {
    console.error('=== HOMEPAGE COMPONENT ERROR ===')
    console.error('Error in HomePage component:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    // Return a simple error fallback
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Something went wrong</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Reload Page
          </button>
        </div>
      </div>
    )
  }
}
