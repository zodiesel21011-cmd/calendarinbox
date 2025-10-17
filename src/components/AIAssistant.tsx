import { useState } from 'react';
import { X, Send, Sparkles, Calendar, Mail, Lightbulb } from 'lucide-react';

interface AIAssistantProps {
  onClose: () => void;
}

export default function AIAssistant({ onClose }: AIAssistantProps) {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<any[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your AI assistant. I can help you manage your calendar, draft emails, prioritize tasks, and more. How can I assist you today?'
    }
  ]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) return;

    // Add user message
    const newHistory = [...chatHistory, { role: 'user', content: message }];

    // Simulate AI response
    const aiResponse = getAIResponse(message);
    newHistory.push({ role: 'assistant', content: aiResponse });

    setChatHistory(newHistory);
    setMessage('');
  };

  const getAIResponse = (userMessage: string) => {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('meeting') || lowerMessage.includes('schedule')) {
      return 'I can help you schedule a meeting. What time works best for you? I\'ll check your calendar for available slots.';
    }

    if (lowerMessage.includes('email') || lowerMessage.includes('reply')) {
      return 'I can help you compose or reply to emails. Would you like me to draft a response or create a new email?';
    }

    if (lowerMessage.includes('priority') || lowerMessage.includes('important')) {
      return 'I\'ve analyzed your emails and found 3 high-priority items that need your attention today. Would you like me to show them to you?';
    }

    if (lowerMessage.includes('summary') || lowerMessage.includes('summarize')) {
      return 'I can summarize your emails and meetings. Would you like a summary of today\'s activity or this week\'s overview?';
    }

    return 'I understand. I\'m here to help with calendar management, email organization, scheduling meetings, and task prioritization. What specific task would you like help with?';
  };

  const quickActions = [
    { icon: Calendar, label: 'Schedule Meeting', action: 'Schedule a meeting for tomorrow' },
    { icon: Mail, label: 'Draft Email', action: 'Help me draft an email' },
    { icon: Sparkles, label: 'Prioritize Tasks', action: 'Show me my priority tasks' },
    { icon: Lightbulb, label: 'Suggestions', action: 'Give me suggestions for today' },
  ];

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      data-testid="ai-assistant-modal"
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[600px] flex flex-col animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">AI Assistant</h2>
              <p className="text-xs text-white/80">Powered by advanced AI</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-600 mb-2">Quick Actions:</p>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  onClick={() => setMessage(action.action)}
                  className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition text-left text-sm"
                >
                  <Icon className="w-4 h-4 text-blue-600" />
                  <span className="text-gray-700">{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-auto p-6 space-y-4">
          {chatHistory.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm">{msg.content}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-4 border-t border-gray-200">
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask me anything..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              data-testid="ai-message-input"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition font-medium flex items-center gap-2"
              data-testid="ai-send-button"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
