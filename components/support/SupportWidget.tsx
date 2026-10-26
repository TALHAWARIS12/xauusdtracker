"use client";

import { useState, useEffect, useRef } from "react";
import {
  Mail,
  MessageSquare,
  X,
  Copy,
  Check,
  ExternalLink,
  Send,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
} from "lucide-react";

const SUPPORT_EMAIL = "Support@xauusdtracker.com";

const COMPLAINT_TOPICS = [
  {
    id: "general",
    label: "General Complaint",
    subject: "Complaint: General Feedback & Inquiry - XAUUSD Tracker",
    body: "Hi XAUUSD Tracker Support,\n\nI would like to file a complaint regarding:\n\n[Please describe your issue or complaint in detail]\n\nAccount Email: ",
  },
  {
    id: "payment",
    label: "Payment & NOWPayments",
    subject: "Complaint: Crypto / NOWPayments Issue - XAUUSD Tracker",
    body: "Hi XAUUSD Tracker Support,\n\nI am experiencing an issue with my crypto payment / NOWPayments invoice.\n\nOrder ID / Tx Hash: \nPayment Amount / Asset: \nDetails of complaint: \n\nAccount Email: ",
  },
  {
    id: "access",
    label: "Subscription & Pro Access",
    subject: "Complaint: Pro Subscription Access - XAUUSD Tracker",
    body: "Hi XAUUSD Tracker Support,\n\nMy subscription clearance is not activating or I have an issue with Pro access.\n\nPlan Tier (Monthly / Yearly): \nComplaint Details: \n\nAccount Email: ",
  },
  {
    id: "telemetry",
    label: "Data & Signals",
    subject: "Complaint: Market Data / Trade Signal Issue - XAUUSD Tracker",
    body: "Hi XAUUSD Tracker Support,\n\nI have a question or complaint regarding the live market data feed / trade signals:\n\nDetails: \n\nAccount Email: ",
  },
];

export function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string>("general");
  const [copied, setCopied] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);

  const currentTopic =
    COMPLAINT_TOPICS.find((t) => t.id === selectedTopic) || COMPLAINT_TOPICS[0];

  const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
    SUPPORT_EMAIL
  )}&su=${encodeURIComponent(currentTopic.subject)}&body=${encodeURIComponent(
    currentTopic.body
  )}`;

  const mailtoUrl = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
    currentTopic.subject
  )}&body=${encodeURIComponent(currentTopic.body)}`;

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(SUPPORT_EMAIL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Close widget when clicking outside or pressing Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (widgetRef.current && !widgetRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div
      ref={widgetRef}
      className="fixed bottom-5 right-5 z-50 flex flex-col items-end font-sans print:hidden"
      id="support-complaint-widget"
    >
      {/* Popover / Modal Dialog */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="support-dialog-title"
          className="mb-3 w-[92vw] sm:w-[420px] max-h-[85vh] overflow-y-auto rounded-2xl border border-gold-300/30 bg-ink-950/95 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.85)] backdrop-blur-xl animate-fade-in transition-all text-white"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-white/[0.08] pb-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-gold-300/20 to-gold-500/20 text-gold-300 border border-gold-400/30 shadow-[0_0_15px_rgba(242,185,59,0.2)]">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gold-300 flex items-center gap-1">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-bull-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-bull-400" />
                  </span>
                  Support & Complaints Desk
                </span>
                <h3
                  id="support-dialog-title"
                  className="font-display text-base font-bold text-white tracking-tight"
                >
                  Got any complaints?
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1 text-slate-400 transition hover:bg-white/10 hover:text-white cursor-pointer"
              aria-label="Close support dialog"
              id="close-support-dialog-btn"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Description */}
          <div className="py-3.5 text-xs text-slate-300 space-y-2 leading-relaxed">
            <p>
              We are here to resolve any issues immediately. If you have any complaints,
              billing inquiries, or feedback regarding your experience with XAUUSD Tracker,
              our team is ready to assist you.
            </p>
          </div>

          {/* Email Display Card */}
          <div className="rounded-xl border border-gold-300/25 bg-gold-400/[0.06] p-3 space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-gold-300 block">
              Official Support Email:
            </span>
            <div className="flex items-center justify-between gap-2 bg-ink-900/80 rounded-lg p-2 border border-white/10">
              <span className="font-mono text-xs sm:text-sm font-semibold text-white truncate select-all">
                {SUPPORT_EMAIL}
              </span>
              <button
                type="button"
                onClick={handleCopyEmail}
                className="btn-secondary px-2.5 py-1 text-xs shrink-0 flex items-center gap-1.5 cursor-pointer"
                title="Copy email address"
                id="copy-support-email-btn"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-bull-300" />
                    <span className="text-bull-300 font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-slate-300" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Complaint Topic Selector */}
          <div className="pt-3 space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
              What is your complaint regarding?
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {COMPLAINT_TOPICS.map((topic) => (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => setSelectedTopic(topic.id)}
                  className={`rounded-lg border px-2.5 py-2 text-left text-[11px] transition cursor-pointer truncate ${
                    selectedTopic === topic.id
                      ? "border-gold-300 bg-gold-400/20 text-white font-bold shadow-sm"
                      : "border-white/10 bg-white/[0.02] text-slate-300 hover:border-white/20 hover:text-white"
                  }`}
                >
                  {topic.label}
                </button>
              ))}
            </div>
          </div>

          {/* Primary Action: Open Gmail */}
          <div className="pt-4 space-y-2">
            <a
              href={gmailComposeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full py-3 text-xs sm:text-sm font-bold shadow-gold flex items-center justify-center gap-2 rounded-xl transition cursor-pointer"
              id="open-gmail-complaint-btn"
            >
              <Send className="h-4 w-4" />
              <span>Take me to Gmail to Send Complaint</span>
              <ExternalLink className="h-3.5 w-3.5 opacity-80" />
            </a>

            <p className="text-[11px] text-center text-slate-400">
              Opens Gmail compose pre-filled with recipient & subject
            </p>

            {/* Alternative Actions */}
            <div className="pt-1 flex items-center justify-between text-xs border-t border-white/[0.06] mt-3">
              <a
                href={mailtoUrl}
                className="text-slate-400 hover:text-white underline text-[11px] transition py-1"
                id="default-mail-client-link"
              >
                Use default mail app instead
              </a>
              <span className="text-[10px] text-bull-300 flex items-center gap-1 font-medium">
                <ShieldCheck className="h-3.5 w-3.5" />
                24/7 Dedicated Support
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Widget Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`group relative flex items-center gap-2.5 rounded-full border px-4 py-2.5 text-xs font-bold transition-all duration-300 cursor-pointer shadow-2xl ${
          isOpen
            ? "border-gold-300 bg-ink-900 text-gold-300 shadow-gold scale-95"
            : "border-gold-300/40 bg-gradient-to-r from-ink-950 via-ink-900 to-ink-950 text-white hover:border-gold-300 hover:shadow-[0_0_25px_rgba(242,185,59,0.35)] hover:scale-105"
        }`}
        aria-label="Got any complaints? Contact support"
        id="support-widget-trigger-btn"
      >
        {/* Glowing aura ping when closed */}
        {!isOpen && (
          <span className="absolute -inset-0.5 -z-10 rounded-full bg-gradient-to-r from-gold-300/30 to-gold-500/30 blur-sm opacity-75 group-hover:opacity-100 transition" />
        )}

        <div className="relative flex h-6 w-6 items-center justify-center rounded-full bg-gold-400/20 text-gold-300">
          {isOpen ? (
            <X className="h-4 w-4" />
          ) : (
            <MessageSquare className="h-3.5 w-3.5" />
          )}
          {!isOpen && (
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-bull-400 ring-2 ring-ink-950" />
          )}
        </div>

        <span className="font-semibold tracking-tight">
          {isOpen ? "Close Support" : "Got Complaints?"}
        </span>
      </button>
    </div>
  );
}
