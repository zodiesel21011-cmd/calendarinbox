import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { preparedStatements } from '../database/schema.js';
import { aiService } from '../services/ai.service.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/events
 * Get events for a date range
 */
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { start, end } = req.query;
    const userId = req.user!.id;

    const startDate = start ? new Date(start as string).toISOString() : new Date().toISOString();
    const endDate = end ? new Date(end as string).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const events = preparedStatements.getEventsByUserId.all(userId, startDate, endDate);

    res.json({ events });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

/**
 * POST /api/events
 * Create a new event
 */
router.post('/', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const {
      title,
      description,
      location,
      startTime,
      endTime,
      allDay,
      color,
      calendarType,
      attendees,
      meetingUrl,
    } = req.body;

    // Validate required fields
    if (!title || !startTime || !endTime) {
      return res.status(400).json({ error: 'Title, start time, and end time are required' });
    }

    // Create event
    const result = preparedStatements.createEvent.run(
      userId,
      title,
      description || null,
      location || null,
      new Date(startTime).toISOString(),
      new Date(endTime).toISOString(),
      allDay ? 1 : 0,
      color || '#3b82f6',
      calendarType || 'personal',
      attendees ? JSON.stringify(attendees) : null,
      meetingUrl || null,
      0
    );

    const eventId = result.lastInsertRowid;

    // Log activity
    preparedStatements.logActivity.run(
      userId,
      'event_created',
      'event',
      eventId,
      JSON.stringify({ title }),
      null
    );

    res.status(201).json({
      message: 'Event created successfully',
      event: {
        id: eventId,
        userId,
        title,
        description,
        location,
        startTime,
        endTime,
        allDay,
        color,
        calendarType,
        attendees,
        meetingUrl,
      },
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

/**
 * PUT /api/events/:id
 * Update an event
 */
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const eventId = parseInt(req.params.id);
    const { title, description, location, startTime, endTime, allDay, color } = req.body;

    const result = preparedStatements.updateEvent.run(
      title,
      description || null,
      location || null,
      new Date(startTime).toISOString(),
      new Date(endTime).toISOString(),
      allDay ? 1 : 0,
      color || '#3b82f6',
      eventId,
      userId
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Log activity
    preparedStatements.logActivity.run(
      userId,
      'event_updated',
      'event',
      eventId,
      JSON.stringify({ title }),
      null
    );

    res.json({ message: 'Event updated successfully' });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

/**
 * DELETE /api/events/:id
 * Delete an event
 */
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const eventId = parseInt(req.params.id);

    const result = preparedStatements.deleteEvent.run(eventId, userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Log activity
    preparedStatements.logActivity.run(
      userId,
      'event_deleted',
      'event',
      eventId,
      null,
      null
    );

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

/**
 * POST /api/events/ai-suggest-time
 * Get AI suggestions for meeting time
 */
router.post('/ai-suggest-time', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { title, duration } = req.body;

    // Get existing events
    const now = new Date().toISOString();
    const futureDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    const events = preparedStatements.getEventsByUserId.all(userId, now, futureDate);

    // Get AI suggestions
    const suggestions = await aiService.suggestMeetingTime(title, duration || 60, events);

    res.json({ suggestions });
  } catch (error) {
    console.error('AI suggest time error:', error);
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
});

export default router;
