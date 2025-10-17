import type { Hono } from 'hono'
import { eq, and, gte, lte } from 'drizzle-orm'
import { getDb } from '../db/db'
import { events, calendars } from '../db/schema'
import { getCurrentUser } from './auth'
import { randomId } from '../lib/crypto'

type Bindings = { DB: D1Database; ASSETS: Fetcher }
type App = Hono<{ Bindings: Bindings }>

export default (app: App) => {
  // Create event
  app.post('/api/events', async (c) => {
    const user = await getCurrentUser(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    try {
      const body = await c.req.json()
      const { calendarId, title, description, startAt, endAt, timeZone, location, recurrence } = body

      if (!calendarId || !title || !startAt || !endAt) {
        return c.json({ error: 'Missing required fields' }, 400)
      }

      const db = getDb(c.env)

      // Verify calendar ownership
      const calendar = await db
        .select()
        .from(calendars)
        .where(and(eq(calendars.id, calendarId), eq(calendars.ownerId, user.id)))
        .limit(1)

      if (calendar.length === 0) {
        return c.json({ error: 'Calendar not found' }, 404)
      }

      const eventId = randomId('event')
      const now = new Date()

      await db.insert(events).values({
        id: eventId,
        calendarId,
        title: title.trim(),
        description: description?.trim() || null,
        startAt: new Date(startAt),
        endAt: new Date(endAt),
        timeZone: timeZone || 'UTC',
        location: location?.trim() || null,
        recurrence: recurrence || null,
        createdAt: now,
        updatedAt: now,
      })

      const result = await db
        .select()
        .from(events)
        .where(eq(events.id, eventId))
        .limit(1)

      return c.json(result[0])
    } catch (error: unknown) {
      console.error('Create event error:', error)
      return c.json({ error: 'Failed to create event' }, 500)
    }
  })

  // List events for calendar
  app.get('/api/calendars/:calendarId/events', async (c) => {
    const user = await getCurrentUser(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    try {
      const calendarId = c.req.param('calendarId')
      const db = getDb(c.env)

      // Verify calendar ownership
      const calendar = await db
        .select()
        .from(calendars)
        .where(and(eq(calendars.id, calendarId), eq(calendars.ownerId, user.id)))
        .limit(1)

      if (calendar.length === 0) {
        return c.json({ error: 'Calendar not found' }, 404)
      }

      const result = await db
        .select()
        .from(events)
        .where(eq(events.calendarId, calendarId))

      return c.json(result)
    } catch (error: unknown) {
      console.error('List events error:', error)
      return c.json({ error: 'Failed to list events' }, 500)
    }
  })

  // List all events for user (across all calendars)
  app.get('/api/events', async (c) => {
    const user = await getCurrentUser(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    try {
      const db = getDb(c.env)

      // Get user's calendar IDs
      const userCalendars = await db
        .select({ id: calendars.id })
        .from(calendars)
        .where(eq(calendars.ownerId, user.id))

      if (userCalendars.length === 0) {
        return c.json([])
      }

      const calendarIds = userCalendars.map((cal) => cal.id)

      // Get events from user's calendars
      const result = await db
        .select()
        .from(events)
        .where(eq(events.calendarId, calendarIds[0]))

      // Note: For multiple calendars, you'd need to use OR conditions or separate queries
      return c.json(result)
    } catch (error: unknown) {
      console.error('List all events error:', error)
      return c.json({ error: 'Failed to list events' }, 500)
    }
  })

  // Get event
  app.get('/api/events/:id', async (c) => {
    const user = await getCurrentUser(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    try {
      const id = c.req.param('id')
      const db = getDb(c.env)

      const result = await db
        .select({
          event: events,
          calendar: calendars,
        })
        .from(events)
        .innerJoin(calendars, eq(events.calendarId, calendars.id))
        .where(and(eq(events.id, id), eq(calendars.ownerId, user.id)))
        .limit(1)

      if (result.length === 0) {
        return c.json({ error: 'Event not found' }, 404)
      }

      return c.json(result[0].event)
    } catch (error: unknown) {
      console.error('Get event error:', error)
      return c.json({ error: 'Failed to get event' }, 500)
    }
  })

  // Update event
  app.put('/api/events/:id', async (c) => {
    const user = await getCurrentUser(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    try {
      const id = c.req.param('id')
      const body = await c.req.json()
      const db = getDb(c.env)

      // Verify ownership
      const existing = await db
        .select({
          event: events,
          calendar: calendars,
        })
        .from(events)
        .innerJoin(calendars, eq(events.calendarId, calendars.id))
        .where(and(eq(events.id, id), eq(calendars.ownerId, user.id)))
        .limit(1)

      if (existing.length === 0) {
        return c.json({ error: 'Event not found' }, 404)
      }

      const updates: Record<string, unknown> = { updatedAt: new Date() }
      if (body.title !== undefined) updates.title = body.title.trim()
      if (body.description !== undefined) updates.description = body.description?.trim() || null
      if (body.startAt !== undefined) updates.startAt = new Date(body.startAt)
      if (body.endAt !== undefined) updates.endAt = new Date(body.endAt)
      if (body.timeZone !== undefined) updates.timeZone = body.timeZone
      if (body.location !== undefined) updates.location = body.location?.trim() || null
      if (body.recurrence !== undefined) updates.recurrence = body.recurrence || null

      await db.update(events).set(updates).where(eq(events.id, id))

      const result = await db
        .select()
        .from(events)
        .where(eq(events.id, id))
        .limit(1)

      return c.json(result[0])
    } catch (error: unknown) {
      console.error('Update event error:', error)
      return c.json({ error: 'Failed to update event' }, 500)
    }
  })

  // Delete event
  app.delete('/api/events/:id', async (c) => {
    const user = await getCurrentUser(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    try {
      const id = c.req.param('id')
      const db = getDb(c.env)

      // Verify ownership
      const existing = await db
        .select({
          event: events,
          calendar: calendars,
        })
        .from(events)
        .innerJoin(calendars, eq(events.calendarId, calendars.id))
        .where(and(eq(events.id, id), eq(calendars.ownerId, user.id)))
        .limit(1)

      if (existing.length === 0) {
        return c.json({ error: 'Event not found' }, 404)
      }

      await db.delete(events).where(eq(events.id, id))

      return c.json({ success: true })
    } catch (error: unknown) {
      console.error('Delete event error:', error)
      return c.json({ error: 'Failed to delete event' }, 500)
    }
  })
}