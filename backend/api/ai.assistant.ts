import type { Hono } from 'hono'
import { eq, and } from 'drizzle-orm'
import { getDb } from '../db/db'
import { events, calendars, threads, messages, integrations } from '../db/schema'
import { getCurrentUser } from './auth'
import { randomId } from '../lib/crypto'
import { createAIProvider, isAIEnabled, isAutoScheduleEnabled, isAutoRespondEnabled, getAIProviderName } from '../lib/ai-assistant'

type Bindings = { DB: D1Database; ASSETS: Fetcher; OPENAI_API_KEY?: string; ANTHROPIC_API_KEY?: string }
type App = Hono<{ Bindings: Bindings }>

export default (app: App) => {
  // Analyze email with AI
  app.post('/api/ai/analyze-email', async (c) => {
    const user = await getCurrentUser(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    if (!isAIEnabled()) {
      return c.json({ error: 'AI features not enabled' }, 400)
    }

    try {
      const body = await c.req.json()
      const { subject, content } = body

      if (!subject || !content) {
        return c.json({ error: 'Subject and content required' }, 400)
      }

      const aiProvider = createAIProvider()
      const analysis = await aiProvider.analyzeEmail(content, subject)

      return c.json(analysis)
    } catch (error: unknown) {
      console.error('AI analysis error:', error)
      return c.json({ error: 'Failed to analyze email' }, 500)
    }
  })

  // Auto-schedule event from email
  app.post('/api/ai/auto-schedule', async (c) => {
    const user = await getCurrentUser(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    if (!isAutoScheduleEnabled()) {
      return c.json({ error: 'Auto-scheduling not enabled' }, 400)
    }

    try {
      const body = await c.req.json()
      const { subject, content, calendarId } = body

      if (!subject || !content) {
        return c.json({ error: 'Subject and content required' }, 400)
      }

      const db = getDb(c.env)

      // Verify calendar ownership
      if (calendarId) {
        const calendar = await db
          .select()
          .from(calendars)
          .where(and(eq(calendars.id, calendarId), eq(calendars.ownerId, user.id)))
          .limit(1)

        if (calendar.length === 0) {
          return c.json({ error: 'Calendar not found' }, 404)
        }
      }

      // Analyze email
      const aiProvider = createAIProvider()
      const analysis = await aiProvider.analyzeEmail(content, subject)

      if (!analysis.isEventRelated || !analysis.eventDetails) {
        return c.json({ 
          scheduled: false, 
          message: 'No event information found in email',
          analysis 
        })
      }

      const details = analysis.eventDetails

      // Get or create default calendar
      let targetCalendarId = calendarId
      if (!targetCalendarId) {
        const userCalendars = await db
          .select()
          .from(calendars)
          .where(eq(calendars.ownerId, user.id))
          .limit(1)

        if (userCalendars.length === 0) {
          // Create AI calendar
          const newCalId = randomId('cal')
          await db.insert(calendars).values({
            id: newCalId,
            ownerId: user.id,
            name: 'AI Scheduled Events',
            color: '#10b981',
            isPublic: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          targetCalendarId = newCalId
        } else {
          targetCalendarId = userCalendars[0].id
        }
      }

      // Create event
      const eventId = randomId('event')
      const now = new Date()

      // Parse dates
      let startAt: Date
      let endAt: Date

      if (details.startDate && details.startTime) {
        startAt = new Date(`${details.startDate}T${details.startTime}:00`)
      } else if (details.startDate) {
        startAt = new Date(`${details.startDate}T09:00:00`)
      } else {
        startAt = new Date(Date.now() + 86400000) // Tomorrow
      }

      if (details.endDate && details.endTime) {
        endAt = new Date(`${details.endDate}T${details.endTime}:00`)
      } else if (details.endDate) {
        endAt = new Date(`${details.endDate}T10:00:00`)
      } else {
        endAt = new Date(startAt.getTime() + 3600000) // +1 hour
      }

      await db.insert(events).values({
        id: eventId,
        calendarId: targetCalendarId,
        title: details.title || subject,
        description: details.description || `Auto-scheduled from email: ${subject}`,
        startAt,
        endAt,
        timeZone: 'UTC',
        location: details.location || null,
        recurrence: null,
        createdAt: now,
        updatedAt: now,
      })

      const createdEvent = await db
        .select()
        .from(events)
        .where(eq(events.id, eventId))
        .limit(1)

      return c.json({
        scheduled: true,
        event: createdEvent[0],
        analysis,
      })
    } catch (error: unknown) {
      console.error('Auto-schedule error:', error)
      return c.json({ error: 'Failed to auto-schedule event' }, 500)
    }
  })

  // Generate AI response
  app.post('/api/ai/generate-response', async (c) => {
    const user = await getCurrentUser(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    if (!isAIEnabled()) {
      return c.json({ error: 'AI features not enabled' }, 400)
    }

    try {
      const body = await c.req.json()
      const { context, tone } = body

      if (!context) {
        return c.json({ error: 'Context required' }, 400)
      }

      const aiProvider = createAIProvider()
      const response = await aiProvider.generateResponse(context, tone || 'professional')

      return c.json({ response })
    } catch (error: unknown) {
      console.error('Generate response error:', error)
      return c.json({ error: 'Failed to generate response' }, 500)
    }
  })

  // Process inbox messages with AI (batch)
  app.post('/api/ai/process-inbox', async (c) => {
    const user = await getCurrentUser(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    if (!isAutoScheduleEnabled()) {
      return c.json({ error: 'Auto-processing not enabled' }, 400)
    }

    try {
      const db = getDb(c.env)

      // Get recent threads
      const userThreads = await db
        .select({
          threadId: messages.threadId,
          subject: threads.subject,
          content: messages.content,
          messageId: messages.id,
        })
        .from(messages)
        .innerJoin(threads, eq(messages.threadId, threads.id))
        .where(eq(messages.senderId, user.id))
        .limit(10)

      const aiProvider = createAIProvider()
      const results = []

      for (const thread of userThreads) {
        const analysis = await aiProvider.analyzeEmail(thread.content, thread.subject)
        
        if (analysis.isEventRelated && analysis.eventDetails) {
          // Could auto-schedule here
          results.push({
            threadId: thread.threadId,
            messageId: thread.messageId,
            analysis,
            autoScheduled: false, // Set to true if you want automatic scheduling
          })
        }
      }

      return c.json({
        processed: userThreads.length,
        eventsCandidates: results.length,
        results,
      })
    } catch (error: unknown) {
      console.error('Process inbox error:', error)
      return c.json({ error: 'Failed to process inbox' }, 500)
    }
  })

  // Get AI assistant status
  app.get('/api/ai/status', async (c) => {
    const user = await getCurrentUser(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    const providerName = getAIProviderName()
    const isDemo = providerName === 'Demo Mode'

    return c.json({
      aiEnabled: isAIEnabled(),
      autoScheduleEnabled: isAutoScheduleEnabled(),
      autoRespondEnabled: isAutoRespondEnabled(),
      provider: providerName,
      isDemo,
      features: {
        emailAnalysis: isAIEnabled(),
        autoScheduling: isAutoScheduleEnabled(),
        autoResponse: isAutoRespondEnabled(),
        smartSuggestions: isAIEnabled(),
      },
    })
  })

  // Update AI settings
  app.patch('/api/ai/settings', async (c) => {
    const user = await getCurrentUser(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    try {
      const body = await c.req.json()
      
      // In production, store per-user AI preferences in database
      // For now, return success
      return c.json({ 
        success: true,
        message: 'AI settings updated',
        settings: body 
      })
    } catch (error: unknown) {
      console.error('Update settings error:', error)
      return c.json({ error: 'Failed to update settings' }, 500)
    }
  })
}