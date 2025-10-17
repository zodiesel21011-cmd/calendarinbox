import { useState, useEffect } from 'react';
import { X, Send, Sparkles } from 'lucide-react';
import * as api from '../services/api';

interface ComposeEmailProps {
  replyTo?: any;
  onClose: () => void;
  onSent: () => void;
}

export default function ComposeEmail({ replyTo, onClose, onSent }: ComposeEmailProps) {
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<number | null>(null);

  useEffect(() => {
    loadAccounts();

    if (replyTo) {
      setTo(replyTo.from_email);
      setSubject(replyTo.subject?.startsWith('Re:') ? replyTo.subject : `Re: ${replyTo.subject}`);
    }
  }, [replyTo]);

  const loadAccounts = async () => {
    try {
      const response = await api.getEmailAccounts();
      setAccounts(response.accounts || []);
      if (response.accounts?.length > 0) {
        setSelectedAccount(response.accounts[0].id);
      }
    } catch (error) {
      console.error('Failed to load accounts:', error);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAccount) {
      alert('Please select an email account');
      return;
    }

    setSending(true);
    try {
      await api.sendEmail(selectedAccount, to, subject, body, cc);
      onSent();
    } catch (error: any) {
      alert(error.message || 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  const handleAICompose = async () => {
    // Placeholder for AI compose functionality
    alert('AI composition feature coming soon!');
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      data-testid="compose-modal"
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {replyTo ? 'Reply to Email' : 'Compose Email'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSend} className="flex-1 flex flex-col overflow-hidden">
          <div className="p-6 space-y-4 overflow-auto">
            {accounts.length > 1 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From
                </label>
                <select
                  value={selectedAccount || ''}
                  onChange={(e) => setSelectedAccount(parseInt(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  required
                >
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.email}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To *
              </label>
              <input
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="recipient@example.com"
                required
                data-testid="compose-to-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CC
              </label>
              <input
                type="email"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="cc@example.com"
                data-testid="compose-cc-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject *
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="Email subject"
                required
                data-testid="compose-subject-input"
              />
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message *
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none"
                placeholder="Type your message here..."
                rows={12}
                required
                data-testid="compose-body-input"
              />
            </div>

            {replyTo && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-xs text-gray-500 mb-2">Replying to:</p>
                <p className="text-sm font-medium text-gray-900">{replyTo.subject}</p>
                <p className="text-xs text-gray-600">From: {replyTo.from_email}</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              type="submit"
              disabled={sending}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="send-email-button"
            >
              <Send className="w-4 h-4" />
              {sending ? 'Sending...' : 'Send'}
            </button>

            <button
              type="button"
              onClick={handleAICompose}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
            >
              <Sparkles className="w-4 h-4" />
              AI Compose
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
