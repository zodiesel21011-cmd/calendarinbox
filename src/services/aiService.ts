import type { Email, AISuggestion } from '../types'

export const aiService = {
  async analyzeEmail(email: Email): Promise<AISuggestion[]> {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const suggestions: AISuggestion[] = []
    
    // Detect meeting requests
    const meetingKeywords = ['meeting', 'schedule', 'call', 'sync', 'discuss']
    const hasMeeting = meetingKeywords.some(keyword =>
      email.subject.toLowerCase().includes(keyword) ||
      email.body.toLowerCase().includes(keyword)
    )
    
    if (hasMeeting) {
      suggestions.push({
        type: 'meeting',
        confidence: 0.85,
        data: {
          title: email.subject,
          suggestedTime: 'Monday 2PM or Tuesday 10AM'
        }
      })
    }
    
    // Suggest reply
    if (!email.isRead) {
      suggestions.push({
        type: 'reply',
        confidence: 0.75,
        data: {
          message: `Hi ${email.from.split('@')[0]},\n\nThank you for your email. I'll review this and get back to you shortly.\n\nBest regards`
        }
      })
    }
    
    // Detect tasks
    if (email.body.toLowerCase().includes('review') || 
        email.body.toLowerCase().includes('please')) {
      suggestions.push({
        type: 'task',
        confidence: 0.70,
        data: {
          task: `Review: ${email.subject}`,
          dueDate: 'This week'
        }
      })
    }
    
    return suggestions
  }
}
