"use client";

import React, { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: "standard" | "icon";
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              shape?: "rectangular" | "pill" | "circle" | "square";
              logo_alignment?: "left" | "center";
              width?: number | string;
            }
          ) => void;
          prompt?: () => void;
        };
      };
    };
  }
}

interface GoogleSignInButtonProps {
  onSuccess: (credential: string) => Promise<void> | void;
  onError?: (error: string) => void;
  text?: "signin_with" | "signup_with" | "continue_with";
  disabled?: boolean;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  onError,
  text = "continue_with",
  disabled = false,
}) => {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  useEffect(() => {
    if (!clientId) {
      return;
    }

    // Check if script is already present
    if (window.google?.accounts?.id) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setScriptLoaded(true);
    };
    script.onerror = () => {
      onError?.("Failed to load Google Identity Services SDK");
    };
    document.body.appendChild(script);

    return () => {
      // Keep script cached in DOM
    };
  }, [clientId, onError]);

  useEffect(() => {
    if (!scriptLoaded || !buttonRef.current || !clientId || disabled) {
      return;
    }

    try {
      window.google?.accounts.id.initialize({
        client_id: clientId,
        callback: (response: { credential: string }) => {
          if (response.credential) {
            onSuccess(response.credential);
          } else {
            onError?.("No credential returned by Google");
          }
        },
      });

      buttonRef.current.innerHTML = "";
      window.google?.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        text,
        shape: "rectangular",
        logo_alignment: "left",
        width: 320,
      });
    } catch (err: any) {
      onError?.(err?.message || "Google Sign-In initialization failed");
    }
  }, [scriptLoaded, clientId, disabled, text, onSuccess, onError]);

  if (!clientId) {
    return (
      <button
        type="button"
        disabled
        className="w-full flex items-center justify-center gap-2.5 rounded-lg border border-border bg-surface-muted/50 px-4 py-2.5 text-xs font-medium text-text-muted cursor-not-allowed transition-colors"
        title="Google OAuth Client ID is not configured (NEXT_PUBLIC_GOOGLE_CLIENT_ID)"
      >
        <svg className="h-4 w-4 opacity-50" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>Sign in with Google (Client ID unconfigured)</span>
      </button>
    );
  }

  return (
    <div className="flex justify-center w-full min-h-[40px] items-center">
      <div ref={buttonRef} className="w-full flex justify-center" />
    </div>
  );
};
