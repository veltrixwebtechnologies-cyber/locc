import React, { useState, useEffect } from "react";
import { QrCode, Star, CheckCircle2, Sparkles, Send } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

export interface AppDownloadBannerConfig {
  is_active: boolean;
  theme_variant?: "dark-navy" | "signature-orchid" | "auto";
  badge1_text: string;
  badge2_text: string;
  headline_prefix: string;
  headline_highlight: string;
  headline_suffix: string;
  description: string;
  button_text: string;
  google_play_rating: string;
  google_play_downloads: string;
  app_store_rating: string;
  app_store_downloads: string;
  qr_label: string;
}

export const DEFAULT_APP_BANNER_CONFIG: AppDownloadBannerConfig = {
  is_active: true,
  theme_variant: "dark-navy",
  badge1_text: "Special App Offer",
  badge2_text: "Exclusive Deals",
  headline_prefix: "Grab ",
  headline_highlight: "10% OFF",
  headline_suffix: " now",
  description:
    "Download the LocalShore App to unlock instant local shop discounts, 15-minute express delivery, and live order GPS tracking!",
  button_text: "Get App Link",
  google_play_rating: "4.8",
  google_play_downloads: "50 Lakh+",
  app_store_rating: "4.9",
  app_store_downloads: "10 Lakh+",
  qr_label: "SCAN TO DOWNLOAD",
};

export const APP_BANNER_CONFIG_KEY = "localshore_app_download_banner_config";

export function getAppBannerConfig(): AppDownloadBannerConfig {
  try {
    const raw = localStorage.getItem(APP_BANNER_CONFIG_KEY);
    if (raw) {
      return { ...DEFAULT_APP_BANNER_CONFIG, ...JSON.parse(raw) };
    }
  } catch {}
  return DEFAULT_APP_BANNER_CONFIG;
}

interface AppDownloadBannerProps {
  variant?: "dark-navy" | "signature-orchid" | "auto";
  className?: string;
}

export const AppDownloadBanner: React.FC<AppDownloadBannerProps> = ({
  variant: propVariant,
  className = "",
}) => {
  const [config, setConfig] = useState<AppDownloadBannerConfig>(getAppBannerConfig);
  const [mobileNumber, setMobileNumber] = useState("");
  const [isSent, setIsSent] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  useEffect(() => {
    const updateConfig = () => {
      setConfig(getAppBannerConfig());
    };

    window.addEventListener("storage", updateConfig);
    window.addEventListener("localshore_banner_updated", updateConfig);

    // Fetch latest from Supabase fallback
    (async () => {
      try {
        const { data, error } = await (supabase as any)
          .from("banners")
          .select("*")
          .eq("placement", "promo")
          .limit(1)
          .maybeSingle();

        if (!error && data && data.image_url) {
          try {
            const parsed = JSON.parse(data.image_url);
            const merged = { ...DEFAULT_APP_BANNER_CONFIG, ...parsed, is_active: data.is_active ?? true };
            setConfig(merged);
            localStorage.setItem(APP_BANNER_CONFIG_KEY, JSON.stringify(merged));
          } catch {}
        }
      } catch (e) {
        // Fallback to local storage config
      }
    })();

    return () => {
      window.removeEventListener("storage", updateConfig);
      window.removeEventListener("localshore_banner_updated", updateConfig);
    };
  }, []);

  if (!config.is_active) {
    return null;
  }

  const activeVariant = propVariant || config.theme_variant || "dark-navy";

  const handleSendLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobileNumber || mobileNumber.trim().length < 10) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }
    setIsSent(true);
    toast.success(`App download link sent to +91 ${mobileNumber}!`);
    setTimeout(() => {
      setMobileNumber("");
      setIsSent(false);
    }, 4000);
  };

  // Dynamic Theme Preset Styles
  const isOrchid = activeVariant === "signature-orchid";

  return (
    <div className={`mx-4 my-6 sm:mx-6 sm:my-8 md:mx-8 ${className}`}>
      <div
        className={`relative overflow-hidden rounded-3xl transition-all duration-300 shadow-2xl ${
          isOrchid
            ? "bg-[#0f0618] border border-[#3b1254]"
            : "bg-[#070a16] border border-[#1d2642]"
        }`}
      >
        {/* Subtle Ambient Background Gradient */}
        <div
          className={`absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] ${
            isOrchid
              ? "from-[#38094d]/50 via-[#140624] to-[#080210]"
              : "from-[#182348]/40 via-[#0a0e21] to-[#060813]"
          } opacity-95`}
        />

        {/* Ambient Glow Effects */}
        <div
          className={`absolute -top-20 -left-20 h-64 w-64 rounded-full blur-3xl ${
            isOrchid ? "bg-purple-600/20" : "bg-amber-500/10"
          }`}
        />
        <div
          className={`absolute -bottom-20 -right-20 h-64 w-64 rounded-full blur-3xl ${
            isOrchid ? "bg-[#981495]/25" : "bg-indigo-600/15"
          }`}
        />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8 p-6 sm:p-8 lg:p-9">
          {/* Left Content Column */}
          <div className="flex-1 space-y-4 text-left">
            <div className="flex flex-wrap items-center gap-2.5">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                  isOrchid
                    ? "bg-[#2d093e] text-[#facc15] border border-[#6b1693]"
                    : "bg-[#2a2208]/90 text-[#facc15] border border-[#52410a]"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5 text-[#facc15] animate-pulse" />
                {config.badge1_text}
              </span>
              <Badge
                variant="outline"
                className={`font-bold px-3 py-1 ${
                  isOrchid
                    ? "border-[#6b1693] text-[#e879f9] bg-[#220730]"
                    : "border-[#0a4d38] text-[#2dd4bf] bg-[#06241a]/80"
                }`}
              >
                {config.badge2_text}
              </Badge>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
              {config.headline_prefix}
              <span className="text-[#facc15] font-black">{config.headline_highlight}</span>
              {config.headline_suffix}
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed font-medium">
              {config.description}
            </p>

            {/* Mobile Number SMS Link Form */}
            <form onSubmit={handleSendLink} className="pt-2 flex flex-col sm:flex-row gap-2.5 max-w-md">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400 text-xs font-bold font-mono">
                  +91
                </div>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="Enter mobile number"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ""))}
                  className={`w-full rounded-xl py-2.5 pl-12 pr-4 text-xs text-white placeholder-slate-500 outline-none transition-all font-mono shadow-inner ${
                    isOrchid
                      ? "bg-[#180a2b] border border-[#3b1763] focus:border-[#facc15] focus:ring-1 focus:ring-[#facc15]"
                      : "bg-[#0e1428] border border-[#232c48] focus:border-[#facc15] focus:ring-1 focus:ring-[#facc15]"
                  }`}
                />
              </div>
              <button
                type="submit"
                disabled={isSent}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#facc15] hover:bg-[#eab308] active:scale-95 px-5 py-2.5 text-xs font-black text-slate-950 transition-all shadow-md shrink-0 cursor-pointer disabled:opacity-75"
              >
                {isSent ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-slate-950" />
                    Link Sent!
                  </>
                ) : (
                  <>
                    {config.button_text}
                    <Send className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Glassmorphic Container (Store Badges & QR Code) */}
          <div className="w-full lg:w-auto shrink-0">
            <div
              className={`relative rounded-2xl border backdrop-blur-md p-5 sm:p-6 shadow-2xl flex flex-col sm:flex-row items-center gap-5 ${
                isOrchid
                  ? "bg-[#1d0933]/80 border-[#3d1663]"
                  : "bg-[#11162b]/80 border-[#232c4a]"
              }`}
            >
              {/* Store Download Buttons Column */}
              <div className="flex flex-col gap-3 w-full sm:w-60">
                {/* Google Play Store Badge */}
                <a
                  href="#google-play"
                  onClick={(e) => {
                    e.preventDefault();
                    toast.info("Google Play Store link clicked — App coming soon!");
                  }}
                  className={`group flex items-center justify-between gap-3 rounded-xl p-2.5 transition-all shadow-md active:scale-98 border ${
                    isOrchid
                      ? "bg-[#140624] hover:bg-[#1d0933] border-[#311152] hover:border-[#5a1e94]"
                      : "bg-[#0a0e1c] hover:bg-[#0f152a] border-[#1f2845] hover:border-[#35436e]"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <svg className="h-6 w-6 text-white shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734c0-.39.227-.743.609-.920zM15.207 13.414l2.56 2.56-11.892 6.84 9.332-9.4zM15.207 10.586L5.875 1.186l11.892 6.84-2.56 2.560zM16.62 12l2.99-1.725c.52-.3.52-.8 0-1.1L16.62 12z" />
                    </svg>
                    <div className="min-w-0 text-left">
                      <div className="text-[8px] font-bold tracking-wider uppercase text-slate-400">GET IT ON</div>
                      <div className="text-xs font-black text-white group-hover:text-[#facc15] transition-colors leading-tight">Google Play</div>
                    </div>
                  </div>
                  <div className="text-right border-l border-white/10 pl-2.5 shrink-0">
                    <div className="flex items-center justify-end text-[11px] font-extrabold text-[#facc15]">
                      <Star className="h-3 w-3 fill-[#facc15] mr-0.5" />
                      {config.google_play_rating}
                    </div>
                    <div className="text-[9px] text-slate-400 whitespace-nowrap">{config.google_play_downloads}</div>
                  </div>
                </a>

                {/* Apple App Store Badge */}
                <a
                  href="#app-store"
                  onClick={(e) => {
                    e.preventDefault();
                    toast.info("Apple App Store link clicked — App coming soon!");
                  }}
                  className={`group flex items-center justify-between gap-3 rounded-xl p-2.5 transition-all shadow-md active:scale-98 border ${
                    isOrchid
                      ? "bg-[#140624] hover:bg-[#1d0933] border-[#311152] hover:border-[#5a1e94]"
                      : "bg-[#0a0e1c] hover:bg-[#0f152a] border-[#1f2845] hover:border-[#35436e]"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <svg className="h-6 w-6 text-white shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.09c.66-.82 1.1-1.96.98-3.09-1 .04-2.17.67-2.88 1.49-.6.69-1.12 1.83-.98 2.94 1.12.09 2.22-.52 2.88-1.34z" />
                    </svg>
                    <div className="min-w-0 text-left">
                      <div className="text-[8px] font-bold tracking-wider uppercase text-slate-400">DOWNLOAD ON THE</div>
                      <div className="text-xs font-black text-white group-hover:text-[#facc15] transition-colors leading-tight">App Store</div>
                    </div>
                  </div>
                  <div className="text-right border-l border-white/10 pl-2.5 shrink-0">
                    <div className="flex items-center justify-end text-[11px] font-extrabold text-[#facc15]">
                      <Star className="h-3 w-3 fill-[#facc15] mr-0.5" />
                      {config.app_store_rating}
                    </div>
                    <div className="text-[9px] text-slate-400 whitespace-nowrap">{config.app_store_downloads}</div>
                  </div>
                </a>
              </div>

              {/* QR Code Container with Scanner Styling */}
              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                className="group flex flex-col items-center justify-center p-2.5 rounded-xl bg-white text-slate-950 shadow-xl border border-white/20 shrink-0 cursor-pointer hover:scale-105 transition-transform"
                title="Click to expand QR Code"
              >
                <div className="relative p-1 rounded-lg bg-slate-50 border border-slate-200">
                  <svg className="w-24 h-24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Background */}
                    <rect width="100" height="100" fill="white" rx="6" />

                    {/* Top Left Position Marker */}
                    <rect x="8" y="8" width="28" height="28" fill="black" rx="4" />
                    <rect x="14" y="14" width="16" height="16" fill="white" rx="2" />
                    <rect x="18" y="18" width="8" height="8" fill="black" rx="1" />

                    {/* Top Right Position Marker */}
                    <rect x="64" y="8" width="28" height="28" fill="black" rx="4" />
                    <rect x="70" y="14" width="16" height="16" fill="white" rx="2" />
                    <rect x="74" y="18" width="8" height="8" fill="black" rx="1" />

                    {/* Bottom Left Position Marker */}
                    <rect x="8" y="64" width="28" height="28" fill="black" rx="4" />
                    <rect x="14" y="70" width="16" height="16" fill="white" rx="2" />
                    <rect x="18" y="74" width="8" height="8" fill="black" rx="1" />

                    {/* QR Code Pattern Data Blocks */}
                    <rect x="42" y="12" width="6" height="6" fill="black" rx="1" />
                    <rect x="52" y="12" width="6" height="6" fill="black" rx="1" />
                    <rect x="42" y="24" width="6" height="6" fill="black" rx="1" />
                    <rect x="48" y="30" width="6" height="6" fill="black" rx="1" />
                    <rect x="12" y="42" width="6" height="6" fill="black" rx="1" />
                    <rect x="24" y="42" width="6" height="6" fill="black" rx="1" />
                    <rect x="36" y="42" width="12" height="6" fill="black" rx="1" />
                    <rect x="54" y="42" width="6" height="6" fill="black" rx="1" />
                    <rect x="66" y="42" width="12" height="6" fill="black" rx="1" />
                    <rect x="84" y="42" width="6" height="6" fill="black" rx="1" />
                    <rect x="42" y="52" width="6" height="6" fill="black" rx="1" />
                    <rect x="52" y="58" width="6" height="6" fill="black" rx="1" />
                    <rect x="42" y="66" width="6" height="6" fill="black" rx="1" />
                    <rect x="66" y="66" width="6" height="6" fill="black" rx="1" />
                    <rect x="78" y="66" width="10" height="6" fill="black" rx="1" />
                    <rect x="54" y="76" width="6" height="6" fill="black" rx="1" />
                    <rect x="66" y="76" width="12" height="6" fill="black" rx="1" />
                    <rect x="84" y="76" width="6" height="6" fill="black" rx="1" />
                    <rect x="42" y="84" width="12" height="6" fill="black" rx="1" />
                    <rect x="60" y="84" width="6" height="6" fill="black" rx="1" />
                    <rect x="72" y="84" width="12" height="6" fill="black" rx="1" />

                    {/* Center Accent Dot */}
                    <circle cx="50" cy="50" r="7" fill={isOrchid ? "#981495" : "#b91c1c"} />
                  </svg>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[9px] font-black text-slate-800 uppercase tracking-wider group-hover:text-primary transition-colors">
                  <QrCode className="h-3 w-3 text-slate-600" />
                  {config.qr_label}
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Enlarged QR Code Modal */}
      {showQrModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setShowQrModal(false)}
        >
          <div
            className="relative bg-white p-6 rounded-3xl max-w-sm w-full text-center space-y-4 shadow-2xl border-4 border-[#981495]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-slate-900 text-lg">Scan to Download App</h3>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-slate-400 hover:text-slate-700 font-black text-xl px-2"
              >
                ×
              </button>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex justify-center">
              <svg className="w-56 h-56" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="100" height="100" fill="white" rx="6" />
                <rect x="8" y="8" width="28" height="28" fill="black" rx="4" />
                <rect x="14" y="14" width="16" height="16" fill="white" rx="2" />
                <rect x="18" y="18" width="8" height="8" fill="black" rx="1" />
                <rect x="64" y="8" width="28" height="28" fill="black" rx="4" />
                <rect x="70" y="14" width="16" height="16" fill="white" rx="2" />
                <rect x="74" y="18" width="8" height="8" fill="black" rx="1" />
                <rect x="8" y="64" width="28" height="28" fill="black" rx="4" />
                <rect x="14" y="70" width="16" height="16" fill="white" rx="2" />
                <rect x="18" y="74" width="8" height="8" fill="black" rx="1" />
                <rect x="42" y="12" width="6" height="6" fill="black" rx="1" />
                <rect x="52" y="12" width="6" height="6" fill="black" rx="1" />
                <rect x="42" y="24" width="6" height="6" fill="black" rx="1" />
                <rect x="48" y="30" width="6" height="6" fill="black" rx="1" />
                <rect x="12" y="42" width="6" height="6" fill="black" rx="1" />
                <rect x="24" y="42" width="6" height="6" fill="black" rx="1" />
                <rect x="36" y="42" width="12" height="6" fill="black" rx="1" />
                <rect x="54" y="42" width="6" height="6" fill="black" rx="1" />
                <rect x="66" y="42" width="12" height="6" fill="black" rx="1" />
                <rect x="84" y="42" width="6" height="6" fill="black" rx="1" />
                <rect x="42" y="52" width="6" height="6" fill="black" rx="1" />
                <rect x="52" y="58" width="6" height="6" fill="black" rx="1" />
                <rect x="42" y="66" width="6" height="6" fill="black" rx="1" />
                <rect x="66" y="66" width="6" height="6" fill="black" rx="1" />
                <rect x="78" y="66" width="10" height="6" fill="black" rx="1" />
                <rect x="54" y="76" width="6" height="6" fill="black" rx="1" />
                <rect x="66" y="76" width="12" height="6" fill="black" rx="1" />
                <rect x="84" y="76" width="6" height="6" fill="black" rx="1" />
                <rect x="42" y="84" width="12" height="6" fill="black" rx="1" />
                <rect x="60" y="84" width="6" height="6" fill="black" rx="1" />
                <rect x="72" y="84" width="12" height="6" fill="black" rx="1" />
                <circle cx="50" cy="50" r="7" fill="#981495" />
              </svg>
            </div>
            <p className="text-xs text-slate-600 font-medium">
              Open your phone camera to scan and download the official LocalShore App instantly.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

