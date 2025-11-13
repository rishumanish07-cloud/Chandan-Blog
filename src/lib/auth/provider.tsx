"use client";

import { createContext, useEffect, useState, ReactNode, Suspense } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";
import type { UserProfile } from "@/lib/types";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./hooks";

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

const publicRoutes = ["/login", "/signup"];
const protectedRoutes = ["/home", "/posts/new", "/profile"];

function AuthRedirector({ children }: { children: ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
  
    useEffect(() => {
      if (loading) return;
  
      const pathIsProtected = protectedRoutes.some(p => pathname.startsWith(p));
      const pathIsPublic = publicRoutes.includes(pathname);
  
      if (!user && pathIsProtected) {
        router.push('/login');
      }
  
      if (user && pathIsPublic) {
        router.push('/home');
      }
    }, [loading, user, pathname, router]);

    return <>{children}</>;
  }
  
  export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser: User | null) => {
        if (firebaseUser) {
          const userRef = doc(db, 'users', firebaseUser.uid);
          const unsubscribeSnapshot = onSnapshot(userRef, (doc) => {
            if (doc.exists()) {
              setUser(doc.data() as UserProfile);
            } else {
              // Fallback to auth data if firestore doc doesn't exist yet
              const { uid, email, displayName, photoURL } = firebaseUser;
              setUser({ uid, email, displayName, photoURL });
            }
            setLoading(false);
          });
          return () => unsubscribeSnapshot();
        } else {
          setUser(null);
          setLoading(false);
        }
      });
  
      return () => unsubscribeAuth();
    }, []);
  
    return (
      <AuthContext.Provider value={{ user, loading }}>
        <Suspense>
            <AuthRedirector>{children}</AuthRedirector>
        </Suspense>
      </AuthContext.Provider>
    );
  }
