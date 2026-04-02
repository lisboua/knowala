import { DefaultSession } from 'next-auth'
import { Role } from '@prisma/client'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      username: string
      role: Role
      ecoScore: number
    } & DefaultSession['user']
  }

  interface User {
    username?: string
    role?: Role
    ecoScore?: number
    googleId?: string
    emailVerified?: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    username?: string
    role?: string
    ecoScore?: number
  }
}
