import { useState, useEffect } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from 'firebase/auth';
import { auth } from '../config/firebase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const translateAuthError = (code: string): string => {
    switch (code) {
      case 'auth/invalid-email':
        return 'รูปแบบอีเมลไม่ถูกต้อง';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
      case 'auth/email-already-in-use':
        return 'อีเมลนี้ถูกใช้งานแล้วในระบบ';
      case 'auth/weak-password':
        return 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร';
      case 'auth/network-request-failed':
        return 'การเชื่อมต่ออินเทอร์เน็ตล้มเหลว';
      default:
        return 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง';
    }
  };

  const login = async (email: string, pass: string) => {
    setAuthError(null);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      return cred.user;
    } catch (err: any) {
      const msg = translateAuthError(err.code);
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const register = async (email: string, pass: string, name: string) => {
    setAuthError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      if (name.trim()) {
        await updateProfile(cred.user, { displayName: name.trim() });
      }
      return cred.user;
    } catch (err: any) {
      const msg = translateAuthError(err.code);
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const logout = async () => {
    setAuthError(null);
    await signOut(auth);
  };

  return {
    user,
    isLoading,
    authError,
    setAuthError,
    login,
    register,
    logout,
  };
}
