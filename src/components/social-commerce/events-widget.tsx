import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Calendar, ChevronRight, MapPin, Check } from "lucide-react";
import { getLocalEventsForLocation, type LocalEvent } from "@/lib/social-feed-data";
import { useDeliveryLocation } from "@/lib/location-store";
import { toast } from "sonner";

export function EventsWidget() {
  const [deliveryLocation] = useDeliveryLocation();
  const currentEvents = getLocalEventsForLocation(deliveryLocation);
  const [event, setEvent] = useState<LocalEvent>(currentEvents[0]);

  useEffect(() => {
    const list = getLocalEventsForLocation(deliveryLocation);
    if (list.length > 0) {
      setEvent(list[0]);
    }
  }, [deliveryLocation]);

  const handleToggleInterest = () => {
    setEvent((prev) => {
      const next = !prev.isInterested;
      const newCount = next ? prev.interestedCount + 1 : prev.interestedCount - 1;
      toast.success(next ? "Marked as interested!" : "Removed from interested events");
      return { ...prev, isInterested: next, interestedCount: newCount };
    });
  };

  return (
    <div className="rounded-3xl bg-white p-4 sm:p-5 border border-[#E2E8F0] shadow-xs">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-4 w-4 text-[#8B2FC9]" />
          <h3 className="text-sm sm:text-base font-bold text-[#0F172A]">Events Near You</h3>
        </div>
        <Link
          to="/community"
          className="group inline-flex items-center gap-0.5 text-xs font-bold text-[#8B2FC9] hover:text-[#581C87]"
        >
          View All
          <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Featured Event Card */}
      <div className="overflow-hidden rounded-2xl bg-[#F8FAFC] border border-[#F0E6FA] transition hover:shadow-xs">
        <div className="flex gap-3 p-3">
          <div className="h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-zinc-200">
            <img src={event.imageUrl} alt={event.title} className="h-full w-full object-cover" />
          </div>
          <div className="flex flex-col justify-between min-w-0">
            <div>
              <h4 className="text-xs font-bold text-[#0F172A] leading-tight line-clamp-2">
                {event.title}
              </h4>
              <p className="mt-1 text-[11px] font-medium text-[#8B2FC9]">
                {event.date} • {event.time}
              </p>
              <div className="mt-0.5 flex items-center gap-1 text-[10px] text-[#64748B] truncate">
                <MapPin className="h-2.5 w-2.5 shrink-0" />
                <span className="truncate">{event.location}</span>
              </div>
            </div>

            <span className="text-[10px] font-bold text-[#0F172A] mt-1">
              {event.interestedCount} people interested
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="px-3 pb-3">
          <button
            type="button"
            onClick={handleToggleInterest}
            className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              event.isInterested
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-[#8B2FC9] text-white hover:bg-[#7812B8]"
            }`}
          >
            {event.isInterested ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Interested</span>
              </>
            ) : (
              <span>I'm Interested →</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
