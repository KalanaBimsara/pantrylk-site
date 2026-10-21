"use client";

import { AlertIcon } from "@/components/Icons";
import { SubmitButton, useAdminForm } from "@/components/admin/ui";
import { signIn } from "./actions";

export default function LoginForm({ next, notice }: { next: string; notice: string | null }) {
  const { state, pending, onSubmit } = useAdminForm(signIn);
  const message = state.status === "error" ? state.message : notice;

  return (
    <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-5">
      {message && (
        <p role="alert" className="flex items-start gap-2 border border-error/40 bg-error/5 px-4 py-3 text-[14.5px] text-error">
          <AlertIcon className="mt-1 shrink-0" /> {message}
        </p>
      )}
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="email" className="field-label">
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="username" required className="field" />
      </div>
      <div>
        <label htmlFor="password" className="field-label">
          Password
        </label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="field" />
      </div>
      <SubmitButton pending={pending} pendingLabel="Signing in…" className="btn btn-navy w-full">
        Sign in
      </SubmitButton>
    </form>
  );
}
