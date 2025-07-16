"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react"
import { signIn, signOut, useSession } from "next-auth/react"

export interface User {
  id: string
  name: string
  email?: string
  image?: string
  country?: string
  provider: "google" | "guest"
  joinedAt: Date
  isOnline: boolean
}

interface AuthContextType {
  user: User | null
  isGuest: boolean
  isLoading: boolean
  login: (provider: string) => Promise<void>
  loginAsGuest: () => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

function generateGuestUser() {
  const random = Math.random().toString(36).substring(2, 7).toUpperCase()
  return {
    id: `guest-${Date.now()}`,
    name: `Guest-${random}`,
    provider: "guest" as const,
    joinedAt: new Date(),
    isOnline: true,
  }
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { data: session, status } = useSession()
  const [user, setUser] = useState<User | null>(null)
  const [isGuest, setIsGuest] = useState(false)
  const isLoading = status === "loading"

  // On mount, check for guest user in sessionStorage
  useEffect(() => {
    if (status === "unauthenticated") {
      const guest = sessionStorage.getItem("guestUser")
      if (guest) {
        setUser(JSON.parse(guest))
        setIsGuest(true)
      } else {
        setUser(null)
        setIsGuest(false)
      }
    }
  }, [status])

  // If authenticated, set user from session
  useEffect(() => {
    const fetchCountry = async () => {
      try {
        const res = await fetch("/api/geo")
        const data = await res.json()
        return data.country || "Unknown"
      } catch {
        return "Unknown"
      }
    }
    
    const fetchUserFromDatabase = async (email: string) => {
      try {
        console.log('Fetching user from database for email:', email)
        // Use the findByEmail endpoint instead of search
        const response = await fetch(`/api/users/find-by-email?email=${encodeURIComponent(email)}`)
        console.log('Response status:', response.status)
        if (response.ok) {
          const user = await response.json()
          console.log('Found user in database:', user)
          return user
        } else {
          console.log('User not found in database, status:', response.status)
        }
      } catch (error) {
        console.error('Error fetching user from database:', error)
      }
      return null
    }
    
    const initUser = async () => {
      if (status === "authenticated" && session?.user) {
        const u = session.user
        
        // Fetch the actual user from database to get the correct ID
        const dbUser = await fetchUserFromDatabase(u.email || '')
        
        if (dbUser) {
          console.log('Using database user with ID:', dbUser.id)
          const country = await fetchCountry()
          
          // Set user as online
          try {
            await fetch('/api/users/status', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: dbUser.id, isOnline: true }),
            })
          } catch (error) {
            console.error('Error setting online status:', error)
          }
          
          setUser({
            id: dbUser.id, // Use the actual database ID
            name: (dbUser.fullName || dbUser.username || u.name) ?? "",
            email: (dbUser.email || u.email) ?? undefined,
            image: (dbUser.avatarUrl || u.image) ?? undefined,
            country: dbUser.country || country,
            provider: "google",
            joinedAt: new Date(dbUser.createdAt),
            isOnline: true,
          })
        } else {
          console.log('User not found in database, using fallback with email as ID')
          // Fallback to session data if user not found in database
          const country = await fetchCountry()
          setUser({
            id: u.email || u.name || "google-user",
            name: u.name ?? "",
            email: u.email ?? undefined,
            image: u.image ?? undefined,
            country,
            provider: "google",
            joinedAt: new Date(),
            isOnline: true,
          })
        }
        
        setIsGuest(false)
        sessionStorage.removeItem("guestUser")
      }
    }
    initUser()
  }, [session, status])

  // Set user offline when component unmounts or page is closed
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (user && user.provider === "google") {
        try {
          // Use sendBeacon for more reliable delivery when page is closing
          navigator.sendBeacon('/api/users/status', JSON.stringify({ 
            userId: user.id, 
            isOnline: false 
          }))
        } catch (error) {
          console.error('Error setting offline status on unload:', error)
        }
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      // Also set offline when component unmounts
      if (user && user.provider === "google") {
        fetch('/api/users/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, isOnline: false }),
        }).catch(error => {
          console.error('Error setting offline status on unmount:', error)
        })
      }
    }
  }, [user])

  const login = async (provider: string) => {
    await signIn(provider, { callbackUrl: "/" })
  }

  const loginAsGuest = () => {
    const guest = generateGuestUser()
    setUser(guest)
    setIsGuest(true)
    sessionStorage.setItem("guestUser", JSON.stringify(guest))
  }

  const logout = async () => {
    // Set user as offline before logging out
    if (user && user.provider === "google") {
      try {
        await fetch('/api/users/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, isOnline: false }),
        })
      } catch (error) {
        console.error('Error setting offline status:', error)
      }
    }
    
    setUser(null)
    setIsGuest(false)
    sessionStorage.removeItem("guestUser")
    signOut({ callbackUrl: "/" })
  }

  return (
    <AuthContext.Provider value={{ user, isGuest, isLoading, login, loginAsGuest, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
