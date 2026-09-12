import lottie, { type AnimationItem } from "lottie-web";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import loadingJson from "@/assets/loading.json";

export interface SmartLottieLoaderProps {
  /** Whether the loader should be active */
  show?: boolean;
  /** Delay in ms before rendering the loader (prevents flicker on fast requests). Default: 250ms */
  delayMs?: number;
  /** Primary text message to display below animation */
  message?: string;
  /** Secondary subtitle text */
  subtext?: string;
  /** Sizing of the animation container */
  size?: "sm" | "md" | "lg" | "xl";
  /** Rendering mode: 'inline' (inside content box), 'overlay' (over card/section), 'fullscreen' (initial app load) */
  mode?: "inline" | "overlay" | "fullscreen";
  /** Optional custom CSS classes */
  className?: string;
}

export function SmartLottieLoader({
  show = true,
  delayMs = 250,
  message,
  subtext,
  size = "md",
  mode = "inline",
  className = "",
}: SmartLottieLoaderProps) {
  const [shouldRender, setShouldRender] = useState(delayMs === 0 ? show : false);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<AnimationItem | null>(null);

  // Anti-flicker delay guard: only mount loader if show remains true after delayMs
  useEffect(() => {
    if (!show) {
      setShouldRender(false);
      return;
    }

    if (delayMs === 0) {
      setShouldRender(true);
      return;
    }

    const timer = setTimeout(() => {
      setShouldRender(true);
    }, delayMs);

    return () => {
      clearTimeout(timer);
    };
  }, [show, delayMs]);

  // Render Lottie-web SVG animation when mounted
  useEffect(() => {
    if (!shouldRender || !containerRef.current) return;

    try {
      animRef.current = lottie.loadAnimation({
        container: containerRef.current,
        renderer: "svg",
        loop: true,
        autoplay: true,
        animationData: loadingJson as Record<string, unknown>,
        rendererSettings: {
          preserveAspectRatio: "xMidYMid meet",
          progressiveLoad: true,
          hideOnTransparent: true,
        },
      });
    } catch (err) {
      console.warn("Lottie loading animation render error:", err);
    }

    return () => {
      if (animRef.current) {
        animRef.current.destroy();
        animRef.current = null;
      }
    };
  }, [shouldRender]);

  const dimensionClasses = {
    sm: "w-16 h-16 sm:w-20 sm:h-20",
    md: "w-24 h-24 sm:w-32 sm:h-32",
    lg: "w-36 h-36 sm:w-44 sm:h-44",
    xl: "w-48 h-48 sm:w-56 sm:h-56",
  }[size];

  if (!show && !shouldRender) return null;

  return (
    <AnimatePresence mode="wait">
      {shouldRender && (
        <m.div
          key="lottie-loader-container"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className={`flex flex-col items-center justify-center ${
            mode === "fullscreen"
              ? "fixed inset-0 z-[999] bg-white/95 backdrop-blur-md p-6"
              : mode === "overlay"
                ? "absolute inset-0 z-40 bg-white/90 backdrop-blur-xs rounded-3xl p-6"
                : "relative p-4 w-full"
          } ${className}`}
          aria-busy="true"
          aria-live="polite"
        >
          <div className="relative flex items-center justify-center">
            {/* Subtle brand glow behind animation */}
            <div className="absolute inset-0 rounded-full bg-[#981495]/10 blur-xl animate-pulse pointer-events-none" />

            {/* 500x500 Lottie Container (Preserves original aspect ratio) */}
            <div
              ref={containerRef}
              className={`${dimensionClasses} aspect-square max-w-full relative z-10`}
            />
          </div>

          {message && (
            <p className="mt-3 font-display text-sm sm:text-base font-bold text-slate-900 tracking-tight text-center">
              {message}
            </p>
          )}

          {subtext && (
            <p className="mt-1 text-xs text-slate-500 font-medium text-center max-w-xs sm:max-w-sm">
              {subtext}
            </p>
          )}
        </m.div>
      )}
    </AnimatePresence>
  );
}

/** Fullscreen Application Initial Loader */
export function FullScreenLottieLoader({
  message = "Loading LocalShore...",
  subtext = "Connecting to real neighborhood stores",
}: {
  message?: string;
  subtext?: string;
}) {
  return (
    <SmartLottieLoader
      show
      delayMs={0}
      mode="fullscreen"
      size="xl"
      message={message}
      subtext={subtext}
    />
  );
}
