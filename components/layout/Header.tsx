"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn, LogOut, User as UserIcon, Shield, Terminal, Activity } from "lucide-react";
import { handleSignOut } from "@/actions/auth-actions";

interface HeaderProps {
  session?: {
    user?: {
      id?: string;
      email?: string | null;
      role?: "USER" | "ADMIN";
    };
  } | null;
}

export function Header({ session }: HeaderProps) {
  const pathname = usePathname();

  const navRoutes = [
    { label: "MARKET OVERVIEW", href: "/" },
    { label: "RADAR TERMINAL", href: "/terminal" },
    ...(session?.user?.role === "ADMIN"
      ? [{ label: "SYS ADMIN", href: "/admin" }]
      : []),
  ];

  return (
    <header className="w-full bg-terminal-surface border-b border-terminal-border text-xs font-mono select-none sticky top-0 z-50">
      {/* Top Bloomberg ticker bar */}
      <div className="bg-terminal-black/90 px-4 py-1 border-b border-terminal-border/60 flex items-center justify-between text-[11px] text-terminal-subtext">
        <div className="flex items-center gap-3">
          <span className="text-terminal-gold font-bold tracking-wider">XAU/USD</span>
          <span className="text-terminal-green font-semibold">$2,714.85</span>
          <span className="text-terminal-green flex items-center gap-1">
            ▲ +0.64% (+17.20)
          </span>
          <span className="hidden md:inline text-terminal-border">|</span>
          <span className="hidden md:inline">24H HIGH: <span className="text-gray-300">2,722.40</span></span>
          <span className="hidden md:inline">24H LOW: <span className="text-gray-300">2,698.10</span></span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-terminal-subtext/70 hidden sm:inline">SYSTEM STATUS:</span>
          <span className="inline-flex items-center gap-1 text-[10px] text-terminal-green px-1.5 py-0.5 rounded bg-terminal-green/10 border border-terminal-green/20">
            NOMINAL
          </span>
        </div>
      </div>

      {/* Main navigation header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Brand & Live Radar Dot */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="p-1.5 bg-terminal-card border border-terminal-border rounded group-hover:border-terminal-gold transition-colors">
              <Terminal className="w-5 h-5 text-terminal-gold" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold tracking-wider text-white text-sm group-hover:text-terminal-gold transition-colors">
                XAU/USD INTELLIGENCE TERMINAL
              </span>
              <span className="text-[10px] text-terminal-subtext tracking-widest uppercase">
                BLOOMBERG PROTOCOL // v4.2
              </span>
            </div>
          </Link>

          {/* Blinking green LIVE radar dot */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-terminal-black/80 rounded border border-terminal-border/80">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-terminal-green opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-terminal-green shadow-[0_0_8px_#00E676]"></span>
            </span>
            <span className="text-[11px] font-bold text-terminal-green tracking-wider">
              LIVE RADAR
            </span>
          </div>
        </div>

        {/* Route Indicators */}
        <nav className="hidden md:flex items-center gap-1">
          {navRoutes.map((route) => {
            const isActive =
              route.href === "/"
                ? pathname === "/"
                : pathname.startsWith(route.href);
            return (
              <Link
                key={route.href}
                href={route.href}
                className={`px-3 py-1.5 rounded transition-all duration-150 flex items-center gap-1.5 ${
                  isActive
                    ? "bg-terminal-card border border-terminal-gold text-terminal-gold shadow-[0_0_10px_rgba(245,158,11,0.15)] font-bold"
                    : "text-terminal-subtext hover:text-white hover:bg-terminal-card/50 border border-transparent"
                }`}
              >
                {isActive && <span className="text-terminal-gold">›</span>}
                <span>{route.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Auth Section */}
        <div className="flex items-center gap-3">
          {session?.user ? (
            <div className="flex items-center gap-3">
              {/* User Email Badge */}
              <div className="flex items-center gap-2 px-2.5 py-1 bg-terminal-card border border-terminal-border rounded text-terminal-subtext">
                <UserIcon className="w-3.5 h-3.5 text-terminal-gold" />
                <span className="text-gray-200 max-w-[140px] truncate">
                  {session.user.email}
                </span>
                <span
                  className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase ${
                    session.user.role === "ADMIN"
                      ? "bg-terminal-gold/20 text-terminal-gold border border-terminal-gold/40"
                      : "bg-terminal-green/20 text-terminal-green border border-terminal-green/40"
                  }`}
                >
                  {session.user.role}
                </span>
              </div>

              {/* Logout Button */}
              <form action={handleSignOut}>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-terminal-black hover:bg-terminal-red/10 border border-terminal-border hover:border-terminal-red/50 text-terminal-subtext hover:text-terminal-red rounded transition-all cursor-pointer"
                  title="Disconnect terminal session"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">LOGOUT</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors ${
                  pathname === "/login"
                    ? "bg-terminal-card border border-terminal-gold text-terminal-gold font-bold"
                    : "bg-terminal-black border border-terminal-border text-terminal-subtext hover:text-white hover:border-terminal-gold"
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>LOGIN</span>
              </Link>
              <Link
                href="/register"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors ${
                  pathname === "/register"
                    ? "bg-terminal-gold text-terminal-black font-bold border border-terminal-gold"
                    : "bg-terminal-gold/90 hover:bg-terminal-gold text-terminal-black font-bold border border-terminal-gold shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                }`}
              >
                <span>SIGN UP</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
