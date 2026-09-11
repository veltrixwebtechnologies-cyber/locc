import React from "react";
import { ArrowUpDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEFAULT_SORT_OPTIONS } from "@/lib/filter-types";

interface SortDropdownProps {
  value: string;
  onChange: (sort: string) => void;
}

export function SortDropdown({ value, onChange }: SortDropdownProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold text-muted-foreground hidden sm:inline">Sort By:</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[170px] h-9 text-xs font-medium rounded-xl border-border bg-card">
          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground mr-1 shrink-0" />
          <SelectValue placeholder="Sort By" />
        </SelectTrigger>
        <SelectContent align="end">
          {DEFAULT_SORT_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} className="text-xs">
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
