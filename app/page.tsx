import Link from "next/link";
import { Terminal, Shield, TrendingUp, Cpu, Activity, BarChart3, ArrowRight, Zap, Radio, Check, Lock, Sparkles } from "lucide-react";
import { auth } from "@/auth";

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="flex-1 bg-terminal-black text-xs font-mono p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-8 select-none">
      {/* Top Banner Notice */}
      <div className="bg-terminal-surface border border-terminal-border rounded-lg p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-2 bg-terminal-card border border-terminal-gold/40 rounded text-terminal-gold shrink-0">
            <Radio className="w-5 h-5 animate-pulse text-terminal-gold" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-white text-sm">
                XAU/USD GOLD INTELLIGENCE PLATFORM
              </span>
              <span className="text-[10px] bg-terminal-green/20 text-terminal-green border border-terminal-green/40 px-1.5 py-0.5 rounded font-bold">
                STREAMING M1/M5/M15
              </span>
            </div>
            <p className="text-terminal-subtext text-[11px] mt-0.5">
              Live spot bullion telemetry · Normalized from 1:1 physical troy ounce gold backing (PAXG/USDT) · WebSocket engine active.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/pricing"
            className="px-3.5 py-2 bg-terminal-card hover:bg-terminal-surface border border-terminal-gold text-terminal-gold font-bold rounded flex items-center gap-1.5 transition text-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-terminal-gold" />
            <span>PLANS ($99/MO)</span>
          </Link>
          {session ? (
            <Link
              href="/terminal"
              className="px-4 py-2 bg-terminal-gold hover:bg-amber-400 text-terminal-black font-extrabold rounded flex items-center gap-2 transition shadow-[0_0_15px_rgba(245,158,11,0.25)] text-xs"
            >
              <span>OPEN RADAR TERMINAL</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 bg-terminal-gold hover:bg-amber-400 text-terminal-black font-extrabold rounded flex items-center gap-2 transition shadow-[0_0_15px_rgba(245,158,11,0.25)] text-xs"
            >
              <span>OPERATOR LOGIN</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      {/* Grid of Key Terminal Metric Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-terminal-card border border-terminal-border rounded-lg p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-terminal-subtext text-[11px] mb-2">
            <span>SPOT SPOT PRICE (XAU/USD)</span>
            <Activity className="w-4 h-4 text-terminal-green" />
          </div>
          <div className="text-2xl font-bold text-white tracking-wide tabular-nums">
            $2,714.85
          </div>
          <div className="flex items-center justify-between text-[11px] mt-3 pt-2 border-t border-terminal-border/60">
            <span className="text-terminal-green font-bold">▲ +$17.20 (+0.64%)</span>
            <span className="text-terminal-subtext">24H TICK VOL: 48.5K</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-terminal-card border border-terminal-border rounded-lg p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-terminal-subtext text-[11px] mb-2">
            <span>RADAR BIAS REGIME</span>
            <TrendingUp className="w-4 h-4 text-terminal-gold" />
          </div>
          <div className="text-2xl font-bold text-terminal-green tracking-wide">
            BULLISH
          </div>
          <div className="flex items-center justify-between text-[11px] mt-3 pt-2 border-t border-terminal-border/60">
            <span className="text-terminal-subtext">CONFIDENCE: <strong className="text-terminal-gold">88.4%</strong></span>
            <span className="text-terminal-green">EMA 20/50 ALIGNED</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-terminal-card border border-terminal-border rounded-lg p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-terminal-subtext text-[11px] mb-2">
            <span>VOLUME DELTA (MODELLED)</span>
            <BarChart3 className="w-4 h-4 text-terminal-subtext" />
          </div>
          <div className="text-2xl font-bold text-white tracking-wide tabular-nums">
            +3,410 Units
          </div>
          <div className="flex items-center justify-between text-[11px] mt-3 pt-2 border-t border-terminal-border/60">
            <span className="text-terminal-green">BID DOMINANCE: 63%</span>
            <span className="text-terminal-subtext">CVD: BULLISH</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-terminal-card border border-terminal-border rounded-lg p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-terminal-subtext text-[11px] mb-2">
            <span>VOLATILITY REGIME (ATR 14)</span>
            <Zap className="w-4 h-4 text-terminal-gold" />
          </div>
          <div className="text-2xl font-bold text-terminal-gold tracking-wide tabular-nums">
            $18.42 / H
          </div>
          <div className="flex items-center justify-between text-[11px] mt-3 pt-2 border-t border-terminal-border/60">
            <span className="text-terminal-subtext">REGIME: EXPANDING</span>
            <span className="text-terminal-gold">RANGE: NORMAL</span>
          </div>
        </div>
      </div>

      {/* Value Proposition & Feature Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-terminal-surface border border-terminal-border rounded-lg p-5 space-y-2.5">
          <div className="flex items-center gap-2 text-terminal-gold font-bold text-xs uppercase">
            <Radio className="w-4 h-4 text-terminal-gold" />
            <span>CONCENTRATION DEPTH POOLS</span>
          </div>
          <p className="text-gray-300 text-xs leading-relaxed">
            Algorithmic stop-loss clusters and take-profit expansion levels derived directly from 15-candle price structures and Fibonacci 0.618 golden extensions.
          </p>
        </div>

        <div className="bg-terminal-surface border border-terminal-border rounded-lg p-5 space-y-2.5">
          <div className="flex items-center gap-2 text-terminal-green font-bold text-xs uppercase">
            <Zap className="w-4 h-4 text-terminal-green" />
            <span>RULE-BASED SETUP ENGINE</span>
          </div>
          <p className="text-gray-300 text-xs leading-relaxed">
            Transparent confluence engine testing EMA(20/50) trend direction, RSI momentum boundaries, and minimum 1.5:1 reward-to-risk ratios. No signal is forced during consolidation.
          </p>
        </div>

        <div className="bg-terminal-surface border border-terminal-border rounded-lg p-5 space-y-2.5">
          <div className="flex items-center gap-2 text-terminal-subtext font-bold text-xs uppercase">
            <Cpu className="w-4 h-4 text-white" />
            <span>INTELLIGENT RISK CALCULATOR</span>
          </div>
          <p className="text-gray-300 text-xs leading-relaxed">
            Interactive lot-sizing and pip risk calculator calibrated for standard 100 troy ounce gold contracts, with live stop and target distance validation.
          </p>
        </div>
      </div>

      {/* Main Terminal Body Grid: Technical Levels & Live Radar Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Institutional Pivot Matrix & Radar Scanner */}
        <div className="lg:col-span-2 space-y-6">
          {/* Institutional Pivot Matrix */}
          <div className="bg-terminal-surface border border-terminal-border rounded-lg overflow-hidden">
            <div className="bg-terminal-card px-4 py-2.5 border-b border-terminal-border flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-terminal-gold" />
                ESTIMATED INSTITUTIONAL PRICE LEVELS // DAILY PIVOTS
              </span>
              <span className="text-[10px] text-terminal-subtext">CALCULATED AT 00:00 UTC</span>
            </div>
            <div className="p-4 overflow-x-auto">
              <table className="w-full text-left font-mono">
                <thead>
                  <tr className="text-terminal-subtext border-b border-terminal-border text-[10px] uppercase">
                    <th className="pb-2">LEVEL NAME</th>
                    <th className="pb-2">PRICE (USD)</th>
                    <th className="pb-2">DISTANCE</th>
                    <th className="pb-2">ORDER BOOK WEIGHT</th>
                    <th className="pb-2 text-right">ACTION BIAS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-terminal-border/40 text-xs tabular-nums">
                  <tr className="hover:bg-terminal-card/50 transition">
                    <td className="py-2.5 font-bold text-terminal-red">RESISTANCE 3 (R3)</td>
                    <td className="py-2.5 text-gray-200">$2,748.50</td>
                    <td className="py-2.5 text-terminal-subtext">+33.65</td>
                    <td className="py-2.5">
                      <div className="w-24 bg-terminal-black h-1.5 rounded-full overflow-hidden">
                        <div className="bg-terminal-red h-full" style={{ width: "85%" }}></div>
                      </div>
                    </td>
                    <td className="py-2.5 text-right text-terminal-red font-semibold">STRONG LIQUIDITY REJECTION</td>
                  </tr>
                  <tr className="hover:bg-terminal-card/50 transition">
                    <td className="py-2.5 font-bold text-terminal-red">RESISTANCE 2 (R2)</td>
                    <td className="py-2.5 text-gray-200">$2,732.10</td>
                    <td className="py-2.5 text-terminal-subtext">+17.25</td>
                    <td className="py-2.5">
                      <div className="w-24 bg-terminal-black h-1.5 rounded-full overflow-hidden">
                        <div className="bg-terminal-red h-full" style={{ width: "65%" }}></div>
                      </div>
                    </td>
                    <td className="py-2.5 text-right text-terminal-red font-semibold">BREAKOUT TRIGGER LEVEL</td>
                  </tr>
                  <tr className="hover:bg-terminal-card/50 transition">
                    <td className="py-2.5 font-bold text-terminal-red">RESISTANCE 1 (R1)</td>
                    <td className="py-2.5 text-gray-200">$2,721.40</td>
                    <td className="py-2.5 text-terminal-subtext">+6.55</td>
                    <td className="py-2.5">
                      <div className="w-24 bg-terminal-black h-1.5 rounded-full overflow-hidden">
                        <div className="bg-terminal-gold h-full" style={{ width: "45%" }}></div>
                      </div>
                    </td>
                    <td className="py-2.5 text-right text-terminal-gold font-semibold">INTERMEDIATE CEILING</td>
                  </tr>
                  <tr className="bg-terminal-gold/5 font-bold">
                    <td className="py-2.5 text-terminal-gold">CURRENT SPOT</td>
                    <td className="py-2.5 text-white">$2,714.85</td>
                    <td className="py-2.5 text-terminal-green">ACTIVE</td>
                    <td className="py-2.5 text-terminal-subtext">AT MARKET</td>
                    <td className="py-2.5 text-right text-terminal-green">FAIR VALUE GAP (FVG)</td>
                  </tr>
                  <tr className="hover:bg-terminal-card/50 transition">
                    <td className="py-2.5 font-bold text-terminal-green">SUPPORT 1 (S1)</td>
                    <td className="py-2.5 text-gray-200">$2,704.20</td>
                    <td className="py-2.5 text-terminal-subtext">-10.65</td>
                    <td className="py-2.5">
                      <div className="w-24 bg-terminal-black h-1.5 rounded-full overflow-hidden">
                        <div className="bg-terminal-green h-full" style={{ width: "60%" }}></div>
                      </div>
                    </td>
                    <td className="py-2.5 text-right text-terminal-green font-semibold">DEMAND ORDER BLOCK</td>
                  </tr>
                  <tr className="hover:bg-terminal-card/50 transition">
                    <td className="py-2.5 font-bold text-terminal-green">SUPPORT 2 (S2)</td>
                    <td className="py-2.5 text-gray-200">$2,689.80</td>
                    <td className="py-2.5 text-terminal-subtext">-25.05</td>
                    <td className="py-2.5">
                      <div className="w-24 bg-terminal-black h-1.5 rounded-full overflow-hidden">
                        <div className="bg-terminal-green h-full" style={{ width: "80%" }}></div>
                      </div>
                    </td>
                    <td className="py-2.5 text-right text-terminal-green font-semibold">INSTITUTIONAL LIQUIDITY POOL</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Col: Session Security & Terminal Access Clearance */}
        <div className="space-y-6">
          <div className="bg-terminal-surface border border-terminal-border rounded-lg p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-terminal-gold font-bold text-xs uppercase mb-3">
                <Shield className="w-4 h-4 text-terminal-gold" />
                <span>TERMINAL ACCESS PROFILE</span>
              </div>
              <div className="space-y-3 bg-terminal-black/70 p-4 rounded border border-terminal-border text-[11px]">
                <div className="flex justify-between">
                  <span className="text-terminal-subtext">OPERATOR STATUS:</span>
                  <span className={session ? "text-terminal-green font-bold" : "text-terminal-subtext"}>
                    {session ? "AUTHENTICATED" : "GUEST / RESTRICTED"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-terminal-subtext">SECURITY ROLE:</span>
                  <span className="text-white font-bold">{session?.user?.role ?? "UNASSIGNED"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-terminal-subtext">RADAR ROUTE:</span>
                  <span className="text-terminal-gold">/terminal (PROTECTED)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-terminal-subtext">PRICING ROUTE:</span>
                  <span className="text-terminal-green">/pricing ($99/MO)</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-terminal-border space-y-2">
              {session ? (
                <Link
                  href="/terminal"
                  className="w-full py-2.5 px-4 bg-terminal-gold hover:bg-amber-400 text-terminal-black font-extrabold rounded flex items-center justify-center gap-2 transition"
                >
                  <Terminal className="w-4 h-4" />
                  <span>LAUNCH WORKSPACE</span>
                </Link>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    href="/login"
                    className="w-full py-2.5 px-4 bg-terminal-gold hover:bg-amber-400 text-terminal-black font-extrabold rounded flex items-center justify-center gap-2 transition"
                  >
                    <span>SIGN IN TO ACCESS TERMINAL</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/register"
                    className="w-full py-2.5 px-4 bg-terminal-card hover:bg-terminal-surface border border-terminal-border text-terminal-subtext hover:text-white rounded text-center transition"
                  >
                    REGISTER NEW OPERATOR
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Quick Technical Specs */}
          <div className="bg-terminal-card border border-terminal-border rounded-lg p-4 text-[11px] space-y-2">
            <div className="flex items-center gap-2 text-terminal-green font-bold">
              <Cpu className="w-3.5 h-3.5" />
              <span>CORE ARCHITECTURE ENGINE</span>
            </div>
            <ul className="text-terminal-subtext space-y-1 list-disc list-inside">
              <li>Next.js App Router with Server Actions</li>
              <li>Prisma PostgreSQL ORM with globalThis pooling</li>
              <li>NextAuth v5 beta with JWT & Session callbacks</li>
              <li>Bcryptjs salted passkey encryption (10 rounds)</li>
              <li>Server-side paywall sanitization</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer Navigation & Legal Disclaimer (Spec §4.1, §16) */}
      <footer className="border-t border-terminal-border pt-6 pb-4 space-y-4 text-[11px] text-terminal-subtext">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-bold text-white">XAUUSD INTELLIGENCE</span>
            <span>·</span>
            <span>GOLD MARKET POSITIONING & LIQUIDITY INTELLIGENCE</span>
          </div>

          <div className="flex items-center gap-4 text-gray-300">
            <Link href="/pricing" className="hover:text-terminal-gold transition">
              Pricing Plans
            </Link>
            <Link href="/disclaimer" className="hover:text-terminal-gold transition">
              Risk Disclaimer
            </Link>
            <Link href="/privacy" className="hover:text-terminal-gold transition">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-terminal-gold transition">
              Terms of Service
            </Link>
          </div>
        </div>

        <p className="text-[10px] text-terminal-subtext/70 leading-relaxed">
          <strong>Risk Disclaimer:</strong> XAUUSD Intelligence provides market data normalization, algorithmic technical indicators, and quantitative structural estimates strictly for educational and research purposes. Liquidity concentration zones, modelled stop-loss hunt levels, and trade setup ideas are mathematical estimates derived from price structure heuristics, not observed private broker order books. The platform does not execute trades or provide financial advice. Users remain entirely responsible for their own risk and trading decisions.
        </p>
      </footer>
    </div>
  );
}
