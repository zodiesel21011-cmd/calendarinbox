import type { Hono } from 'hono'
import { eq, and } from 'drizzle-orm'
import { getDb } from '../db/db'
import { integrations, syncedEvents, events, calendars } from '../db/schema'
import { getCurrentUser } from './auth'
import { randomId } from '../lib/crypto'
import { processUserEmails } from '../lib/email-sync'

type Bindings = { DB: D1Database; ASSETS: Fetcher }
type App = Hono<{ Bindings: Bindings }>

export default (app: App) => {
  // List user's integrations
  app.get('/api/integrations', async (c) => {
    const user = await getCurrentUser(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    try {
      const db = getDb(c.env)
      const result = await db
        .select({
          id: integrations.id,
          provider: integrations.provider,
          type: integrations.type,
          email: integrations.email,
          isActive: integrations.isActive,
          lastSyncAt: integrations.lastSyncAt,
          createdAt: integrations.createdAt,
        })
        .from(integrations)
        .where(eq(integrations.userId, user.id))

      return c.json(result)
    } catch (error: unknown) {
      console.error('List integrations error:', error)
      return c.json({ error: 'Failed to list integrations' }, 500)
    }
  })

  // OAuth callback handler for Google
  app.get('/api/integrations/google/callback', async (c) => {
    const user = await getCurrentUser(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    try {
      const code = c.req.query('code')
      const type = c.req.query('type') || 'calendar' // 'calendar' or 'email'

      if (!code) {
        return c.json({ error: 'No authorization code provided' }, 400)
      }

      // In production, exchange code for tokens with Google OAuth
      // For MVP, we'll simulate the token exchange
      const db = getDb(c.env)
      const integrationId = randomId('integration')
      const now = new Date()

      await db.insert(integrations).values({
        id: integrationId,
        userId: user.id,
        provider: 'google',
        type,
        accessToken: `mock_access_token_${code}`,
        refreshToken: `mock_refresh_token_${code}`,
        expiresAt: new Date(Date.now() + 3600 * 1000),
        email: user.email,
        isActive: true,
        lastSyncAt: now,
        createdAt: now,
        updatedAt: now,
      })

      return c.json({ success: true, integrationId })
    } catch (error: unknown) {
      console.error('Google OAuth callback error:', error)
      return c.json({ error: 'Failed to connect Google account' }, 500)
    }
  })

  // OAuth callback handler for Outlook
  app.get('/api/integrations/outlook/callback', async (c) => {
    const user = await getCurrentUser(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    try {
      const code = c.req.query('code')
      const type = c.req.query('type') || 'calendar'

      if (!code) {
        return c.json({ error: 'No authorization code provided' }, 400)
      }

      const db = getDb(c.env)
      const integrationId = randomId('integration')
      const now = new Date()

      await db.insert(integrations).values({
        id: integrationId,
        userId: user.id,
        provider: 'outlook',
        type,
        accessToken: `mock_access_token_${code}`,
        refreshToken: `mock_refresh_token_${code}`,
        expiresAt: new Date(Date.now() + 3600 * 1000),
        email: user.email,
        isActive: true,
        lastSyncAt: now,
        createdAt: now,
        updatedAt: now,
      })

      return c.json({ success: true, integrationId })
    } catch (error: unknown) {
      console.error('Outlook OAuth callback error:', error)
      return c.json({ error: 'Failed to connect Outlook account' }, 500)
    }
  })

  // Connect integration (initiate OAuth flow)
  app.post('/api/integrations/connect', async (c) => {
    const user = await getCurrentUser(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    try {
      const body = await c.req.json()
      const { provider, type } = body // provider: 'google', 'outlook', 'apple' | type: 'email', 'calendar'

      if (!provider || !type) {
        return c.json({ error: 'Provider and type are required' }, 400)
      }

      // Generate OAuth URL based on provider
      let authUrl = ''
      
      if (provider === 'google') {
        const redirectUri = `${c.req.url.split('/api')[0]}/api/integrations/google/callback`
        const scopes = type === 'calendar' 
          ? 'https://www.googleapis.com/auth/calendar'
          : 'https://www.googleapis.com/auth/gmail.readonly'
        
        authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
          `client_id=YOUR_CLIENT_ID&` +
          `redirect_uri=${encodeURIComponent(redirectUri)}&` +
          `response_type=code&` +
          `scope=${encodeURIComponent(scopes)}&` +
          `access_type=offline&` +
          `state=${type}`
      } else if (provider === 'outlook') {
        const redirectUri = `${c.req.url.split('/api')[0]}/api/integrations/outlook/callback`
        const scopes = type === 'calendar'
          ? 'Calendars.ReadWrite'
          : 'Mail.Read'
        
        authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
          `client_id=YOUR_CLIENT_ID&` +
          `redirect_uri=${encodeURIComponent(redirectUri)}&` +
          `response_type=code&` +
          `scope=${encodeURIComponent(scopes)}&` +
          `state=${type}`
      }

      return c.json({ authUrl })
    } catch (error: unknown) {
      console.error('Connect integration error:', error)
      return c.json({ error: 'Failed to initiate connection' }, 500)
    }
  })

  // Sync calendar events
  app.post('/api/integrations/:id/sync', async (c) => {
    const user = await getCurrentUser(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    try {
      const id = c.req.param('id')
      const db = getDb(c.env)

      // Get integration
      const integration = await db
        .select()
        .from(integrations)
        .where(and(eq(integrations.id, id), eq(integrations.userId, user.id)))
        .limit(1)

      if (integration.length === 0) {
        return c.json({ error: 'Integration not found' }, 404)
      }

      const int = integration[0]

      // AUTO-SYNC EMAILS: If this is an email integration, process emails with AI
      let emailSyncResult = null
      if (int.type === 'email') {
        // DEMO: Simulate fetching emails from Gmail/Outlook
        const mockEmails = [
          {
            id: `email_${Date.now()}_1`,
            threadId: `thread_demo_1`,
            subject: 'Team Meeting Next Monday',
            body: 'Hi team, let\'s have our weekly sync next Monday at 2pm in Conference Room A. Please confirm your attendance.',
            from: 'manager@company.com',
            date: new Date(),
            integrationId: int.id,
          },
          {
            id: `email_${Date.now()}_2`,
            threadId: `thread_demo_2`,
            subject: 'Client Call Tomorrow 3PM',
            body: 'Reminder: client call scheduled for tomorrow at 3:00 PM. Zoom link will be sent separately.',
            from: 'client@partner.com',
            date: new Date(),
            integrationId: int.id,
          },
        ]

        // Process emails with AI and auto-schedule
        emailSyncResult = await processUserEmails(db, user.id, mockEmails)
      }

      // Simulate fetching events from external calendar
      // In production, use Google Calendar API or Microsoft Graph API
      const externalEvents = int.type === 'calendar' ? [
        {
          id: 'ext_event_1',
          title: 'Synced Meeting from ' + int.provider,
          description: 'This event was synced from your external calendar',
          startAt: new Date(Date.now() + 86400000),
          endAt: new Date(Date.now() + 90000000),
          location: 'Synced Location',
        },
      ] : []

      // Get or create default calendar for synced events
      const userCalendars = await db
        .select()
        .from(calendars)
        .where(eq(calendars.ownerId, user.id))
        .limit(1)

      let calendarId = userCalendars[0]?.id

      if (!calendarId) {
        // Create a default calendar
        const newCalId = randomId('cal')
        await db.insert(calendars).values({
          id: newCalId,
          ownerId: user.id,
          name: `${int.provider} Calendar`,
          color: int.provider === 'google' ? '#4285f4' : '#0078d4',
          isPublic: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        calendarId = newCalId
      }

      // Import events
      let importedCount = 0
      for (const extEvent of externalEvents) {
        const eventId = randomId('event')
        const now = new Date()

        await db.insert(events).values({
          id: eventId,
          calendarId,
          title: extEvent.title,
          description: extEvent.description,
          startAt: extEvent.startAt,
          endAt: extEvent.endAt,
          timeZone: 'UTC',
          location: extEvent.location,
          recurrence: null,
          createdAt: now,
          updatedAt: now,
        })

        // Track sync
        await db.insert(syncedEvents).values({
          id: randomId('synced'),
          eventId,
          integrationId: id,
          externalId: extEvent.id,
          lastSyncAt: now,
        })

        importedCount++
      }

      // Update last sync time
      await db
        .update(integrations)
        .set({ lastSyncAt: new Date(), updatedAt: new Date() })
        .where(eq(integrations.id, id))

      // Return comprehensive sync result
      const response: any = {
        success: true,
        provider: int.provider,
        type: int.type,
      }

      if (int.type === 'calendar') {
        response.calendarSync = {
          eventsImported: importedCount,
        }
      }

      if (int.type === 'email' && emailSyncResult) {
        response.emailSync = {
          processed: emailSyncResult.processed,
          created: emailSyncResult.created,
          updated: emailSyncResult.updated,
          skipped: emailSyncResult.skipped,
          message: `Auto-scheduled ${emailSyncResult.created} events from ${emailSyncResult.processed} emails`,
        }
      }

      return c.json(response)
    } catch (error: unknown) {
      console.error('Sync integration error:', error)
      return c.json({ error: 'Failed to sync' }, 500)
    }
  })

  // Delete integration
  app.delete('/api/integrations/:id', async (c) => {
    const user = await getCurrentUser(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    try {
      const id = c.req.param('id')
      const db = getDb(c.env)

      // Verify ownership
      const existing = await db
        .select()
        .from(integrations)
        .where(and(eq(integrations.id, id), eq(integrations.userId, user.id)))
        .limit(1)

      if (existing.length === 0) {
        return c.json({ error: 'Integration not found' }, 404)
      }

      await db.delete(integrations).where(eq(integrations.id, id))

      return c.json({ success: true })
    } catch (error: unknown) {
      console.error('Delete integration error:', error)
      return c.json({ error: 'Failed to delete integration' }, 500)
    }
  })

  // Toggle integration active status
  app.patch('/api/integrations/:id/toggle', async (c) => {
    const user = await getCurrentUser(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    try {
      const id = c.req.param('id')
      const db = getDb(c.env)

      const existing = await db
        .select()
        .from(integrations)
        .where(and(eq(integrations.id, id), eq(integrations.userId, user.id)))
        .limit(1)

      if (existing.length === 0) {
        return c.json({ error: 'Integration not found' }, 404)
      }

      const newStatus = !existing[0].isActive

      await db
        .update(integrations)
        .set({ isActive: newStatus, updatedAt: new Date() })
        .where(eq(integrations.id, id))

      return c.json({ success: true, isActive: newStatus })
    } catch (error: unknown) {
      console.error('Toggle integration error:', error)
      return c.json({ error: 'Failed to toggle integration' }, 500)
    }
  })
}