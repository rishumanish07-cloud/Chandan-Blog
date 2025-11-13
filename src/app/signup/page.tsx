"use client";

import { useAuth } from "@/lib/auth/hooks";
import { AuthForm } from "@/components/auth/AuthForm";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return null;
  }

  if (user) {
    router.push('/home');
    return null;
  }

  return <AuthForm type="signup" />;
}
