import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import { verifyPassword } from "./auth-utils"
import { z } from "zod"

// Extend NextAuth types
declare module "next-auth" {
  interface User {
    role: string
  }
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
  }
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          const { email, password } = loginSchema.parse(credentials)

          const user = await prisma.user.findUnique({
            where: { email }
          })

          if (!user) {
            return null
          }

          // Check if user has a password (for credentials auth)
          if (!user.password) {
            return null
          }

          // Verify password
          const isValidPassword = await verifyPassword(password, user.password)
          if (!isValidPassword) {
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }
        } catch {
          return null
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
      // If signing in with Google, ensure user exists in database
      if (account?.provider === 'google') {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
          })

          // If user doesn't exist, create one (PrismaAdapter will handle this, but we ensure phone is null)
          if (!existingUser) {
            // PrismaAdapter will create the user, but we can add custom logic here if needed
          }
        } catch (error) {
          console.error('Error during Google sign in:', error)
        }
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role || 'SUBSCRIBER'
      }
      // Fetch role from database if not in token
      if (token.sub && !token.role) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { role: true },
        })
        if (dbUser) {
          token.role = dbUser.role
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub!
        session.user.role = token.role as string || 'SUBSCRIBER'
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
}
