import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import {
  Users,
  MessageSquare,
  Calendar,
  Vote,
  Heart,
  Share2,
  Sparkles,
  Send,
  Plus,
  Check,
  MapPin,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { SocialCommerceShell } from "@/components/social-commerce/social-commerce-shell";
import { useDeliveryLocation } from "@/lib/location-store";
import {
  getLocalGroupsForLocation,
  getLocalEventsForLocation,
  isBengaluruLocation,
  INITIAL_LOCAL_GROUPS,
  INITIAL_LOCAL_EVENTS,
  type LocalGroup,
  type LocalEvent,
} from "@/lib/social-feed-data";

export const Route = createFileRoute("/community")({
  component: CommunityPage,
});

interface DiscussionPost {
  id: string;
  authorName: string;
  authorAvatar: string;
  groupName: string;
  timestamp: string;
  content: string;
  likesCount: number;
  commentsCount: number;
  isLiked?: boolean;
  comments: Array<{
    id: string;
    userName: string;
    text: string;
    timestamp: string;
  }>;
}

const INITIAL_DISCUSSIONS: DiscussionPost[] = [
  {
    id: "disc_1",
    authorName: "Priya S",
    authorAvatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
    groupName: "Coimbatore Foodies",
    timestamp: "3 hours ago",
    content:
      "Best filter coffee spots near RS Puram? ☕️ Looking for authentic local recommendations with that rich chicory aroma!",
    likesCount: 54,
    commentsCount: 28,
    isLiked: false,
    comments: [
      {
        id: "c_1",
        userName: "Karthik R.",
        text: "Sree Annapoorna on DB Road is unbeatable for classic Kumbakonam degree style! ☕",
        timestamp: "2h ago",
      },
      {
        id: "c_2",
        userName: "Divya N.",
        text: "Try the brass tumbler coffee at Anandhas too, pure bliss in the morning.",
        timestamp: "1h ago",
      },
    ],
  },
  {
    id: "disc_2",
    authorName: "Venkatesh Rao",
    authorAvatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    groupName: "Local Entrepreneurs",
    timestamp: "5 hours ago",
    content:
      "Calling all local makers & home bakers! We're organizing a cooperative stall at next week's RS Puram Fest. Who would like to co-share table space? 🤝",
    likesCount: 38,
    commentsCount: 14,
    isLiked: true,
    comments: [
      {
        id: "c_3",
        userName: "Ravi's Artisan Bakery",
        text: "We'd love to join! Can bring our fresh sourdough & croissant baskets.",
        timestamp: "4h ago",
      },
    ],
  },
  {
    id: "disc_3",
    authorName: "Meenakshi K.",
    authorAvatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
    groupName: "Sustainable Coimbatore",
    timestamp: "Yesterday",
    content:
      "Native vegetable seeds exchange meetup this Sunday at Race Course! Bringing heirloom brinjal, country tomato and ridge gourd seeds. 🌱 Free for all neighbors!",
    likesCount: 82,
    commentsCount: 19,
    isLiked: false,
    comments: [],
  },
];

const INITIAL_POLL = {
  question: "What type of local events would you like to see more?",
  totalVotes: 342,
  options: [
    { id: "opt_1", label: "Food Festivals", percentage: 52, votes: 178 },
    { id: "opt_2", label: "Local Markets", percentage: 26, votes: 89 },
    { id: "opt_3", label: "Workshops", percentage: 12, votes: 41 },
    { id: "opt_4", label: "Others", percentage: 10, votes: 34 },
  ],
};

const SUB_TABS = ["For You", "Groups", "Discussions", "Events", "Polls"] as const;
type SubTab = (typeof SUB_TABS)[number];

function CommunityPage() {
  const [deliveryLocation] = useDeliveryLocation();
  const isBLR = isBengaluruLocation(deliveryLocation);
  const currentArea =
    deliveryLocation?.area ||
    deliveryLocation?.label?.split(",")[0] ||
    (isBLR ? "SFHS Layout" : "RS Puram");
  const currentCity = isBLR ? "Bengaluru" : (deliveryLocation?.city?.split(",")[0] || "Coimbatore");

  const locationGroups = useMemo(() => getLocalGroupsForLocation(deliveryLocation), [deliveryLocation]);
  const locationEvents = useMemo(() => getLocalEventsForLocation(deliveryLocation), [deliveryLocation]);

  const [activeTab, setActiveTab] = useState<SubTab>("For You");
  const [groups, setGroups] = useState<LocalGroup[]>(locationGroups);
  const [events, setEvents] = useState<LocalEvent[]>(locationEvents);

  const dynamicDiscussions = useMemo<DiscussionPost[]>(() => {
    return [
      {
        id: "disc_1",
        authorName: "Priya S",
        authorAvatar:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
        groupName: `${currentArea} Foodies`,
        timestamp: "3 hours ago",
        content: `Best filter coffee spots near ${currentArea}? ☕️ Looking for authentic local recommendations with that rich chicory aroma!`,
        likesCount: 54,
        commentsCount: 28,
        isLiked: false,
        comments: [
          {
            id: "c_1",
            userName: "Karthik R.",
            text: isBLR
              ? "SLV Swadisht and City Bites on 14th Cross are unbeatable for authentic degree filter coffee! ☕"
              : "Sree Annapoorna on DB Road is unbeatable for classic Kumbakonam degree style! ☕",
            timestamp: "2h ago",
          },
          {
            id: "c_2",
            userName: "Divya N.",
            text: isBLR
              ? "Try the brass tumbler coffee at Ravi's Bakery too, pure bliss in the morning."
              : "Try the brass tumbler coffee at Anandhas too, pure bliss in the morning.",
            timestamp: "1h ago",
          },
        ],
      },
      {
        id: "disc_2",
        authorName: "Venkatesh Rao",
        authorAvatar:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
        groupName: `Local Entrepreneurs - ${currentCity}`,
        timestamp: "5 hours ago",
        content: `Calling all local makers & home bakers in ${currentArea}! We're organizing a cooperative stall at next week's ${currentArea} Fest. Who would like to co-share table space? 🤝`,
        likesCount: 38,
        commentsCount: 14,
        isLiked: true,
        comments: [
          {
            id: "c_3",
            userName: "Ravi's Artisan Bakery",
            text: "We'd love to join! Can bring our fresh sourdough & croissant baskets.",
            timestamp: "4h ago",
          },
        ],
      },
      {
        id: "disc_3",
        authorName: "Meenakshi K.",
        authorAvatar:
          "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
        groupName: `Sustainable ${currentArea}`,
        timestamp: "Yesterday",
        content: `Native vegetable seeds exchange meetup this Sunday at ${currentArea}! Bringing heirloom brinjal, country tomato and ridge gourd seeds. 🌱 Free for all neighbors!`,
        likesCount: 82,
        commentsCount: 19,
        isLiked: false,
        comments: [],
      },
    ];
  }, [currentArea, currentCity, isBLR]);

  const [discussions, setDiscussions] = useState<DiscussionPost[]>(dynamicDiscussions);
  const [poll, setPoll] = useState(INITIAL_POLL);
  const [selectedPollOption, setSelectedPollOption] = useState<string | null>(null);

  // New discussion post composer
  const [newPostText, setNewPostText] = useState("");
  const [selectedGroupForPost, setSelectedGroupForPost] = useState(
    locationGroups[0]?.name || `${currentArea} Foodies`
  );
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    setGroups(locationGroups);
    setEvents(locationEvents);
    setDiscussions(dynamicDiscussions);
    if (locationGroups.length > 0) {
      setSelectedGroupForPost(locationGroups[0].name);
    }
  }, [locationGroups, locationEvents, dynamicDiscussions]);

  const handleToggleJoinGroup = (groupId: string) => {
    setGroups((prev) =>
      prev.map((grp) => {
        if (grp.id === groupId) {
          const nextState = !grp.isJoined;
          toast.success(
            nextState ? `Joined ${grp.name}!` : `Left ${grp.name}`,
            { description: nextState ? "You will receive updates in your feed." : "" }
          );
          return { ...grp, isJoined: nextState };
        }
        return grp;
      })
    );
  };

  const handleToggleEventInterested = (eventId: string) => {
    setEvents((prev) =>
      prev.map((evt) => {
        if (evt.id === eventId) {
          const nextState = !evt.isInterested;
          const nextCount = nextState ? evt.interestedCount + 1 : evt.interestedCount - 1;
          toast.success(
            nextState ? "Added to your upcoming events!" : "Removed from interested list"
          );
          return { ...evt, isInterested: nextState, interestedCount: nextCount };
        }
        return evt;
      })
    );
  };

  const handleToggleLikeDiscussion = (postId: string) => {
    setDiscussions((prev) =>
      prev.map((d) => {
        if (d.id === postId) {
          const nextLiked = !d.isLiked;
          return {
            ...d,
            isLiked: nextLiked,
            likesCount: nextLiked ? d.likesCount + 1 : d.likesCount - 1,
          };
        }
        return d;
      })
    );
  };

  const handleAddComment = (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;
    setDiscussions((prev) =>
      prev.map((d) => {
        if (d.id === postId) {
          return {
            ...d,
            commentsCount: d.commentsCount + 1,
            comments: [
              ...d.comments,
              {
                id: `c_${Date.now()}`,
                userName: "You",
                text,
                timestamp: "Just now",
              },
            ],
          };
        }
        return d;
      })
    );
    setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
    toast.success("Comment posted!");
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim()) return;

    const newPost: DiscussionPost = {
      id: `disc_${Date.now()}`,
      authorName: "You",
      authorAvatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
      groupName: selectedGroupForPost,
      timestamp: "Just now",
      content: newPostText.trim(),
      likesCount: 1,
      commentsCount: 0,
      isLiked: true,
      comments: [],
    };

    setDiscussions([newPost, ...discussions]);
    setNewPostText("");
    toast.success(`Posted to ${selectedGroupForPost}!`);
  };

  const handleVotePoll = (optionId: string) => {
    if (selectedPollOption) return;
    setSelectedPollOption(optionId);
    setPoll((prev) => {
      const nextTotal = prev.totalVotes + 1;
      const nextOptions = prev.options.map((opt) => {
        const votes = opt.id === optionId ? opt.votes + 1 : opt.votes;
        return {
          ...opt,
          votes,
          percentage: Math.round((votes / nextTotal) * 100),
        };
      });
      return {
        ...prev,
        totalVotes: nextTotal,
        options: nextOptions,
      };
    });
    toast.success("Vote recorded! Thanks for shaping our community.");
  };

  return (
    <SocialCommerceShell
      rightSidebar={
        <div className="space-y-4">
          {/* LocalShore Community Poll Widget */}
          <div className="rounded-3xl bg-white p-5 border border-purple-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Vote className="w-5 h-5 text-[#8B2FC9]" />
              <h3 className="text-sm font-bold text-[#0F172A]">
                LocalShore Community Poll
              </h3>
            </div>
            <p className="text-xs text-[#746A85] font-medium leading-relaxed">
              {poll.question}
            </p>

            <div className="space-y-2">
              {poll.options.map((opt) => {
                const isSelected = selectedPollOption === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleVotePoll(opt.id)}
                    disabled={Boolean(selectedPollOption)}
                    className={`w-full text-left relative overflow-hidden rounded-xl border p-2.5 transition-all text-xs font-semibold ${
                      isSelected
                        ? "border-[#8B2FC9] bg-purple-50/60"
                        : "border-purple-100 bg-white hover:border-purple-300"
                    }`}
                  >
                    {/* Background Progress Bar */}
                    <div
                      className="absolute inset-y-0 left-0 bg-purple-100/70 transition-all duration-500"
                      style={{ width: `${opt.percentage}%` }}
                    />
                    <div className="relative flex items-center justify-between z-10">
                      <span className="text-[#0F172A] flex items-center gap-1.5">
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#8B2FC9]" />}
                        {opt.label}
                      </span>
                      <span className="text-[#8B2FC9] font-bold">
                        {opt.percentage}%
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-gray-400 text-right">
              {poll.totalVotes} neighborhood votes
            </p>
          </div>

          {/* Upcoming Local Events Widget */}
          <div className="rounded-3xl bg-white p-5 border border-purple-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#8B2FC9]" />
                <h3 className="text-sm font-bold text-[#0F172A]">
                  Upcoming Events
                </h3>
              </div>
              <span className="text-[11px] font-bold text-[#8B2FC9]">View All</span>
            </div>

            {events.map((evt) => (
              <div
                key={evt.id}
                className="overflow-hidden rounded-2xl border border-purple-100 group hover:shadow-md transition-shadow"
              >
                <div className="h-28 overflow-hidden relative">
                  <img
                    src={evt.imageUrl}
                    alt={evt.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <span className="absolute bottom-2 left-2 text-xs font-bold text-white">
                    {evt.date} • {evt.time}
                  </span>
                </div>
                <div className="p-3 bg-white space-y-2">
                  <p className="text-xs font-bold text-[#0F172A] leading-tight">
                    {evt.title}
                  </p>
                  <p className="text-[11px] text-[#746A85] flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-purple-600" />
                    {evt.location}
                  </p>
                  <button
                    onClick={() => handleToggleEventInterested(evt.id)}
                    className={`w-full py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
                      evt.isInterested
                        ? "bg-purple-100 text-[#8B2FC9]"
                        : "bg-gradient-to-r from-[#8B2FC9] to-[#581C87] text-white hover:opacity-95 shadow-sm"
                    }`}
                  >
                    {evt.isInterested ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Interested ({evt.interestedCount})
                      </>
                    ) : (
                      <>
                        I'm Interested
                        <span>→</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900/10 via-purple-600/5 to-transparent p-5 sm:p-6 rounded-3xl border border-purple-100">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-700 text-xs font-bold uppercase tracking-wider mb-2">
            <Users className="w-3.5 h-3.5" />
            Neighborhood Community
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            Community
          </h1>
          <p className="text-sm text-[#746A85] mt-1">
            Local groups, discussions, events and neighborhood announcements.
          </p>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {SUB_TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-[#8B2FC9] text-white shadow-sm shadow-purple-400/40"
                    : "bg-white text-[#746A85] hover:text-[#0F172A] border border-purple-100 hover:border-purple-200"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* My Groups Rail / Card */}
        <div className="rounded-3xl bg-white p-5 border border-purple-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#8B2FC9]" />
              My Groups ({groups.length})
            </h2>
            <button
              onClick={() => setActiveTab("Groups")}
              className="text-xs font-bold text-[#8B2FC9] hover:text-[#581C87]"
            >
              View All &gt;
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {groups.map((grp) => (
              <div
                key={grp.id}
                className="p-3.5 rounded-2xl border border-purple-100 bg-[#F8FAFC]/50 hover:bg-white transition flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={grp.avatar}
                    alt={grp.name}
                    className="w-11 h-11 rounded-full object-cover shrink-0 border border-purple-200"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#0F172A] truncate">
                      {grp.name}
                    </p>
                    <p className="text-[11px] text-[#746A85]">{grp.membersCount}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleJoinGroup(grp.id)}
                  className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 ${
                    grp.isJoined
                      ? "bg-purple-100 text-[#8B2FC9] hover:bg-purple-200"
                      : "bg-gradient-to-r from-[#8B2FC9] to-[#581C87] text-white hover:opacity-95 shadow-sm"
                  }`}
                >
                  {grp.isJoined ? "Joined" : "Join"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Start a Conversation Composer */}
        <div className="rounded-3xl bg-white p-4 sm:p-5 border border-purple-100 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#8B2FC9] to-pink-500 text-white font-bold flex items-center justify-center text-sm shadow-sm">
              LS
            </div>
            <div className="flex-1">
              <input
                type="text"
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                placeholder="Ask neighbors, share local tips, or start a discussion..."
                className="w-full bg-[#F8FAFC] rounded-2xl px-4 py-2.5 text-xs text-[#0F172A] placeholder-gray-400 border border-purple-100 focus:outline-none focus:ring-2 focus:ring-[#8B2FC9]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#746A85] font-medium">Post to:</span>
              <select
                value={selectedGroupForPost}
                onChange={(e) => setSelectedGroupForPost(e.target.value)}
                className="text-xs font-bold text-[#8B2FC9] bg-purple-50 rounded-xl px-2.5 py-1 border border-purple-200 focus:outline-none"
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.name}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleCreatePost}
              disabled={!newPostText.trim()}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#8B2FC9] to-[#581C87] text-white text-xs font-bold shadow-sm hover:opacity-95 disabled:opacity-40 transition active:scale-95 flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              Post
            </button>
          </div>
        </div>

        {/* Discussions Feed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#8B2FC9]" />
              Trending Discussions Near You
            </h2>
          </div>

          {discussions.map((post) => (
            <div
              key={post.id}
              className="rounded-3xl bg-white p-5 border border-purple-100 shadow-sm space-y-4 hover:shadow-md transition"
            >
              {/* Author Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={post.authorAvatar}
                    alt={post.authorName}
                    className="w-10 h-10 rounded-full object-cover border border-purple-100"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#0F172A]">
                        {post.authorName}
                      </span>
                      <span className="text-[11px] text-purple-600 bg-purple-50 font-semibold px-2 py-0.5 rounded-full">
                        in {post.groupName}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400">
                      {post.timestamp}
                    </span>
                  </div>
                </div>
              </div>

              {/* Content Body */}
              <p className="text-xs sm:text-sm text-[#0F172A] leading-relaxed">
                {post.content}
              </p>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-purple-50">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleToggleLikeDiscussion(post.id)}
                    className={`flex items-center gap-1.5 text-xs font-semibold transition active:scale-110 ${
                      post.isLiked ? "text-rose-500" : "text-[#746A85] hover:text-rose-500"
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 ${post.isLiked ? "fill-current" : ""}`}
                    />
                    {post.likesCount}
                  </button>

                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#746A85]">
                    <MessageSquare className="w-4 h-4" />
                    {post.commentsCount}
                  </div>

                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(window.location.href);
                      toast.success("Discussion link copied!");
                    }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#746A85] hover:text-[#8B2FC9]"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                </div>
              </div>

              {/* Comment Thread */}
              {post.comments.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-purple-50/60 bg-purple-50/30 p-3 rounded-2xl">
                  {post.comments.map((comment) => (
                    <div key={comment.id} className="text-xs space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#0F172A]">
                          {comment.userName}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {comment.timestamp}
                        </span>
                      </div>
                      <p className="text-[#746A85]">{comment.text}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Comment Input */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={commentInputs[post.id] || ""}
                  onChange={(e) =>
                    setCommentInputs({ ...commentInputs, [post.id]: e.target.value })
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddComment(post.id);
                    }
                  }}
                  placeholder="Write a reply..."
                  className="flex-1 bg-[#F8FAFC] rounded-xl px-3 py-2 text-xs border border-purple-100 focus:outline-none focus:ring-1 focus:ring-[#8B2FC9]"
                />
                <button
                  onClick={() => handleAddComment(post.id)}
                  className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition active:scale-95"
                >
                  Reply
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SocialCommerceShell>
  );
}

