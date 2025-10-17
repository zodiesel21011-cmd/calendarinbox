import type { Hono } from 'hono'
import { eq, and } from 'drizzle-orm'
import { getDb } from '../db/db'
import { calendars } from '../db/schema'
import { getCurrentUser } from './auth'
import { randomId } from '../lib/crypto'

type Bindings = { DB: D1Database; ASSETS: Fetcher }
type App = Hono<{ Bindings: Bindings }>

export default (app: App) => {
  // Create calendar
  app.post('/api/calendars', async (c) => {
    const user = await getCurrentUser(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    try {
      const body = await c.req.json()
      const { name, color, isPublic } = body

      if (!name) {
        return c.json({ error: 'Calendar name is required' }, 400)
      }

      const db = getDb(c.env)
      const calendarId = randomId('cal')
      const now = new Date()

      await db.insert(calendars).values({
        id: calendarId,
        ownerId: user.id,
        name: name.trim(),
        color: color || '#3b82f6',
        isPublic: isPublic || false,
        createdAt: now,
        updatedAt: now,
      })

      const result = await db
        .select()
        .from(calendars)
        .where(eq(calendars.id, calendarId))
        .limit(1)

      return c.json(result[0])
    } catch (error: unknown) {
      console.error('Create calendar error:', error)
      return c.json({ error: 'Failed to create calendar' }, 500)
    }
  })

  // List calendars
  app.get('/api/calendars', async (c) => {
    const user = await getCurrentUser(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    try {
      const db = getDb(c.env)
      const result = await db
        .select()
        .from(calendars)
        .where(eq(calendars.ownerId, user.id))

      return c.json(result)
    } catch (error: unknown) {
      console.error('List calendars error:', error)
      return c.json({ error: 'Failed to list calendars' }, 500)
    }
  })

  // Get calendar
  app.get('/api/calendars/:id', async (c) => {
    const user = await getCurrentUser(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    try {
      const id = c.req.param('id')
      const db = getDb(c.env)

      const result = await db
        .select()
        .from(calendars)
        .where(and(eq(calendars.id, id), eq(calendars.ownerId, user.id)))
        .limit(1)

      if (result.length === 0) {
        return c.json({ error: 'Calendar not found' }, 404)
      }

      return c.json(result[0])
    } catch (error: unknown) {
      console.error('Get calendar error:', error)
      return c.json({ error: 'Failed to get calendar' }, 500)
    }
  })

  // Update calendar
  app.put('/api/calendars/:id', async (c) => {
    const user = await getCurrentUser(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    try {
      const id = c.req.param('id')
      const body = await c.req.json()
      const { name, color, isPublic } = body

      const db = getDb(c.env)

      // Check ownership
      const existing = await db
        .select()
        .from(calendars)
        .where(and(eq(calendars.id, id), eq(calendars.ownerId, user.id)))
        .limit(1)

      if (existing.length === 0) {
        return c.json({ error: 'Calendar not found' }, 404)
      }

      const updates: Record<string, unknown> = { updatedAt: new Date() }
      if (name !== undefined) updates.name = name.trim()
      if (color !== undefined) updates.color = color
      if (isPublic !== undefined) updates.isPublic = isPublic

      await db.update(calendars).set(updates).where(eq(calendars.id, id))

      const result = await db
        .select()
        .from(calendars)
        .where(eq(calendars.id, id))
        .limit(1)

      return c.json(result[0])
    } catch (error: unknown) {
      console.error('Update calendar error:', error)
      return c.json({ error: 'Failed to update calendar' }, 500)
    }
  })

  // Delete calendar
  app.delete('/api/calendars/:id', async (c) => {
    const user = await getCurrentUser(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    try {
      const id = c.req.param('id')
      const db = getDb(c.env)

      // Check ownership
      const existing = await db
        .select()
        .from(calendars)
        .where(and(eq(calendars.id, id), eq(calendars.ownerId, user.id)))
        .limit(1)

      if (existing.length === 0) {
        return c.json({ error: 'Calendar not found' }, 404)
      }

      await db.delete(calendars).where(eq(calendars.id, id))

      return c.json({ success: true })
    } catch (error: unknown) {
      console.error('Delete calendar error:', error)
      return c.json({ error: 'Failed to delete calendar' }, 500)
    }
  })
}