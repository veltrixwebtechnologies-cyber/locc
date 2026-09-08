import React, { useState } from "react";
import { QrCode, Star, Smartphone, ArrowRight, CheckCircle2, Sparkles, Send } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export const AppDownloadBanner: React.FC = () => {
  const [mobileNumber, setMobileNumber] = useState("");
  const [isSent, setIsSent] = useState(false);

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

  return (
    <div className="mx-5 my-8 md:mx-8">
      <div className="relative overflow-hidden rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl">
        {/* Background Image with Dark Coastal Gradient */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity scale-105"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-900/80" />

        {/* Decorative ambient glows */}
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8 p-6 sm:p-8 lg:p-10">
          
          {/* Left Content Column */}
          <div className="flex-1 space-y-4 text-left">
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 px-3 py-1 text-xs font-bold text-amber-300 border border-amber-400/30 backdrop-blur-xs">
                <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                Special App Offer
              </span>
              <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-950/40">
                Exclusive Deals
              </Badge>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Grab <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-200 bg-clip-text text-transparent">10% OFF</span> now
            </h2>

            <p className="text-sm sm:text-base text-slate-300 max-w-lg leading-relaxed font-medium">
              Download the <strong className="text-white font-semibold">LocalShore App</strong> to unlock instant local shop discounts, 15-minute express delivery, and live order GPS tracking!
            </p>

            {/* Mobile Number SMS Link Form */}
            <form onSubmit={handleSendLink} className="pt-2 flex flex-col sm:flex-row gap-2.5 max-w-md">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400 text-sm font-semibold">
                  +91
                </div>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="Enter mobile number"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ""))}
                  className="w-full rounded-xl bg-slate-900/90 border border-slate-700/80 py-2.5 pl-12 pr-4 text-sm text-white placeholder-slate-500 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={isSent}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-95 px-5 py-2.5 text-xs font-black text-slate-950 transition-all shadow-lg shrink-0 cursor-pointer disabled:opacity-75"
              >
                {isSent ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-slate-950" />
                    Link Sent!
                  </>
                ) : (
                  <>
                    Get App Link
                    <Send className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Glassmorphic Container (Store Badges & QR Code) */}
          <div className="w-full lg:w-auto shrink-0">
            <div className="relative rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md p-5 sm:p-6 shadow-2xl flex flex-col sm:flex-row items-center gap-6">
              
              {/* Store Download Buttons Column */}
              <div className="flex flex-col gap-3 w-full sm:w-60">
                
                {/* Google Play Store Badge */}
                <a
                  href="#google-play"
                  onClick={(e) => {
                    e.preventDefault();
                    toast.info("Google Play Store link clicked — App coming soon!");
                  }}
                  className="group flex items-center gap-3 rounded-xl bg-slate-900/90 hover:bg-slate-900 border border-slate-700/80 hover:border-slate-500 p-2.5 transition-all shadow-md active:scale-98"
                >
                  <svg className="h-7 w-7 text-white shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734c0-.39.227-.743.609-.920zM15.207 13.414l2.56 2.56-11.892 6.84 9.332-9.4zM15.207 10.586L5.875 1.186l11.892 6.84-2.56 2.560zM16.62 12l2.99-1.725c.52-.3.52-.8 0-1.1L16.62 12z"/>
                  </svg>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-[9px] font-semibold tracking-wider uppercase text-slate-400">GET IT ON</div>
                    <div className="text-xs font-extrabold text-white group-hover:text-amber-300 transition-colors">Google Play</div>
                  </div>
                  <div className="text-right border-l border-slate-800 pl-2">
                    <div className="flex items-center justify-end text-[11px] font-bold text-amber-400">
                      <Star className="h-3 w-3 fill-amber-400 mr-0.5" />
                      4.8
                    </div>
                    <div className="text-[9px] text-slate-400 whitespace-nowrap">50 Lakh+</div>
                  </div>
                </a>

                {/* Apple App Store Badge */}
                <a
                  href="#app-store"
                  onClick={(e) => {
                    e.preventDefault();
                    toast.info("Apple App Store link clicked — App coming soon!");
                  }}
                  className="group flex items-center gap-3 rounded-xl bg-slate-900/90 hover:bg-slate-900 border border-slate-700/80 hover:border-slate-500 p-2.5 transition-all shadow-md active:scale-98"
                >
                  <svg className="h-7 w-7 text-white shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.09c.66-.82 1.1-1.96.98-3.09-1 .04-2.17.67-2.88 1.49-.6.69-1.12 1.83-.98 2.94 1.12.09 2.22-.52 2.88-1.34z"/>
                  </svg>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-[9px] font-semibold tracking-wider uppercase text-slate-400">Download on the</div>
                    <div className="text-xs font-extrabold text-white group-hover:text-amber-300 transition-colors">App Store</div>
                  </div>
                  <div className="text-right border-l border-slate-800 pl-2">
                    <div className="flex items-center justify-end text-[11px] font-bold text-amber-400">
                      <Star className="h-3 w-3 fill-amber-400 mr-0.5" />
                      4.9
                    </div>
                    <div className="text-[9px] text-slate-400 whitespace-nowrap">10 Lakh+</div>
                  </div>
                </a>

              </div>

              {/* QR Code Container with Scanner Styling */}
              <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white text-slate-950 shadow-xl border border-white/20 shrink-0 group">
                <div className="relative p-1.5 rounded-lg bg-slate-100 border border-slate-200">
                  <svg className="w-24 h-24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Background */}
                    <rect width="100" height="100" fill="white" rx="6"/>
                    
                    {/* Top Left Position Marker */}
                    <rect x="8" y="8" width="28" height="28" fill="black" rx="4"/>
                    <rect x="14" y="14" width="16" height="16" fill="white" rx="2"/>
                    <rect x="18" y="18" width="8" height="8" fill="black" rx="1"/>

                    {/* Top Right Position Marker */}
                    <rect x="64" y="8" width="28" height="28" fill="black" rx="4"/>
                    <rect x="70" y="14" width="16" height="16" fill="white" rx="2"/>
                    <rect x="74" y="18" width="8" height="8" fill="black" rx="1"/>

                    {/* Bottom Left Position Marker */}
                    <rect x="8" y="64" width="28" height="28" fill="black" rx="4"/>
                    <rect x="14" y="70" width="16" height="16" fill="white" rx="2"/>
                    <rect x="18" y="74" width="8" height="8" fill="black" rx="1"/>

                    {/* QR Code Pattern Data Blocks */}
                    <rect x="42" y="12" width="6" height="6" fill="black" rx="1"/>
                    <rect x="52" y="12" width="6" height="6" fill="black" rx="1"/>
                    <rect x="42" y="24" width="6" height="6" fill="black" rx="1"/>
                    <rect x="48" y="30" width="6" height="6" fill="black" rx="1"/>
                    <rect x="12" y="42" width="6" height="6" fill="black" rx="1"/>
                    <rect x="24" y="42" width="6" height="6" fill="black" rx="1"/>
                    <rect x="36" y="42" width="12" height="6" fill="black" rx="1"/>
                    <rect x="54" y="42" width="6" height="6" fill="black" rx="1"/>
                    <rect x="66" y="42" width="12" height="6" fill="black" rx="1"/>
                    <rect x="84" y="42" width="6" height="6" fill="black" rx="1"/>
                    <rect x="42" y="52" width="6" height="6" fill="black" rx="1"/>
                    <rect x="52" y="58" width="6" height="6" fill="black" rx="1"/>
                    <rect x="42" y="66" width="6" height="6" fill="black" rx="1"/>
                    <rect x="66" y="66" width="6" height="6" fill="black" rx="1"/>
                    <rect x="78" y="66" width="10" height="6" fill="black" rx="1"/>
                    <rect x="54" y="76" width="6" height="6" fill="black" rx="1"/>
                    <rect x="66" y="76" width="12" height="6" fill="black" rx="1"/>
                    <rect x="84" y="76" width="6" height="6" fill="black" rx="1"/>
                    <rect x="42" y="84" width="12" height="6" fill="black" rx="1"/>
                    <rect x="60" y="84" width="6" height="6" fill="black" rx="1"/>
                    <rect x="72" y="84" width="12" height="6" fill="black" rx="1"/>

                    {/* Center LocalShore Branding Dot */}
                    <circle cx="50" cy="50" r="7" fill="#981495" />
                  </svg>
                </div>
                <div className="mt-1.5 flex items-center gap-1 text-[10px] font-extrabold text-slate-800 uppercase tracking-wider">
                  <QrCode className="h-3 w-3 text-slate-600" />
                  Scan to download
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
