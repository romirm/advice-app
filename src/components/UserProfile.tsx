import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DefaultAvatar from '../assets/default-avatar.svg';

interface UserProfileProps {
  onLogout?: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ onLogout }) => {
  const { user, loading, error, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    onLogout?.();
    setIsLoggingOut(false);
  };

  if (loading) {
    return (
      <div className="p-6 border rounded-2xl shadow-md w-[360px] text-center">
        Loading profile…
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 border rounded-2xl shadow-md w-[360px] text-red-500">
        {error}
      </div>
    );
  }

  const displayName = user?.displayName || 'User';
  const email = user?.email || 'No email';
  const avatar = user?.photoURL || DefaultAvatar;

  return (
    <div className="p-6 border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-md w-auto inline-block">
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <img
              src={avatar}
              alt="Profile"
              className="w-full h-full object-cover"
            />
            {isLoggingOut && (
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                <svg
                  className="animate-spin h-8 w-8 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1">
          <div className="font-bold text-lg text-gray-800 dark:text-white">
            {displayName}
          </div>
          <div className="text-gray-600 dark:text-gray-400 text-sm">
            {email}
          </div>
        </div>

        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="ml-4 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white py-1.5 px-4 rounded text-sm border border-gray-300 dark:border-none hover:bg-gray-200 dark:hover:bg-gray-600 transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default UserProfile;
