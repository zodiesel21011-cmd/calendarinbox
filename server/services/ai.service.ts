import OpenAI from 'openai';

const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

interface EmailAnalysis {
  category: string;
  priority: number;
  summary: string;
  suggestedActions: string[];
  suggestedEvent?: {
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    location?: string;
  };
}

interface EmailContext {
  subject: string;
  body: string;
  from: string;
  context?: string;
}

class AIService {
  /**
   * Analyze email content with AI
   */
  async analyzeEmail(email: EmailContext): Promise<EmailAnalysis> {
    if (!openai) {
      // Return basic analysis if OpenAI is not configured
      return this.basicEmailAnalysis(email);
    }

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant that analyzes emails for a professional calendar/inbox manager. 
Analyze the email and provide:
1. Category (work, personal, finance, travel, marketing, etc.)
2. Priority (1-10, where 10 is most urgent)
3. Brief summary (1-2 sentences)
4. Suggested actions (array of strings)
5. If the email mentions a meeting/event, extract event details in JSON format

Respond in JSON format only.`
          },
          {
            role: 'user',
            content: `Subject: ${email.subject}\n\nFrom: ${email.from}\n\nBody: ${email.body.substring(0, 1000)}`
          }
        ],
        temperature: 0.3,
        max_tokens: 500,
      });

      const response = completion.choices[0].message.content;
      if (!response) {
        return this.basicEmailAnalysis(email);
      }

      try {
        return JSON.parse(response);
      } catch {
        return this.basicEmailAnalysis(email);
      }
    } catch (error) {
      console.error('AI analysis error:', error);
      return this.basicEmailAnalysis(email);
    }
  }

  /**
   * Generate email reply with AI
   */
  async generateEmailReply(email: EmailContext): Promise<string> {
    if (!openai) {
      return this.basicEmailReply(email);
    }

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a professional email assistant. Generate a polite, professional email reply based on the context provided.
${email.context ? `Additional context: ${email.context}` : ''}`
          },
          {
            role: 'user',
            content: `Generate a reply to this email:\n\nSubject: ${email.subject}\n\nFrom: ${email.from}\n\nBody: ${email.body.substring(0, 1000)}`
          }
        ],
        temperature: 0.7,
        max_tokens: 300,
      });

      return completion.choices[0].message.content || this.basicEmailReply(email);
    } catch (error) {
      console.error('AI reply generation error:', error);
      return this.basicEmailReply(email);
    }
  }

  /**
   * Smart schedule suggestion based on existing events
   */
  async suggestMeetingTime(title: string, duration: number, existingEvents: any[]): Promise<string[]> {
    if (!openai) {
      return this.basicScheduleSuggestion(duration);
    }

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a smart calendar assistant. Suggest 3 optimal meeting times considering existing events and typical business hours (9 AM - 6 PM).'
          },
          {
            role: 'user',
            content: `Meeting: ${title}\nDuration: ${duration} minutes\n\nExisting events: ${JSON.stringify(existingEvents)}\n\nSuggest 3 time slots in ISO format.`
          }
        ],
        temperature: 0.5,
        max_tokens: 200,
      });

      const response = completion.choices[0].message.content;
      if (response) {
        // Parse suggested times from response
        const times = response.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/g) || [];
        if (times.length > 0) return times;
      }
    } catch (error) {
      console.error('AI scheduling error:', error);
    }

    return this.basicScheduleSuggestion(duration);
  }

  /**
   * Auto-categorize and prioritize incoming emails
   */
  async batchAnalyzeEmails(emails: EmailContext[]): Promise<EmailAnalysis[]> {
    // For better performance, analyze in batches
    const results: EmailAnalysis[] = [];

    for (const email of emails) {
      results.push(await this.analyzeEmail(email));
    }

    return results;
  }

  /**
   * Generate meeting summary from email thread
   */
  async generateMeetingSummary(emails: EmailContext[]): Promise<string> {
    if (!openai) {
      return 'Meeting summary not available without AI configuration.';
    }

    try {
      const thread = emails.map(e => `From: ${e.from}\nSubject: ${e.subject}\n${e.body}`).join('\n\n---\n\n');

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Summarize this email thread and extract key points, decisions, and action items.'
          },
          {
            role: 'user',
            content: thread.substring(0, 3000)
          }
        ],
        temperature: 0.3,
        max_tokens: 300,
      });

      return completion.choices[0].message.content || 'No summary available.';
    } catch (error) {
      console.error('AI summary error:', error);
      return 'Error generating summary.';
    }
  }

  /**
   * Basic email analysis fallback (when AI is not available)
   */
  private basicEmailAnalysis(email: EmailContext): EmailAnalysis {
    const category = this.detectBasicCategory(email.subject, email.body);
    const priority = this.detectBasicPriority(email.subject, email.body);

    return {
      category,
      priority,
      summary: email.body.substring(0, 150) + '...',
      suggestedActions: ['Reply', 'Archive'],
    };
  }

  /**
   * Basic email reply fallback
   */
  private basicEmailReply(email: EmailContext): string {
    return `Thank you for your email regarding "${email.subject}". I'll review this and get back to you shortly.\n\nBest regards`;
  }

  /**
   * Basic schedule suggestion fallback
   */
  private basicScheduleSuggestion(duration: number): string[] {
    const now = new Date();
    const suggestions: string[] = [];

    for (let i = 1; i <= 3; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      date.setHours(10, 0, 0, 0);
      suggestions.push(date.toISOString());
    }

    return suggestions;
  }

  /**
   * Detect basic category from keywords
   */
  private detectBasicCategory(subject: string, body: string): string {
    const text = (subject + ' ' + body).toLowerCase();

    if (text.includes('meeting') || text.includes('calendar') || text.includes('schedule')) return 'work';
    if (text.includes('invoice') || text.includes('payment') || text.includes('receipt')) return 'finance';
    if (text.includes('flight') || text.includes('hotel') || text.includes('booking')) return 'travel';
    if (text.includes('unsubscribe') || text.includes('newsletter')) return 'marketing';

    return 'personal';
  }

  /**
   * Detect basic priority from keywords
   */
  private detectBasicPriority(subject: string, body: string): number {
    const text = (subject + ' ' + body).toLowerCase();

    if (text.includes('urgent') || text.includes('asap') || text.includes('immediate')) return 9;
    if (text.includes('important') || text.includes('priority')) return 7;
    if (text.includes('fyi') || text.includes('info')) return 3;

    return 5;
  }
}

export const aiService = new AIService();
