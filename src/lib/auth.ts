import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { rateLimitLogin } from '@/lib/rate-limit'
import type { DefaultSession, NextAuthConfig } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      username: string
      role: string
      ecoScore: number
      needsOnboarding: boolean
    } & DefaultSession['user']
  }

  interface User {
    username?: string
    role?: string
    ecoScore?: number
    needsOnboarding?: boolean
  }
}

export const authConfig: NextAuthConfig = {
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          username: generateUsername(profile.name || profile.email),
          emailVerified: true,
          role: 'USER',
          ecoScore: 0,
        }
      },
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Credenciais inválidas.')
        }

        // Rate limit: 5 tentativas por IP a cada 15 minutos
        const ip =
          (req as any)?.headers?.['x-forwarded-for'] ||
          (req as any)?.headers?.['x-real-ip'] ||
          'unknown'
        const rl = await rateLimitLogin(String(ip))
        if (!rl.success) {
          throw new Error('Muitas tentativas. Tente novamente em 15 minutos.')
        }

        const email = (credentials.email as string).toLowerCase().trim()
        const password = credentials.password as string

        const user = await db.user.findUnique({
          where: { email },
        })

        if (!user || !user.password) {
          // Same error message to prevent email enumeration
          throw new Error('E-mail ou senha incorretos.')
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)

        if (!isPasswordValid) {
          throw new Error('E-mail ou senha incorretos.')
        }

        if (!user.emailVerified) {
          throw new Error('Por favor, confirme seu e-mail antes de entrar.')
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          username: user.username,
          role: user.role,
          ecoScore: user.ecoScore,
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        const existingUser = await db.user.findUnique({
          where: { email: user.email! },
        })

        if (existingUser) {
          // Atualiza googleId se ainda não tiver
          if (!existingUser.googleId) {
            await db.user.update({
              where: { id: existingUser.id },
              data: { googleId: (profile as any)?.sub, emailVerified: true },
            })
          }
          // Preenche os dados do user para o JWT
          user.id = existingUser.id
          user.username = existingUser.username
          user.role = existingUser.role
          user.ecoScore = existingUser.ecoScore
        } else {
          // Beta fechado: não permite cadastro via Google por enquanto
          return false
        }
      }
      return true
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.username = user.username
        token.role = user.role
        token.ecoScore = user.ecoScore
        token.needsOnboarding = user.needsOnboarding ?? false
      }

      if (trigger === 'update' && session) {
        token.ecoScore = session.ecoScore
        token.username = session.username
      }

      // Refresh user data periodically
      if (token.id && !user) {
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
          select: { username: true, role: true, ecoScore: true, name: true, image: true, needsOnboarding: true },
        })
        if (dbUser) {
          token.username = dbUser.username
          token.role = dbUser.role
          token.ecoScore = dbUser.ecoScore
          token.name = dbUser.name
          token.picture = dbUser.image
          token.needsOnboarding = dbUser.needsOnboarding
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.username = token.username as string
        session.user.role = token.role as string
        session.user.ecoScore = token.ecoScore as number
        session.user.needsOnboarding = token.needsOnboarding as boolean
      }
      return session
    },
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)

function generateUsername(nameOrEmail: string): string {
  // Convert name to lowercase username
  const base = nameOrEmail
    .split('@')[0] // Take part before @ if email
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove special chars
    .slice(0, 15) // Max 15 chars

  const suffix = Math.floor(Math.random() * 9000) + 1000
  return `${base || 'user'}${suffix}`
}

async function generateUniqueUsername(nameOrEmail: string): Promise<string> {
  const base = nameOrEmail
    .split('@')[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 15)

  const baseUsername = base || 'user'

  // Try without suffix first
  const existing = await db.user.findUnique({ where: { username: baseUsername } })
  if (!existing) return baseUsername

  // Add random suffix until unique
  let attempts = 0
  while (attempts < 10) {
    const suffix = Math.floor(Math.random() * 90000) + 10000
    const candidate = `${baseUsername}${suffix}`
    const exists = await db.user.findUnique({ where: { username: candidate } })
    if (!exists) return candidate
    attempts++
  }

  // Fallback with timestamp
  return `${baseUsername}${Date.now()}`
}
