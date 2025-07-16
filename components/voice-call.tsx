"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import {
  Menu,
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  RotateCcw,
  MessageCircle,
  Globe,
  Clock,
} from "lucide-react"

interface VoiceCallProps {
  onMenuClick: () => void
  onBackToChat: () => void
}

interface CallUser {
  id: string
  name: string
  country: string
  age: number
  interests: string[]
  isOnline: boolean
  profilePicture?: string
}

const countries = [
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "ES", name: "Spain", flag: "🇪🇸" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },
  { code: "BR", name: "Brazil", flag: "🇧🇷" },
  { code: "IT", name: "Italy", flag: "🇮🇹" },
  { code: "KR", name: "South Korea", flag: "🇰🇷" },
  { code: "CN", name: "China", flag: "🇨🇳" },
  { code: "IN", name: "India", flag: "🇮🇳" },
]

const sampleUsers: CallUser[] = [
  {
    id: "1",
    name: "Sofia",
    country: "Spain",
    age: 24,
    interests: ["Spanish", "Art", "Travel"],
    isOnline: true,
  },
  {
    id: "2",
    name: "Hiroshi",
    country: "Japan",
    age: 28,
    interests: ["Japanese", "Technology", "Anime"],
    isOnline: true,
  },
  {
    id: "3",
    name: "Emma",
    country: "France",
    age: 22,
    interests: ["French", "Literature", "Cooking"],
    isOnline: true,
  },
]

type CallState = "idle" | "searching" | "connecting" | "connected" | "ended"

export function VoiceCall({ onMenuClick, onBackToChat }: VoiceCallProps) {
  const [callState, setCallState] = useState<CallState>("idle")
  const [selectedCountry, setSelectedCountry] = useState<string>("any")
  const [ageRange, setAgeRange] = useState<number[]>([18, 65])
  const [currentUser, setCurrentUser] = useState<CallUser | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isSpeakerOn, setIsSpeakerOn] = useState(true)
  const [callDuration, setCallDuration] = useState(0)
  const [searchingTime, setSearchingTime] = useState(0)

  // Timer effects
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (callState === "connected") {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [callState])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (callState === "searching") {
      interval = setInterval(() => {
        setSearchingTime((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [callState])

  const startSearch = () => {
    setCallState("searching")
    setSearchingTime(0)

    // Simulate finding a match after 3-8 seconds
    const searchTime = Math.random() * 5000 + 3000
    setTimeout(() => {
      const availableUsers = sampleUsers.filter((user) => {
        const countryMatch = selectedCountry === "any" || user.country === selectedCountry
        const ageMatch = user.age >= ageRange[0] && user.age <= ageRange[1]
        return countryMatch && ageMatch && user.isOnline
      })

      if (availableUsers.length > 0) {
        const randomUser = availableUsers[Math.floor(Math.random() * availableUsers.length)]
        setCurrentUser(randomUser)
        setCallState("connecting")

        // Simulate connection after 2 seconds
        setTimeout(() => {
          setCallState("connected")
          setCallDuration(0)
        }, 2000)
      } else {
        setCallState("idle")
        alert("No users found matching your criteria. Please try different filters.")
      }
    }, searchTime)
  }

  const endCall = () => {
    setCallState("ended")
    setTimeout(() => {
      setCallState("idle")
      setCurrentUser(null)
      setCallDuration(0)
      setSearchingTime(0)
    }, 2000)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const getCountryFlag = (countryName: string) => {
    const country = countries.find((c) => c.name === countryName)
    return country?.flag || "🌍"
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" className="lg:hidden" onClick={onMenuClick}>
              <Menu className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Voice Chat</h2>
              <p className="text-sm text-gray-600">Connect with random language partners</p>
            </div>
          </div>
          <Button variant="outline" onClick={onBackToChat}>
            <MessageCircle className="h-4 w-4 mr-2" />
            Back to Chat
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Filters Card */}
          {callState === "idle" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="h-5 w-5 mr-2" />
                  Find Your Language Partner
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Country Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Country</label>
                  <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">🌍 Any Country</SelectItem>
                      {countries.map((country) => (
                        <SelectItem key={country.code} value={country.name}>
                          {country.flag} {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Age Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Age Range: {ageRange[0]} - {ageRange[1]} years
                  </label>
                  <Slider value={ageRange} onValueChange={setAgeRange} max={65} min={18} step={1} className="w-full" />
                </div>

                {/* Start Call Button */}
                <Button onClick={startSearch} className="w-full" size="lg">
                  <Phone className="h-4 w-4 mr-2" />
                  Find Partner & Start Call
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Searching State */}
          {callState === "searching" && (
            <Card className="text-center">
              <CardContent className="p-8">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold mb-2">Searching for a partner...</h3>
                <p className="text-gray-600 mb-4">
                  Looking for someone from {selectedCountry === "any" ? "anywhere" : selectedCountry} aged {ageRange[0]}
                  -{ageRange[1]}
                </p>
                <Badge variant="outline">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatTime(searchingTime)}
                </Badge>
                <div className="mt-4">
                  <Button variant="outline" onClick={() => setCallState("idle")}>
                    Cancel Search
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Connecting State */}
          {callState === "connecting" && currentUser && (
            <Card className="text-center">
              <CardContent className="p-8">
                <Avatar className="w-20 h-20 mx-auto mb-4">
                  <AvatarFallback className="text-lg">{getInitials(currentUser.name)}</AvatarFallback>
                </Avatar>
                <h3 className="text-xl font-semibold mb-2">{currentUser.name}</h3>
                <p className="text-gray-600 mb-2">
                  {getCountryFlag(currentUser.country)} {currentUser.country} • Age {currentUser.age}
                </p>
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  {currentUser.interests.map((interest, index) => (
                    <Badge key={index} variant="secondary">
                      {interest}
                    </Badge>
                  ))}
                </div>
                <div className="animate-pulse">
                  <p className="text-lg font-medium text-blue-600">Connecting...</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Connected State */}
          {callState === "connected" && currentUser && (
            <Card>
              <CardContent className="p-8 text-center">
                <Avatar className="w-24 h-24 mx-auto mb-4 ring-4 ring-green-500 ring-opacity-50">
                  <AvatarFallback className="text-xl">{getInitials(currentUser.name)}</AvatarFallback>
                </Avatar>
                <h3 className="text-2xl font-semibold mb-2">{currentUser.name}</h3>
                <p className="text-gray-600 mb-2">
                  {getCountryFlag(currentUser.country)} {currentUser.country} • Age {currentUser.age}
                </p>
                <div className="flex flex-wrap justify-center gap-2 mb-6">
                  {currentUser.interests.map((interest, index) => (
                    <Badge key={index} variant="secondary">
                      {interest}
                    </Badge>
                  ))}
                </div>

                {/* Call Duration */}
                <div className="bg-green-100 text-green-800 rounded-full px-4 py-2 inline-flex items-center mb-6">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  {formatTime(callDuration)}
                </div>

                {/* Call Controls */}
                <div className="flex justify-center space-x-4">
                  <Button
                    variant={isMuted ? "destructive" : "outline"}
                    size="lg"
                    onClick={() => setIsMuted(!isMuted)}
                    className="rounded-full w-14 h-14"
                  >
                    {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </Button>

                  <Button variant="destructive" size="lg" onClick={endCall} className="rounded-full w-14 h-14">
                    <PhoneOff className="h-5 w-5" />
                  </Button>

                  <Button
                    variant={isSpeakerOn ? "default" : "outline"}
                    size="lg"
                    onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                    className="rounded-full w-14 h-14"
                  >
                    {isSpeakerOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Call Ended State */}
          {callState === "ended" && (
            <Card className="text-center">
              <CardContent className="p-8">
                <div className="text-gray-400 mb-4">
                  <PhoneOff className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Call Ended</h3>
                <p className="text-gray-600 mb-4">Call duration: {formatTime(callDuration)}</p>
                <Button onClick={() => setCallState("idle")} className="mr-2">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Find Another Partner
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Tips Card */}
          {callState === "idle" && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-800">Voice Chat Tips</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-blue-700 space-y-2">
                <p>• Be respectful and patient with language learners</p>
                <p>• Speak clearly and at a moderate pace</p>
                <p>• Share your culture and ask about theirs</p>
                <p>• Use simple words if your partner is a beginner</p>
                <p>• Have fun and make new friends!</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
