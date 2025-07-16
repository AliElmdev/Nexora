// app/api/auth/[...nextauth]/route.ts

import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          // Check if user already exists
          const existingUser = await prisma.user.findFirst({
            where: {
              OR: [
                { email: user.email! },
                { googleId: profile?.sub }
              ]
            }
          })

          if (!existingUser) {
            // Create new user
            await prisma.user.create({
              data: {
                email: user.email!,
                username: user.email!.split('@')[0] + '_' + Math.random().toString(36).substr(2, 5),
                fullName: user.name || '',
                avatarUrl: user.image || '',
                googleId: profile?.sub,
                googleEmail: user.email!,
                googleName: user.name || '',
                googleImage: user.image || '',
                country: 'Unknown',
                language: 'en',
                timezone: 'UTC'
              }
            })
            console.log('New user created:', user.email)
          } else {
            // Update existing user's Google info if needed
            if (!existingUser.googleId) {
              await prisma.user.update({
                where: { id: existingUser.id },
                data: {
                  googleId: profile?.sub,
                  googleEmail: user.email!,
                  googleName: user.name || '',
                  googleImage: user.image || '',
                  avatarUrl: user.image || existingUser.avatarUrl,
                  fullName: user.name || existingUser.fullName
                }
              })
            }
            console.log('Existing user logged in:', user.email)
          }
        } catch (error) {
          console.error('Error during sign in:', error)
          return false
        }
      }
      return true
    },
    async session({ session, token }) {
      if (session.user?.email) {
        try {
          // Get user from database
          const user = await prisma.user.findUnique({
            where: { email: session.user.email }
          })
          
          if (user) {
            session.user.id = user.id
            session.user.username = user.username
            session.user.fullName = user.fullName
            session.user.avatarUrl = user.avatarUrl
            session.user.country = user.country
            session.user.language = user.language
          }
        } catch (error) {
          console.error('Error fetching user session:', error)
        }
      }
      return session
    },
    async jwt({ token, user, account }) {
      if (account?.provider === "google" && user) {
        token.provider = account.provider
      }
      return token
    }
  },
  pages: {
    signIn: '/',
  },
  session: {
    strategy: "jwt",
  },
})

export { handler as GET, handler as POST }
