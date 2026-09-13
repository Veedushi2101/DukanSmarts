import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Store, Mail, Lock, User, ArrowRight, KeyRound } from "lucide-react";

export const LoginPage: React.FC = () => {
  const { login, loginWithGoogle, registerStoreOwner } = useAuth();
  const [mode, setMode] = useState<"LOGIN" | "REGISTER">("LOGIN");

  const [name, setName] = useState("");
  const [storeName, setStoreName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // OTP Verification Stage
  const [awaitingOtp, setAwaitingOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "LOGIN") {
        await login(email, password);
        // Stage OTP check
        setAwaitingOtp(true);
      } else {
        if (!name.trim() || !storeName.trim()) {
          throw new Error("Please enter your name and store name.");
        }
        await registerStoreOwner(name, email, password, storeName);
        setAwaitingOtp(true);
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      const message =
        err?.code === "auth/user-not-found" ||
        err?.code === "auth/wrong-password" ||
        err?.code === "auth/invalid-credential"
          ? "Invalid email or password."
          : err?.code === "auth/email-already-in-use"
          ? "This email is already registered. Please sign in."
          : err?.code === "auth/weak-password"
          ? "Password should be at least 6 characters."
          : err?.message || "Authentication failed.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyLoginOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.trim() !== "123456") {
      setError("Invalid code. Please enter 123456 for demo.");
      return;
    }
    // Proceed to app (AuthContext already holds the authenticated user session)
    window.location.reload();
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
      // Onboarding modal will open if first time; otherwise enters dashboard
    } catch (err: any) {
      if (err?.code !== "auth/popup-closed-by-user") {
        setError(err?.message || "Google sign-in failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-100 font-sans text-xs">
      <div className="flex w-full max-w-4xl min-h-[640px] rounded-3xl overflow-hidden bg-white shadow-2xl border border-slate-200">
        {/* Left Side Banner */}
        <div className="w-1/2 hidden md:block relative">
          <img
            className="h-full w-full object-cover"
            src="https://images.unsplash.com/photo-1604719312566-8912e9227c6a?q=80&w=1200&auto=format&fit=crop"
            alt="Kirana Store"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent flex flex-col justify-end p-8 text-white space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Store className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold">DukanSmarts Multi-Store</h3>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">
              Simplified Kirana billing, verified owner credentials, exact rupee calculations, and intelligent inventory tracking.
            </p>
          </div>
        </div>

        {/* Right Side Form Container */}
        <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-8 sm:p-12">
          <div className="w-full max-w-sm space-y-5">
            {/* If waiting for 2FA OTP */}
            {awaitingOtp ? (
              <form onSubmit={handleVerifyLoginOtp} className="space-y-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <KeyRound className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Security Check</h2>
                  <p className="text-slate-500 mt-1">
                    Enter the 6-digit verification code sent to your account.
                  </p>
                </div>

                <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-center">
                  <span className="text-[11px] text-slate-500">Demo Code: </span>
                  <span className="font-bold text-slate-900">123456</span>
                </div>

                {error && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-medium text-left">
                    {error}
                  </div>
                )}

                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="123456"
                  className="w-full text-center text-xl font-bold tracking-widest py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 font-mono"
                />

                <button
                  type="submit"
                  className="w-full h-11 rounded-full text-white bg-slate-900 hover:bg-slate-800 font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Verify & Open Dukaan</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <>
                <div className="text-center space-y-1">
                  <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    {mode === "LOGIN" ? "Owner Sign In" : "Register Store"}
                  </h2>
                  <p className="text-slate-500">
                    {mode === "LOGIN"
                      ? "Access your digital dukaan billing counter"
                      : "Create your owner profile and shop inventory"}
                  </p>
                </div>

                {/* Tab Switcher */}
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("LOGIN");
                      setError(null);
                    }}
                    className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                      mode === "LOGIN" ? "bg-slate-900 text-white shadow-xs" : "text-slate-500"
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("REGISTER");
                      setError(null);
                    }}
                    className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                      mode === "REGISTER" ? "bg-slate-900 text-white shadow-xs" : "text-slate-500"
                    }`}
                  >
                    New Shop
                  </button>
                </div>

                {error && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-medium">
                    {error}
                  </div>
                )}

                {/* Google Sign-in */}
                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={loading}
                  className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center h-11 rounded-full transition-all gap-2.5 font-bold text-slate-700 cursor-pointer shadow-2xs"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                  <span>Continue with Google</span>
                </button>

                <div className="flex items-center gap-3 w-full my-3">
                  <div className="w-full h-px bg-slate-200" />
                  <span className="text-slate-400 text-[11px] whitespace-nowrap">or with email</span>
                  <div className="w-full h-px bg-slate-200" />
                </div>

                {/* Email/Password Form */}
                <form onSubmit={handleSubmit} className="space-y-3">
                  {mode === "REGISTER" && (
                    <>
                      <div className="flex items-center w-full bg-slate-50 border border-slate-200 focus-within:border-emerald-600 h-11 rounded-full overflow-hidden px-4 gap-2.5 transition-colors">
                        <User className="w-4 h-4 text-slate-400 shrink-0" />
                        <input
                          type="text"
                          required
                          placeholder="Your Full Name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="bg-transparent text-slate-800 placeholder-slate-400 outline-none text-xs w-full font-medium"
                        />
                      </div>

                      <div className="flex items-center w-full bg-slate-50 border border-slate-200 focus-within:border-emerald-600 h-11 rounded-full overflow-hidden px-4 gap-2.5 transition-colors">
                        <Store className="w-4 h-4 text-slate-400 shrink-0" />
                        <input
                          type="text"
                          required
                          placeholder="Dukaan / Store Name"
                          value={storeName}
                          onChange={(e) => setStoreName(e.target.value)}
                          className="bg-transparent text-slate-800 placeholder-slate-400 outline-none text-xs w-full font-medium"
                        />
                      </div>
                    </>
                  )}

                  <div className="flex items-center w-full bg-slate-50 border border-slate-200 focus-within:border-emerald-600 h-11 rounded-full overflow-hidden px-4 gap-2.5 transition-colors">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type="email"
                      required
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-transparent text-slate-800 placeholder-slate-400 outline-none text-xs w-full font-medium"
                    />
                  </div>

                  <div className="flex items-center w-full bg-slate-50 border border-slate-200 focus-within:border-emerald-600 h-11 rounded-full overflow-hidden px-4 gap-2.5 transition-colors">
                    <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-transparent text-slate-800 placeholder-slate-400 outline-none text-xs w-full font-medium"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 rounded-full text-white bg-slate-900 hover:bg-slate-800 font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 mt-2"
                  >
                    <span>{loading ? "Verifying..." : mode === "LOGIN" ? "Sign In" : "Register Store"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};