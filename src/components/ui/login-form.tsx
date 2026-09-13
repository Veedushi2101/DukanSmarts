"use client";

import { cn } from "../../lib/utils";
import React, { useState } from "react";
import { Mail, Lock } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";

interface LoginFormProps {
  className?: string;
  onSuccess?: (data: { email?: string; token?: string }) => void;
}

export default function LoginForm({ className, onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Standard Email/Password Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Add your authentication API logic here
      console.log("Submitting login:", { email, password, rememberMe });
      if (onSuccess) {
        onSuccess({ email });
      }
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Google OAuth Handler
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      console.log("Google login success:", tokenResponse);
      // Pass tokenResponse.access_token to your backend to verify and fetch user profile
      if (onSuccess) {
        onSuccess({ token: tokenResponse.access_token });
      }
    },
    onError: (error) => console.error("Google Login Failed:", error),
  });

  return (
    <div className={cn("flex min-h-[700px] w-full rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-100", className)}>
      {/* Left side visual banner with reliable Unsplash image */}
      <div className="w-full hidden md:inline-block relative">
        <img
          className="h-full w-full object-cover"
          src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop"
          alt="Abstract geometric background"
        />
        <div className="absolute inset-0 bg-indigo-950/20 backdrop-brightness-95" />
      </div>

      {/* Right side form */}
      <div className="w-full flex flex-col items-center justify-center p-6 md:p-12">
        <form onSubmit={handleSubmit} className="md:w-96 w-full max-w-sm flex flex-col items-center justify-center">
          <h2 className="text-4xl text-gray-900 font-medium">Sign in</h2>
          <p className="text-sm text-gray-500/90 mt-3">Welcome back! Please sign in to continue</p>

          {/* Google Sign-in Button */}
          <button
            type="button"
            onClick={() => handleGoogleLogin()}
            className="w-full mt-8 bg-gray-500/10 hover:bg-gray-500/15 flex items-center justify-center h-12 rounded-full transition-colors gap-3"
            aria-label="Sign in with Google"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
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
            <span className="text-sm font-medium text-gray-700">Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 w-full my-5">
            <div className="w-full h-px bg-gray-300/90" />
            <p className="w-full text-nowrap text-sm text-gray-500/90 text-center">or sign in with email</p>
            <div className="w-full h-px bg-gray-300/90" />
          </div>

          {/* Email Input */}
          <div className="flex items-center w-full bg-transparent border border-gray-300/60 focus-within:border-indigo-500 h-12 rounded-full overflow-hidden px-5 gap-3 transition-colors">
            <Mail className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-transparent text-gray-700 placeholder-gray-400 outline-none text-sm w-full h-full"
              required
            />
          </div>

          {/* Password Input */}
          <div className="flex items-center mt-4 w-full bg-transparent border border-gray-300/60 focus-within:border-indigo-500 h-12 rounded-full overflow-hidden px-5 gap-3 transition-colors">
            <Lock className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-transparent text-gray-700 placeholder-gray-400 outline-none text-sm w-full h-full"
              required
            />
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="w-full flex items-center justify-between mt-6 text-gray-500/80">
            <div className="flex items-center gap-2">
              <input
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label className="text-sm cursor-pointer select-none" htmlFor="rememberMe">
                Remember me
              </label>
            </div>
            <a className="text-sm underline hover:text-indigo-600 transition-colors" href="#forgot-password">
              Forgot password?
            </a>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="mt-8 w-full h-11 rounded-full text-white bg-indigo-600 hover:bg-indigo-700 transition-colors font-medium text-sm shadow-sm disabled:opacity-50"
          >
            {isLoading ? "Signing in..." : "Login"}
          </button>

          <p className="text-gray-500/90 text-sm mt-4">
            Don’t have an account?{" "}
            <a className="text-indigo-600 font-medium hover:underline" href="#signup">
              Sign up
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}