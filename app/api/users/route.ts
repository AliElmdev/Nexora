import { NextRequest, NextResponse } from 'next/server'
import { UserService } from '@/lib/services/userService'

const userService = new UserService()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const country = searchParams.get('country')
    const language = searchParams.get('language')

    if (query) {
      const users = await userService.searchUsers(query)
      return NextResponse.json(users)
    }

    if (country) {
      const users = await userService.getUsersByCountry(country)
      return NextResponse.json(users)
    }

    if (language) {
      const users = await userService.getUsersByLanguage(language)
      return NextResponse.json(users)
    }

    // Return all users (for admin purposes)
    const users = await userService.getAllUsers()
    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, username, fullName, avatarUrl, bio, country, language, timezone, googleId, googleEmail, googleName, googleImage } = body

    // Validate required fields
    if (!email || !username) {
      return NextResponse.json(
        { error: 'Email and username are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await userService.findByEmail(email)
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      )
    }

    // Check if username is taken
    const existingUsername = await userService.findByUsername(username)
    if (existingUsername) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 409 }
      )
    }

    // Create new user
    const user = await userService.createUser({
      email,
      username,
      fullName,
      avatarUrl,
      bio,
      country,
      language,
      timezone,
      googleId,
      googleEmail,
      googleName,
      googleImage,
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
} 