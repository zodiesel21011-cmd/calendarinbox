import React, { useState, useEffect } from 'react'
import { Mail, Star, Trash2, Reply, Forward, Clock, Paperclip, Calendar as CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import type { Email, AISuggestion } from '../types'
import { emailService } from '../services/emailService'
import { aiService } from '../services/aiService'

export const InboxView: React.FC = () => {
  const [emails, setEmails] = useState<Email[]>([])
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEmails()
  }, [])

  useEffect(() => {
    if (selectedEmail) {
      emailService.markAsRead(selectedEmail.id)
      analyzeEmail(selectedEmail)
    }
  }, [selectedEmail])

  const loadEmails = async () => {
    setLoading(true)
    const data = await emailService.getEmails()
    setEmails(data)
    if (data.length > 0) setSelectedEmail(data[0])
    setLoading(false)
  }

  const analyzeEmail = async (email: Email) => {
    const result = await aiService.analyzeEmail(email)
    setSuggestions(result)
  }

  return (
    <div className="h-full flex bg-white">
      {/* Email List */}
      <div className="w-96 border-r border-gray-200 flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
          <h2 className="text-xl font-bold">Inbox</h2>
          <p className="text-sm text-blue-100 mt-1">
            {emails.filter(e => !e.isRead).length} unread
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            emails.map(email => (
              <div
                key={email.id}
                onClick={() => setSelectedEmail(email)}
                className={`p-4 border-b cursor-pointer transition-colors ${
                  selectedEmail?.id === email.id 
                    ? 'bg-blue-50 border-l-4 border-l-blue-600' 
                    : 'hover:bg-gray-50'
                } ${!email.isRead ? 'bg-blue-50/30' : ''}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`text-sm truncate ${!email.isRead ? 'font-bold text-blue-700' : 'font-semibold text-gray-900'}`}>
                        {email.from.split('@')[0]}
                      </p>
                      {email.importance === 'high' && (
                        <Star className="w-4 h-4 text-red-500 fill-red-500" />
                      )}
                      {email.hasAttachments && (
                        <Paperclip className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <p className={`text-sm truncate ${!email.isRead ? 'font-semibold' : ''}`}>
                      {email.subject}
                    </p>
                    <p className="text-xs text-gray-500 truncate mt-1">
                      {email.body.substring(0, 50)}...
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                    {format(email.timestamp, 'MMM d')}
                  </span>
                </div>
                {email.labels.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {email.labels.slice(0, 2).map(label => (
                      <span key={label} className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                        {label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Email Detail */}
      <div className="flex-1 flex flex-col">
        {selectedEmail ? (
          <>
            <div className="bg-white border-b p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedEmail.subject}
                  </h1>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span><strong>From:</strong> {selectedEmail.from}</span>
                    <span><strong>To:</strong> {selectedEmail.to}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {format(selectedEmail.timestamp, 'PPpp')}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Reply">
                    <Reply className="w-5 h-5 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Forward">
                    <Forward className="w-5 h-5 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-red-100 rounded-lg transition-colors" title="Delete">
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </button>
                </div>
              </div>
              {selectedEmail.importance === 'high' && (
                <div className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                  <Star className="w-4 h-4 fill-current" />
                  High Priority
                </div>
              )}
            </div>

            {/* AI Suggestions */}
            {suggestions.length > 0 && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-b p-4">
                <h3 className="text-sm font-semibold text-purple-900 mb-3">
                  🤖 AI Suggestions
                </h3>
                <div className="space-y-2">
                  {suggestions.map((sug, idx) => (
                    <div key={idx} className="bg-white rounded-lg p-3 shadow-sm border">
                      {sug.type === 'meeting' && (
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <CalendarIcon className="w-4 h-4 text-purple-600" />
                              <span className="font-medium text-sm">Meeting Detected</span>
                              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                                {Math.round(sug.confidence * 100)}% confident
                              </span>
                            </div>
                            <p className="text-xs text-gray-600">{sug.data.suggestedTime}</p>
                          </div>
                          <button className="bg-purple-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-purple-700">
                            Add to Calendar
                          </button>
                        </div>
                      )}
                      {sug.type === 'reply' && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Reply className="w-4 h-4 text-blue-600" />
                            <span className="font-medium text-sm">Quick Reply</span>
                          </div>
                          <p className="text-xs text-gray-600 italic mb-2">
                            "{sug.data.message.substring(0, 80)}..."
                          </p>
                          <button className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-blue-700">
                            Use AI Reply
                          </button>
                        </div>
                      )}
                      {sug.type === 'task' && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">📋</span>
                            <div>
                              <p className="font-medium text-sm">{sug.data.task}</p>
                              <p className="text-xs text-gray-500">Due: {sug.data.dueDate}</p>
                            </div>
                          </div>
                          <button className="bg-green-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-green-700">
                            Create Task
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Email Body */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {selectedEmail.body}
                </div>
              </div>
              {selectedEmail.hasAttachments && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Attachments</h4>
                  <div className="bg-gray-50 p-3 rounded-lg flex items-center gap-3">
                    <Paperclip className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-700">budget-report.pdf</span>
                    <span className="text-xs text-gray-500">2.4 MB</span>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <Mail className="w-16 h-16 mx-auto mb-4" />
              <p>Select an email to read</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
