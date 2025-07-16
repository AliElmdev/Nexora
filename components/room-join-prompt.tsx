"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, MessageCircle, ArrowRight } from "lucide-react"
import type { Room } from "@/app/page"
import { useAuth } from "@/components/auth-provider"

interface RoomJoinPromptProps {
  room: Room
  onJoin: () => void
  onCancel: () => void
}

export function RoomJoinPrompt({ room, onJoin, onCancel }: RoomJoinPromptProps) {
  const { user } = useAuth()
  const [isJoining, setIsJoining] = useState(false)

  const handleJoin = async () => {
    if (!user?.id) return
    
    setIsJoining(true)
    try {
      const response = await fetch(`/api/rooms/${room.id}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      })

      if (response.ok) {
        // Call onJoin immediately after successful join
        onJoin()
      } else {
        const errorData = await response.json()
        console.error('Failed to join room:', errorData.error)
        
        // If user is already a member, still proceed to show the room
        if (response.status === 409) {
          onJoin()
        }
      }
    } catch (error) {
      console.error('Error joining room:', error)
      // On error, still try to proceed (user might already be a member)
      onJoin()
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <div className="flex items-center justify-center h-full bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <MessageCircle className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle className="text-xl">Join {room.name}</CardTitle>
          <CardDescription>
            Join this room to participate in the conversation and see messages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Category:</span>
              <span className="text-sm font-medium capitalize">{room.category}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Members:</span>
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">
                  {room.memberCount}/{room.maxMembers}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Created by:</span>
              <span className="text-sm font-medium">{room.createdBy}</span>
            </div>
          </div>
          
          {room.description && (
            <div className="text-sm text-gray-600 bg-blue-50 rounded-lg p-3">
              <p className="font-medium text-blue-800 mb-1">About this room:</p>
              <p>{room.description}</p>
            </div>
          )}

          <div className="flex space-x-3 pt-2">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleJoin}
              disabled={isJoining}
              className="flex-1"
            >
              {isJoining ? (
                "Joining..."
              ) : (
                <>
                  Join Room
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 