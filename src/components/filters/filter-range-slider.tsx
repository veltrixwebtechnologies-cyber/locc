import React, { useState, useEffect, useCallback } from "react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FilterRangeSliderProps {
  min: number;
  max: number;
  currentMin?: number;
  currentMax?: number;
  onChange: (minPrice: number, maxPrice: number) => void;
}

export function FilterRangeSlider({
  min,
  max,
  currentMin,
  currentMax,
  onChange,
}: FilterRangeSliderProps) {
  const safeMin = Math.max(0, min || 0);
  const safeMax = Math.max(safeMin + 100, max || 10000);

  const [range, setRange] = useState<[number, number]>([
    currentMin ?? safeMin,
    currentMax ?? safeMax,
  ]);

  useEffect(() => {
    setRange([currentMin ?? safeMin, currentMax ?? safeMax]);
  }, [currentMin, currentMax, safeMin, safeMax]);

  // Debounced callback
  useEffect(() => {
    const handler = setTimeout(() => {
      // Do not emit the component's default bounds as an active filter on mount.
      // Only emit after the user changes the range.
      const normalizedMin = currentMin ?? safeMin;
      const normalizedMax = currentMax ?? safeMax;
      if (range[0] !== normalizedMin || range[1] !== normalizedMax) {
        onChange(range[0], range[1]);
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [range, currentMin, currentMax, onChange]);

  return (
    <div className="space-y-4 py-2">
      <div className="text-sm font-extrabold tracking-tight text-foreground">
        ₹{range[0].toLocaleString("en-IN")} – ₹{range[1].toLocaleString("en-IN")}
      </div>

      <Slider
        min={safeMin}
        max={safeMax}
        step={50}
        value={range}
        onValueChange={(val) => setRange([val[0], val[1]])}
        className="w-full py-2 [&_[data-slot=slider-track]]:h-1.5 [&_[data-slot=slider-range]]:bg-[#286aa6] [&_[data-slot=slider-thumb]]:h-7 [&_[data-slot=slider-thumb]]:w-7 [&_[data-slot=slider-thumb]]:border-4 [&_[data-slot=slider-thumb]]:border-white [&_[data-slot=slider-thumb]]:bg-[#286aa6] [&_[data-slot=slider-thumb]]:shadow-[0_3px_9px_rgba(15,23,42,0.25)]"
      />

      <div className="grid grid-cols-2 gap-2 pt-1">
        <div>
          <Label className="text-[10px] font-bold uppercase text-muted-foreground">Min (₹)</Label>
          <Input
            type="number"
            min={safeMin}
            max={range[1]}
            value={range[0]}
            onChange={(e) => {
              const val = Number(e.target.value);
              if (!Number.isFinite(val)) return;
              setRange([Math.max(safeMin, Math.min(val, range[1])), range[1]]);
            }}
            className="h-9 rounded-xl bg-background text-xs font-semibold shadow-sm"
          />
        </div>
        <div>
          <Label className="text-[10px] font-bold uppercase text-muted-foreground">Max (₹)</Label>
          <Input
            type="number"
            min={range[0]}
            max={safeMax}
            value={range[1]}
            onChange={(e) => {
              const val = Number(e.target.value);
              if (!Number.isFinite(val)) return;
              setRange([range[0], Math.min(safeMax, Math.max(val, range[0]))]);
            }}
            className="h-9 rounded-xl bg-background text-xs font-semibold shadow-sm"
          />
        </div>
      </div>
    </div>
  );
}
