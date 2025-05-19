import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, db, storage } from '../firebase/config';
import {
  doc,
  setDoc,
  serverTimestamp,
  onSnapshot,
  getDoc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<{ error?: string }>;
  loginWithGoogle: () => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  uploadProfilePicture: (file: File) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  login: async () => ({}),
  register: async () => ({}),
  loginWithGoogle: async () => ({}),
  logout: async () => { },
  uploadProfilePicture: async () => ({}),
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1) Auth state listener
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (fbUser) => {
      setAuthUser(fbUser);
      setLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  // 2) Firestore profile listener with name fallback
  useEffect(() => {
    if (!authUser) {
      setUser(null);
      return;
    }
    setLoading(true);
    const userDocRef = doc(db, 'users', authUser.uid);
    const unsubscribeProfile = onSnapshot(
      userDocRef,
      (snap) => {
        if (snap.exists()) {
          const d = snap.data() as any;
          const name = d.displayName || d.name || authUser.displayName || 'User';
          setUser({
            uid: authUser.uid,
            email: d.email,
            displayName: name,
            photoURL: d.photoURL,
          });
        } else {
          const name = authUser.displayName || 'User';
          setUser({
            uid: authUser.uid,
            email: authUser.email!,
            displayName: name,
            photoURL: authUser.photoURL,
          });
        }
        setLoading(false);
      },
      (err) => {
        console.error('Profile listener error:', err);
        setError('Failed to load profile');
        setLoading(false);
      }
    );
    return () => unsubscribeProfile();
  }, [authUser]);

  // Register
  const register = async (
    email: string,
    password: string,
    displayName: string
  ) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName });
      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid,
        email,
        displayName,
        photoURL: cred.user.photoURL || null,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      });
      return {};
    } catch (e: any) {
      console.error('register error', e);
      return { error: e.message };
    }
  };

  // Login
  const login = async (email: string, password: string) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await setDoc(
        doc(db, 'users', cred.user.uid),
        { lastLogin: serverTimestamp() },
        { merge: true }
      );
      return {};
    } catch (e: any) {
      console.error('login error', e);
      return { error: e.message };
    }
  };

  // Google login
  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      const userRef = doc(db, 'users', cred.user.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, {
          uid: cred.user.uid,
          email: cred.user.email,
          displayName: cred.user.displayName,
          photoURL: cred.user.photoURL,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
        });
      } else {
        await setDoc(
          userRef,
          { lastLogin: serverTimestamp() },
          { merge: true }
        );
      }
      return {};
    } catch (e: any) {
      console.error('google login error', e);
      return { error: e.message };
    }
  };

  // Logout
  const logout = async () => {
    await signOut(auth);
  };

  // Upload profile pic
  const uploadProfilePicture = async (file: File) => {
    if (!user) return { error: 'Not logged in' };
    try {
      const path = `profilePictures/${user.uid}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);
      await updateProfile(auth.currentUser!, { photoURL });
      await setDoc(
        doc(db, 'users', user.uid),
        { photoURL },
        { merge: true }
      );
      return {};
    } catch (e: any) {
      console.error('upload error', e);
      return { error: e.message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        loginWithGoogle,
        logout,
        uploadProfilePicture,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
