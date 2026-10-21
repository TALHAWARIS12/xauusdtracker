"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Crown, LogOut, Menu, Sparkles, X } from "lucide-react";
import { handleSignOut } from "@/actions/auth-actions";
import { BrandLogo } from "@/components/layout/BrandLogo";

interface HeaderProps {
  session?: {
    user?: {
      id?: string;
      email?: string | null;
      role?: "USER" | "ADMIN";
    };
  } | null;
  isPro?: boolean;
}

export function Header({ session, isPro = false }: HeaderProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navRoutes = [
    { label: "Overview", href: "/" },
    { label: "Dashboard", href: "/dashboard" },
    { label: "Pricing", href: "/pricing" },
    ...(session?.user ? [{ label: "Account", href: "/account" }] : []),
    ...(session?.user?.role === "ADMIN" ? [{ label: "Admin", href: "/admin" }] : []),
  ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const initials = (session?.user?.email ?? "?").slice(0, 1).toUpperCase();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-ink-950/75 backdrop-blur-xl">
      <div className="container-app flex h-16 items-center justify-between gap-4">
        {/* Brand + live status */}
        <div className="flex items-center gap-4">
          <Link href="/" className="group flex items-center gap-2.5" aria-label="XAUUSD Tracker home">
            <BrandLogo className="h-8 w-8 transition-transform duration-300 group-hover:rotate-12" />
            <span className="font-display text-[15px] font-bold tracking-tight text-white">
              XAUUSD<span className="text-gold-300"> Tracker</span>
            </span>
          </Link>

          <span className="badge-live hidden sm:inline-flex" id="header-live-badge">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-bull-400 opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-bull-400" />
            </span>
            LIVE MARKET
          </span>
        </div>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {navRoutes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              id={`nav-${route.label.toLowerCase()}`}
              className={`relative rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive(route.href) ? "text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              {route.label}
              {isActive(route.href) && (
                <span className="absolute inset-x-3 -bottom-[17px] h-[2px] rounded-full bg-gradient-to-r from-gold-300 to-gold-500" />
              )}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {isPro ? (
            <span className="badge-pro" id="header-pro-badge" title="Your Pro access is active">
              <Crown className="h-3.5 w-3.5" />
              PRO MEMBER
            </span>
          ) : (
            <Link href="/pricing" className="btn-ghost hidden text-gold-300 hover:text-gold-200 sm:inline-flex" id="header-upgrade">
              <Sparkles className="h-4 w-4" />
              Upgrade
            </Link>
          )}

          {session?.user ? (
            <div className="hidden items-center gap-2 md:flex">
              <Link
                href="/account"
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] py-1 pl-1 pr-3 text-sm text-slate-200 transition hover:border-white/20"
                title={session.user.email ?? undefined}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-gold-300 to-gold-600 text-xs font-bold text-ink-950">
                  {initials}
                </span>
                <span className="max-w-[140px] truncate">{session.user.email}</span>
              </Link>
              <form action={handleSignOut}>
                <button type="submit" className="btn-ghost" title="Sign out" id="header-signout">
                  <LogOut className="h-4 w-4" />
                  <span className="sr-only">Sign out</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Link href="/login" className="btn-ghost" id="header-signin">
                Sign in
              </Link>
              <Link href="/register" className="btn-primary px-4 py-2" id="header-get-started">
                Get started
              </Link>
            </div>
          )}

          <button
            type="button"
            className="btn-ghost md:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            id="header-mobile-toggle"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span className="sr-only">Toggle navigation</span>
          </button>
        </div>
      </div>

      {/* Mobile navigation */}
      {mobileOpen && (
        <div id="mobile-nav" className="animate-fade-in border-t border-white/[0.06] bg-ink-950/95 md:hidden">
          <nav className="container-app flex flex-col gap-1 py-3" aria-label="Mobile">
            {navRoutes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                onClick={() => setMobileOpen(false)}
                className={`rounded-lg px-3 py-2.5 text-sm font-medium ${
                  isActive(route.href) ? "bg-white/[0.06] text-white" : "text-slate-300"
                }`}
              >
                {route.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2 border-t border-white/[0.06] pt-3">
              {session?.user ? (
                <form action={handleSignOut} className="w-full">
                  <button type="submit" className="btn-secondary w-full">
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </form>
              ) : (
                <>
                  <Link href="/login" className="btn-secondary flex-1" onClick={() => setMobileOpen(false)}>
                    Sign in
                  </Link>
                  <Link href="/register" className="btn-primary flex-1" onClick={() => setMobileOpen(false)}>
                    Get started
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
