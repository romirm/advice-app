import { useState } from 'react';
import { useAuth } from '../context/LocalAuthContext';

interface LoginProps {
  onLogin: () => void;
  onSwitchToRegister: () => void;
}

const Login = ({ onLogin, onSwitchToRegister }: LoginProps) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!email || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    const result = await login(email, password);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    onLogin();
  };

  const createAdminUser = () => {
    const usersStr = localStorage.getItem('users') || '[]';
    let users = [];

    try {
      users = JSON.parse(usersStr);
      if (users.length === 0) {
        const adminUser = {
          uid: 'admin_user',
          email: 'admin',
          password: '123',
          displayName: 'Administrator',
          photoURL: null,
          createdAt: new Date().toISOString(),
        };
        users.push(adminUser);
        localStorage.setItem('users', JSON.stringify(users));
        console.log('Admin user created');
      }
    } catch (err) {
      console.error('Failed to create admin user');
    }
  };

  useState(() => {
    createAdminUser();
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#202120] transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-[#202120] p-6 rounded border border-gray-300 dark:border-[#444654] text-black dark:text-white shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>

        {error && (
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="mb-4">
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 dark:text-gray-300 font-medium mb-1">
              Email/Username
            </label>
            <input
              type="text"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500 bg-white dark:bg-gray-800 text-black dark:text-white"
              disabled={loading}
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 dark:text-gray-300 font-medium mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500 bg-white dark:bg-gray-800 text-black dark:text-white"
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded font-medium transition"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <span className="text-gray-600 dark:text-gray-400">Don't have an account?</span>{' '}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="text-blue-500 dark:text-blue-400 underline"
            disabled={loading}
          >
            Register
          </button>
        </div>

        <div className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
          Default: admin / 123
        </div>
      </div>
    </div>
  );
};

export default Login;
