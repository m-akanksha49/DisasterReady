// src/contexts/AuthContext.js
// ✅ FIXED: Properly fetches DB user (with numeric id + role) after Firebase auth
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
} from 'firebase/auth';

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [dbUser, setDbUser] = useState(null);         // { id, email, display_name, role, ... }
  const [loading, setLoading] = useState(true);

  // Fetch/register user in MySQL
  const syncUserToDb = async (fbUser) => {
    if (!fbUser) { setDbUser(null); return; }
    try {
      const token = await fbUser.getIdToken();
      // Try fetching first
      const res = await fetch(`${API}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDbUser(data);
      } else {
        // Register if not found
        const regRes = await fetch(`${API}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firebase_uid: fbUser.uid,
            email: fbUser.email,
            display_name: fbUser.displayName || fbUser.email.split("@")[0],
            role: "student",
          }),
        });
        if (regRes.ok) {
          const regData = await regRes.json();
          setDbUser(regData.user);
        }
      }
    } catch (err) {
      console.error("syncUserToDb error:", err.message);
      // Fallback: expose firebase user data so app doesn't break
      setDbUser({
        id: fbUser.uid,
        firebase_uid: fbUser.uid,
        email: fbUser.email,
        display_name: fbUser.displayName || fbUser.email,
        role: "student",
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      await syncUserToDb(fbUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      return { user: cred.user, error: null };
    } catch (error) {
      return { user: null, error };
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
      setDbUser(null);
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signUp = async (email, password, displayName = '') => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      return { user: cred.user, error: null };
    } catch (error) {
      return { user: null, error };
    }
  };

  // `user` is the merged object used by all components
  const user = dbUser
    ? {
        ...dbUser,
        uid: firebaseUser?.uid,          // Firebase UID
        id: dbUser.id || firebaseUser?.uid,
        email: dbUser.email || firebaseUser?.email,
        name: dbUser.display_name || firebaseUser?.displayName,
      }
    : firebaseUser
    ? {
        id: firebaseUser.uid,
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName || firebaseUser.email,
        role: "student",
      }
    : null;

  const value = {
    user,
    dbUser,
    firebaseUser,
    loading,
    signIn,
    signOut: signOutUser,
    signUp,
    refreshUser: () => firebaseUser && syncUserToDb(firebaseUser),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}