import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<{error?: string}>;
  register: (email: string, password: string, displayName: string) => Promise<{error?: string}>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  login: async () => ({}),
  register: async () => ({}),
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user from localStorage on startup
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Failed to parse stored user data');
      }
    }
    setLoading(false);
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    // Get users from localStorage
    const usersStr = localStorage.getItem('users') || '[]';
    let users = [];
    
    try {
      users = JSON.parse(usersStr);
    } catch (err) {
      return { error: 'Failed to load users data' };
    }
    
    // Find user
    const foundUser = users.find((u: any) => u.email === email);
    
    if (!foundUser) {
      return { error: 'User not found' };
    }
    
    if (foundUser.password !== password) {
      return { error: 'Incorrect password' };
    }
    
    // Create user object without password
    const userObj: User = {
      uid: foundUser.uid,
      email: foundUser.email,
      displayName: foundUser.displayName,
      photoURL: foundUser.photoURL,
    };
    
    // Save user to state and localStorage
    setUser(userObj);
    localStorage.setItem('user', JSON.stringify(userObj));
    
    return {};
  };
  
  // Register function
  const register = async (email: string, password: string, displayName: string) => {
    // Get existing users
    const usersStr = localStorage.getItem('users') || '[]';
    let users = [];
    
    try {
      users = JSON.parse(usersStr);
    } catch (err) {
      return { error: 'Failed to load users data' };
    }
    
    // Check if user already exists
    if (users.some((u: any) => u.email === email)) {
      return { error: 'User already exists' };
    }
    
    // Create new user
    const uid = 'user_' + Date.now();
    const newUser = {
      uid,
      email,
      password, // In a real app, this would be hashed
      displayName,
      photoURL: null,
      createdAt: new Date().toISOString(),
    };
    
    // Add to users list
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    // Create user object without password
    const userObj: User = {
      uid,
      email,
      displayName,
      photoURL: null,
    };
    
    // Save user to state and localStorage
    setUser(userObj);
    localStorage.setItem('user', JSON.stringify(userObj));
    
    return {};
  };
  
  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}; 