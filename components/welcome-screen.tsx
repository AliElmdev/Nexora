"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Menu, MessageCircle, Users, Globe, BookOpen, Palette, Cpu, Microscope, Phone } from "lucide-react"
import { ProfileDropdown } from "@/components/profile-dropdown"

interface WelcomeScreenProps {
  onMenuClick: () => void
}

const features = [
  {
    icon: MessageCircle,
    title: "Real-time Chat",
    description: "Connect instantly with learners worldwide",
  },
  {
    icon: Phone,
    title: "Voice Calls",
    description: "Practice speaking with random partners",
  },
  {
    icon: Globe,
    title: "Cultural Exchange",
    description: "Share and learn about different cultures",
  },
  {
    icon: Users,
    title: "Study Groups",
    description: "Join topic-focused learning communities",
  },
]

const categories = [
  { name: "Languages", icon: BookOpen, color: "bg-blue-100 text-blue-800", count: 12 },
  { name: "Culture", icon: Globe, color: "bg-purple-100 text-purple-800", count: 8 },
  { name: "Technology", icon: Cpu, color: "bg-green-100 text-green-800", count: 15 },
  { name: "Arts", icon: Palette, color: "bg-pink-100 text-pink-800", count: 6 },
  { name: "Science", icon: Microscope, color: "bg-orange-100 text-orange-800", count: 9 },
]

export function WelcomeScreen({ onMenuClick }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" size="sm" className="lg:hidden mr-3" onClick={onMenuClick}>
              <Menu className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-bold text-gray-900">Welcome to Cultural Exchange</h1>
          </div>
          <div className="hidden lg:block">
            <ProfileDropdown />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          {/* Hero section */}
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Connect, Learn, and Share Cultures</h2>
            <p className="text-lg text-gray-600 mb-8">
              Join topic-based chat rooms to practice languages, explore cultures, and learn together with people from
              around the world.
            </p>
            <Button size="lg" onClick={onMenuClick} className="lg:hidden">
              Browse Chat Rooms
            </Button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {features.map((feature, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <feature.icon className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Categories */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Explore Categories</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {categories.map((category, index) => (
                <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-6 text-center">
                    <category.icon className="h-8 w-8 mx-auto mb-3 text-gray-600" />
                    <h4 className="font-semibold text-gray-900 mb-2">{category.name}</h4>
                    <Badge className={category.color}>{category.count} rooms</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Getting started */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
            <CardHeader>
              <CardTitle className="text-xl text-center">Getting Started</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                    1
                  </div>
                  <h4 className="font-semibold mb-2">Choose a Room</h4>
                  <p className="text-sm text-gray-600">Browse rooms by topic or language</p>
                </div>
                <div>
                  <div className="w-12 h-12 bg-purple-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                    2
                  </div>
                  <h4 className="font-semibold mb-2">Join the Conversation</h4>
                  <p className="text-sm text-gray-600">Start chatting with fellow learners</p>
                </div>
                <div>
                  <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                    3
                  </div>
                  <h4 className="font-semibold mb-2">Learn & Share</h4>
                  <p className="text-sm text-gray-600">Exchange knowledge and cultures</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
