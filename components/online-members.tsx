"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { X, Phone } from "lucide-react"

interface ChatUser {
  id: string
  name: string
  country: string
  isOnline: boolean
  avatar?: string
}

interface OnlineMembersProps {
  users: ChatUser[]
  onClose: () => void
  groupCallParticipants: string[]
}

export function OnlineMembers({ users, onClose, groupCallParticipants }: OnlineMembersProps) {
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

  const onlineUsers = users.filter((user) => user.isOnline)
  const offlineUsers = users.filter((user) => !user.isOnline)

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Members</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Members List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Online Members */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            Online ({onlineUsers.length})
          </h4>
          <div className="space-y-2">
            {onlineUsers.map((user) => (
              <Card key={user.id} className="p-3">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="text-sm">{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                      {groupCallParticipants.includes(user.name) && (
                        <div className="flex items-center">
                          <Phone className="h-3 w-3 text-green-500" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {getCountryFlag(user.country)} {user.country}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Offline Members */}
        {offlineUsers.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
              Offline ({offlineUsers.length})
            </h4>
            <div className="space-y-2">
              {offlineUsers.map((user) => (
                <Card key={user.id} className="p-3 opacity-60">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="text-sm">{getInitials(user.name)}</AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-gray-400 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-500 truncate">{user.name}</p>
                      <p className="text-xs text-gray-400">
                        {getCountryFlag(user.country)} {user.country}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Group Call Info */}
      {groupCallParticipants.length > 0 && (
        <div className="p-4 border-t border-gray-200 bg-green-50">
          <div className="flex items-center space-x-2 mb-2">
            <Phone className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">Group Call Active</span>
          </div>
          <p className="text-xs text-green-700">
            {groupCallParticipants.length} participant{groupCallParticipants.length !== 1 ? "s" : ""} in call
          </p>
        </div>
      )}
    </div>
  )
}
