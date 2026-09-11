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
      if (range[0] !== currentMin || range[1] !== currentMax) {
        onChange(range[0], range[1]);
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [range, currentMin, currentMax, onChange]);

  return (
    <div className="space-y-4 py-2">
      <div className="flex items-center justify-between text-xs font-semibold text-foreground">
        <span>₹{range[0].toLocaleString("en-IN")}</span>
        <span>₹{range[1].toLocaleString("en-IN")}</span>
      </div>

      <Slider
        min={safeMin}
        max={safeMax}
        step={50}
        value={range}
        onValueChange={(val) => setRange([val[0], val[1]])}
        className="w-full"
      />

      <div className="grid grid-cols-2 gap-2 pt-1">
        <div>
          <Label className="text-[10px] text-muted-foreground uppercase font-bold">Min (₹)</Label>
          <Input
            type="number"
            min={safeMin}
            max={range[1]}
            value={range[0]}
            onChange={(e) => {
              const val = Number(e.target.value);
              setRange([val, range[1]]);
            }}
            className="h-8 text-xs font-medium"
          />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground uppercase font-bold">Max (₹)</Label>
          <Input
            type="number"
            min={range[0]}
            max={safeMax}
            value={range[1]}
            onChange={(e) => {
              const val = Number(e.target.value);
              setRange([range[0], val]);
            }}
            className="h-8 text-xs font-medium"
          />
        </div>
      </div>
    </div>
  );
}
