"use client";

import { useActionState, useState } from "react";
import { Lock, KeyRound, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { changePassword, ChangePasswordState } from "@/actions/auth-actions";

export function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState<ChangePasswordState | null, FormData>(
    changePassword,
    null
  );
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-2 text-white font-bold text-xs uppercase">
          <KeyRound className="h-4 w-4 text-gold-300" />
          <span>Security & Passkey</span>
        </div>
        {!isOpen && (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="text-xs text-gold-300 hover:text-white underline font-semibold transition cursor-pointer"
          >
            Update Passkey
          </button>
        )}
      </div>

      {!isOpen ? (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-xs text-slate-400 flex items-center justify-between">
          <span>Security Passkey is encrypted with bcrypt (10 rounds).</span>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="btn-secondary text-[11px] py-1 px-3 cursor-pointer"
          >
            Change Passkey
          </button>
        </div>
      ) : (
        <form action={formAction} className="space-y-4">
          {state?.error && (
            <div className="p-3 bg-bear-400/10 border border-bear-400/30 rounded-lg flex items-center gap-2 text-xs text-bear-300">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{state.error}</span>
            </div>
          )}

          {state?.success && (
            <div className="p-3 bg-bull-400/10 border border-bull-400/30 rounded-lg flex items-center gap-2 text-xs text-bull-300">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Passkey updated successfully! Your credentials have been saved.</span>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label
                htmlFor="currentPassword"
                className="block text-[11px] font-semibold uppercase text-slate-400 mb-1"
              >
                Current Passkey
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  required
                  placeholder="••••••••••••"
                  className="w-full bg-white/[0.03] border border-white/10 focus:border-gold-300 rounded-lg pl-9 pr-3 py-2 text-xs text-white outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="newPassword"
                className="block text-[11px] font-semibold uppercase text-slate-400 mb-1"
              >
                New Passkey (min. 8 characters)
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  required
                  placeholder="••••••••••••"
                  className="w-full bg-white/[0.03] border border-white/10 focus:border-gold-300 rounded-lg pl-9 pr-3 py-2 text-xs text-white outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmNewPassword"
                className="block text-[11px] font-semibold uppercase text-slate-400 mb-1"
              >
                Confirm New Passkey
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  id="confirmNewPassword"
                  name="confirmNewPassword"
                  type="password"
                  required
                  placeholder="••••••••••••"
                  className="w-full bg-white/[0.03] border border-white/10 focus:border-gold-300 rounded-lg pl-9 pr-3 py-2 text-xs text-white outline-none font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={isPending}
              className="btn-primary text-xs py-2 px-4 shadow-gold flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save New Passkey</span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="btn-secondary text-xs py-2 px-3 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
