import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { preparedStatements } from '../database/schema.js';
import { emailService } from '../services/email.service.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/emails
 * Get emails for user
 */
router.get('/', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { folder = 'inbox', limit = '50', offset = '0' } = req.query;

    const emails = preparedStatements.getEmailsByUserId.all(
      userId,
      folder as string,
      parseInt(limit as string),
      parseInt(offset as string)
    );

    res.json({ emails });
  } catch (error) {
    console.error('Get emails error:', error);
    res.status(500).json({ error: 'Failed to fetch emails' });
  }
});

/**
 * GET /api/emails/stats
 * Get email statistics
 */
router.get('/stats', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const stats = await emailService.getEmailStats(userId);

    res.json({ stats });
  } catch (error) {
    console.error('Get email stats error:', error);
    res.status(500).json({ error: 'Failed to fetch email stats' });
  }
});

/**
 * GET /api/emails/:id
 * Get a specific email
 */
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const emailId = parseInt(req.params.id);

    const email = preparedStatements.getEmailById.get(emailId, userId);

    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    // Mark as read
    preparedStatements.updateEmailReadStatus.run(1, emailId, userId);

    res.json({ email });
  } catch (error) {
    console.error('Get email error:', error);
    res.status(500).json({ error: 'Failed to fetch email' });
  }
});

/**
 * POST /api/emails/send
 * Send an email
 */
router.post('/send', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { accountId, to, subject, html, cc, bcc } = req.body;

    // Validate input
    if (!accountId || !to || !subject || !html) {
      return res.status(400).json({ error: 'Account, recipient, subject, and body are required' });
    }

    await emailService.sendEmail(accountId, userId, { to, subject, html, cc, bcc });

    res.json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Send email error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

/**
 * POST /api/emails/:id/ai-reply
 * Generate AI reply for an email
 */
router.post('/:id/ai-reply', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const emailId = parseInt(req.params.id);
    const { context } = req.body;

    const reply = await emailService.generateReply(emailId, userId, context);

    res.json({ reply });
  } catch (error) {
    console.error('AI reply error:', error);
    res.status(500).json({ error: 'Failed to generate reply' });
  }
});

/**
 * POST /api/emails/search
 * Search emails
 */
router.post('/search', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const results = await emailService.searchEmails(userId, query);

    res.json({ results });
  } catch (error) {
    console.error('Search emails error:', error);
    res.status(500).json({ error: 'Failed to search emails' });
  }
});

/**
 * PUT /api/emails/:id/folder
 * Move email to a folder
 */
router.put('/:id/folder', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const emailId = parseInt(req.params.id);
    const { folder } = req.body;

    if (!folder) {
      return res.status(400).json({ error: 'Folder is required' });
    }

    preparedStatements.updateEmailFolder.run(folder, emailId, userId);

    res.json({ message: 'Email moved successfully' });
  } catch (error) {
    console.error('Move email error:', error);
    res.status(500).json({ error: 'Failed to move email' });
  }
});

/**
 * POST /api/emails/:id/ai-analyze
 * Analyze email with AI
 */
router.post('/:id/ai-analyze', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const emailId = parseInt(req.params.id);

    await emailService.processEmailWithAI(emailId, userId);

    res.json({ message: 'Email analyzed successfully' });
  } catch (error) {
    console.error('AI analyze error:', error);
    res.status(500).json({ error: 'Failed to analyze email' });
  }
});

export default router;
