"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Video, ArrowRight, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { useAuth } from "@/context/AuthContext";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/";

  const { login, loginWithGoogle } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      router.push(redirectTarget);
    } catch (err: any) {
      setErrorMessage(err?.message || "Invalid email or password.");
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credential: string) => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await loginWithGoogle(credential);
      router.push(redirectTarget);
    } catch (err: any) {
      if (err?.message === "ACCOUNT_EXISTS_WITH_DIFFERENT_METHOD") {
        setErrorMessage(
          "An account already exists with this email address using email/password. Please sign in with your password below."
        );
      } else {
        setErrorMessage(err?.message || "Google sign-in failed. Please try again.");
      }
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-xl border border-border bg-surface p-7 sm:p-9 shadow-sm space-y-6">
      {/* Brand Header */}
      <div className="flex flex-col items-center text-center space-y-2">
        <Link href="/" className="flex items-center gap-2 group mb-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0e72ed] text-white shadow-sm transition-transform group-hover:scale-105">
            <Video className="h-5 w-5" />
          </div>
        </Link>
        <h1 className="text-xl font-bold tracking-tight text-text-primary">
          Sign in to OrbitMeet
        </h1>
        <p className="text-xs text-text-secondary">
          Manage your schedule, meetings, and conferences
        </p>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="flex items-start gap-2.5 rounded-lg border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{errorMessage}</span>
        </div>
      )}

      {/* Google Sign-in */}
      <div className="space-y-4">
        <GoogleSignInButton
          text="signin_with"
          onSuccess={handleGoogleSuccess}
          onError={(err) => setErrorMessage(err)}
          disabled={isSubmitting}
        />

        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-border-subtle" />
          <span className="bg-surface px-2.5 text-[11px] font-medium text-text-muted uppercase tracking-wider">
            or continue with email
          </span>
        </div>
      </div>

      {/* Email / Password Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            label="Email address"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
            required
            autoFocus
          />
        </div>

        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[34px] text-text-muted hover:text-text-primary transition-colors"
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        <Button
          type="submit"
          className="w-full gap-2 mt-2"
          isLoading={isSubmitting}
          disabled={isSubmitting}
        >
          <span>Sign In</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>

      {/* Footer Links */}
      <div className="pt-2 border-t border-border-subtle flex flex-col items-center gap-3 text-xs text-text-secondary">
        <div>
          Don&apos;t have an account?{" "}
          <Link
            href={`/signup${redirectTarget !== "/" ? `?redirect=${encodeURIComponent(redirectTarget)}` : ""}`}
            className="font-semibold text-[#0e72ed] hover:underline"
          >
            Create an account
          </Link>
        </div>

        <div className="text-[11px] text-text-muted">
          Joining a meeting as a guest?{" "}
          <Link href="/join" className="text-text-secondary underline hover:text-text-primary">
            Join with meeting code
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-app flex flex-col justify-center items-center p-4">
      <Suspense
        fallback={
          <div className="text-xs text-text-muted">Loading authentication...</div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
