import type { Hono } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { and, eq, gt } from 'drizzle-orm'
import { getDb } from '../db/db'
import { users, sessions } from '../db/schema'
import { generateSalt, hashPassword, verifyPassword, randomId } from '../lib/crypto'

type Bindings = { DB: D1Database; ASSETS: Fetcher }
type App = Hono<{ Bindings: Bindings }>

const COOKIE_NAME = 'sid'
const SESSION_TTL_DAYS = 7

function computeExpiry(days: number) {
  return new Date(Date.now() + days * 864e5)
}

function isSecure(c: { req: { url: string } }) {
  try {
    return new URL(c.req.url).protocol === 'https:'
  } catch {
    return false
  }
}

export async function getCurrentUser(c: { req: { url: string }; env: { DB: D1Database } }) {
  const sessionId = getCookie(c, COOKIE_NAME)
  if (!sessionId) return null

  const db = getDb(c.env)
  const now = new Date()

  const result = await db
    .select({
      userId: sessions.userId,
      email: users.email,
      username: users.username,
      name: users.name,
      id: users.id,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, now)))
    .limit(1)

  if (result.length === 0) return null

  return {
    id: result[0].userId,
    email: result[0].email,
    username: result[0].username,
    name: result[0].name,
  }
}

export default (app: App) => {
  app.post('/api/auth/register', async (c) => {
    try {
      const body = await c.req.json()
      const { email, username, name, password } = body

      // Validate inputs
      if (!email || !username || !name || !password) {
        return c.json({ error: 'All fields are required' }, 400)
      }

      if (password.length < 6) {
        return c.json({ error: 'Password must be at least 6 characters' }, 400)
      }

      const normalizedEmail = email.toLowerCase().trim()
      const normalizedUsername = username.toLowerCase().trim()

      const db = getDb(c.env)

      // Check if email or username already exists
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1)

      if (existing.length > 0) {
        return c.json({ error: 'Email already exists' }, 400)
      }

      const existingUsername = await db
        .select()
        .from(users)
        .where(eq(users.username, normalizedUsername))
        .limit(1)

      if (existingUsername.length > 0) {
        return c.json({ error: 'Username already exists' }, 400)
      }

      // Hash password
      const salt = generateSalt()
      const hash = await hashPassword(password, salt)

      // Create user
      const userId = randomId('user')
      const now = new Date()

      await db.insert(users).values({
        id: userId,
        email: normalizedEmail,
        username: normalizedUsername,
        name: name.trim(),
        passwordHash: hash,
        passwordSalt: salt,
        createdAt: now,
        updatedAt: now,
      })

      // Create session
      const sessionId = randomId('session')
      await db.insert(sessions).values({
        id: sessionId,
        userId,
        expiresAt: computeExpiry(SESSION_TTL_DAYS),
        createdAt: now,
      })

      // Set cookie
      setCookie(c, COOKIE_NAME, sessionId, {
        httpOnly: true,
        secure: isSecure(c),
        sameSite: 'Lax',
        path: '/',
        expires: computeExpiry(SESSION_TTL_DAYS),
      })

      return c.json({
        id: userId,
        email: normalizedEmail,
        username: normalizedUsername,
        name: name.trim(),
      })
    } catch (error: unknown) {
      console.error('Register error:', error)
      return c.json({ error: 'Registration failed' }, 500)
    }
  })

  app.post('/api/auth/login', async (c) => {
    try {
      const body = await c.req.json()
      const { email, password } = body

      if (!email || !password) {
        return c.json({ error: 'Invalid credentials' }, 401)
      }

      const normalizedEmail = email.toLowerCase().trim()
      const db = getDb(c.env)

      // Find user
      const result = await db
        .select()
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1)

      if (result.length === 0) {
        return c.json({ error: 'Invalid credentials' }, 401)
      }

      const user = result[0]

      // Verify password
      const valid = await verifyPassword(password, user.passwordSalt, user.passwordHash)
      if (!valid) {
        return c.json({ error: 'Invalid credentials' }, 401)
      }

      // Create session
      const sessionId = randomId('session')
      const now = new Date()

      await db.insert(sessions).values({
        id: sessionId,
        userId: user.id,
        expiresAt: computeExpiry(SESSION_TTL_DAYS),
        createdAt: now,
      })

      // Set cookie
      setCookie(c, COOKIE_NAME, sessionId, {
        httpOnly: true,
        secure: isSecure(c),
        sameSite: 'Lax',
        path: '/',
        expires: computeExpiry(SESSION_TTL_DAYS),
      })

      return c.json({
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
      })
    } catch (error: unknown) {
      console.error('Login error:', error)
      return c.json({ error: 'Login failed' }, 500)
    }
  })

  app.post('/api/auth/logout', async (c) => {
    const sessionId = getCookie(c, COOKIE_NAME)
    
    if (sessionId) {
      const db = getDb(c.env)
      await db.delete(sessions).where(eq(sessions.id, sessionId))
    }

    deleteCookie(c, COOKIE_NAME, {
      path: '/',
    })

    return c.json({ success: true })
  })

  app.get('/api/auth/me', async (c) => {
    const user = await getCurrentUser(c)
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    return c.json(user)
  })
}