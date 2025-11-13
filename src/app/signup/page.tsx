"use client";

import { useAuth } from "@/lib/auth/hooks";
import { AuthForm } from "@/components/auth/AuthForm";

export default function SignUpPage() {
  const { user, loading } = useAuth();

  if (loading || user) {
    // AuthProvider will handle redirection, so we show nothing here to prevent flicker.
    return null;
  }

  return <AuthForm type="signup" />;
}
