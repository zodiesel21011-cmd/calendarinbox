import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import CalendarView from '../components/CalendarView';
import EmailView from '../components/EmailView';
import AIAssistant from '../components/AIAssistant';
import Header from '../components/Header';

type View = 'calendar' | 'inbox' | 'sent' | 'drafts' | 'settings';

export default function Dashboard() {
  const [currentView, setCurrentView] = useState<View>('calendar');
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden" data-testid="dashboard">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onToggleAI={() => setShowAIAssistant(!showAIAssistant)} />

        <main className="flex-1 overflow-auto">
          {currentView === 'calendar' && <CalendarView />}
          {(currentView === 'inbox' || currentView === 'sent' || currentView === 'drafts') && (
            <EmailView folder={currentView} />
          )}
          {currentView === 'settings' && (
            <div className="p-8">
              <h2 className="text-2xl font-bold mb-6">Settings</h2>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Account Information</h3>
                    <p className="text-gray-600">Email: {user?.email}</p>
                    <p className="text-gray-600">Name: {user?.name}</p>
                  </div>

                  <div className="pt-4 border-t">
                    <h3 className="font-semibold mb-3">Connected Email Accounts</h3>
                    <p className="text-gray-500 text-sm">Manage your connected email accounts and integrations</p>
                    <button className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                      Add Email Account
                    </button>
                  </div>

                  <div className="pt-4 border-t">
                    <h3 className="font-semibold mb-3">AI Features</h3>
                    <label className="flex items-center gap-3">
                      <input type="checkbox" className="w-4 h-4" defaultChecked />
                      <span className="text-gray-700">Enable AI email categorization</span>
                    </label>
                    <label className="flex items-center gap-3 mt-2">
                      <input type="checkbox" className="w-4 h-4" defaultChecked />
                      <span className="text-gray-700">Enable AI calendar suggestions</span>
                    </label>
                    <label className="flex items-center gap-3 mt-2">
                      <input type="checkbox" className="w-4 h-4" defaultChecked />
                      <span className="text-gray-700">Enable AI email replies</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {showAIAssistant && <AIAssistant onClose={() => setShowAIAssistant(false)} />}
    </div>
  );
}
