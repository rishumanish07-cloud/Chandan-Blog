"use client";

import { createContext, useEffect, useState, ReactNode, Suspense } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
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
const protectedRoutes = ["/home", "/posts/new"];

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
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser: User | null) => {
        if (firebaseUser) {
          const { uid, email, displayName, photoURL } = firebaseUser;
          const userProfile = { uid, email, displayName, photoURL };
          setUser(userProfile);
        } else {
          setUser(null);
        }
        setLoading(false);
      });
  
      return () => unsubscribe();
    }, []);
  
    return (
      <AuthContext.Provider value={{ user, loading }}>
        <Suspense>
            <AuthRedirector>{children}</AuthRedirector>
        </Suspense>
      </AuthContext.Provider>
    );
  }
