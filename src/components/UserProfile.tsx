import { useState } from 'react';
import { useAuth } from '../context/LocalAuthContext';
import DefaultAvatar from '../assets/default-avatar.svg';

interface UserProfileProps {
  onLogout: () => void;
}

const UserProfile = ({ onLogout }: UserProfileProps) => {
  const { user, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      logout();
      onLogout();
    } catch (error) {
      setError('Failed to log out');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded bg-white">
      <div className="flex items-center">
        <div className="relative">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
            {user?.photoURL ? (
              <img 
                src={user.photoURL} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            ) : (
              <img 
                src={DefaultAvatar} 
                alt="Default Avatar" 
                className="w-8 h-8 opacity-50"
              />
            )}
            
            {isLoading && (
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            )}
          </div>
        </div>
        
        <div className="ml-4">
          <div className="font-bold text-lg">{user?.displayName || 'User'}</div>
          <div className="text-gray-600 text-sm">{user?.email}</div>
        </div>
        
        <button
          onClick={handleLogout}
          className="ml-auto bg-gray-200 text-gray-800 py-1 px-3 rounded text-sm"
          disabled={isLoading}
        >
          Logout
        </button>
      </div>
      
      {error && (
        <div className="mt-2 text-red-500 text-sm">
          {error}
        </div>
      )}
    </div>
  );
};

export default UserProfile; 