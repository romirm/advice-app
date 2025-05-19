import { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

interface LoginProps {
  onLogin: () => void;
}

const Login = ({ onLogin }: LoginProps) => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      // Optional: ensure full profile info is included
      provider.addScope('profile');
      provider.addScope('email');

      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      console.log("✅ Google login successful:", {
        uid: user.uid,
        name: user.displayName,
        email: user.email,
        photoURL: user.photoURL
      });

      // Store user profile in Firestore
      await setDoc(doc(db, "users", user.uid), {
        name: user.displayName || "Unnamed User",
        email: user.email || "No email",
        photoURL: user.photoURL || null,
        joinedAt: serverTimestamp()
      }, { merge: true });

      onLogin(); // let the app know user has signed in
    } catch (err: any) {
      console.error("❌ Google Sign-in Error:", err);
      setError('Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white relative overflow-hidden">
      <div className="bg-white/10 backdrop-blur-md border-black p-8 rounded-xl shadow-xl max-w-md w-full text-center text-black">
        <h2 className="text-3xl font-bold mb-6">Welcome to Aptly</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="flex items-center justify-center w-full gap-3 bg-white text-black font-semibold py-2 px-4 rounded-lg shadow hover:bg-gray-100 transition"
        >
          <svg
            className="w-5 h-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
          >
            <path
              fill="#fbc02d"
              d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.2 35 24 35c-6.1 0-11.3-4.9-11.3-11S17.9 13 24 13c2.6 0 5 .9 6.9 2.4l5.9-5.9C32.5 6.3 28.5 5 24 5 12.4 5 3.4 14.1 3.4 25.7S12.4 46 24 46c11.5 0 20.9-9.3 20.9-20.9 0-1.4-.1-2.8-.3-4.1z"
            />
            <path
              fill="#e53935"
              d="M6.3 14.5l6.6 4.8C14.8 15 19.1 13 24 13c2.6 0 5 .9 6.9 2.4l5.9-5.9C32.5 6.3 28.5 5 24 5c-6.9 0-13 3.1-17.1 8z"
            />
            <path
              fill="#4caf50"
              d="M24 46c4.5 0 8.5-1.5 11.7-4l-5.4-4.4c-2.1 1.4-4.7 2.2-7.4 2.2-5.2 0-9.6-3.5-11.2-8.2l-6.6 5.1C10.6 41.8 16.8 46 24 46z"
            />
            <path
              fill="#1565c0"
              d="M43.6 20.5H42V20H24v8h11.3C34.8 32.4 30.3 35 25.1 35c-6.1 0-11.3-4.9-11.3-11S19 13 25.1 13c2.6 0 5 .9 6.9 2.4l5.9-5.9C34.5 6.3 30.5 5 26 5c-11.6 0-20.6 9.1-20.6 20.6S14.4 46 26 46c11.5 0 20.9-9.3 20.9-20.9 0-1.4-.1-2.8-.3-4.1z"
            />
          </svg>
          {loading ? 'Signing in...' : 'Sign in with Google'}
        </button>
      </div>
    </div>
  );
};

export default Login;