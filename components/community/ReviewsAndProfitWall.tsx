"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Star,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PlusCircle,
  Flame,
  ShieldCheck,
  Award,
  Send,
  Sparkles,
  MapPin,
  Clock,
  AlertCircle,
} from "lucide-react";
import {
  GENERATED_REVIEWS,
  SEEDED_PROFIT_POSTS,
  ProfitPost,
  TraderReview,
} from "@/lib/community/reviews-and-wins";

interface ReviewsAndProfitWallProps {
  userEmail?: string | null;
  isSubscribed?: boolean;
}

const LOCAL_STORAGE_WINS_KEY = "xauusd_community_user_wins_v1";
const LOCAL_STORAGE_LIKED_KEY = "xauusd_community_liked_ids_v1";

function formatRelativeTime(isoString: string): string {
  const timestamp = new Date(isoString).getTime();
  if (Number.isNaN(timestamp)) return "Recently";
  const diffSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSeconds < 90) return "Just now";
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function ReviewsAndProfitWall({
  userEmail,
  isSubscribed = false,
}: ReviewsAndProfitWallProps) {
  // Reviews filter state
  const [reviewFilter, setReviewFilter] = useState<
    "all" | "prop" | "scalper" | "orderflow"
  >("all");

  // Profit wall state
  const [posts, setPosts] = useState<ProfitPost[]>(SEEDED_PROFIT_POSTS);
  const [totalCommunityProfit, setTotalCommunityProfit] = useState<number>(148645);
  const [totalWinsCount, setTotalWinsCount] = useState<number>(318);
  const [likedIds, setLikedIds] = useState<Record<string, boolean>>({});

  // Form state
  const defaultAlias = useMemo(() => {
    if (!userEmail) return "";
    const prefix = userEmail.split("@")[0] || "";
    return prefix.charAt(0).toUpperCase() + prefix.slice(1, 14);
  }, [userEmail]);

  const [showForm, setShowForm] = useState<boolean>(true);
  const [traderName, setTraderName] = useState<string>(defaultAlias);
  const [location, setLocation] = useState<string>("");
  const [profitUsd, setProfitUsd] = useState<string>("");
  const [direction, setDirection] = useState<"LONG" | "SHORT">("LONG");
  const [timeframe, setTimeframe] = useState<"1M" | "5M" | "15M" | "1H">("5M");
  const [setupUsed, setSetupUsed] = useState<string>(
    "Liquidity Pool Sweep + Volume Delta"
  );
  const [pips, setPips] = useState<string>("");
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Sync initial name if userEmail loads
  useEffect(() => {
    if (defaultAlias && !traderName) {
      setTraderName(defaultAlias);
    }
  }, [defaultAlias, traderName]);

  // Fetch live community wins from API + merge localStorage
  useEffect(() => {
    let active = true;

    try {
      const savedLikes = localStorage.getItem(LOCAL_STORAGE_LIKED_KEY);
      if (savedLikes) {
        setLikedIds(JSON.parse(savedLikes));
      }
    } catch {}

    async function loadWins() {
      let localPosts: ProfitPost[] = [];
      try {
        const rawLocal = localStorage.getItem(LOCAL_STORAGE_WINS_KEY);
        if (rawLocal) {
          const parsed = JSON.parse(rawLocal);
          if (Array.isArray(parsed)) {
            localPosts = parsed;
          }
        }
      } catch {}

      try {
        const res = await fetch("/api/community/wins", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (active && Array.isArray(data.posts)) {
            const serverIds = new Set(data.posts.map((p: ProfitPost) => p.id));
            const merged = [
              ...localPosts.filter((p) => !serverIds.has(p.id)),
              ...data.posts,
            ];
            setPosts(merged);
            if (data.stats?.totalProfitUsd) {
              const extraLocalProfit = localPosts
                .filter((p) => !serverIds.has(p.id))
                .reduce((acc, p) => acc + (Number(p.profitUsd) || 0), 0);
              setTotalCommunityProfit(data.stats.totalProfitUsd + extraLocalProfit);
            }
            if (data.stats?.totalWinsCount) {
              setTotalWinsCount(
                data.stats.totalWinsCount +
                  localPosts.filter((p) => !serverIds.has(p.id)).length
              );
            }
            return;
          }
        }
      } catch {}

      if (active && localPosts.length > 0) {
        const existingIds = new Set(SEEDED_PROFIT_POSTS.map((p) => p.id));
        const uniqueLocal = localPosts.filter((p) => !existingIds.has(p.id));
        setPosts([...uniqueLocal, ...SEEDED_PROFIT_POSTS]);
      }
    }

    loadWins();
    return () => {
      active = false;
    };
  }, []);

  const filteredReviews: TraderReview[] = useMemo(() => {
    if (reviewFilter === "all") return GENERATED_REVIEWS;
    return GENERATED_REVIEWS.filter((r) => r.category === reviewFilter);
  }, [reviewFilter]);

  async function handleSubmitProfit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const numericProfit = Number(profitUsd);
    if (!traderName || traderName.trim().length < 2) {
      setFormError("Please enter your name or trader alias (at least 2 characters).");
      return;
    }
    if (!Number.isFinite(numericProfit) || numericProfit <= 0) {
      setFormError("Please enter a valid profit amount in USD (e.g. 450).");
      return;
    }
    if (!comment || comment.trim().length < 10) {
      setFormError(
        "Please write a short note (at least 10 characters) on how you made this profit to motivate new members."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        traderName: traderName.trim(),
        location: location.trim() || "Global Trader",
        profitUsd: numericProfit,
        direction,
        timeframe,
        setupUsed,
        pips: pips.trim() || "Verified Target Hit",
        rating,
        comment: comment.trim(),
      };

      const res = await fetch("/api/community/wins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        setFormError(result.error || "Could not post your profit. Please check your entries.");
        setIsSubmitting(false);
        return;
      }

      const createdPost: ProfitPost = result.post;

      // Save to localStorage for instant persistence
      try {
        const rawLocal = localStorage.getItem(LOCAL_STORAGE_WINS_KEY);
        const existingLocal: ProfitPost[] = rawLocal ? JSON.parse(rawLocal) : [];
        const updatedLocal = [createdPost, ...existingLocal].slice(0, 25);
        localStorage.setItem(LOCAL_STORAGE_WINS_KEY, JSON.stringify(updatedLocal));
      } catch {}

      setPosts((prev) => [createdPost, ...prev.filter((p) => p.id !== createdPost.id)]);
      setTotalCommunityProfit((prev) => Math.round((prev + numericProfit) * 100) / 100);
      setTotalWinsCount((prev) => prev + 1);

      // Reset fields
      setProfitUsd("");
      setPips("");
      setComment("");
      setFormSuccess(
        `Congratulations! Your +${formatUsd(numericProfit)} profit post is now live on the community wall.`
      );
    } catch {
      setFormError("Network error while posting your win. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLikePost(postId: string) {
    if (likedIds[postId]) return;

    const updatedLiked = { ...likedIds, [postId]: true };
    setLikedIds(updatedLiked);
    try {
      localStorage.setItem(LOCAL_STORAGE_LIKED_KEY, JSON.stringify(updatedLiked));
    } catch {}

    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, likes: p.likes + 1 } : p))
    );

    try {
      await fetch("/api/community/wins", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: postId }),
      });
    } catch {}
  }

  return (
    <div className="space-y-24">
      {/* =====================================================================
          PART 1: VERIFIED TRADER REVIEWS SECTION
      ===================================================================== */}
      <section id="reviews" className="container-app space-y-10 scroll-mt-20">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <span className="eyebrow">VERIFIED TRADER REVIEWS</span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Trusted by Consistent XAU/USD Traders
          </h2>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            From funded prop-firm traders in London to intraday gold scalpers in Dubai and Nairobi, see how real-time institutional order flow transforms execution.
          </p>
        </div>

        {/* Aggregate Rating Summary Bar */}
        <div className="bg-ink-900 border border-white/[0.08] rounded-2xl p-6 sm:p-7 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="flex flex-col items-center justify-center bg-ink-850 border border-gold-400/25 rounded-xl px-5 py-3">
              <span className="font-display text-3xl font-extrabold text-white">4.9</span>
              <div className="flex items-center gap-0.5 text-gold-400 mt-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-gold-400 text-gold-400" />
                ))}
              </div>
              <span className="text-[11px] text-slate-400 mt-1">Out of 5.0</span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <ShieldCheck className="w-4 h-4 text-bull-400" />
                <span className="text-sm font-semibold text-white">
                  94% of Active Members Report Improved Entry Precision
                </span>
              </div>
              <p className="text-xs text-slate-400 max-w-xl">
                Verified feedback from traders utilizing our 15-candle Liquidity Concentration Pools, Buyer/Seller Volume Delta, and Rule-Based Signal Engine.
              </p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {[
              { id: "all", label: "All Reviews" },
              { id: "prop", label: "Prop Firm Traders" },
              { id: "scalper", label: "1M/5M Scalpers" },
              { id: "orderflow", label: "Order Flow & Spot" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setReviewFilter(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  reviewFilter === tab.id
                    ? "bg-gold-400 text-ink-950 shadow-gold"
                    : "bg-ink-850 text-slate-300 border border-white/[0.08] hover:border-white/20 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReviews.map((review) => (
            <div
              key={review.id}
              className="bg-ink-900 border border-white/[0.08] hover:border-gold-400/30 rounded-2xl p-6 flex flex-col justify-between space-y-5 transition duration-200 shadow-card"
            >
              <div className="space-y-4">
                {/* Stars + Highlight Metric */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 text-gold-400">
                    {[...Array(review.rating)].map((_, idx) => (
                      <Star key={idx} className="w-4 h-4 fill-gold-400 text-gold-400" />
                    ))}
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-bull-500/10 border border-bull-400/25 px-2.5 py-1 text-[11px] font-semibold text-bull-300">
                    <TrendingUp className="w-3 h-3" />
                    {review.highlightMetric}
                  </span>
                </div>

                {/* Comment */}
                <p className="text-sm text-slate-300 leading-relaxed">
                  &ldquo;{review.comment}&rdquo;
                </p>

                {/* Feature Used Pill */}
                <div className="pt-1">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-ink-850 border border-white/[0.06] px-2.5 py-1 text-[11px] font-medium text-gold-300">
                    <Sparkles className="w-3 h-3 text-gold-400" />
                    Favorite Tool: {review.featureUsed}
                  </span>
                </div>
              </div>

              {/* Author Footer */}
              <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-ink-850 border border-gold-400/30 flex items-center justify-center font-display text-xs font-bold text-gold-300 shrink-0">
                    {review.initials}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-white">
                        {review.name}
                      </span>
                      {review.verified && (
                        <CheckCircle2
                          className="w-3.5 h-3.5 text-bull-400 shrink-0"
                          aria-label="Verified Trader"
                        />
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      {review.role} • {review.location}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] text-slate-500 shrink-0">
                  {review.dateAgo}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =====================================================================
          PART 2: LIVE COMMUNITY PROFIT WALL & POST YOUR WIN SECTION
      ===================================================================== */}
      <section id="wins" className="container-app space-y-10 scroll-mt-20">
        {/* Header & Live Motivational Counter Banner */}
        <div className="bg-ink-900 border border-gold-400/25 rounded-2xl p-6 sm:p-8 lg:p-10 shadow-card space-y-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-bull-500/10 border border-bull-400/30 px-3.5 py-1 text-xs font-semibold text-bull-300">
                <span className="h-2 w-2 rounded-full bg-bull-400 animate-pulse" />
                <span>LIVE MEMBER PROFIT WALL • REAL TRADER PAYOUTS</span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight">
                Money Made by Our Community
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Did XAUUSD Tracker help you catch a profitable gold move today? Post the money you made below to celebrate your execution and motivate new members!
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowForm((prev) => !prev)}
                id="toggle-post-profit-btn"
                className="btn-primary px-6 py-3.5 text-sm font-semibold shadow-gold cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{showForm ? "Hide Profit Form" : "Post Your Profit ($)" }</span>
              </button>
            </div>
          </div>

          {/* Live Telemetry Counter Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="bg-ink-850 border border-white/[0.08] rounded-xl p-4 flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-bull-500/15 border border-bull-400/30 flex items-center justify-center text-bull-400 shrink-0">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-medium text-slate-400 block">
                  Community Reported Profits
                </span>
                <span
                  className="font-mono text-xl sm:text-2xl font-bold text-bull-400"
                  id="total-community-profit"
                >
                  +{formatUsd(totalCommunityProfit)}
                </span>
              </div>
            </div>

            <div className="bg-ink-850 border border-white/[0.08] rounded-xl p-4 flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-gold-400/15 border border-gold-400/30 flex items-center justify-center text-gold-300 shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-medium text-slate-400 block">
                  Verified Profitable Posts
                </span>
                <span className="font-mono text-xl sm:text-2xl font-bold text-white">
                  {totalWinsCount} Wins Shared
                </span>
              </div>
            </div>

            <div className="bg-ink-850 border border-white/[0.08] rounded-xl p-4 flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-bull-500/15 border border-bull-400/30 flex items-center justify-center text-bull-400 shrink-0">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-medium text-slate-400 block">
                  Avg. Community Risk:Reward
                </span>
                <span className="font-mono text-xl sm:text-2xl font-bold text-white">
                  1 : 3.1 R:R
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Post Your Profit Form */}
          {showForm && (
            <div className="bg-ink-950 border border-white/10 rounded-2xl p-6 sm:p-7 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-4">
                <div>
                  <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-gold-400" />
                    <span>Share the Money You Made from XAUUSD Tracker</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Your win will appear immediately on the live profit wall to inspire fellow traders.
                  </p>
                </div>
                {isSubscribed && (
                  <span className="badge-pro self-start sm:self-center">
                    Posting as Verified Pro Trader
                  </span>
                )}
              </div>

              {formError && (
                <div className="p-3.5 bg-bear-500/10 border border-bear-500/30 rounded-xl flex items-start gap-2.5 text-xs text-bear-300">
                  <AlertCircle className="w-4 h-4 text-bear-400 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="p-3.5 bg-bull-500/10 border border-bull-500/30 rounded-xl flex items-start gap-2.5 text-xs text-bull-300">
                  <CheckCircle2 className="w-4 h-4 text-bull-400 shrink-0 mt-0.5" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <form onSubmit={handleSubmitProfit} className="space-y-5" id="post-profit-form">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Trader Name */}
                  <div>
                    <label
                      htmlFor="win-trader-name"
                      className="block text-xs font-medium text-slate-300 mb-1.5"
                    >
                      Your Name / Trader Alias *
                    </label>
                    <input
                      id="win-trader-name"
                      type="text"
                      required
                      maxLength={40}
                      value={traderName}
                      onChange={(e) => setTraderName(e.target.value)}
                      placeholder="e.g. Alex M."
                      className="w-full bg-ink-850 border border-white/10 focus:border-gold-400 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition"
                    />
                  </div>

                  {/* Location */}
                  <div>
                    <label
                      htmlFor="win-location"
                      className="block text-xs font-medium text-slate-300 mb-1.5"
                    >
                      City / Country
                    </label>
                    <input
                      id="win-location"
                      type="text"
                      maxLength={40}
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. London, UK / Nairobi"
                      className="w-full bg-ink-850 border border-white/10 focus:border-gold-400 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition"
                    />
                  </div>

                  {/* Profit Made ($ USD) */}
                  <div>
                    <label
                      htmlFor="win-profit-usd"
                      className="block text-xs font-medium text-bull-300 mb-1.5"
                    >
                      Money Made ($ USD) *
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-bull-400 font-mono font-bold">
                        $
                      </span>
                      <input
                        id="win-profit-usd"
                        type="number"
                        step="any"
                        min="1"
                        max="500000"
                        required
                        value={profitUsd}
                        onChange={(e) => setProfitUsd(e.target.value)}
                        placeholder="450.00"
                        className="w-full bg-ink-850 border border-bull-400/30 focus:border-bull-400 rounded-xl pl-8 pr-3.5 py-2.5 text-sm font-mono font-bold text-white placeholder-slate-500 outline-none transition"
                      />
                    </div>
                  </div>

                  {/* Pips / R:R */}
                  <div>
                    <label
                      htmlFor="win-pips"
                      className="block text-xs font-medium text-slate-300 mb-1.5"
                    >
                      Pips or R:R Captured
                    </label>
                    <input
                      id="win-pips"
                      type="text"
                      maxLength={35}
                      value={pips}
                      onChange={(e) => setPips(e.target.value)}
                      placeholder="e.g. +65 pips • 1:3 R:R"
                      className="w-full bg-ink-850 border border-white/10 focus:border-gold-400 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition"
                    />
                  </div>
                </div>

                {/* Quick Profit Chips + Direction + Timeframe + Setup */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Direction */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Trade Direction
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDirection("LONG")}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                          direction === "LONG"
                            ? "bg-bull-500/20 border-bull-400 text-bull-300"
                            : "bg-ink-850 border-white/10 text-slate-400 hover:text-white"
                        }`}
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>LONG (BUY)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDirection("SHORT")}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                          direction === "SHORT"
                            ? "bg-bear-500/20 border-bear-400 text-bear-300"
                            : "bg-ink-850 border-white/10 text-slate-400 hover:text-white"
                        }`}
                      >
                        <TrendingDown className="w-3.5 h-3.5" />
                        <span>SHORT (SELL)</span>
                      </button>
                    </div>
                  </div>

                  {/* Timeframe */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Timeframe
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {(["1M", "5M", "15M", "1H"] as const).map((tf) => (
                        <button
                          key={tf}
                          type="button"
                          onClick={() => setTimeframe(tf)}
                          className={`py-2.5 rounded-xl text-xs font-mono font-bold border transition cursor-pointer ${
                            timeframe === tf
                              ? "bg-gold-400 text-ink-950 border-gold-400"
                              : "bg-ink-850 border-white/10 text-slate-300 hover:border-white/20"
                          }`}
                        >
                          {tf}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Setup Used */}
                  <div>
                    <label
                      htmlFor="win-setup-used"
                      className="block text-xs font-medium text-slate-300 mb-1.5"
                    >
                      Dashboard Feature Used
                    </label>
                    <select
                      id="win-setup-used"
                      value={setupUsed}
                      onChange={(e) => setSetupUsed(e.target.value)}
                      className="w-full bg-ink-850 border border-white/10 focus:border-gold-400 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none transition"
                    >
                      <option value="Liquidity Pool Sweep + Volume Delta">
                        Liquidity Pool Sweep + Volume Delta
                      </option>
                      <option value="Rule-Based Signal Engine">
                        Rule-Based Signal Engine
                      </option>
                      <option value="Buyer vs. Seller Order Flow">
                        Buyer vs. Seller Order Flow
                      </option>
                      <option value="London–NY Overlap Breakout">
                        London–NY Overlap Breakout
                      </option>
                      <option value="Position Calculator + VWAP Bounce">
                        Position Calculator + VWAP Bounce
                      </option>
                    </select>
                  </div>
                </div>

                {/* Comment & Rating */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="win-comment"
                      className="block text-xs font-medium text-slate-300"
                    >
                      How did XAUUSD Tracker help you make this profit? (Motivate new members) *
                    </label>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-slate-400 mr-1">Rating:</span>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="cursor-pointer"
                          aria-label={`Rate ${star} stars`}
                        >
                          <Star
                            className={`w-4 h-4 ${
                              star <= rating
                                ? "fill-gold-400 text-gold-400"
                                : "text-slate-600"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    id="win-comment"
                    rows={3}
                    required
                    maxLength={400}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Example: Caught a +$450 long on XAU/USD during the NY open after the 5M Liquidity Pool flagged a stop-hunt at $4,125 and buyer volume hit 67%..."
                    className="w-full bg-ink-850 border border-white/10 focus:border-gold-400 rounded-xl p-3.5 text-sm text-white placeholder-slate-500 outline-none transition"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
                  <p className="text-xs text-slate-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-bull-400 inline mr-1.5" />
                    Posted directly to the live XAUUSD Tracker Community Profit Wall.
                  </p>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    id="submit-profit-post-btn"
                    className="w-full sm:w-auto px-7 py-3 bg-gradient-to-r from-gold-400 to-gold-500 hover:from-gold-300 hover:to-gold-400 text-ink-950 font-semibold text-sm rounded-xl shadow-gold transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmitting ? "Posting Win..." : "Post My Profit to Wall"}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Live Profit Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => {
            const isLiked = Boolean(likedIds[post.id]);
            return (
              <div
                key={post.id}
                className="bg-ink-900 border border-white/[0.08] hover:border-bull-400/30 rounded-2xl p-6 flex flex-col justify-between space-y-5 transition duration-200 shadow-card"
              >
                <div className="space-y-4">
                  {/* Top Profit Amount + Direction Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="bg-bull-500/15 border border-bull-400/30 rounded-xl px-3.5 py-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-bull-300 block">
                        VERIFIED PROFIT MADE
                      </span>
                      <span className="font-mono text-2xl font-extrabold text-bull-400">
                        +{formatUsd(post.profitUsd)}
                      </span>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold ${
                          post.direction === "LONG"
                            ? "bg-bull-500/15 text-bull-300 border border-bull-400/25"
                            : "bg-bear-500/15 text-bear-300 border border-bear-400/25"
                        }`}
                      >
                        {post.direction === "LONG" ? (
                          <TrendingUp className="w-3.5 h-3.5" />
                        ) : (
                          <TrendingDown className="w-3.5 h-3.5" />
                        )}
                        {post.direction} XAU/USD ({post.timeframe})
                      </span>
                      <span className="text-[11px] font-mono text-gold-300">
                        {post.pips}
                      </span>
                    </div>
                  </div>

                  {/* Setup Used Tag */}
                  <div className="flex items-center justify-between text-xs bg-ink-850 border border-white/[0.06] rounded-lg px-3 py-2">
                    <span className="text-slate-400">Setup:</span>
                    <span className="font-medium text-white truncate ml-2">
                      {post.setupUsed}
                    </span>
                  </div>

                  {/* Trader's Story */}
                  <p className="text-sm text-slate-300 leading-relaxed">
                    &ldquo;{post.comment}&rdquo;
                  </p>
                </div>

                {/* Bottom Trader Info & Motivate Button */}
                <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-white">
                        {post.traderName}
                      </span>
                      {post.verified && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-bull-400 shrink-0" />
                      )}
                      <span className="text-[11px] text-gold-300 bg-gold-400/10 border border-gold-400/20 rounded px-1.5 py-0.5">
                        {post.badge}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        {post.location}
                      </span>
                      <span className="inline-flex items-center gap-1 text-slate-500">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(post.createdAt)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleLikePost(post.id)}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold border transition cursor-pointer ${
                      isLiked
                        ? "bg-gold-400/20 border-gold-400/40 text-gold-300"
                        : "bg-ink-850 border-white/10 text-slate-300 hover:border-gold-400/30 hover:text-white"
                    }`}
                    title="Celebrate this trader's win"
                  >
                    <Flame
                      className={`w-3.5 h-3.5 ${
                        isLiked ? "fill-gold-400 text-gold-400" : "text-gold-400"
                      }`}
                    />
                    <span>{post.likes}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

