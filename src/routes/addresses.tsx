import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { addressesStore, useAddresses, type Address } from "@/modules/shopper/services/addresses-store";
import { useAuth } from "@/lib/auth-store";
import {
  ChevronLeft,
  MapPin,
  Trash2,
  Plus,
  LocateFixed,
  Map as MapIcon,
  Search,
  Check,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Navigation,
  X,
} from "lucide-react";
import {
  detectCurrentGPSLocation,
  commitDetectedLocation,
  useDeliveryLocation,
  type DeliveryLocation,
} from "@/lib/location-store";
import { isValidCoordinate } from "@/lib/geo";
import { MAX_CUSTOMER_DELIVERY_ACCURACY_M } from "@/lib/coordinates";
import { geocodeSearch } from "@/lib/map-service/providers";
import { LocationMapPicker } from "@/components/ui/location-map-picker";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";

export const Route = createFileRoute("/addresses")({ component: AddressesPage });

function AddressesPage() {
  const auth = useAuth();
  const items = useAddresses();
  const [activeDeliveryLocation] = useDeliveryLocation();

  // Form State
  const [label, setLabel] = useState("");
  const [line, setLine] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [coordsStatusText, setCoordsStatusText] = useState<string>("");

  // Map Picker Modal State
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [mapPickerTargetId, setMapPickerTargetId] = useState<string | null>(null);

  // GPS State
  const [isLocating, setIsLocating] = useState(false);

  // Geocoding Autocomplete State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const signedIn = Boolean(auth.id || auth.phone || auth.email);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  if (!signedIn) {
    return (
      <AppShell>
        <div className="mx-5 mt-12 rounded-2xl border hairline bg-card p-6 text-center shadow-xs">
          <p className="font-display text-xl font-bold text-foreground">Sign in required</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Please sign in to view and manage your saved delivery addresses.
          </p>
          <Link
            to="/auth"
            search={{ redirect: "/addresses" }}
            className="mt-5 inline-block rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground shadow-md transition hover:bg-primary/90"
          >
            Sign in to your account
          </Link>
        </div>
      </AppShell>
    );
  }

  const handleUseCurrentGPS = async () => {
    setIsLocating(true);
    try {
      // Must require low accuracy (precise GPS fix <= MAX_CUSTOMER_DELIVERY_ACCURACY_M)
      const detected = await detectCurrentGPSLocation({
        silent: false,
        commit: false,
        allowApproximate: false,
      });

      if (!isValidCoordinate(detected.lat, detected.lng)) {
        toast.error("Could not obtain a valid coordinate. Please pick your location on the map.");
        return;
      }

      const accuracy = detected.accuracy ?? 0;
      if (accuracy > MAX_CUSTOMER_DELIVERY_ACCURACY_M) {
        toast.error(`GPS accuracy is ±${Math.round(accuracy)}m. Please choose your exact entrance on the map.`);
        setCoordsStatusText(`GPS approximate (±${Math.round(accuracy)}m). Adjust pin on map.`);
        handleOpenMapPicker();
        return;
      }

      setCoords({ lat: detected.lat, lng: detected.lng });
      const resolvedAddress = detected.label || `${detected.area}, ${detected.city}`;
      if (!line.trim()) {
        setLine(resolvedAddress);
      }
      if (!label.trim() && detected.area) {
        setLabel(detected.area);
      }
      setCoordsStatusText(`GPS fix confirmed (±${Math.round(accuracy)}m)`);
      toast.success("Location detected via device GPS", {
        description: resolvedAddress,
      });
    } catch (err) {
      toast.error("GPS detection failed. Please choose on the map or type your address.");
    } finally {
      setIsLocating(false);
    }
  };

  const handleOpenMapPicker = (targetAddressId?: string) => {
    setMapPickerTargetId(targetAddressId ?? null);
    setIsMapPickerOpen(true);
  };

  const handleMapLocationConfirmed = (loc: DeliveryLocation) => {
    if (!isValidCoordinate(loc.lat, loc.lng)) {
      toast.error("Selected map location is invalid. Please reposition the pin.");
      return;
    }

    if (mapPickerTargetId) {
      // Updating existing address with verified coordinates
      addressesStore.update(mapPickerTargetId, {
        lat: loc.lat,
        lng: loc.lng,
        line: loc.label || loc.area || "Confirmed map location",
      });
      toast.success("Address location pin updated!");
      setMapPickerTargetId(null);
    } else {
      // Populating the new address form
      setCoords({ lat: loc.lat, lng: loc.lng });
      setLine(loc.label || `${loc.area}, ${loc.city}`);
      if (!label.trim() && loc.area) {
        setLabel(loc.area);
      }
      setCoordsStatusText(`Pin confirmed at ${loc.area || "selected spot"}`);
      toast.success("Location confirmed from map");
    }
    setIsMapPickerOpen(false);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (!val.trim() || val.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      return;
    }

    setIsSearching(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await geocodeSearch(val);
        setSearchResults(res || []);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);
  };

  const handleSelectSearchResult = (r: any) => {
    const rawName = r.label || r.placeName || r.address || "";
    const lat = Number(r.lat);
    const lng = Number(r.lng);

    if (isValidCoordinate(lat, lng)) {
      setCoords({ lat, lng });
      setLine(rawName);
      const parts = rawName.split(",");
      if (!label.trim() && parts[0]) {
        setLabel(parts[0].trim());
      }
      setCoordsStatusText(`Area selected: ${parts[0] || "Found location"}`);
      setSearchResults([]);
      setSearchQuery("");
      toast.success("Address found and coordinates set");
    } else {
      toast.error("Selected search result has invalid coordinates. Please use the map pin.");
    }
  };

  const handleSaveAddress = () => {
    if (!label.trim()) {
      toast.error("Please provide an address label (e.g., Home, Office)");
      return;
    }
    if (!line.trim()) {
      toast.error("Please provide the full street address");
      return;
    }
    if (!coords || !isValidCoordinate(coords.lat, coords.lng)) {
      toast.error("Delivery requires a confirmed map pin so riders can reach you. Set location using GPS or Map Pin.");
      return;
    }

    addressesStore.add({
      label: label.trim(),
      line: line.trim(),
      lat: coords.lat,
      lng: coords.lng,
    });

    toast.success("Address saved with confirmed delivery pin!");
    setLabel("");
    setLine("");
    setCoords(null);
    setCoordsStatusText("");
  };

  const handleSetActiveDelivery = (a: Address) => {
    if (typeof a.lat !== "number" || typeof a.lng !== "number" || !isValidCoordinate(a.lat, a.lng)) {
      toast.error("Cannot set as delivery destination: coordinates missing. Please pin on map first.");
      return;
    }

    commitDetectedLocation({
      id: a.id,
      label: a.line,
      area: a.label,
      city: "",
      lat: a.lat,
      lng: a.lng,
    });
    toast.success(`Active delivery location set to: ${a.label}`);
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 pt-6 pb-20 sm:px-6">
        <Link
          to="/profile"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Profile
        </Link>
        <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-primary font-bold">
          Delivery Preferences
        </p>
        <h1 className="mt-1 font-display text-2xl sm:text-3xl font-extrabold text-foreground">
          Saved Addresses
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Manage your delivery drop-offs. Confirmed map coordinates ensure accurate nearby shops and delivery estimates.
        </p>

        {/* Existing Addresses List */}
        <div className="mt-6 space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Your Saved Locations ({items.length})
          </h2>

          {items.length === 0 ? (
            <div className="rounded-2xl border hairline bg-card p-6 text-center text-sm text-muted-foreground shadow-2xs">
              <MapPin className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40 stroke-1" />
              <p className="font-semibold text-foreground">No saved addresses yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Add your home or work address below to speed up checkout.
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {items.map((a) => {
                const hasValidCoords =
                  typeof a.lat === "number" && typeof a.lng === "number" && isValidCoordinate(a.lat, a.lng);
                const isActive =
                  activeDeliveryLocation &&
                  typeof activeDeliveryLocation.lat === "number" &&
                  typeof activeDeliveryLocation.lng === "number" &&
                  hasValidCoords &&
                  Math.abs(activeDeliveryLocation.lat - a.lat!) < 0.0001 &&
                  Math.abs(activeDeliveryLocation.lng - a.lng!) < 0.0001;

                return (
                  <div
                    key={a.id}
                    className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border p-4 transition-all shadow-xs ${
                      isActive
                        ? "border-primary/60 bg-primary/[0.03] ring-1 ring-primary/20"
                        : "border-border/80 bg-card hover:border-border"
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                          hasValidCoords ? "bg-primary/10 text-primary" : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-foreground">{a.label}</p>
                          {isActive && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400">
                              <CheckCircle2 className="h-3 w-3" /> Active Delivery
                            </span>
                          )}
                          {!hasValidCoords && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-extrabold text-amber-800 dark:text-amber-300">
                              <AlertCircle className="h-3 w-3" /> Pin Missing
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{a.line}</p>
                        <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                          {hasValidCoords ? (
                            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                              📍 {a.lat!.toFixed(4)}, {a.lng!.toFixed(4)} (Verified drop-off pin)
                            </span>
                          ) : (
                            <span className="text-amber-700 dark:text-amber-400">
                              Drop-off coordinates not set. Click &ldquo;Set Pin&rdquo; to enable delivery.
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {!hasValidCoords ? (
                        <button
                          type="button"
                          onClick={() => handleOpenMapPicker(a.id)}
                          className="rounded-xl bg-amber-500/15 text-amber-900 dark:text-amber-200 border border-amber-300/60 px-3 py-1.5 text-xs font-bold hover:bg-amber-500/25 transition cursor-pointer"
                        >
                          Set Pin on Map
                        </button>
                      ) : (
                        !isActive && (
                          <button
                            type="button"
                            onClick={() => handleSetActiveDelivery(a)}
                            className="rounded-xl bg-muted px-3 py-1.5 text-xs font-bold text-foreground hover:bg-primary hover:text-primary-foreground transition cursor-pointer"
                          >
                            Deliver here
                          </button>
                        )
                      )}

                      <button
                        type="button"
                        onClick={() => addressesStore.remove(a.id)}
                        className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition cursor-pointer"
                        aria-label={`Delete address ${a.label}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add New Address Section */}
        <div className="mt-8 rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-border/60">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
              <Plus className="h-4 w-4 stroke-[3]" />
            </div>
            <h2 className="text-base font-extrabold text-foreground">Add New Delivery Address</h2>
          </div>

          {/* Quick Location Action Buttons */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleUseCurrentGPS}
              disabled={isLocating}
              className="flex items-center justify-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 hover:bg-primary/10 px-4 py-2.5 text-xs font-bold text-primary transition active:scale-[0.98] cursor-pointer"
            >
              {isLocating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LocateFixed className="h-4 w-4 stroke-[2.2]" />
              )}
              <span>{isLocating ? "Acquiring GPS fix…" : "Use Current GPS Location"}</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenMapPicker()}
              className="flex items-center justify-center gap-2 rounded-2xl border border-border/80 bg-muted/60 hover:bg-muted px-4 py-2.5 text-xs font-bold text-foreground transition active:scale-[0.98] cursor-pointer"
            >
              <MapIcon className="h-4 w-4 text-primary" />
              <span>Choose &amp; Adjust on Map</span>
            </button>
          </div>

          {/* Search Area Landmark Autocomplete */}
          <div className="mt-4 relative">
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
              Search Area or Landmark (Optional)
            </label>
            <div className="relative flex items-center">
              <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Type an area, road or landmark to search…"
                className="w-full rounded-xl border border-input bg-background pl-9 pr-8 py-2 text-xs font-medium placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 h-4 w-4 animate-spin text-muted-foreground" />
              )}
              {searchQuery && !isSearching && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
                  className="absolute right-3 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Autocomplete Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-2xl border hairline bg-popover p-1.5 shadow-xl">
                {searchResults.map((r, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSelectSearchResult(r)}
                    className="flex w-full items-start gap-2.5 rounded-xl px-3 py-2 text-left text-xs hover:bg-muted/80 transition cursor-pointer"
                  >
                    <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span className="line-clamp-2 text-foreground font-medium">
                      {r.placeName || r.label || r.address}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Coordinates Confirmation Status */}
          <div className="mt-4 rounded-2xl border p-3.5 bg-muted/40 border-border/70 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${
                  coords ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"
                }`}
              >
                <MapPin className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Drop-off Coordinates Status
                </span>
                <p className="text-xs font-semibold text-foreground truncate">
                  {coords ? (
                    <span className="text-emerald-700 dark:text-emerald-400">
                      ✓ Lat: {coords.lat.toFixed(4)}, Lng: {coords.lng.toFixed(4)}
                      {coordsStatusText ? ` · ${coordsStatusText}` : ""}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      No coordinates selected yet. Use GPS or Map button above.
                    </span>
                  )}
                </p>
              </div>
            </div>

            {coords && (
              <button
                type="button"
                onClick={() => handleOpenMapPicker()}
                className="text-[11px] font-bold text-primary hover:underline shrink-0 cursor-pointer"
              >
                Fine-tune
              </button>
            )}
          </div>

          {/* Form Fields */}
          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                Address Label (e.g., Home, Work, Parents) <span className="text-destructive">*</span>
              </label>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g., Home, Office, Apartment 4B"
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                Full Delivery Address <span className="text-destructive">*</span>
              </label>
              <textarea
                value={line}
                onChange={(e) => setLine(e.target.value)}
                placeholder="Door number, building name, street, locality, landmark, and pincode"
                rows={2}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-5 flex items-center justify-between gap-3 pt-3 border-t border-border/60">
            <p className="text-[11px] text-muted-foreground">
              {coords ? "Coordinates verified. Ready to save." : "Drop-off pin is required for delivery validation."}
            </p>
            <button
              type="button"
              onClick={handleSaveAddress}
              disabled={!coords}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-xs font-extrabold text-primary-foreground shadow-md transition hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Check className="h-4 w-4 stroke-[3]" />
              <span>Save Address</span>
            </button>
          </div>
        </div>

        {/* Modal Map Picker Dialog */}
        <AnimatePresence>
          {isMapPickerOpen && (
            <div
              className="fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto bg-slate-950/40 p-2 backdrop-blur-[2px] sm:p-4"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) setIsMapPickerOpen(false);
              }}
            >
              <motion.div
                role="dialog"
                aria-modal="true"
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
                className="relative my-auto flex h-[calc(100dvh-1.5rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl sm:h-[min(820px,calc(100dvh-2rem))] sm:rounded-3xl sm:p-5"
              >
                <div className="flex items-center justify-between pb-2 border-b border-border/60 mb-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <h3 className="text-base font-extrabold text-foreground">
                      Confirm Drop-off Pin on Map
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMapPickerOpen(false)}
                    className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label="Close Map Picker"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex-1 min-h-0 overflow-hidden rounded-2xl">
                  <LocationMapPicker
                    initialLat={coords?.lat ?? activeDeliveryLocation?.lat}
                    initialLng={coords?.lng ?? activeDeliveryLocation?.lng}
                    initialLabel={line || activeDeliveryLocation?.label}
                    requiresManualConfirmation={true}
                    onSelectLocation={handleMapLocationConfirmed}
                    onBack={() => setIsMapPickerOpen(false)}
                  />
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}

