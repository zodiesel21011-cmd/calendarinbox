import React from 'react'
import { Calendar, Mail, Inbox, Send, Star, Users, Bot, Settings } from 'lucide-react'

interface SidebarProps {
  activeView: string
  onViewChange: (view: string) => void
  unreadCount?: number
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeView, 
  onViewChange, 
  unreadCount = 0 
}) => {
  const menuItems = [
    { id: 'inbox', icon: Mail, label: 'Inbox', badge: unreadCount },
    { id: 'calendar', icon: Calendar, label: 'Calendar' },
    { id: 'sent', icon: Send, label: 'Sent' },
    { id: 'starred', icon: Star, label: 'Starred' },
    { id: 'teams', icon: Users, label: 'Teams' },
    { id: 'ai', icon: Bot, label: 'AI Assistant' },
  ]

  return (
    <div className="w-64 bg-gray-900 text-white h-full flex flex-col">
      {/* Logo Header */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">AI Mail Pro</h1>
            <p className="text-xs text-gray-400">Enterprise</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeView === item.id
            
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg
                  transition-all duration-200
                  ${isActive 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                    : 'text-gray-300 hover:bg-gray-800'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="flex-1 text-left font-medium">{item.label}</span>
                {item.badge && item.badge > 0 ? (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full min-w-[24px] text-center">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Settings Footer */}
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={() => onViewChange('settings')}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
        >
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </button>
        <div className="mt-4 text-center text-xs text-gray-500">
          v1.0.0 • Built with AI
        </div>
      </div>
    </div>
  )
}
