import type { CalendarEvent } from '../types'

const today = new Date()
today.setHours(0, 0, 0, 0)

const mockEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Team Standup',
    description: 'Daily sync with development team',
    start: new Date(today.getTime() + 9 * 3600000),
    end: new Date(today.getTime() + 9.5 * 3600000),
    location: 'Microsoft Teams',
    attendees: ['dev-team@company.com'],
    isOnlineMeeting: true,
    teamsLink: 'https://teams.microsoft.com/l/meetup-join/...',
    color: '#10b981'
  },
  {
    id: '2',
    title: 'Q4 Budget Review',
    description: 'Quarterly budget planning meeting',
    start: new Date(today.getTime() + 14 * 3600000),
    end: new Date(today.getTime() + 15 * 3600000),
    location: 'Conference Room A',
    attendees: ['john.smith@techcorp.com', 'finance@company.com'],
    color: '#0ea5e9'
  },
  {
    id: '3',
    title: 'Client Presentation',
    description: 'Product demo for Acme Corp',
    start: new Date(today.getTime() + 86400000 + 10 * 3600000),
    end: new Date(today.getTime() + 86400000 + 11.5 * 3600000),
    location: 'Microsoft Teams',
    attendees: ['client@acme.com', 'sales@company.com'],
    isOnlineMeeting: true,
    color: '#8b5cf6'
  },
  {
    id: '4',
    title: 'Marketing Campaign Review',
    description: 'Review new campaign materials',
    start: new Date(today.getTime() + 86400000 + 15 * 3600000),
    end: new Date(today.getTime() + 86400000 + 16 * 3600000),
    attendees: ['sarah.marketing@company.com'],
    color: '#ec4899'
  }
]

export const calendarService = {
  async getEvents(): Promise<CalendarEvent[]> {
    return new Promise(resolve => {
      setTimeout(() => resolve(mockEvents), 300)
    })
  }
}
