import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ShieldCheck, Truck, Store, Mail, Phone, Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
});

type Mode = "phone" | "email";

function authErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "string" && error.trim()) return error;
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === "object") {
    const value = error as { message?: unknown; msg?: unknown; error_code?: unknown; code?: unknown };
    const detail = typeof value.message === "string" && value.message.trim()
      ? value.message
      : typeof value.msg === "string" && value.msg.trim()
        ? value.msg
        : "";
    if (detail) {
      const code = typeof value.error_code === "string" ? value.error_code : typeof value.code === "string" ? value.code : "";
      return code ? `${code}: ${detail}` : detail;
    }
  }
  return fallback;
}

function AuthPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const [mode, setMode] = useState<Mode>("phone");

  // phone flow
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [cooldown, setCooldown] = useState(0);

  // email flow (OTP)
  const [emailStep, setEmailStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [emailOtp, setEmailOtp] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const done = useCallback(() => {
    if (redirect === "/checkout") {
      navigate({ to: "/checkout" });
      return;
    }
    navigate({ to: "/", search: { category: undefined, q: undefined } });
  }, [navigate, redirect]);

  const completeSupabaseEmailSession = useCallback(async () => {
    const { data, error: userError } = await supabase.auth.getUser();
    const user = data.user;
    if (userError || !user) return false;

    if (user.phone) {
      done();
      return true;
    }
    if (!user.email) return false;

    const displayName =
      (typeof user.user_metadata?.name === "string" && user.user_metadata.name.trim()) ||
      name.trim() ||
      user.email.split("@")[0];

    done();
    return true;
  }, [done, name]);

  useEffect(() => {
    let active = true;

    void supabase.auth.getSession().then(async ({ data }) => {
      if (!active || !data.session) return;
      await completeSupabaseEmailSession();
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        setTimeout(() => {
          if (active) void completeSupabaseEmailSession();
        }, 0);
      }
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, [completeSupabaseEmailSession]);

  // 30s resend cooldown ticker
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6,14}$/.test(phone)) {
      setError("Enter a valid phone number.");
      return;
    }
    if (!/^\+\d{1,3}$/.test(countryCode)) {
      setError("Enter a valid country code, e.g. +91.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithOtp({ phone: `${countryCode}${phone}` });
      if (authError) throw authError;
      setStep("otp");
      setCooldown(30);
    } catch (err) {
      console.error("Supabase phone OTP error", err);
      setError(authErrorMessage(err, "Could not send the verification code. Check Supabase Auth SMS settings."));
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (cooldown > 0 || loading) return;
    setError(null);
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithOtp({ phone: `${countryCode}${phone}` });
      if (authError) throw authError;
      setCooldown(30);
      setOtp("");
    } catch (err) {
      console.error("Supabase phone OTP resend error", err);
      setError(authErrorMessage(err, "Could not resend the verification code. Check Supabase Auth SMS settings."));
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError("Enter the 6-digit code.");
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
      done();
    } catch (err) {
      console.error("Supabase phone OTP verification error", err);
      setError(authErrorMessage(err, "That code could not be verified."));
    } finally {
      setLoading(false);
    }
  };
  const sendEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          data: { display_name: name.trim() || email.split("@")[0] },
          emailRedirectTo: `${window.location.origin}/auth`,
        },
      });
      if (authError) throw authError;
      setEmailStep("otp");
      setCooldown(30);
    } catch (err) {
      console.error("Supabase email OTP error", err);
      setError(authErrorMessage(err, "Could not send the verification code. Check Supabase SMTP settings."));
    } finally {
      setLoading(false);
    }
  };

  const verifyEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (emailOtp.length < 6 || emailOtp.length > 8) {
      setError("Enter the verification code from the email.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      let { error: authError } = await supabase.auth.verifyOtp({ email, token: emailOtp, type: "email" });
      // New users can receive a signup confirmation token when email
      // confirmation is enabled. Support that token type as well.
      if (authError) {
        const fallback = await supabase.auth.verifyOtp({ email, token: emailOtp, type: "signup" as any });
        authError = fallback.error;
      }
      if (authError) throw authError;
      done();
    } catch (err) {
      console.error("Supabase email OTP verification error", err);
      setError(authErrorMessage(err, "That code could not be verified."));
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
          shouldCreateUser: true,
          data: { display_name: name.trim() || email.split("@")[0] },
          emailRedirectTo: `${window.location.origin}/auth`,
        },
      });
      if (authError) throw authError;
      setCooldown(30);
      setEmailOtp("");
    } catch (err) {
      console.error("Supabase email OTP resend error", err);
      setError(authErrorMessage(err, "Could not resend the verification code."));
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
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 lg:grid-cols-2">
        <aside className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
          <Link
            to="/"
            search={{ category: undefined, q: undefined }}
            className="inline-flex items-center gap-2 text-sm opacity-90 hover:opacity-100"
          >
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary-foreground/15 font-display text-sm font-bold">
              LS
            </span>
            <span className="font-display text-lg font-bold">Local Shore</span>
          </Link>

          <div className="max-w-md">
            <p className="font-mono text-[11px] uppercase tracking-widest opacity-80">Sign in</p>
            <h2 className="mt-3 font-display text-4xl leading-tight">
              Pick your own local shop. We just deliver.
            </h2>
            <p className="mt-3 text-sm opacity-85">
              Sign in with your phone or email to place orders, track deliveries, and save your
              favourite shops.
            </p>

            <ul className="mt-8 space-y-4 text-sm">
              <Perk
                icon={Store}
                title="Real neighbourhood shops"
                desc="No dark stores. You choose where it's sourced from."
              />
              <Perk
                icon={Truck}
                title="Live order tracking"
                desc="See your rider from shop to doorstep on a map."
              />
              <Perk
                icon={ShieldCheck}
                title="Phone OTP or email login"
                desc="Use whichever is easier for you."
              />
            </ul>
          </div>

          <p className="text-xs opacity-70">By continuing you agree to our Terms & Privacy.</p>
        </aside>

        <section className="flex flex-col px-5 pt-6 sm:px-8 lg:justify-center lg:px-12 lg:pt-0">
          <div className="flex items-center justify-between lg:hidden">
            <Link
              to="/"
              search={{ category: undefined, q: undefined }}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
            <span className="inline-flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground font-display text-xs font-bold">
                LS
              </span>
              <span className="font-display text-sm font-bold">Local Shore</span>
            </span>
          </div>

          <div className="mx-auto mt-8 w-full max-w-md lg:mt-0">
            <h1 className="font-display text-3xl leading-tight sm:text-4xl">
              {mode === "phone"
                ? step === "phone"
                  ? "Sign in with your phone"
                  : "Enter the code we sent"
                : emailStep === "email"
                  ? "Sign in with your email"
                  : "Enter the code we emailed"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {mode === "phone"
                ? step === "phone"
                  ? "We'll text you a 6-digit code via Supabase Auth. No password to remember."
                  : `Sent to ${countryCode} ${phone}. Enter the 6-digit code you received.`
                : emailStep === "email"
                  ? "We'll email you a verification code. No password to remember."
                  : `Sent to ${email}. Check your inbox (and spam) for the verification code.`}
            </p>

            {/* Mode tabs */}
            <div className="mt-6 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
              <button
                type="button"
                onClick={() => switchMode("phone")}
                className={`inline-flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors ${
                  mode === "phone"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Phone className="h-4 w-4" /> Phone
              </button>
              <button
                type="button"
                onClick={() => switchMode("email")}
                className={`inline-flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors ${
                  mode === "email"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Mail className="h-4 w-4" /> Email
              </button>
            </div>

            {mode === "phone" ? (
              step === "phone" ? (
                <form onSubmit={sendOtp} className="mt-6 space-y-4">
                  <label className="flex items-center gap-2 rounded-xl bg-card px-3 py-3.5 ring-1 ring-black/[0.06] focus-within:ring-2 focus-within:ring-primary">
                    <input
                      inputMode="tel"
                      maxLength={4}
                      value={countryCode}
                      onChange={(e) => {
                        let v = e.target.value.replace(/[^\d+]/g, "");
                        if (!v.startsWith("+")) v = "+" + v.replace(/\+/g, "");
                        setCountryCode(v.slice(0, 4));
                      }}
                      className="w-14 bg-transparent font-mono text-sm outline-none"
                      aria-label="Country code"
                    />
                    <span className="h-5 w-px bg-black/10" />
                    <input
                      inputMode="numeric"
                      maxLength={14}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      placeholder="98765 43210"
                      className="w-full bg-transparent font-mono text-base outline-none tracking-wider"
                      autoFocus
                    />
                  </label>
                  {error && <p className="text-xs text-destructive">{error}</p>}
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-teal-deep disabled:opacity-70"
                  >
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    {loading ? "Sending code…" : "Send code"}
                  </button>
                  <div id="firebase-recaptcha-container" />
                </form>
              ) : (
                <form onSubmit={verifyOtp} className="mt-6 space-y-4">
                  <p className="text-xs text-muted-foreground">
                    Code sent to{" "}
                    <span className="font-mono">
                      {countryCode} {phone}
                    </span>
                  </p>
                  <input
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="000000"
                    className="w-full rounded-xl bg-card px-3 py-4 text-center font-mono text-3xl tracking-[0.5em] outline-none ring-1 ring-black/[0.06] focus:ring-2 focus:ring-primary"
                    autoFocus
                  />
                  {error && <p className="text-xs text-destructive">{error}</p>}
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-teal-deep disabled:opacity-70"
                  >
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    {loading ? "Verifying…" : "Verify and continue"}
                  </button>
                  <div className="flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setStep("phone");
                        setOtp("");
                        setError(null);
                      }}
                      className="text-muted-foreground underline-offset-4 hover:underline"
                    >
                      Use a different number
                    </button>
                    <button
                      type="button"
                      onClick={resendOtp}
                      disabled={cooldown > 0 || loading}
                      className="text-primary underline-offset-4 hover:underline disabled:text-muted-foreground disabled:no-underline"
                    >
                      {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                    </button>
                  </div>
                  <div id="firebase-recaptcha-container" />
                </form>
              )
            ) : emailStep === "email" ? (
              <form onSubmit={sendEmailOtp} className="mt-6 space-y-3">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name (optional)"
                  className="w-full rounded-xl bg-card px-3.5 py-3.5 text-sm outline-none ring-1 ring-black/[0.06] focus:ring-2 focus:ring-primary"
                />
                <label className="flex items-center gap-2 rounded-xl bg-card px-3 py-3.5 ring-1 ring-black/[0.06] focus-within:ring-2 focus-within:ring-primary">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-transparent text-sm outline-none"
                    autoFocus
                  />
                </label>
                {error && <p className="text-xs text-destructive">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-teal-deep disabled:opacity-70"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {loading ? "Sending code…" : "Send verification code"}
                </button>
                <p className="pt-1 text-center text-xs text-muted-foreground">
                  New to Local Shore? An account is created automatically.
                </p>
              </form>
            ) : (
              <form onSubmit={verifyEmailOtp} className="mt-6 space-y-4">
                <p className="text-xs text-muted-foreground">Code sent to <span className="font-mono">{email}</span></p>
                <input
                  inputMode="numeric"
                  maxLength={8}
                  value={emailOtp}
                  onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="00000000"
                  className="w-full rounded-xl bg-card px-3 py-4 text-center font-mono text-3xl tracking-[0.5em] outline-none ring-1 ring-black/[0.06] focus:ring-2 focus:ring-primary"
                  autoFocus
                />
                {error && <p className="text-xs text-destructive">{error}</p>}
                <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-70">
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {loading ? "Verifying…" : "Verify and continue"}
                </button>
                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => { setEmailStep("email"); setEmailOtp(""); setError(null); }}
                    className="text-muted-foreground underline-offset-4 hover:underline"
                  >
                    Use a different email
                  </button>
                  <button
                    type="button"
                    onClick={resendEmailOtp}
                    disabled={cooldown > 0 || loading}
                    className="text-primary underline-offset-4 hover:underline disabled:text-muted-foreground disabled:no-underline"
                  >
                    {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                  </button>
                </div>
              </form>
            )}
          </div>

          <p className="mx-auto mt-10 w-full max-w-md text-center text-[11px] text-muted-foreground lg:hidden">
            By continuing you agree to our Terms & Privacy.
          </p>
        </section>
      </div>
    </div>
  );
}

function Perk({
  icon: Icon,
  title,
  desc,
}: {
  icon: typeof ShieldCheck;
  title: string;
  desc: string;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-foreground/15">
        <Icon className="h-4.5 w-4.5" />
      </span>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-xs opacity-80">{desc}</p>
      </div>
    </li>
  );
}
