import { useState } from 'react';
import './App.css';
import Home from './pages/Home';
import Login from './components/Login';
import UserProfile from './components/UserProfile';
import QueryHistoryList from './components/QueryHistoryList';
import { QueryHistoryItem, saveQueryHistory, updateQueryConversation } from './utils/localQueryHistory';
import { useAuth, AuthProvider } from './context/AuthContext';

function AppContent() {
  const { user, loading, logout } = useAuth();
  const [selectedQuery, setSelectedQuery] = useState<QueryHistoryItem | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const handleLoginSuccess = () => {
    setSelectedQuery(null);
    setShowHistory(false);
  };

  const handleLogout = async () => {
    await logout();
    handleLoginSuccess();
  };

  const handleSelectQuery = (query: QueryHistoryItem) => {
    setSelectedQuery(query);
    setShowHistory(false);
  };

  const handleToggleHistory = () => {
    setShowHistory(prev => !prev);
  };

  const handleQuerySave = async (
    question: string,
    perspectives: any[],
    selectedPerspective: string | null = null,
    conversation: any[] = []
  ) => {
    if (!user) return null;
    try {
      const id = saveQueryHistory(
        user.uid,
        question,
        perspectives,
        selectedPerspective,
        conversation
      );
      return id;
    } catch (error) {
      console.error('Error saving query:', error);
      return null;
    }
  };

  const handleUpdateConversation = async (
    queryId: string,
    selectedPerspective: string,
    conversation: any[]
  ) => {
    if (!user || !queryId) return;
    try {
      updateQueryConversation(
        queryId,
        selectedPerspective,
        conversation
      );
    } catch (error) {
      console.error('Error updating conversation:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Login onLogin={handleLoginSuccess} />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="flex items-start mb-8 gap-4">
        <UserProfile onLogout={handleLogout} />
        <div className="flex-1 flex justify-end">
          <button
            onClick={handleToggleHistory}
            className="bg-[#3b82f6] hover:bg-[#2563eb] text-white py-2 px-4 rounded shadow transition-colors"
          >
            {showHistory ? 'Hide History' : 'View History'}
          </button>
        </div>
      </div>

      {showHistory ? (
        <div className="mb-8">
          <QueryHistoryList onSelectQuery={handleSelectQuery} />
        </div>
      ) : selectedQuery ? (
        <div className="mb-4">
          <div className="bg-blue-50 p-3 border border-blue-200 rounded flex justify-between items-center">
            <div>
              <div className="font-medium">Loading previous query</div>
              <div className="text-sm text-gray-600">{selectedQuery.question}</div>
            </div>
            <button
              onClick={() => setSelectedQuery(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              × Close
            </button>
          </div>
        </div>
      ) : null}

      <Home
        initialQuery={selectedQuery}
        onSaveQuery={handleQuerySave}
        onUpdateConversation={handleUpdateConversation}
      />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
