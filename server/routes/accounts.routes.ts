import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { preparedStatements } from '../database/schema.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/accounts
 * Get all email accounts for user
 */
router.get('/', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const accounts = preparedStatements.getEmailAccountsByUserId.all(userId);

    // Don't send sensitive tokens to frontend
    const sanitizedAccounts = (accounts as any[]).map(acc => ({
      id: acc.id,
      provider: acc.provider,
      email: acc.email,
      isPrimary: acc.is_primary === 1,
      lastSync: acc.last_sync,
    }));

    res.json({ accounts: sanitizedAccounts });
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

/**
 * POST /api/accounts
 * Add a new email account
 */
router.post('/', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { provider, email, accessToken, refreshToken } = req.body;

    // Validate input
    if (!provider || !email) {
      return res.status(400).json({ error: 'Provider and email are required' });
    }

    // Check if account already exists
    const existingAccounts: any[] = preparedStatements.getEmailAccountsByUserId.all(userId);
    const isPrimary = existingAccounts.length === 0 ? 1 : 0;

    const result = preparedStatements.createEmailAccount.run(
      userId,
      provider,
      email,
      accessToken || null,
      refreshToken || null,
      isPrimary
    );

    const accountId = result.lastInsertRowid;

    // Log activity
    preparedStatements.logActivity.run(
      userId,
      'account_added',
      'email_account',
      accountId,
      JSON.stringify({ provider, email }),
      null
    );

    res.status(201).json({
      message: 'Email account added successfully',
      account: {
        id: accountId,
        provider,
        email,
        isPrimary: isPrimary === 1,
      },
    });
  } catch (error) {
    console.error('Add account error:', error);
    res.status(500).json({ error: 'Failed to add email account' });
  }
});

/**
 * DELETE /api/accounts/:id
 * Remove an email account
 */
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const accountId = parseInt(req.params.id);

    const db = (await import('../database/schema.js')).default;
    const result = db.prepare('DELETE FROM email_accounts WHERE id = ? AND user_id = ?')
      .run(accountId, userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Log activity
    preparedStatements.logActivity.run(
      userId,
      'account_removed',
      'email_account',
      accountId,
      null,
      null
    );

    res.json({ message: 'Email account removed successfully' });
  } catch (error) {
    console.error('Remove account error:', error);
    res.status(500).json({ error: 'Failed to remove email account' });
  }
});

export default router;
