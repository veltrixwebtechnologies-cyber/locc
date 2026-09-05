import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  ShieldCheck,
  Truck,
  Store,
  Mail,
  Phone,
  Loader2,
  ArrowRight,
  Lock,
  Zap,
  Heart,
  ChevronDown,
  UserCheck,
  User,
  MapPin,
  Sparkles,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { OtpInput, OTP_LENGTH } from "@/components/auth/otp-input";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
});

type Mode = "phone" | "email" | "password";
type AuthIntent = "login" | "signup";

function authErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "string" && error.trim()) return error;
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === "object") {
    const value = error as {
      message?: unknown;
      msg?: unknown;
      error_code?: unknown;
      code?: unknown;
    };
    const detail =
      typeof value.message === "string" && value.message.trim()
        ? value.message
        : typeof value.msg === "string" && value.msg.trim()
          ? value.msg
          : "";
    if (detail) {
      const code =
        typeof value.error_code === "string"
          ? value.error_code
          : typeof value.code === "string"
            ? value.code
            : "";
      return code ? `${code}: ${detail}` : detail;
    }
  }
  return fallback;
}

function authFriendlyError(error: unknown, fallback: string) {
  const message = authErrorMessage(error, fallback).toLowerCase();
  if (message.includes("expired") || message.includes("otp_expired"))
    return "This code has expired. Request a new code.";
  if (message.includes("invalid") || message.includes("token"))
    return "Invalid verification code. Check the code and try again.";
  if (message.includes("rate") || message.includes("too many") || message.includes("limit"))
    return "Too many attempts. Wait a moment and try again.";
  if (message.includes("network") || message.includes("fetch"))
    return "Network error. Check your connection and try again.";
  return fallback;
}

function AuthPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const [mode, setMode] = useState<Mode>("phone");
  const [intent, setIntent] = useState<AuthIntent>("login");

  // Phone flow states
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [cooldown, setCooldown] = useState(0);

  // Email flow states
  const [emailStep, setEmailStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [emailOtp, setEmailOtp] = useState("");

  // Password flow states
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);

  const PENDING_OTP_KEY = "localshore.pending-otp.v1";

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const done = useCallback(() => {
    if (redirect === "/checkout") {
      navigate({ to: "/checkout" });
      return;
    }
    navigate({ to: "/", search: { category: undefined, q: undefined } });
  }, [navigate, redirect]);

  useEffect(() => {
    try {
      const pending = JSON.parse(localStorage.getItem(PENDING_OTP_KEY) ?? "null") as {
        mode?: Mode;
        intent?: AuthIntent;
        phone?: string;
        countryCode?: string;
        email?: string;
        name?: string;
        step?: "phone" | "otp";
        emailStep?: "email" | "otp";
      } | null;
      if (
        pending?.mode === "phone" &&
        pending.step === "otp" &&
        pending.phone &&
        pending.countryCode
      ) {
        setMode("phone");
        setIntent(pending.intent === "signup" ? "signup" : "login");
        setPhone(pending.phone);
        setCountryCode(pending.countryCode);
        setName(pending.name ?? "");
        setStep("otp");
      } else if (pending?.mode === "email" && pending.emailStep === "otp" && pending.email) {
        setMode("email");
        setIntent(pending.intent === "signup" ? "signup" : "login");
        setEmail(pending.email);
        setName(pending.name ?? "");
        setEmailStep("otp");
      }
    } catch {
      localStorage.removeItem(PENDING_OTP_KEY);
    }
  }, []);

  useEffect(() => {
    let active = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) done();
    });

    return () => {
      active = false;
    };
  }, [done]);

  const saveProfile = async (
    userId: string,
    profile: { email?: string; phone?: string; display_name: string },
  ) => {
    const { error: profileError } = await (supabase as any)
      .from("profiles")
      .upsert({ id: userId, ...profile }, { onConflict: "id" });
    if (profileError)
      throw new Error(
        "Verification succeeded, but your profile could not be saved. Please try again.",
      );
  };

  // 30s resend cooldown ticker
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown > 0) {
      setError(`Please wait ${cooldown}s before requesting another code.`);
      return;
    }
    if (intent === "signup" && name.trim().length < 2) {
      setError("Enter your full name to create an account.");
      return;
    }
    if (!/^\d{6,14}$/.test(phone)) {
      setError("Enter a valid mobile phone number.");
      return;
    }
    if (!/^\+\d{1,3}$/.test(countryCode)) {
      setError("Enter a valid country code, e.g. +91.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const normalizedPhone = `${countryCode}${phone}`;
      const { error: authError } = await supabase.auth.signInWithOtp({
        phone: normalizedPhone,
        options: { shouldCreateUser: intent === "signup" },
      });
      if (authError) throw authError;
      setStep("otp");
      setCooldown(30);
      localStorage.setItem(
        PENDING_OTP_KEY,
        JSON.stringify({ mode: "phone", intent, phone, countryCode, name, step: "otp" }),
      );
    } catch (err) {
      console.error("Supabase phone OTP error", err);
      setError(
        authFriendlyError(
          err,
          "Could not send the verification code. Check Supabase Auth SMS settings.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (cooldown > 0 || loading) return;
    setError(null);
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithOtp({
        phone: `${countryCode}${phone}`,
        options: { shouldCreateUser: intent === "signup" },
      });
      if (authError) throw authError;
      setCooldown(30);
      setOtp("");
    } catch (err) {
      console.error("Supabase phone OTP resend error", err);
      setError(
        authFriendlyError(
          err,
          "Could not resend the verification code. Check Supabase Auth SMS settings.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== OTP_LENGTH) {
      setError(`Enter the complete ${OTP_LENGTH}-digit code.`);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.verifyOtp({
        phone: `${countryCode}${phone}`,
        token: otp,
        type: "sms",
      });
      if (authError) throw authError;
      if (intent === "signup") {
        const { data } = await supabase.auth.getUser();
        if (!data.user) throw new Error("Could not finish creating your account.");
        await saveProfile(data.user.id, {
          phone: `${countryCode}${phone}`,
          display_name: name.trim() || "Customer",
        });
        toast.success("Account created successfully!");
      } else {
        toast.success("Welcome back!");
      }
      localStorage.removeItem(PENDING_OTP_KEY);
      done();
    } catch (err) {
      console.error("Supabase phone OTP verification error", err);
      setError(authFriendlyError(err, "That code could not be verified."));
    } finally {
      setLoading(false);
    }
  };

  const sendEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown > 0) {
      setError(`Please wait ${cooldown}s before requesting another code.`);
      return;
    }
    if (intent === "signup" && name.trim().length < 2) {
      setError("Enter your full name to create an account.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: intent === "signup",
          ...(intent === "signup"
            ? { data: { display_name: name.trim() || email.split("@")[0] } }
            : {}),
          emailRedirectTo: `${window.location.origin}/auth`,
        },
      });
      if (authError) throw authError;
      setEmailStep("otp");
      setCooldown(30);
      localStorage.setItem(
        PENDING_OTP_KEY,
        JSON.stringify({ mode: "email", intent, email: email.trim(), name, emailStep: "otp" }),
      );
    } catch (err) {
      console.error("Supabase email OTP error", err);
      setError(
        authFriendlyError(
          err,
          "Could not send the verification code. Check Supabase SMTP settings.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const verifyEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (emailOtp.length !== OTP_LENGTH) {
      setError(`Enter the complete ${OTP_LENGTH}-digit code.`);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: emailOtp,
        type: "email",
      });
      if (authError) throw authError;
      const { data } = await supabase.auth.getUser();
      if (!data.user) throw new Error("Could not finish creating your account.");
      if (intent === "signup") {
        await saveProfile(data.user.id, {
          email: email.trim(),
          display_name: name.trim() || email.split("@")[0],
        });
        toast.success("Account created successfully!");
      } else {
        toast.success("Welcome back!");
      }
      localStorage.removeItem(PENDING_OTP_KEY);
      done();
    } catch (err) {
      console.error("Supabase email OTP verification error", err);
      setError(authFriendlyError(err, "That code could not be verified."));
    } finally {
      setLoading(false);
    }
  };

  const resendEmailOtp = async () => {
    if (cooldown > 0 || loading) return;
    setError(null);
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: intent === "signup",
          ...(intent === "signup"
            ? { data: { display_name: name.trim() || email.split("@")[0] } }
            : {}),
          emailRedirectTo: `${window.location.origin}/auth`,
        },
      });
      if (authError) throw authError;
      setCooldown(30);
      setEmailOtp("");
    } catch (err) {
      console.error("Supabase email OTP resend error", err);
      setError(authFriendlyError(err, "Could not resend the verification code."));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Please fill in all required fields.");
      return;
    }
    if (intent === "signup" && name.trim().length < 2) {
      setError("Enter your full name to create an account.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      if (intent === "signup") {
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { display_name: name.trim() || email.split("@")[0] },
          },
        });
        if (authError) throw authError;
        if (data.user) {
          await saveProfile(data.user.id, {
            email: email.trim(),
            display_name: name.trim() || email.split("@")[0],
          });
        }
        toast.success("Account created successfully!");
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (authError) throw authError;
        toast.success("Welcome back!");
      }
      done();
    } catch (err) {
      console.error("Password auth error", err);
      setError(
        authFriendlyError(
          err,
          intent === "signup" ? "Could not create account." : "Invalid email or password.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const sendPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (authError) throw authError;
      toast.success("Password reset instructions sent to your email!");
      setForgotPassword(false);
    } catch (err) {
      console.error("Password reset error", err);
      setError(authFriendlyError(err, "Could not send password reset email."));
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setStep("phone");
    setEmailStep("email");
    setOtp("");
    setEmailOtp("");
    localStorage.removeItem(PENDING_OTP_KEY);
  };

  const switchIntent = (next: AuthIntent) => {
    setIntent(next);
    setError(null);
    setStep("phone");
    setEmailStep("email");
    setOtp("");
    setEmailOtp("");
    localStorage.removeItem(PENDING_OTP_KEY);
  };

  return (
    // STRICT TRUE FULL-VIEWPORT CONTAINER (No outer card, No outer bg-slate, 100vw x 100vh)
    <div className="w-screen h-screen min-h-[100dvh] overflow-hidden bg-white flex flex-col lg:flex-row font-sans">
      {/* =================================================================== */}
      {/* LEFT PANEL: 48% Width Full Viewport Signature Orchid Brand Panel   */}
      {/* =================================================================== */}
      <aside className="hidden lg:flex lg:w-[48%] xl:w-[46%] h-full bg-gradient-to-br from-[#730d70] via-[#5c095a] to-[#420440] text-white p-10 xl:p-14 flex-col justify-between relative overflow-y-auto shrink-0 select-none">
        {/* Soft radial orchid illumination behind content */}
        <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[32rem] h-[32rem] bg-[#c026d3]/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-[24rem] h-[24rem] bg-[#981495]/25 rounded-full blur-[90px] pointer-events-none" />

        {/* TOP: LocalShore Logo */}
        <div className="relative z-10 flex items-center justify-between">
          <Link
            to="/"
            search={{ category: undefined, q: undefined }}
            className="inline-flex items-center gap-3.5 group"
          >
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-white font-black text-base shadow-md group-hover:scale-105 transition-transform">
              LS
            </span>
            <span className="font-display font-extrabold text-2xl xl:text-3xl tracking-tight text-white">
              LocalShore
            </span>
          </Link>
        </div>

        {/* MIDDLE: Eyebrow + Powerful Headline + Benefits */}
        <div className="relative z-10 my-auto py-8 space-y-7">
          {/* Eyebrow */}
          <div>
            <span className="text-[11px] font-black uppercase tracking-widest text-[#f0abfc] bg-white/10 px-4 py-1.5 rounded-full border border-white/12 backdrop-blur-md inline-flex items-center gap-1.5">
              <span>WELCOME BACK</span>
              <span className="text-xs">👋</span>
            </span>

            {/* Main Headline */}
            <h1 className="font-display mt-4 text-3xl xl:text-4xl 2xl:text-5xl font-black leading-[1.12] tracking-tight text-white">
              Pick your own local shop.
              <span className="block mt-1.5 bg-gradient-to-r from-[#f0abfc] via-[#f5d0fe] to-[#e879f9] bg-clip-text text-transparent">
                We just deliver.
              </span>
            </h1>

            {/* Supporting Text */}
            <p className="mt-3.5 text-sm xl:text-base text-fuchsia-100/80 leading-relaxed font-medium max-w-lg">
              Sign in to place orders, track deliveries in real time, and save your favourite local
              shops.
            </p>
          </div>

          {/* 3 Premium Feature Rows */}
          <div className="space-y-4.5 pt-2">
            {/* Feature 1 */}
            <div className="flex items-start gap-4 group">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/12 border border-white/20 text-fuchsia-200 shadow-md shadow-black/10 backdrop-blur-md group-hover:scale-105 transition-transform shadow-[0_0_20px_rgba(240,171,252,0.18)]">
                <Store className="h-5.5 w-5.5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Real neighbourhood shops</h3>
                <p className="text-xs xl:text-sm text-fuchsia-100/75 leading-relaxed mt-0.5">
                  No dark stores. Everything comes from trusted local shops near you.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-start gap-4 group">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/12 border border-white/20 text-fuchsia-200 shadow-md shadow-black/10 backdrop-blur-md group-hover:scale-105 transition-transform shadow-[0_0_20px_rgba(240,171,252,0.18)]">
                <Truck className="h-5.5 w-5.5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Live order tracking</h3>
                <p className="text-xs xl:text-sm text-fuchsia-100/75 leading-relaxed mt-0.5">
                  See your order move from shop to doorstep on a live map.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-start gap-4 group">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/12 border border-white/20 text-fuchsia-200 shadow-md shadow-black/10 backdrop-blur-md group-hover:scale-105 transition-transform shadow-[0_0_20px_rgba(240,171,252,0.18)]">
                <ShieldCheck className="h-5.5 w-5.5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Easy & secure login</h3>
                <p className="text-xs xl:text-sm text-fuchsia-100/75 leading-relaxed mt-0.5">
                  Phone OTP or email login. Quick, safe and hassle-free.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: Enlarged Local Shop Delivery Visual + Security Card */}
        <div className="relative z-10 space-y-4 pt-4">
          {/* Visual Delivery Scene Canvas Card */}
          <div className="relative w-full rounded-2xl bg-[#420440]/75 border border-white/15 p-5 overflow-hidden backdrop-blur-md shadow-2xl">
            {/* Top Ribbon Banner */}
            <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-fuchsia-200 pb-2.5 border-b border-white/10 mb-3.5">
              <span className="flex items-center gap-1.5 text-white">
                <Store className="h-3.5 w-3.5 text-[#f0abfc]" />
                <span>LOCAL SHOP</span>
              </span>
              <span className="text-[#f0abfc] flex items-center gap-1">
                <span>→</span>
                <Truck className="h-3.5 w-3.5 text-amber-300" />
                <span>LIVE DELIVERY →</span>
              </span>
              <span className="flex items-center gap-1.5 text-white">
                <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                <span>YOUR DOORSTEP</span>
              </span>
            </div>

            {/* Scene Canvas */}
            <div className="relative h-24 w-full flex items-center justify-between px-3">
              {/* Left Node: Local Shop */}
              <div className="relative z-10 flex flex-col items-center">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-tr from-[#981495] to-[#c026d3] text-white shadow-xl shadow-[#981495]/50 border border-white/20">
                  <Store className="h-6 w-6" />
                </div>
                <span className="text-[11px] font-bold text-white mt-1.5">🏪 Local shop</span>
              </div>

              {/* Center: Dotted Delivery Arc Path with Animated Rider */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <svg className="w-full h-full" viewBox="0 0 340 90" fill="none">
                  <path
                    d="M 60 45 Q 170 10 280 45"
                    stroke="#f0abfc"
                    strokeWidth="3"
                    strokeDasharray="7 7"
                    className="animate-route-dash opacity-90"
                  />
                </svg>

                {/* Rider Icon Badge */}
                <div className="absolute top-2.5 grid h-8 w-8 place-items-center rounded-xl bg-[#981495] text-white border border-[#f0abfc] shadow-lg shadow-purple-950/70 animate-bounce">
                  <Truck className="h-4 w-4" />
                </div>
              </div>

              {/* Right Node: Doorstep */}
              <div className="relative z-10 flex flex-col items-center">
                <div className="relative flex items-center justify-center">
                  <span className="absolute h-11 w-11 animate-ping rounded-full bg-emerald-400/40 opacity-75" />
                  <span className="relative grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-xl shadow-emerald-900/50 border border-white/20">
                    <MapPin className="h-6 w-6" />
                  </span>
                </div>
                <span className="text-[11px] font-bold text-white mt-1.5">📍 Your doorstep</span>
              </div>
            </div>
          </div>

          {/* Translucent Glass Security Message */}
          <div className="flex items-center gap-3 rounded-2xl bg-white/10 backdrop-blur-md px-4.5 py-3 border border-white/15 text-xs xl:text-sm text-fuchsia-100 font-semibold shadow-xs">
            <Lock className="h-4 w-4 text-[#f0abfc] shrink-0" />
            <span>🔒 Your data is 100% secure and private with us.</span>
          </div>

          {/* Subdued Terms Footnote */}
          <p className="text-xs text-fuchsia-200/60 text-center lg:text-left">
            By continuing you agree to our{" "}
            <span className="text-white underline underline-offset-2 cursor-pointer hover:text-[#f0abfc]">
              Terms & Privacy
            </span>
            .
          </p>
        </div>
      </aside>

      {/* =================================================================== */}
      {/* RIGHT PANEL: 52% Width Full Viewport Authentication Form Container  */}
      {/* =================================================================== */}
      <main className="w-full lg:w-[52%] xl:w-[54%] h-full bg-white p-6 sm:p-10 lg:p-14 xl:p-16 flex flex-col justify-between overflow-y-auto shrink-0">
        {/* TOP RIGHT: Security Badge & Mobile Back Link */}
        <div className="flex items-center justify-between w-full max-w-[500px] mx-auto">
          {/* Mobile Header Logo */}
          <Link
            to="/"
            search={{ category: undefined, q: undefined }}
            className="lg:hidden inline-flex items-center gap-2"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#981495] text-white font-black text-xs shadow-sm">
              LS
            </span>
            <span className="font-black text-xl tracking-tight text-slate-900">LocalShore</span>
          </Link>

          {/* Security Pill */}
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-700 border border-emerald-200/70 shadow-2xs ml-auto">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>🛡 100% Secure</span>
            <span className="hidden sm:inline text-emerald-600/70 font-normal">
              | We protect your privacy
            </span>
          </div>
        </div>

        {/* CENTER: Vertically Centered Form Container (Max 480-500px width) */}
        <div className="my-auto py-6 max-w-[480px] mx-auto w-full">
          {/* Mobile-only Brand Headline */}
          <div className="lg:hidden mb-6 text-center">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#981495] bg-[#fdf2fe] px-3 py-1 rounded-full border border-[#f0abfc]/40">
              WELCOME BACK 👋
            </span>
            <h1 className="font-display mt-2.5 text-2xl font-black text-slate-900 leading-tight">
              Pick your own local shop. <span className="text-[#981495]">We just deliver.</span>
            </h1>
          </div>

          {/* Form Title & Subheading */}
          <div className="text-left">
            <h2 className="font-display text-2xl sm:text-3xl xl:text-4xl font-black tracking-tight text-slate-900">
              {intent === "signup" ? "Create your account" : "Sign in to your account"}
            </h2>
            <p className="mt-2 text-xs sm:text-sm font-medium text-slate-500 leading-relaxed">
              {mode === "phone"
                ? step === "phone"
                  ? `We'll send you an ${OTP_LENGTH}-digit code via SMS to sign in securely.`
                  : `Enter the ${OTP_LENGTH}-digit verification code sent to ${countryCode} ${phone}.`
                : emailStep === "email"
                  ? `We'll send you an ${OTP_LENGTH}-digit verification code via email.`
                  : `Enter the ${OTP_LENGTH}-digit code sent to ${email}.`}
            </p>
          </div>

          {/* SEGMENTED CONTROL 1: Login vs Sign Up */}
          <div className="mt-6 grid grid-cols-2 gap-1 rounded-2xl bg-slate-100/90 p-1.5 border border-slate-200/60">
            <button
              type="button"
              onClick={() => switchIntent("login")}
              className={`inline-flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs sm:text-sm font-extrabold transition-all duration-200 cursor-pointer ${
                intent === "login"
                  ? "bg-white text-[#700b6e] shadow-xs border border-slate-200/80"
                  : "text-slate-500 hover:text-slate-900 font-semibold"
              }`}
            >
              <UserCheck className="h-4 w-4" />
              <span>Login</span>
            </button>

            <button
              type="button"
              onClick={() => switchIntent("signup")}
              className={`inline-flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs sm:text-sm font-extrabold transition-all duration-200 cursor-pointer ${
                intent === "signup"
                  ? "bg-white text-[#700b6e] shadow-xs border border-slate-200/80"
                  : "text-slate-500 hover:text-slate-900 font-semibold"
              }`}
            >
              <User className="h-4 w-4" />
              <span>Sign up</span>
            </button>
          </div>

          {/* SEGMENTED CONTROL 2: Phone vs Email vs Password */}
          <div className="mt-3 grid grid-cols-3 gap-1 rounded-2xl bg-slate-100/90 p-1.5 border border-slate-200/60">
            <button
              type="button"
              onClick={() => switchMode("phone")}
              className={`inline-flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs sm:text-sm font-extrabold transition-all duration-200 cursor-pointer ${
                mode === "phone"
                  ? "bg-white text-[#700b6e] shadow-xs border border-slate-200/80"
                  : "text-slate-500 hover:text-slate-900 font-semibold"
              }`}
            >
              <Phone className="h-4 w-4 text-[#981495]" />
              <span>Phone</span>
            </button>

            <button
              type="button"
              onClick={() => switchMode("email")}
              className={`inline-flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs sm:text-sm font-extrabold transition-all duration-200 cursor-pointer ${
                mode === "email"
                  ? "bg-white text-[#700b6e] shadow-xs border border-slate-200/80"
                  : "text-slate-500 hover:text-slate-900 font-semibold"
              }`}
            >
              <Mail className="h-4 w-4 text-[#981495]" />
              <span>Email OTP</span>
            </button>

            <button
              type="button"
              onClick={() => switchMode("password")}
              className={`inline-flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs sm:text-sm font-extrabold transition-all duration-200 cursor-pointer ${
                mode === "password"
                  ? "bg-white text-[#700b6e] shadow-xs border border-slate-200/80"
                  : "text-slate-500 hover:text-slate-900 font-semibold"
              }`}
            >
              <Lock className="h-4 w-4 text-[#981495]" />
              <span>Password</span>
            </button>
          </div>

          {/* PHONE FLOW FORM */}
          {mode === "phone" ? (
            step === "phone" ? (
              <form onSubmit={sendOtp} className="mt-5 space-y-4">
                {intent === "signup" && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      autoComplete="name"
                      className="w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm font-medium outline-none focus:border-[#981495] focus:bg-white focus:ring-4 focus:ring-[#981495]/10 transition"
                    />
                  </div>
                )}

                {/* Phone input with country code picker */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mobile Number
                  </label>
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 transition-all focus-within:border-[#981495] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#981495]/10">
                    <div className="flex items-center gap-1 font-mono text-sm font-bold text-slate-700 pr-2 border-r border-slate-200 shrink-0">
                      <span>+91</span>
                      <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                    <Phone className="h-4 w-4 text-slate-400 shrink-0 ml-1" />
                    <input
                      inputMode="numeric"
                      maxLength={14}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      placeholder="98765 43210"
                      className="w-full border-0 bg-transparent font-mono text-base font-bold text-slate-900 outline-none ring-0 shadow-none tracking-wider placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:ring-0 focus:shadow-none focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-none"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Green Privacy Reassurance Message */}
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50/80 border border-emerald-200/60 px-3 py-2 text-xs text-emerald-800 font-semibold">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>🛡 We'll never share your number with anyone.</span>
                </div>

                {error && (
                  <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs font-bold text-red-600">
                    {error}
                  </div>
                )}

                {/* Primary CTA Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group w-full inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#981495] to-[#700b6e] hover:from-[#821280] hover:to-[#5c095a] text-white font-extrabold py-3.5 px-5 text-sm sm:text-base shadow-md shadow-[#981495]/25 hover:shadow-lg hover:shadow-[#981495]/35 transition-all hover:scale-[1.005] active:scale-[0.995] disabled:opacity-60 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Sending code…</span>
                    </>
                  ) : (
                    <>
                      <span>{intent === "signup" ? "Send OTP to Register" : "Send OTP"}</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* Phone OTP Verification Form */
              <form onSubmit={verifyOtp} className="mt-5 space-y-4">
                <div className="rounded-xl bg-[#fdf2fe] border border-[#f0abfc]/40 p-3 text-xs font-medium text-[#700b6e] flex items-center justify-between">
                  <span>
                    Code sent to{" "}
                    <strong className="font-mono text-[#570656]">
                      {countryCode} {phone}
                    </strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("phone");
                      setOtp("");
                      setError(null);
                    }}
                    className="text-[#981495] font-bold hover:underline"
                  >
                    Edit
                  </button>
                </div>

                <div className="py-2 flex justify-center">
                  <OtpInput value={otp} onChange={setOtp} disabled={loading} />
                </div>

                {error && (
                  <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs font-bold text-red-600">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || otp.length !== OTP_LENGTH}
                  className="group w-full inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#981495] to-[#700b6e] hover:from-[#821280] hover:to-[#5c095a] text-white font-extrabold py-3.5 px-5 text-sm sm:text-base shadow-md shadow-[#981495]/25 hover:shadow-lg hover:shadow-[#981495]/35 transition-all hover:scale-[1.005] active:scale-[0.995] disabled:opacity-60 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Verifying…</span>
                    </>
                  ) : (
                    <>
                      <span>Verify & Continue</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-xs font-semibold pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("phone");
                      setOtp("");
                      setError(null);
                    }}
                    className="text-slate-500 hover:text-slate-900 hover:underline"
                  >
                    Use a different number
                  </button>
                  <button
                    type="button"
                    onClick={resendOtp}
                    disabled={cooldown > 0 || loading}
                    className="text-[#981495] font-bold hover:underline disabled:text-slate-400 disabled:no-underline"
                  >
                    {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend OTP"}
                  </button>
                </div>
              </form>
            )
          ) : mode === "email" ? (
            /* EMAIL FLOW FORM */
            emailStep === "email" ? (
              <form onSubmit={sendEmailOtp} className="mt-5 space-y-4">
                {intent === "signup" && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      autoComplete="name"
                      className="w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm font-medium outline-none focus:border-[#981495] focus:bg-white focus:ring-4 focus:ring-[#981495]/10 transition"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 transition-all focus-within:border-[#981495] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#981495]/10">
                    <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                    <input
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full border-0 bg-transparent text-sm font-semibold text-slate-900 outline-none ring-0 shadow-none placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:ring-0 focus:shadow-none focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-none"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Green Privacy Reassurance Message */}
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50/80 border border-emerald-200/60 px-3 py-2 text-xs text-emerald-800 font-semibold">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>🛡 We'll never share your email with anyone.</span>
                </div>

                {error && (
                  <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs font-bold text-red-600">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="group w-full inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#981495] to-[#700b6e] hover:from-[#821280] hover:to-[#5c095a] text-white font-extrabold py-3.5 px-5 text-sm sm:text-base shadow-md shadow-[#981495]/25 hover:shadow-lg hover:shadow-[#981495]/35 transition-all hover:scale-[1.005] active:scale-[0.995] disabled:opacity-60 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Sending code…</span>
                    </>
                  ) : (
                    <>
                      <span>{intent === "signup" ? "Send OTP to Register" : "Send OTP"}</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* Email OTP Verification Form */
              <form onSubmit={verifyEmailOtp} className="mt-5 space-y-4">
                <div className="rounded-xl bg-[#fdf2fe] border border-[#f0abfc]/40 p-3 text-xs font-medium text-[#700b6e] flex items-center justify-between">
                  <span>
                    Code sent to <strong className="font-mono text-[#570656]">{email}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setEmailStep("email");
                      setEmailOtp("");
                      setError(null);
                    }}
                    className="text-[#981495] font-bold hover:underline"
                  >
                    Edit
                  </button>
                </div>

                <div className="py-2 flex justify-center">
                  <OtpInput value={emailOtp} onChange={setEmailOtp} disabled={loading} />
                </div>

                {error && (
                  <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs font-bold text-red-600">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || emailOtp.length !== OTP_LENGTH}
                  className="group w-full inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#981495] to-[#700b6e] hover:from-[#821280] hover:to-[#5c095a] text-white font-extrabold py-3.5 px-5 text-sm sm:text-base shadow-md shadow-[#981495]/25 hover:shadow-lg hover:shadow-[#981495]/35 transition-all hover:scale-[1.005] active:scale-[0.995] disabled:opacity-60 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Verifying…</span>
                    </>
                  ) : (
                    <>
                      <span>Verify & Continue</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-xs font-semibold pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEmailStep("email");
                      setEmailOtp("");
                      setError(null);
                    }}
                    className="text-slate-500 hover:text-slate-900 hover:underline"
                  >
                    Use a different email
                  </button>
                  <button
                    type="button"
                    onClick={resendEmailOtp}
                    disabled={cooldown > 0 || loading}
                    className="text-[#981495] font-bold hover:underline disabled:text-slate-400 disabled:no-underline"
                  >
                    {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend Code"}
                  </button>
                </div>
              </form>
            )
          ) : /* PASSWORD FLOW FORM */
          forgotPassword ? (
            <form onSubmit={sendPasswordReset} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 transition-all focus-within:border-[#981495] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#981495]/10">
                  <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full border-0 bg-transparent text-sm font-semibold text-slate-900 outline-none ring-0 shadow-none placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:ring-0 focus:shadow-none focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-none"
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs font-bold text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group w-full inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#981495] to-[#700b6e] hover:from-[#821280] hover:to-[#5c095a] text-white font-extrabold py-3.5 px-5 text-sm sm:text-base shadow-md shadow-[#981495]/25 hover:shadow-lg hover:shadow-[#981495]/35 transition-all hover:scale-[1.005] active:scale-[0.995] disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Sending reset link…</span>
                  </>
                ) : (
                  <>
                    <span>Send Reset Link</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setForgotPassword(false);
                    setError(null);
                  }}
                  className="text-xs font-bold text-[#981495] hover:underline"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handlePasswordAuth} className="mt-5 space-y-4">
              {intent === "signup" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    autoComplete="name"
                    className="w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm font-medium outline-none focus:border-[#981495] focus:bg-white focus:ring-4 focus:ring-[#981495]/10 transition"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 transition-all focus-within:border-[#981495] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#981495]/10">
                  <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full border-0 bg-transparent text-sm font-semibold text-slate-900 outline-none ring-0 shadow-none placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:ring-0 focus:shadow-none focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">Password</label>
                  {intent === "login" && (
                    <button
                      type="button"
                      onClick={() => {
                        setForgotPassword(true);
                        setError(null);
                      }}
                      className="text-xs font-bold text-[#981495] hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-2xl bg-slate-50 border border-slate-200 pl-4 pr-11 py-3 text-sm font-medium outline-none focus:border-[#981495] focus:bg-white focus:ring-4 focus:ring-[#981495]/10 transition"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 focus:outline-none cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4.5 w-4.5" />
                    ) : (
                      <Eye className="h-4.5 w-4.5" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs font-bold text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group w-full inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#981495] to-[#700b6e] hover:from-[#821280] hover:to-[#5c095a] text-white font-extrabold py-3.5 px-5 text-sm sm:text-base shadow-md shadow-[#981495]/25 hover:shadow-lg hover:shadow-[#981495]/35 transition-all hover:scale-[1.005] active:scale-[0.995] disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing…</span>
                  </>
                ) : (
                  <>
                    <span>{intent === "signup" ? "Create Account" : "Sign In"}</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-widest font-black">
              <span className="bg-white px-3 text-slate-400">OR</span>
            </div>
          </div>

          {/* Secondary Button: Switch Auth Mode */}
          <button
            type="button"
            onClick={() => switchMode(mode === "phone" ? "email" : "phone")}
            className="w-full inline-flex items-center justify-center gap-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-[#fdf2fe]/50 text-slate-800 font-bold py-3.5 px-4 text-xs sm:text-sm shadow-2xs transition-all hover:border-[#f0abfc]/70 cursor-pointer"
          >
            {mode === "phone" ? (
              <>
                <Mail className="h-4 w-4 text-[#981495]" />
                <span>Continue with Email</span>
              </>
            ) : (
              <>
                <Phone className="h-4 w-4 text-[#981495]" />
                <span>Continue with Phone</span>
              </>
            )}
          </button>
        </div>

        {/* BOTTOM: Trust Signals & Help Link */}
        <div className="mt-auto pt-4 border-t border-slate-100 max-w-[480px] mx-auto w-full">
          {/* 3 Compact Trust Indicators */}
          <div className="grid grid-cols-3 gap-2 text-center mb-4">
            {/* Trust Signal 1 */}
            <div className="flex flex-col items-center p-2 rounded-xl bg-slate-50/70 border border-slate-100">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-amber-100 text-amber-700 mb-1">
                <Zap className="h-3.5 w-3.5" />
              </span>
              <span className="text-[11px] font-black text-slate-900 leading-tight">
                Quick login
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Under 10 seconds</span>
            </div>

            {/* Trust Signal 2 */}
            <div className="flex flex-col items-center p-2 rounded-xl bg-slate-50/70 border border-slate-100">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-blue-100 text-blue-700 mb-1">
                <ShieldCheck className="h-3.5 w-3.5" />
              </span>
              <span className="text-[11px] font-black text-slate-900 leading-tight">
                Secure & private
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Encrypted data</span>
            </div>

            {/* Trust Signal 3 */}
            <div className="flex flex-col items-center p-2 rounded-xl bg-slate-50/70 border border-slate-100">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-pink-100 text-pink-700 mb-1">
                <Heart className="h-3.5 w-3.5" />
              </span>
              <span className="text-[11px] font-black text-slate-900 leading-tight">
                Loved by locals
              </span>
              <span className="text-[10px] text-slate-500 font-medium">10,000+ shoppers</span>
            </div>
          </div>

          {/* Help Footer */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => toast.info("Contact support@localshore.in for assistance")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#981495] transition-colors cursor-pointer"
            >
              <span>Trouble signing in?</span>
              <span className="font-bold text-[#981495] flex items-center gap-0.5">
                Get help <ArrowRight className="h-3 w-3" />
              </span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
