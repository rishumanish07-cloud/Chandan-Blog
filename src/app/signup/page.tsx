"use client";

import { useAuth } from "@/lib/auth/hooks";
import { AuthForm } from "@/components/auth/AuthForm";

export default function SignUpPage() {
  const { user, loading } = useAuth();

  if (loading || user) {
    return null;
  }

  return <AuthForm type="signup" />;
}
