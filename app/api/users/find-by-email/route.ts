import { NextRequest, NextResponse } from 'next/server'
import { UserService } from '@/lib/services/userService'

const userService = new UserService()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      )
    }

    const user = await userService.findByEmail(email)
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error finding user by email:', error)
    return NextResponse.json(
      { error: 'Failed to find user' },
      { status: 500 }
    )
  }
} 