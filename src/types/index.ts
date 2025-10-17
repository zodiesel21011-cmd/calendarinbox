export interface Email {
  id: string
  from: string
  to: string
  subject: string
  body: string
  timestamp: Date
  isRead: boolean
  hasAttachments: boolean
  importance: 'low' | 'normal' | 'high'
  labels: string[]
}

export interface CalendarEvent {
  id: string
  title: string
  description: string
  start: Date
  end: Date
  location?: string
  attendees: string[]
  isOnlineMeeting?: boolean
  teamsLink?: string
  color?: string
}

export interface AISuggestion {
  type: 'meeting' | 'reply' | 'task'
  confidence: number
  data: any
}
