import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Users, ChevronRight, Check } from "lucide-react";
import { getLocalGroupsForLocation, type LocalGroup } from "@/lib/social-feed-data";
import { useDeliveryLocation } from "@/lib/location-store";
import { toast } from "sonner";

export function LocalGroupsWidget() {
  const [deliveryLocation] = useDeliveryLocation();
  const currentGroups = getLocalGroupsForLocation(deliveryLocation);
  const [groups, setGroups] = useState<LocalGroup[]>(currentGroups);

  useEffect(() => {
    setGroups(getLocalGroupsForLocation(deliveryLocation));
  }, [deliveryLocation]);

  const handleToggleJoin = (groupId: string, groupName: string) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        const nextJoined = !g.isJoined;
        toast.success(nextJoined ? `Joined "${groupName}" group!` : `Left "${groupName}"`);
        return { ...g, isJoined: nextJoined };
      }),
    );
  };

  return (
    <div className="rounded-3xl bg-white p-4 sm:p-5 border border-[#E2E8F0] shadow-xs">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-1.5">
          <Users className="h-4 w-4 text-[#8B2FC9]" />
          <h3 className="text-sm sm:text-base font-bold text-[#0F172A]">Local Groups</h3>
        </div>
        <Link
          to="/community"
          className="group inline-flex items-center gap-0.5 text-xs font-bold text-[#8B2FC9] hover:text-[#581C87]"
        >
          View All
          <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Groups List */}
      <div className="space-y-3">
        {groups.map((grp) => (
          <div
            key={grp.id}
            className="flex items-center justify-between gap-2.5 rounded-2xl bg-[#F8FAFC] p-2.5 border border-[#F0E6FA]"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-9 w-9 shrink-0 overflow-hidden rounded-xl bg-purple-50 shadow-xs border border-[#E2E8F0] flex items-center justify-center font-bold text-xs text-[#8B2FC9]">
                {grp.avatar ? (
                  <img
                    src={grp.avatar}
                    alt=""
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  grp.name.slice(0, 2).toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-[#0F172A] truncate">{grp.name}</h4>
                <p className="text-[10px] text-[#64748B]">{grp.membersCount}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleToggleJoin(grp.id, grp.name)}
              className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold transition cursor-pointer ${
                grp.isJoined
                  ? "bg-purple-100 text-[#581C87] flex items-center gap-1"
                  : "bg-[#8B2FC9] text-white hover:bg-[#7812B8]"
              }`}
            >
              {grp.isJoined ? (
                <>
                  <Check className="h-3 w-3 stroke-[2.5]" />
                  <span>Joined</span>
                </>
              ) : (
                <span>Join</span>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
