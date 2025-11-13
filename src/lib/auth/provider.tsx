"use client";

import { createContext, useEffect, useState, ReactNode, Suspense } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import type { UserProfile } from "@/lib/types";
import { usePathname, useRouter } from "next/navigation";

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

function AuthRedirect({ children }: { children: ReactNode }) {
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
  
    if (loading) {
      const pathIsProtected = protectedRoutes.some(p => pathname.startsWith(p));
      const pathIsPublic = publicRoutes.includes(pathname);
      if (pathIsProtected || pathIsPublic) {
        return (
          <div className="flex items-center justify-center h-screen">
              <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-32 w-32 animate-spin"></div>
          </div>
        );
      }
    }
  
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
        <Suspense fallback={
            <div className="flex items-center justify-center h-screen">
                <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-32 w-32 animate-spin"></div>
            </div>
        }>
            <AuthRedirect>{children}</AuthRedirect>
        </Suspense>
      </AuthContext.Provider>
    );
  }

  // Hook to use auth context
import { useContext } from "react";

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};