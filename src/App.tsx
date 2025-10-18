import React, { useState, useEffect } from 'react'
import { Sidebar } from './components/Sidebar'
import { InboxView } from './components/InboxView'
import { CalendarView } from './components/CalendarView'
import { emailService } from './services/emailService'

function App() {
  const [activeView, setActiveView] = useState('inbox')
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    loadUnreadCount()
  }, [])

  const loadUnreadCount = async () => {
    const emails = await emailService.getEmails()
    const count = emails.filter(e => !e.isRead).length
    setUnreadCount(count)
  }

  const renderView = () => {
    switch (activeView) {
      case 'inbox':
        return <InboxView onUnreadChange={loadUnreadCount} />
      case 'calendar':
        return <CalendarView />
      case 'sent':
      case 'starred':
      case 'teams':
      case 'ai':
      case 'settings':
        return (
          <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
            <div className="text-center max-w-md">
              <div className="text-6xl mb-4">
                {activeView === 'teams' && '👥'}
                {activeView === 'ai' && '🤖'}
                {activeView === 'sent' && '📤'}
                {activeView === 'starred' && '⭐'}
                {activeView === 'settings' && '⚙️'}
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2 capitalize">
                {activeView}
              </h2>
              <p className="text-gray-600">
                {activeView === 'teams' && 'Microsoft Teams Integration - Connect your account to sync meetings'}
                {activeView === 'ai' && 'AI Assistant - Intelligent email and calendar management'}
                {activeView === 'sent' && 'Sent Mail - Your outgoing messages'}
                {activeView === 'starred' && 'Starred - Important messages you\'ve marked'}
                {activeView === 'settings' && 'Settings - Configure your preferences'}
              </p>
              {activeView === 'teams' && (
                <button className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                  Connect Microsoft Teams
                </button>
              )}
              {activeView === 'ai' && (
                <div className="mt-8 space-y-3 text-left bg-white rounded-xl p-6 shadow-lg">
                  <div className="flex items-center justify-between py-2">
                    <span>Email Analysis</span>
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">Active</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span>Auto-Scheduling</span>
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">Active</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span>Duplicate Detection</span>
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">Active</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      default:
        return <InboxView />
    }
  }

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      <Sidebar 
        activeView={activeView} 
        onViewChange={setActiveView}
        unreadCount={unreadCount}
      />
      <div className="flex-1 overflow-hidden">
        {renderView()}
      </div>
    </div>
  )
}

export default App
