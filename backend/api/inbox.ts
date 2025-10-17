import type { Hono } from 'hono'
import { eq, and, desc } from 'drizzle-orm'
import { getDb } from '../db/db'
import { threads, threadParticipants, messages, users } from '../db/schema'
import { getCurrentUser } from './auth'
import { randomId } from '../lib/crypto'

type Bindings = { DB: D1Database; ASSETS: Fetcher }
type App = Hono<{ Bindings: Bindings }>

export default (app: App) => {
  // Create thread
  app.post('/api/threads', async (c) => {
    const user = await getCurrentUser(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    try {
      const body = await c.req.json()
      const { subject, participantIds } = body

      if (!subject) {
        return c.json({ error: 'Subject is required' }, 400)
      }

      const db = getDb(c.env)
      const threadId = randomId('thread')
      const now = new Date()

      // Create thread
      await db.insert(threads).values({
        id: threadId,
        subject: subject.trim(),
        createdBy: user.id,
        createdAt: now,
        updatedAt: now,
      })

      // Add creator as participant
      await db.insert(threadParticipants).values({
        id: randomId('tp'),
        threadId,
        userId: user.id,
        joinedAt: now,
      })

      // Add other participants
      if (participantIds && Array.isArray(participantIds)) {
        for (const participantId of participantIds) {
          if (participantId !== user.id) {
            await db.insert(threadParticipants).values({
              id: randomId('tp'),
              threadId,
              userId: participantId,
              joinedAt: now,
            })
          }
        }
      }

      const result = await db
        .select()
        .from(threads)
        .where(eq(threads.id, threadId))
        .limit(1)

      return c.json(result[0])
    } catch (error: unknown) {
      console.error('Create thread error:', error)
      return c.json({ error: 'Failed to create thread' }, 500)
    }
  })

  // List user's threads
  app.get('/api/threads', async (c) => {
    const user = await getCurrentUser(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    try {
      const db = getDb(c.env)

      // Get threads where user is a participant
      const userThreads = await db
        .select({
          threadId: threadParticipants.threadId,
        })
        .from(threadParticipants)
        .where(eq(threadParticipants.userId, user.id))

      if (userThreads.length === 0) {
        return c.json([])
      }

      const threadIds = userThreads.map((t) => t.threadId)

      // Get thread details
      const result = await db
        .select()
        .from(threads)
        .where(eq(threads.id, threadIds[0]))

      return c.json(result)
    } catch (error: unknown) {
      console.error('List threads error:', error)
      return c.json({ error: 'Failed to list threads' }, 500)
    }
  })

  // Get thread with messages
  app.get('/api/threads/:id', async (c) => {
    const user = await getCurrentUser(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    try {
      const id = c.req.param('id')
      const db = getDb(c.env)

      // Verify user is participant
      const participation = await db
        .select()
        .from(threadParticipants)
        .where(and(eq(threadParticipants.threadId, id), eq(threadParticipants.userId, user.id)))
        .limit(1)

      if (participation.length === 0) {
        return c.json({ error: 'Thread not found' }, 404)
      }

      // Get thread
      const thread = await db
        .select()
        .from(threads)
        .where(eq(threads.id, id))
        .limit(1)

      if (thread.length === 0) {
        return c.json({ error: 'Thread not found' }, 404)
      }

      // Get messages with sender info
      const threadMessages = await db
        .select({
          id: messages.id,
          threadId: messages.threadId,
          senderId: messages.senderId,
          content: messages.content,
          createdAt: messages.createdAt,
          senderName: users.name,
          senderUsername: users.username,
        })
        .from(messages)
        .innerJoin(users, eq(messages.senderId, users.id))
        .where(eq(messages.threadId, id))
        .orderBy(desc(messages.createdAt))

      return c.json({
        ...thread[0],
        messages: threadMessages,
      })
    } catch (error: unknown) {
      console.error('Get thread error:', error)
      return c.json({ error: 'Failed to get thread' }, 500)
    }
  })

  // Send message
  app.post('/api/threads/:id/messages', async (c) => {
    const user = await getCurrentUser(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    try {
      const id = c.req.param('id')
      const body = await c.req.json()
      const { content } = body

      if (!content) {
        return c.json({ error: 'Message content is required' }, 400)
      }

      const db = getDb(c.env)

      // Verify user is participant
      const participation = await db
        .select()
        .from(threadParticipants)
        .where(and(eq(threadParticipants.threadId, id), eq(threadParticipants.userId, user.id)))
        .limit(1)

      if (participation.length === 0) {
        return c.json({ error: 'Thread not found' }, 404)
      }

      const messageId = randomId('msg')
      const now = new Date()

      // Create message
      await db.insert(messages).values({
        id: messageId,
        threadId: id,
        senderId: user.id,
        content: content.trim(),
        createdAt: now,
      })

      // Update thread timestamp
      await db.update(threads).set({ updatedAt: now }).where(eq(threads.id, id))

      const result = await db
        .select({
          id: messages.id,
          threadId: messages.threadId,
          senderId: messages.senderId,
          content: messages.content,
          createdAt: messages.createdAt,
          senderName: users.name,
          senderUsername: users.username,
        })
        .from(messages)
        .innerJoin(users, eq(messages.senderId, users.id))
        .where(eq(messages.id, messageId))
        .limit(1)

      return c.json(result[0])
    } catch (error: unknown) {
      console.error('Send message error:', error)
      return c.json({ error: 'Failed to send message' }, 500)
    }
  })

  // Get thread participants
  app.get('/api/threads/:id/participants', async (c) => {
    const user = await getCurrentUser(c)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    try {
      const id = c.req.param('id')
      const db = getDb(c.env)

      // Verify user is participant
      const participation = await db
        .select()
        .from(threadParticipants)
        .where(and(eq(threadParticipants.threadId, id), eq(threadParticipants.userId, user.id)))
        .limit(1)

      if (participation.length === 0) {
        return c.json({ error: 'Thread not found' }, 404)
      }

      // Get participants
      const result = await db
        .select({
          id: users.id,
          name: users.name,
          username: users.username,
          email: users.email,
          joinedAt: threadParticipants.joinedAt,
        })
        .from(threadParticipants)
        .innerJoin(users, eq(threadParticipants.userId, users.id))
        .where(eq(threadParticipants.threadId, id))

      return c.json(result)
    } catch (error: unknown) {
      console.error('Get participants error:', error)
      return c.json({ error: 'Failed to get participants' }, 500)
    }
  })
}