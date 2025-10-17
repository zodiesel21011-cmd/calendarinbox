import nodemailer from 'nodemailer';
import { preparedStatements } from '../database/schema.js';
import { aiService } from './ai.service.js';

export interface EmailAccount {
  id: number;
  provider: string;
  email: string;
  access_token?: string;
  refresh_token?: string;
  imap_host?: string;
  imap_port?: number;
  smtp_host?: string;
  smtp_port?: number;
}

export interface Email {
  id?: number;
  subject: string;
  from: string;
  to: string;
  cc?: string;
  body: string;
  date: Date;
  isRead?: boolean;
  isStarred?: boolean;
  folder?: string;
  aiSummary?: string;
  aiCategory?: string;
  aiPriority?: number;
}

class EmailService {
  /**
   * Send email via SMTP
   */
  async sendEmail(accountId: number, userId: number, emailData: {
    to: string;
    subject: string;
    html: string;
    cc?: string;
    bcc?: string;
  }): Promise<void> {
    try {
      const account = preparedStatements.getEmailAccountsByUserId.all(userId)
        .find((acc: any) => acc.id === accountId);

      if (!account) {
        throw new Error('Email account not found');
      }

      // Create SMTP transporter based on provider
      const transporter = await this.createTransporter(account);

      await transporter.sendMail({
        from: account.email,
        to: emailData.to,
        cc: emailData.cc,
        bcc: emailData.bcc,
        subject: emailData.subject,
        html: emailData.html,
      });

      // Log activity
      preparedStatements.logActivity.run(
        userId,
        'email_sent',
        'email',
        null,
        JSON.stringify({ to: emailData.to, subject: emailData.subject }),
        null
      );
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  /**
   * Create SMTP transporter based on email provider
   */
  private async createTransporter(account: any) {
    // Gmail configuration
    if (account.provider === 'gmail') {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: account.email,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          clientId: process.env.GMAIL_CLIENT_ID,
          clientSecret: process.env.GMAIL_CLIENT_SECRET,
        },
      });
    }

    // Outlook/Microsoft configuration
    if (account.provider === 'outlook') {
      return nodemailer.createTransport({
        host: 'smtp.office365.com',
        port: 587,
        secure: false,
        auth: {
          type: 'OAuth2',
          user: account.email,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          clientId: process.env.OUTLOOK_CLIENT_ID,
          clientSecret: process.env.OUTLOOK_CLIENT_SECRET,
        },
      });
    }

    // Generic SMTP configuration
    return nodemailer.createTransport({
      host: account.smtp_host || process.env.SMTP_HOST,
      port: account.smtp_port || parseInt(process.env.SMTP_PORT || '587'),
      secure: account.smtp_port === 465,
      auth: {
        user: account.email,
        pass: account.access_token,
      },
    });
  }

  /**
   * Fetch emails from IMAP server (simplified version)
   * In production, use proper IMAP library with OAuth2 support
   */
  async fetchEmails(accountId: number, userId: number, folder: string = 'INBOX'): Promise<Email[]> {
    try {
      // This is a placeholder. In production, implement full IMAP integration
      // with libraries like node-imap or imap-simple with OAuth2 support
      
      // For demo purposes, return empty array
      // Real implementation would:
      // 1. Connect to IMAP server with OAuth2
      // 2. Fetch emails from specified folder
      // 3. Parse email content
      // 4. Store in database with duplicate detection
      // 5. Process with AI for categorization and summarization

      return [];
    } catch (error) {
      console.error('Error fetching emails:', error);
      throw error;
    }
  }

  /**
   * Process email with AI for smart categorization and suggestions
   */
  async processEmailWithAI(emailId: number, userId: number): Promise<void> {
    try {
      const email: any = preparedStatements.getEmailById.get(emailId, userId);
      
      if (!email) {
        throw new Error('Email not found');
      }

      // Use AI to analyze email
      const analysis = await aiService.analyzeEmail({
        subject: email.subject,
        body: email.body_text || email.body_html,
        from: email.from_email,
      });

      // Update email with AI insights
      const updateStmt = preparedStatements as any;
      if (!updateStmt.updateEmailAI) {
        const db = (await import('../database/schema.js')).default;
        updateStmt.updateEmailAI = db.prepare(`
          UPDATE emails 
          SET ai_category = ?, ai_priority = ?, ai_summary = ?, ai_suggested_actions = ?
          WHERE id = ?
        `);
      }

      updateStmt.updateEmailAI.run(
        analysis.category,
        analysis.priority,
        analysis.summary,
        JSON.stringify(analysis.suggestedActions),
        emailId
      );

      // Create calendar event if suggested
      if (analysis.suggestedEvent) {
        preparedStatements.createEvent.run(
          userId,
          analysis.suggestedEvent.title,
          analysis.suggestedEvent.description,
          analysis.suggestedEvent.location || null,
          analysis.suggestedEvent.startTime,
          analysis.suggestedEvent.endTime,
          0,
          '#4f46e5',
          'work',
          null,
          null,
          1
        );
      }
    } catch (error) {
      console.error('Error processing email with AI:', error);
    }
  }

  /**
   * Generate AI-powered email reply
   */
  async generateReply(emailId: number, userId: number, context?: string): Promise<string> {
    try {
      const email: any = preparedStatements.getEmailById.get(emailId, userId);
      
      if (!email) {
        throw new Error('Email not found');
      }

      return await aiService.generateEmailReply({
        subject: email.subject,
        body: email.body_text || email.body_html,
        from: email.from_email,
        context,
      });
    } catch (error) {
      console.error('Error generating reply:', error);
      throw error;
    }
  }

  /**
   * Get email statistics
   */
  async getEmailStats(userId: number): Promise<any> {
    const db = (await import('../database/schema.js')).default;
    
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread,
        SUM(CASE WHEN is_starred = 1 THEN 1 ELSE 0 END) as starred,
        SUM(CASE WHEN folder = 'inbox' THEN 1 ELSE 0 END) as inbox,
        SUM(CASE WHEN ai_priority >= 8 THEN 1 ELSE 0 END) as high_priority
      FROM emails
      WHERE user_id = ?
    `).get(userId);

    return stats;
  }

  /**
   * Search emails with AI-powered semantic search
   */
  async searchEmails(userId: number, query: string): Promise<Email[]> {
    try {
      const searchPattern = `%${query}%`;
      const results: any[] = preparedStatements.searchEmails.all(userId, searchPattern, searchPattern);
      
      return results.map(email => ({
        id: email.id,
        subject: email.subject,
        from: email.from_email,
        to: email.to_email,
        body: email.body_text || email.body_html,
        date: new Date(email.date),
        isRead: email.is_read === 1,
        isStarred: email.is_starred === 1,
        folder: email.folder,
        aiSummary: email.ai_summary,
        aiCategory: email.ai_category,
        aiPriority: email.ai_priority,
      }));
    } catch (error) {
      console.error('Error searching emails:', error);
      throw error;
    }
  }
}

export const emailService = new EmailService();
