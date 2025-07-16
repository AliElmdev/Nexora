"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth-provider"
import { Globe, MessageCircle, Users, Phone, Loader2 } from "lucide-react"

const providers = [
  {
    id: "google",
    name: "Google",
    icon: "🔍",
    color: "bg-red-500 hover:bg-red-600",
  },
  {
    id: "github",
    name: "GitHub",
    icon: "🐙",
    color: "bg-gray-800 hover:bg-gray-900",
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: "📘",
    color: "bg-blue-600 hover:bg-blue-700",
  },
  {
    id: "twitter",
    name: "Twitter",
    icon: "🐦",
    color: "bg-sky-500 hover:bg-sky-600",
  },
]

const features = [
  {
    icon: MessageCircle,
    title: "Group Chat Rooms",
    description: "Join topic-based discussions",
  },
  {
    icon: Phone,
    title: "Voice Calls",
    description: "Practice speaking with others",
  },
  {
    icon: Users,
    title: "Make Friends",
    description: "Connect with learners worldwide",
  },
  {
    icon: Globe,
    title: "Cultural Exchange",
    description: "Share and learn cultures",
  },
]

interface LoginScreenProps {
  onGuestMode?: () => void
}

export function LoginScreen({ onGuestMode }: LoginScreenProps) {
  const { login, isLoading } = useAuth()
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)

  const handleLogin = async (providerId: string) => {
    setSelectedProvider(providerId)
    try {
      await login(providerId)
    } catch (error) {
      console.error("Login failed:", error)
    } finally {
      setSelectedProvider(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Cultural Exchange</h1>
          <p className="text-xl text-gray-600 mb-2">Connect, Learn, and Share Cultures</p>
          <p className="text-gray-500">Join thousands of language learners worldwide</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Features Section */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Why Join Us?</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3 p-4 bg-white rounded-lg shadow-sm">
                    <feature.icon className="h-6 w-6 text-blue-500 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium text-gray-900">{feature.title}</h3>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-2">🌍 Global Community</h3>
              <p className="text-blue-800 text-sm">
                Join learners from over 50 countries practicing languages, sharing cultures, and making lifelong
                friendships.
              </p>
            </div>
          </div>

          {/* Login Section */}
          <div className="flex justify-center">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Welcome Back!</CardTitle>
                <CardDescription>Sign in to continue your learning journey</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {providers.map((provider) => (
                    <Button
                      key={provider.id}
                      onClick={() => handleLogin(provider.id)}
                      disabled={isLoading}
                      className={`w-full ${provider.color} text-white relative`}
                      size="lg"
                    >
                      {selectedProvider === provider.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <span className="mr-2 text-lg">{provider.icon}</span>
                      )}
                      Continue with {provider.name}
                    </Button>
                  ))}
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">Or</span>
                  </div>
                </div>

                {onGuestMode && (
                  <Button
                    onClick={onGuestMode}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    👀 Continue as Guest
                  </Button>
                )}

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">Secure & Fast</span>
                  </div>
                </div>

                <div className="text-center space-y-2">
                  <p className="text-xs text-gray-500">
                    By signing in, you agree to our Terms of Service and Privacy Policy
                  </p>
                  <div className="flex justify-center space-x-2">
                    <Badge variant="secondary" className="text-xs">
                      🔒 Secure
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      🚀 Fast
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      🌍 Global
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-blue-600">10K+</div>
            <div className="text-sm text-gray-600">Active Users</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-green-600">50+</div>
            <div className="text-sm text-gray-600">Countries</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-purple-600">100+</div>
            <div className="text-sm text-gray-600">Chat Rooms</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-orange-600">24/7</div>
            <div className="text-sm text-gray-600">Support</div>
          </div>
        </div>
      </div>
    </div>
  )
}
