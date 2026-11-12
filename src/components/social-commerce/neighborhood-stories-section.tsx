import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Plus, Play, ChevronRight, X, ChevronLeft, Sparkles, MoreHorizontal } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { INITIAL_STORIES, type SocialStory, type SocialStoryItem } from "@/lib/social-feed-data";
import { useAuth } from "@/lib/auth-store";
import { useLocalShoreRoles } from "@/lib/roles-store";
import { toast } from "sonner";

interface NeighborhoodStoriesSectionProps {
  stories?: SocialStory[];
}

export function NeighborhoodStoriesSection({
  stories = INITIAL_STORIES,
}: NeighborhoodStoriesSectionProps) {
  const auth = useAuth();
  const roleState = useLocalShoreRoles();
  const isSeller = roleState.hasRole("seller");

  // Story Viewer Modal State
  const [activeStoryGroup, setActiveStoryGroup] = useState<SocialStory | null>(null);
  const [activeItemIndex, setActiveItemIndex] = useState(0);
  const [storyProgress, setStoryProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // All Stories Modal State
  const [isAllStoriesOpen, setIsAllStoriesOpen] = useState(false);

  // Create Story Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [storyCaption, setStoryCaption] = useState("");

  const handleOpenStory = (story: SocialStory) => {
    setActiveStoryGroup(story);
    setActiveItemIndex(0);
    setStoryProgress(0);
    setIsPaused(false);
  };

  const handleCloseStory = () => {
    setActiveStoryGroup(null);
    setActiveItemIndex(0);
    setStoryProgress(0);
  };

  // Story Auto-advance Timer
  useEffect(() => {
    if (!activeStoryGroup || isPaused) return;

    const currentItem = activeStoryGroup.stories[activeItemIndex];
    const duration = (currentItem?.durationSeconds || 5) * 1000;
    const intervalMs = 50;
    const step = (intervalMs / duration) * 100;

    const timer = setInterval(() => {
      setStoryProgress((prev) => {
        if (prev >= 100) {
          // Go to next story item
          if (activeItemIndex < activeStoryGroup.stories.length - 1) {
            setActiveItemIndex((idx) => idx + 1);
            return 0;
          } else {
            // Find next story group
            const currentGroupIndex = stories.findIndex((s) => s.id === activeStoryGroup.id);
            if (currentGroupIndex < stories.length - 1) {
              setActiveStoryGroup(stories[currentGroupIndex + 1]);
              setActiveItemIndex(0);
              return 0;
            } else {
              handleCloseStory();
              return 0;
            }
          }
        }
        return prev + step;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [activeStoryGroup, activeItemIndex, isPaused, stories]);

  const handlePrevItem = () => {
    if (activeItemIndex > 0) {
      setActiveItemIndex((idx) => idx - 1);
      setStoryProgress(0);
    } else {
      const currentGroupIndex = stories.findIndex((s) => s.id === activeStoryGroup?.id);
      if (currentGroupIndex > 0) {
        setActiveStoryGroup(stories[currentGroupIndex - 1]);
        setActiveItemIndex(0);
        setStoryProgress(0);
      }
    }
  };

  const handleNextItem = () => {
    if (!activeStoryGroup) return;
    if (activeItemIndex < activeStoryGroup.stories.length - 1) {
      setActiveItemIndex((idx) => idx + 1);
      setStoryProgress(0);
    } else {
      const currentGroupIndex = stories.findIndex((s) => s.id === activeStoryGroup.id);
      if (currentGroupIndex < stories.length - 1) {
        setActiveStoryGroup(stories[currentGroupIndex + 1]);
        setActiveItemIndex(0);
        setStoryProgress(0);
      } else {
        handleCloseStory();
      }
    }
  };

  const handleCreateStoryClick = () => {
    setIsCreateModalOpen(true);
  };

  const handlePublishStory = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Story posted to your neighborhood feed! 📸");
    setIsCreateModalOpen(false);
    setStoryCaption("");
  };

  const activeStoryItem = activeStoryGroup?.stories[activeItemIndex];

  return (
    <section className="rounded-3xl bg-white p-4 sm:p-5 md:p-6 border border-[#E2E8F0] shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[#8B2FC9]" />
          <h2 className="text-base sm:text-lg font-bold text-[#0F172A] tracking-tight">
            Neighborhood Stories
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setIsAllStoriesOpen(true)}
          className="group inline-flex items-center gap-1 text-xs font-bold text-[#8B2FC9] hover:text-[#581C87] cursor-pointer"
        >
          See All Stories
          <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Stories Rail */}
      <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto no-scrollbar pb-1 touch-scroll">
        {/* + Create Story Button (Matches mobile & desktop mockups) */}
        <button
          type="button"
          onClick={handleCreateStoryClick}
          className="group flex flex-col items-center justify-center shrink-0 w-[74px] sm:w-[82px] cursor-pointer"
        >
          <div className="relative flex h-[72px] w-[72px] sm:h-[78px] sm:w-[78px] flex-col items-center justify-center rounded-[22px] border-2 border-dashed border-[#8B2FC9]/50 bg-[#F8FAFC] transition group-hover:border-[#8B2FC9] group-hover:bg-[#F9EDFD]">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#8B2FC9] text-white shadow-xs group-hover:scale-110 transition">
              <Plus className="h-4 w-4 stroke-[2.5]" />
            </div>
          </div>
          <span className="mt-1.5 text-center text-[11px] font-bold text-[#0F172A] leading-tight">
            Create Story
          </span>
        </button>

        {/* Real Shop Stories with Rounded Squircle Rings */}
        {stories.map((story) => (
          <button
            key={story.id}
            type="button"
            onClick={() => handleOpenStory(story)}
            className="group flex flex-col items-center justify-center shrink-0 w-[74px] sm:w-[82px] cursor-pointer text-left"
          >
            {/* Squircle Gradient Story Ring */}
            <div className="relative p-[2.5px] rounded-[22px] bg-gradient-to-tr from-[#8B2FC9] via-[#EC4899] to-[#F59E0B] group-hover:shadow-[0_4px_16px_rgba(168, 56, 189,0.3)] transition-all">
              <div className="relative h-[68px] w-[68px] sm:h-[74px] sm:w-[74px] overflow-hidden rounded-[20px] bg-white ring-2 ring-white">
                <img
                  src={story.thumbnailUrl}
                  alt={story.shopName}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = "/assets/ravis-bakery-logo.png";
                  }}
                />
                {story.hasVideo && (
                  <div className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#8B2FC9] text-white shadow-xs">
                    <Play className="h-2 w-2 fill-white ml-0.5" />
                  </div>
                )}
              </div>
            </div>
            <span className="mt-1.5 max-w-[74px] sm:max-w-[82px] truncate text-center text-[11px] font-bold text-[#0F172A] leading-tight">
              {story.shopName}
            </span>
          </button>
        ))}

        {/* "..." More Circle Button (Opens All Stories Browser) */}
        <button
          type="button"
          onClick={() => setIsAllStoriesOpen(true)}
          className="group flex flex-col items-center justify-center shrink-0 w-[74px] sm:w-[82px] cursor-pointer text-left"
        >
          <div className="relative flex h-[72px] w-[72px] sm:h-[78px] sm:w-[78px] items-center justify-center rounded-[22px] border border-[#E2E8F0] bg-[#F8FAFC] transition group-hover:border-[#8B2FC9] group-hover:bg-[#F9EDFD]">
            <MoreHorizontal className="h-6 w-6 text-[#8B2FC9]" />
          </div>
          <span className="mt-1.5 text-center text-[11px] font-bold text-[#64748B] leading-tight">
            More
          </span>
        </button>
      </div>

      {/* Story Viewer Dialog */}
      <Dialog open={Boolean(activeStoryGroup)} onOpenChange={(open) => !open && handleCloseStory()}>
        <DialogContent hideCloseButton className="max-w-md p-0 overflow-hidden border-none bg-black text-white sm:rounded-3xl shadow-2xl z-[120]">
          <DialogTitle className="sr-only">
            {activeStoryGroup ? `${activeStoryGroup.shopName} Story` : "Story Viewer"}
          </DialogTitle>
          {activeStoryGroup && activeStoryItem && (
            <div className="relative h-[580px] w-full flex flex-col justify-between bg-zinc-950">
              {/* Progress Indicators Bar */}
              <div className="absolute top-3 inset-x-3 z-30 flex gap-1">
                {activeStoryGroup.stories.map((item, idx) => (
                  <div
                    key={item.id}
                    className="h-1 flex-1 rounded-full bg-white/30 overflow-hidden"
                  >
                    <div
                      className="h-full bg-white transition-all ease-linear"
                      style={{
                        width:
                          idx < activeItemIndex
                            ? "100%"
                            : idx === activeItemIndex
                              ? `${storyProgress}%`
                              : "0%",
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Story Header (Shop avatar, name, close) */}
              <div className="relative z-30 flex items-center justify-between p-4 pt-6 bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 overflow-hidden rounded-full ring-2 ring-[#8B2FC9]">
                    <img
                      src={activeStoryGroup.shopAvatar}
                      alt={activeStoryGroup.shopName}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white">
                        {activeStoryGroup.shopName}
                      </span>
                      {activeStoryGroup.verified && (
                        <span className="rounded-full bg-[#8B2FC9] px-1 text-[9px] font-bold text-white">
                          ✓
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-white/70">{activeStoryItem.timestamp}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCloseStory}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Story Image / Video */}
              <div
                className="absolute inset-0 z-10 flex items-center justify-center"
                onMouseDown={() => setIsPaused(true)}
                onMouseUp={() => setIsPaused(false)}
                onTouchStart={() => setIsPaused(true)}
                onTouchEnd={() => setIsPaused(false)}
              >
                <img
                  src={activeStoryItem.mediaUrl}
                  alt={activeStoryItem.caption || activeStoryGroup.shopName}
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Left & Right Tappable Navigation Areas */}
              <div className="absolute inset-y-16 inset-x-0 z-20 flex">
                <div
                  className="w-1/3 h-full cursor-pointer"
                  onClick={handlePrevItem}
                  title="Previous story"
                />
                <div
                  className="w-2/3 h-full cursor-pointer"
                  onClick={handleNextItem}
                  title="Next story"
                />
              </div>

              {/* Story Footer Caption & Direct Shop Link */}
              <div className="relative z-30 p-4 pb-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                {activeStoryItem.caption && (
                  <p className="text-sm font-semibold text-white leading-relaxed mb-3 drop-shadow-md">
                    {activeStoryItem.caption}
                  </p>
                )}
                <div className="flex items-center justify-between gap-3">
                  <Link
                    to="/store/$storeId"
                    params={{ storeId: activeStoryGroup.shopId }}
                    onClick={handleCloseStory}
                    className="flex-1 text-center rounded-full bg-white/20 backdrop-blur-md px-4 py-2.5 text-xs font-bold text-white border border-white/30 hover:bg-white hover:text-[#0F172A] transition"
                  >
                    Visit Shop Profile →
                  </Link>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Story Dialog */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-md p-6 sm:rounded-3xl">
          <DialogTitle className="text-base font-bold text-[#0F172A]">
            Post a Neighborhood Story
          </DialogTitle>
          <form onSubmit={handlePublishStory} className="mt-4 space-y-4">
            <div>
              <label className="text-xs font-bold text-[#504660] block mb-1">Photo / Video</label>
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#E2E8F0] bg-[#F8FAFC] p-6 text-center hover:bg-[#F1F5F9] cursor-pointer">
                <Plus className="h-8 w-8 text-[#8B2FC9] mb-2" />
                <span className="text-xs font-bold text-[#0F172A]">Click to upload media</span>
                <span className="text-[11px] text-[#64748B] mt-0.5">
                  JPG, PNG, or MP4 (Max 15s)
                </span>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-[#504660] block mb-1">Caption</label>
              <textarea
                value={storyCaption}
                onChange={(e) => setStoryCaption(e.target.value)}
                placeholder="What's fresh or exciting right now? (e.g. Fresh croissants out of the oven!)"
                rows={3}
                className="w-full rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2.5 text-xs outline-none focus:border-[#8B2FC9]"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-full px-4 py-2 text-xs font-bold text-[#64748B] hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-full bg-[#8B2FC9] px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-[#7812B8]"
              >
                Share Story
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* All Neighborhood Stories Gallery Dialog (See All Stories) */}
      <Dialog open={isAllStoriesOpen} onOpenChange={setIsAllStoriesOpen}>
        <DialogContent className="max-w-2xl p-6 sm:rounded-3xl max-h-[85vh] overflow-y-auto">
          <div className="flex items-center justify-between pb-3 border-b border-purple-100">
            <div>
              <DialogTitle className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#8B2FC9]" />
                All Neighborhood Stories
              </DialogTitle>
              <p className="text-xs text-[#746A85] mt-0.5">
                Explore real daily updates and fresh arrivals from local shops.
              </p>
            </div>
            <button
              onClick={() => {
                setIsAllStoriesOpen(false);
                handleOpenStory(stories[0]);
              }}
              className="px-4 py-2 rounded-2xl bg-gradient-to-r from-[#8B2FC9] to-[#581C87] text-white text-xs font-bold shadow-md hover:opacity-95 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Watch All
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 pt-4">
            {stories.map((story) => (
              <div
                key={story.id}
                onClick={() => {
                  setIsAllStoriesOpen(false);
                  handleOpenStory(story);
                }}
                className="group relative rounded-2xl overflow-hidden border border-purple-100 bg-[#F8FAFC] hover:border-purple-300 hover:shadow-md transition cursor-pointer flex flex-col"
              >
                <div className="aspect-[4/5] relative overflow-hidden bg-slate-900">
                  <img
                    src={story.thumbnailUrl}
                    alt={story.shopName}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                  
                  {/* Shop Avatar & Name on Card */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-2">
                    <img
                      src={story.shopAvatar}
                      alt={story.shopName}
                      className="w-7 h-7 rounded-full object-cover border-2 border-white"
                    />
                    <span className="text-[11px] font-bold text-white drop-shadow-sm truncate max-w-[100px]">
                      {story.shopName}
                    </span>
                  </div>

                  {story.hasVideo && (
                    <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xs">
                      <Play className="w-2.5 h-2.5 fill-white" />
                    </div>
                  )}

                  {/* Caption & Timestamp */}
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white">
                    <p className="text-[11px] font-medium line-clamp-2 leading-tight">
                      {story.stories[0]?.caption || "Tap to view story"}
                    </p>
                    <span className="text-[10px] text-purple-200 mt-1 block">
                      {story.stories[0]?.timestamp || "Recent"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
