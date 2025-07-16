import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      username: string
      fullName?: string | null
      avatarUrl?: string | null
      country?: string | null
      language?: string | null
    }
  }

  interface User {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    username: string
    fullName?: string | null
    avatarUrl?: string | null
    country?: string | null
    language?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    provider?: string
  }
} 