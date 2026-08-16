import * as LottieReact from "lottie-react";
import { useEffect, useState, type ComponentType } from "react";

// Some Vite/CJS combinations expose the package through its namespace object.
// Resolve the actual React component explicitly so React never receives the module object.
const lottieExports = LottieReact as unknown as { default?: unknown; Lottie?: unknown };
const Lottie = (
  (lottieExports.default as { default?: unknown } | undefined)?.default ??
  lottieExports.default ??
  lottieExports.Lottie
) as ComponentType<{
  animationData: Record<string, unknown>;
  loop: boolean;
  autoplay: boolean;
  className?: string;
  "aria-hidden"?: boolean;
}>;
const LottieComponent = typeof Lottie === "function" ? Lottie : null;

/** Reusable delivery animation loaded from the supplied Lottie artwork. */
export function DeliveryAnimation({ className = "" }: { className?: string }) {
  const [animationData, setAnimationData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    let active = true;
    void fetch("/animations/delivery-man.json")
      .then((response) => response.json())
      .then((data: Record<string, unknown>) => {
        if (active) setAnimationData(data);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  return animationData && LottieComponent ? <LottieComponent animationData={animationData} loop autoplay className={className} aria-hidden="true" /> : null;
}
