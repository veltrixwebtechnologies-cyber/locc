import React from "react";
import { SlidersHorizontal, X, RotateCcw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DynamicFilterPanel } from "./dynamic-filter-panel";
import {
  type FilterDefinition,
  type ProductFilterState,
  type FacetResult,
} from "@/lib/filter-types";

interface FilterBottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filterDefinitions: FilterDefinition[];
  filterState: ProductFilterState;
  facets: FacetResult;
  totalProducts: number;
  onUpdateState: (patch: Partial<ProductFilterState>) => void;
  onClearAll: () => void;
}

export function FilterBottomSheet({
  open,
  onOpenChange,
  filterDefinitions,
  filterState,
  facets,
  totalProducts,
  onUpdateState,
  onClearAll,
}: FilterBottomSheetProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full max-h-[85vh] p-0 flex flex-col rounded-t-3xl sm:rounded-2xl overflow-hidden gap-0">
        {/* Header */}
        <DialogHeader className="p-4 border-b flex flex-row items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-primary" />
            <DialogTitle className="text-base font-bold text-foreground">Filters</DialogTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="text-xs font-semibold text-destructive hover:bg-destructive/10 h-7 px-2"
            >
              <RotateCcw className="h-3 w-3 mr-1" /> Clear All
            </Button>
            <DialogClose className="rounded-full p-1 hover:bg-muted text-muted-foreground transition-colors">
              <X className="h-5 w-5" />
            </DialogClose>
          </div>
        </DialogHeader>

        {/* Scrollable Filter Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <DynamicFilterPanel
            filterDefinitions={filterDefinitions}
            filterState={filterState}
            facets={facets}
            onUpdateState={onUpdateState}
            onClearAll={onClearAll}
            className="border-0 p-0 shadow-none"
          />
        </div>

        {/* Sticky Bottom CTA */}
        <div className="p-4 border-t bg-background shrink-0 flex items-center justify-between gap-3 shadow-lg">
          <Button
            type="button"
            variant="outline"
            onClick={onClearAll}
            className="flex-1 rounded-xl text-xs font-bold"
          >
            Clear All
          </Button>

          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex-[2] rounded-xl text-xs font-bold bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
          >
            Show {totalProducts} Product{totalProducts === 1 ? "" : "s"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
