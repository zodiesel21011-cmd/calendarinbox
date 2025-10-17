import type { Email } from '../types'

const mockEmails: Email[] = [
  {
    id: '1',
    from: 'john.smith@techcorp.com',
    to: 'me@company.com',
    subject: 'Q4 Budget Review Meeting - Action Required',
    body: 'Hi team,\n\nWe need to schedule our Q4 budget review meeting. This is critical for planning next quarter.\n\nProposed times:\n- Monday 2PM\n- Tuesday 10AM\n\nPlease confirm your availability.\n\nBest regards,\nJohn',
    timestamp: new Date('2025-10-18T09:00:00'),
    isRead: false,
    hasAttachments: true,
    importance: 'high',
    labels: ['important', 'work']
  },
  {
    id: '2',
    from: 'sarah.marketing@company.com',
    to: 'me@company.com',
    subject: 'New Campaign Launch - Final Review',
    body: 'The new marketing campaign is ready for final review. Please check the attached materials by end of day Thursday.\n\nKey deliverables:\n- Social media graphics\n- Email templates\n- Landing page copy\n\nLet me know if you have any questions!',
    timestamp: new Date('2025-10-17T14:30:00'),
    isRead: false,
    hasAttachments: false,
    importance: 'high',
    labels: ['marketing']
  },
  {
    id: '3',
    from: 'teams-notification@microsoft.com',
    to: 'me@company.com',
    subject: 'Teams Meeting: Daily Standup',
    body: 'You have a Teams meeting scheduled:\n\nDaily Standup\nTime: Tomorrow at 9:00 AM\nDuration: 15 minutes\n\nJoin: https://teams.microsoft.com/l/meetup-join/...',
    timestamp: new Date('2025-10-16T16:00:00'),
    isRead: true,
    hasAttachments: false,
    importance: 'normal',
    labels: ['teams', 'meetings']
  },
  {
    id: '4',
    from: 'hr@company.com',
    to: 'me@company.com',
    subject: 'Benefits Enrollment Deadline - October 25',
    body: 'Reminder: Annual benefits enrollment period closes on October 25th.\n\nPlease review and update your:\n- Health insurance\n- 401(k) contributions\n- FSA/HSA selections\n\nLog into the benefits portal to make changes.',
    timestamp: new Date('2025-10-15T10:00:00'),
    isRead: true,
    hasAttachments: true,
    importance: 'high',
    labels: ['hr']
  },
  {
    id: '5',
    from: 'dev-team@company.com',
    to: 'me@company.com',
    subject: 'Code Review: Authentication Feature',
    body: 'Hi,\n\nPlease review PR #456 when you get a chance. It includes the new OAuth authentication flow.\n\nChanges:\n- JWT token implementation\n- Refresh token logic\n- User session management\n\nThanks!',
    timestamp: new Date('2025-10-14T11:20:00'),
    isRead: true,
    hasAttachments: false,
    importance: 'normal',
    labels: ['development']
  }
]

export const emailService = {
  async getEmails(): Promise<Email[]> {
    return new Promise(resolve => {
      setTimeout(() => resolve(mockEmails), 300)
    })
  },

  async markAsRead(id: string): Promise<void> {
    const email = mockEmails.find(e => e.id === id)
    if (email) email.isRead = true
  }
}
