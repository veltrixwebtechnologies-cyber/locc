import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn("relative flex w-full touch-none select-none items-center", className)}
    {...props}
  >
    <SliderPrimitive.Track data-slot="slider-track" className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-slate-300">
      <SliderPrimitive.Range data-slot="slider-range" className="absolute h-full bg-[#286aa6]" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb data-slot="slider-thumb" className="block h-7 w-7 rounded-full border-4 border-white bg-[#286aa6] shadow-[0_3px_9px_rgba(15,23,42,0.25)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#286aa6]/40 disabled:pointer-events-none disabled:opacity-50" />
    <SliderPrimitive.Thumb data-slot="slider-thumb" className="block h-7 w-7 rounded-full border-4 border-white bg-[#286aa6] shadow-[0_3px_9px_rgba(15,23,42,0.25)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#286aa6]/40 disabled:pointer-events-none disabled:opacity-50" />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
