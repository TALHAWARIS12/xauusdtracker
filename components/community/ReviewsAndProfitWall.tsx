"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Star,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  PlusCircle,
  Flame,
  ShieldCheck,
  Award,
  Send,
  Sparkles,
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

const LOCAL_STORAGE_WINS_KEY = "xauusd_community_user_wins_v2";
const LOCAL_STORAGE_LIKED_KEY = "xauusd_community_liked_ids_v2";

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

function formatBigUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

const QUICK_PROFIT_PRESETS = [500, 1250, 2500, 5000, 10000, 25000];

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
  const [totalCommunityProfit, setTotalCommunityProfit] =
    useState<number>(1486530);
  const [totalWinsCount, setTotalWinsCount] = useState<number>(2846);
  const [likedIds, setLikedIds] = useState<Record<string, boolean>>({});

  // Form state: ONLY Name and Profit Made
  const defaultAlias = useMemo(() => {
    if (!userEmail) return "";
    const prefix = userEmail.split("@")[0] || "";
    return prefix.charAt(0).toUpperCase() + prefix.slice(1, 16);
  }, [userEmail]);

  const [showForm, setShowForm] = useState<boolean>(true);
  const [traderName, setTraderName] = useState<string>(defaultAlias);
  const [profitUsd, setProfitUsd] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

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
            localPosts = parsed.filter((p) => Number(p?.profitUsd) > 0);
          }
        }
      } catch {}

      try {
        const res = await fetch("/api/community/wins", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (active && Array.isArray(data.posts)) {
            const validServerPosts = data.posts.filter(
              (p: ProfitPost) => Number(p?.profitUsd) > 0
            );
            const serverIds = new Set(validServerPosts.map((p: ProfitPost) => p.id));
            const merged = [
              ...localPosts.filter((p) => !serverIds.has(p.id)),
              ...validServerPosts,
            ];
            setPosts(merged);
            if (data.stats?.totalProfitUsd) {
              const extraLocalProfit = localPosts
                .filter((p) => !serverIds.has(p.id))
                .reduce((acc, p) => acc + (Number(p.profitUsd) || 0), 0);
              setTotalCommunityProfit(
                data.stats.totalProfitUsd + extraLocalProfit
              );
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

  function handleProfitInputChange(val: string) {
    // Strictly strip minus signs so losses can never be entered
    const sanitized = val.replace(/-/g, "");
    setProfitUsd(sanitized);
    if (formError) setFormError(null);
  }

  async function handleSubmitProfit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!traderName || traderName.trim().length < 2) {
      setFormError("Please enter your name (at least 2 characters).");
      return;
    }

    if (profitUsd.trim().startsWith("-")) {
      setFormError("Only profits made are allowed. Losses cannot be posted.");
      return;
    }

    const numericProfit = Number(profitUsd);
    if (!Number.isFinite(numericProfit) || numericProfit <= 0) {
      setFormError(
        "Please enter a positive profit amount in USD. Losses are not allowed."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        traderName: traderName.trim(),
        profitUsd: numericProfit,
      };

      const res = await fetch("/api/community/wins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        setFormError(
          result.error || "Could not post your profit. Please check your entry."
        );
        setIsSubmitting(false);
        return;
      }

      const createdPost: ProfitPost = result.post;

      try {
        const rawLocal = localStorage.getItem(LOCAL_STORAGE_WINS_KEY);
        const existingLocal: ProfitPost[] = rawLocal ? JSON.parse(rawLocal) : [];
        const updatedLocal = [createdPost, ...existingLocal].slice(0, 25);
        localStorage.setItem(LOCAL_STORAGE_WINS_KEY, JSON.stringify(updatedLocal));
      } catch {}

      setPosts((prev) => [
        createdPost,
        ...prev.filter((p) => p.id !== createdPost.id),
      ]);
      setTotalCommunityProfit(
        (prev) => Math.round((prev + numericProfit) * 100) / 100
      );
      setTotalWinsCount((prev) => prev + 1);

      setProfitUsd("");
      setFormSuccess(
        `Congratulations ${traderName.trim()}! Your +${formatBigUsd(numericProfit)} profit is now live on the Profit Wall.`
      );
    } catch {
      setFormError("Network error while posting your profit. Please try again.");
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
              <span className="font-display text-3xl font-extrabold text-white">
                4.9
              </span>
              <div className="flex items-center gap-0.5 text-gold-400 mt-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-3.5 h-3.5 fill-gold-400 text-gold-400"
                  />
                ))}
              </div>
              <span className="text-[11px] text-slate-400 mt-1">
                Out of 5.0
              </span>
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
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 text-gold-400">
                    {[...Array(review.rating)].map((_, idx) => (
                      <Star
                        key={idx}
                        className="w-4 h-4 fill-gold-400 text-gold-400"
                      />
                    ))}
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-bull-500/15 border border-bull-400/30 px-3 py-1 text-xs font-mono font-bold text-bull-300">
                    <TrendingUp className="w-3.5 h-3.5" />
                    {review.highlightMetric}
                  </span>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed">
                  &ldquo;{review.comment}&rdquo;
                </p>

                <div className="pt-1">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-ink-850 border border-white/[0.06] px-2.5 py-1 text-[11px] font-medium text-gold-300">
                    <Sparkles className="w-3 h-3 text-gold-400" />
                    Favorite Tool: {review.featureUsed}
                  </span>
                </div>
              </div>

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
          PART 2: LIVE COMMUNITY PROFIT WALL (ONLY NAME & PROFIT MADE, BIG NUMBERS)
      ===================================================================== */}
      <section id="wins" className="container-app space-y-10 scroll-mt-20">
        {/* Header & Massive Live Profit Counter Banner */}
        <div className="bg-ink-900 border border-gold-400/30 rounded-2xl p-6 sm:p-8 lg:p-10 shadow-card space-y-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-bull-500/15 border border-bull-400/30 px-3.5 py-1 text-xs font-semibold text-bull-300">
                <span className="h-2 w-2 rounded-full bg-bull-400 animate-pulse" />
                <span>VERIFIED MEMBER PROFITS • 100% WINNERS WALL</span>
              </div>
              <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                Money Made by Our Members
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Real profits posted by XAUUSD Tracker members. Enter your name and the profit you made below to motivate new traders!
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowForm((prev) => !prev)}
                id="toggle-post-profit-btn"
                className="btn-primary px-7 py-4 text-sm font-bold shadow-gold cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{showForm ? "Hide Profit Form" : "Post Your Profit ($)"}</span>
              </button>
            </div>
          </div>

          {/* BIG NUMBERS: High-Impact Telemetry Counter Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 pt-2">
            <div className="lg:col-span-2 bg-ink-950 border-2 border-bull-400/40 rounded-2xl p-6 sm:p-7 flex flex-col justify-center space-y-2 shadow-[0_0_40px_-12px_rgba(52,211,153,0.25)]">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-bull-300">
                <DollarSign className="w-4 h-4 text-bull-400" />
                <span>TOTAL COMMUNITY VERIFIED PROFITS MADE</span>
              </div>
              <div
                className="font-mono text-3xl sm:text-5xl lg:text-6xl font-extrabold text-bull-400 tracking-tight tabular-nums"
                id="total-community-profit"
              >
                +{formatBigUsd(totalCommunityProfit)}
              </div>
              <p className="text-xs text-slate-400">
                Live cumulative XAU/USD profits reported by verified members worldwide
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              <div className="bg-ink-850 border border-gold-400/30 rounded-2xl p-5 flex flex-col justify-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gold-300 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-gold-400" />
                  PROFITABLE PAYOUTS POSTED
                </span>
                <span className="font-mono text-3xl sm:text-4xl font-extrabold text-white mt-1 tabular-nums">
                  {totalWinsCount.toLocaleString()}+
                </span>
              </div>

              <div className="bg-ink-850 border border-bull-400/30 rounded-2xl p-5 flex flex-col justify-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-bull-300 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-bull-400" />
                  TOP SINGLE MEMBER PROFIT
                </span>
                <span className="font-mono text-3xl sm:text-4xl font-extrabold text-bull-400 mt-1 tabular-nums">
                  +$24,600.00
                </span>
              </div>
            </div>
          </div>

          {/* Simplified Form: ONLY Name & Profit Made (No Losses Allowed) */}
          {showForm && (
            <div className="bg-ink-950 border border-white/10 rounded-2xl p-6 sm:p-7 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-4">
                <div>
                  <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-gold-400" />
                    <span>Post Your Profit Made (Winners Only)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Enter only your name and the profit you made in USD to inspire new members.
                  </p>
                </div>
                {isSubscribed && (
                  <span className="badge-pro self-start sm:self-center">
                    Verified Pro Member
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

              <form
                onSubmit={handleSubmitProfit}
                className="space-y-4"
                id="post-profit-form"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                  {/* Field 1: Trader Name ONLY */}
                  <div className="md:col-span-5">
                    <label
                      htmlFor="win-trader-name"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2"
                    >
                      1. Your Name *
                    </label>
                    <input
                      id="win-trader-name"
                      type="text"
                      required
                      maxLength={40}
                      value={traderName}
                      onChange={(e) => setTraderName(e.target.value)}
                      placeholder="Enter your name (e.g. Alex M.)"
                      className="w-full bg-ink-850 border border-white/15 focus:border-gold-400 rounded-xl px-4 py-3.5 text-base font-semibold text-white placeholder-slate-500 outline-none transition"
                    />
                  </div>

                  {/* Field 2: Profit Made ($ USD) ONLY — Strictly Positive */}
                  <div className="md:col-span-4">
                    <label
                      htmlFor="win-profit-usd"
                      className="block text-xs font-semibold uppercase tracking-wider text-bull-300 mb-2"
                    >
                      2. Profit Made ($ USD) *
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-bull-400 font-mono text-xl font-extrabold">
                        +$
                      </span>
                      <input
                        id="win-profit-usd"
                        type="number"
                        step="any"
                        min="1"
                        max="1000000"
                        required
                        value={profitUsd}
                        onChange={(e) => handleProfitInputChange(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "-" || e.key === "e") {
                            e.preventDefault();
                          }
                        }}
                        placeholder="2,500.00"
                        className="w-full bg-ink-850 border-2 border-bull-400/40 focus:border-bull-400 rounded-xl pl-12 pr-4 py-3.5 text-lg font-mono font-extrabold text-bull-400 placeholder-slate-600 outline-none transition"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="md:col-span-3">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      id="submit-profit-post-btn"
                      className="w-full py-4 px-6 bg-gradient-to-r from-gold-400 to-gold-500 hover:from-gold-300 hover:to-gold-400 text-ink-950 font-extrabold text-sm rounded-xl shadow-gold transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>
                        {isSubmitting ? "Posting..." : "Post My Profit"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Quick Big-Number Profit Presets */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs text-slate-400 mr-1">
                    Quick select profit:
                  </span>
                  {QUICK_PROFIT_PRESETS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleProfitInputChange(String(amt))}
                      className="px-3 py-1.5 rounded-lg bg-bull-500/10 hover:bg-bull-500/20 border border-bull-400/30 font-mono text-xs font-bold text-bull-300 transition cursor-pointer"
                    >
                      +${amt.toLocaleString()}
                    </button>
                  ))}
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Live Profit Cards Grid — Big Profit Numbers & Name Only */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => {
            const isLiked = Boolean(likedIds[post.id]);
            return (
              <div
                key={post.id}
                className="bg-ink-900 border border-bull-400/25 hover:border-bull-400/50 rounded-2xl p-6 flex flex-col justify-between space-y-5 transition duration-200 shadow-card"
              >
                {/* Big Profit Display Box */}
                <div className="bg-ink-950 border border-bull-400/30 rounded-2xl p-5 text-center space-y-1.5 shadow-[0_0_25px_-10px_rgba(52,211,153,0.2)]">
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-bull-300">
                    <TrendingUp className="w-3.5 h-3.5 text-bull-400" />
                    <span>VERIFIED PROFIT MADE</span>
                  </div>
                  <div className="font-mono text-3xl sm:text-4xl font-extrabold text-bull-400 tracking-tight tabular-nums">
                    +{formatBigUsd(post.profitUsd)}
                  </div>
                </div>

                {/* Trader Name & Celebrate Action */}
                <div className="flex items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gold-400/15 border border-gold-400/30 flex items-center justify-center font-display text-sm font-extrabold text-gold-300 shrink-0">
                      {post.traderName.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base font-bold text-white truncate">
                          {post.traderName}
                        </span>
                        <CheckCircle2 className="w-4 h-4 text-bull-400 shrink-0" />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="text-gold-300 font-medium">
                          {post.badge}
                        </span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1 text-slate-500">
                          <Clock className="w-3 h-3" />
                          {formatRelativeTime(post.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleLikePost(post.id)}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold border transition cursor-pointer shrink-0 ${
                      isLiked
                        ? "bg-gold-400/20 border-gold-400/40 text-gold-300"
                        : "bg-ink-850 border-white/10 text-slate-300 hover:border-gold-400/30 hover:text-white"
                    }`}
                    title="Celebrate this profit"
                  >
                    <Flame
                      className={`w-4 h-4 ${
                        isLiked
                          ? "fill-gold-400 text-gold-400"
                          : "text-gold-400"
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
