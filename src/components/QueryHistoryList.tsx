import { useState, useEffect } from 'react';
import { getUserQueryHistory } from '../utils/localQueryHistory';
import { useAuth } from '../context/LocalAuthContext';
import { QueryHistoryItem } from '../utils/localQueryHistory';

interface QueryHistoryListProps {
  onSelectQuery: (query: QueryHistoryItem) => void;
}

const QueryHistoryList = ({ onSelectQuery }: QueryHistoryListProps) => {
  const { user } = useAuth();
  const [queries, setQueries] = useState<QueryHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQueries = async () => {
      if (!user) return;

      setLoading(true);
      setError(null);

      try {
        const history = getUserQueryHistory(user.uid);
        setQueries(history);
      } catch (error) {
        console.error('Error fetching query history', error);
        setError('Failed to load your history');
      } finally {
        setLoading(false);
      }
    };

    fetchQueries();
  }, [user]);

  // Format date to readable format
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="py-4 text-center text-gray-500">
        Loading your history...
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-4 text-center text-red-500">
        {error}
      </div>
    );
  }

  if (queries.length === 0) {
    return (
      <div className="py-4 text-center text-gray-500">
        No previous queries found
      </div>
    );
  }

  return (
    <div className="border rounded overflow-hidden">
      <h3 className="font-medium p-3 bg-gray-50 border-b">Your History</h3>

      <div className="max-h-80 overflow-y-auto">
        {queries.map((query) => (
          <div
            key={query.id}
            className="p-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer"
            onClick={() => onSelectQuery(query)}
          >
            <div className="font-medium truncate">{query.question}</div>
            <div className="text-sm text-gray-500 flex justify-between mt-1">
              <span>
                {query.selectedPerspective ? (
                  <span className="text-blue-600">{query.selectedPerspective} perspective</span>
                ) : (
                  <span>Multiple perspectives</span>
                )}
              </span>
              <span>{formatDate(query.createdAt)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QueryHistoryList; 