import { useState, useEffect } from 'react';
import { Mail, Star, Archive, Trash2, Reply, Forward, Sparkles, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import * as api from '../services/api';
import ComposeEmail from './ComposeEmail';

interface EmailViewProps {
  folder: string;
}

export default function EmailView({ folder }: EmailViewProps) {
  const [emails, setEmails] = useState<any[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadEmails();
    loadStats();
  }, [folder]);

  const loadEmails = async () => {
    try {
      setLoading(true);
      const response = await api.getEmails(folder);
      setEmails(response.emails || []);
    } catch (error) {
      console.error('Failed to load emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.getEmailStats();
      setStats(response.stats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleEmailClick = async (email: any) => {
    try {
      const response = await api.getEmail(email.id);
      setSelectedEmail(response.email);
    } catch (error) {
      console.error('Failed to load email:', error);
    }
  };

  const handleReply = () => {
    setShowCompose(true);
  };

  const handleAIReply = async () => {
    if (!selectedEmail) return;

    try {
      await api.generateReply(selectedEmail.id);
      setShowCompose(true);
      // You can pass the AI-generated reply to the compose modal
    } catch (error) {
      console.error('Failed to generate AI reply:', error);
    }
  };

  const handleArchive = async () => {
    if (!selectedEmail) return;

    try {
      await api.moveEmailToFolder(selectedEmail.id, 'archive');
      setSelectedEmail(null);
      await loadEmails();
    } catch (error) {
      console.error('Failed to archive email:', error);
    }
  };

  return (
    <div className="flex h-full" data-testid="email-view">
      {/* Email List */}
      <div className="w-96 border-r border-gray-200 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 capitalize">{folder}</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={loadEmails}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                data-testid="refresh-emails"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowCompose(true)}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                data-testid="compose-button"
              >
                Compose
              </button>
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <div className="font-semibold text-gray-900">{stats.unread || 0}</div>
                <div className="text-gray-500">Unread</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <div className="font-semibold text-gray-900">{stats.starred || 0}</div>
                <div className="text-gray-500">Starred</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <div className="font-semibold text-gray-900">{stats.high_priority || 0}</div>
                <div className="text-gray-500">Priority</div>
              </div>
            </div>
          )}
        </div>

        {/* Email List */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : emails.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
              <Mail className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-center">No emails in {folder}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {emails.map((email: any) => (
                <div
                  key={email.id}
                  onClick={() => handleEmailClick(email)}
                  className={`email-list-item p-4 cursor-pointer ${
                    selectedEmail?.id === email.id ? 'bg-blue-50' : ''
                  } ${email.is_read === 0 ? 'bg-blue-50/30' : ''}`}
                  data-testid={`email-${email.id}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`text-sm truncate ${
                          email.is_read === 0 ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'
                        }`}>
                          {email.from_name || email.from_email}
                        </h3>
                        {email.is_starred === 1 && (
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className={`text-sm truncate ${
                        email.is_read === 0 ? 'font-medium text-gray-900' : 'text-gray-600'
                      }`}>
                        {email.subject || '(No subject)'}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                      {email.date && format(new Date(email.date), 'MMM d')}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 line-clamp-2">
                    {email.body_text?.substring(0, 100) || email.body_html?.substring(0, 100) || ''}
                  </p>

                  {email.ai_category && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                        {email.ai_category}
                      </span>
                      {email.ai_priority >= 8 && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                          High Priority
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Email Detail */}
      <div className="flex-1 bg-white overflow-auto">
        {selectedEmail ? (
          <div className="h-full flex flex-col">
            {/* Email Header */}
            <div className="border-b border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedEmail.subject || '(No subject)'}
                  </h2>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                      {(selectedEmail.from_name || selectedEmail.from_email).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {selectedEmail.from_name || selectedEmail.from_email}
                      </p>
                      <p className="text-xs text-gray-500">
                        To: {selectedEmail.to_email}
                      </p>
                    </div>
                  </div>
                </div>
                <span className="text-sm text-gray-500">
                  {selectedEmail.date && format(new Date(selectedEmail.date), 'MMM d, yyyy h:mm a')}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleReply}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                  data-testid="reply-button"
                >
                  <Reply className="w-4 h-4" />
                  Reply
                </button>
                <button
                  onClick={handleAIReply}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium"
                  data-testid="ai-reply-button"
                >
                  <Sparkles className="w-4 h-4" />
                  AI Reply
                </button>
                <button
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
                >
                  <Forward className="w-4 h-4" />
                  Forward
                </button>
                <div className="flex-1"></div>
                <button
                  onClick={handleArchive}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                  data-testid="archive-button"
                >
                  <Archive className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              {/* AI Summary */}
              {selectedEmail.ai_summary && (
                <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-purple-900 mb-1">AI Summary</p>
                      <p className="text-sm text-purple-700">{selectedEmail.ai_summary}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Email Body */}
            <div className="flex-1 p-6 overflow-auto">
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ 
                  __html: selectedEmail.body_html || selectedEmail.body_text?.replace(/\n/g, '<br />') || '' 
                }}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Mail className="w-24 h-24 mb-4 opacity-50" />
            <p className="text-lg">Select an email to read</p>
          </div>
        )}
      </div>

      {showCompose && (
        <ComposeEmail
          replyTo={selectedEmail}
          onClose={() => setShowCompose(false)}
          onSent={() => {
            setShowCompose(false);
            loadEmails();
          }}
        />
      )}
    </div>
  );
}
