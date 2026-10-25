"use client";

import { useActionState } from "react";
import type { FormState } from "@/lib/types";

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  children: React.ReactNode;
  submitLabel: string;
  className?: string;
};

// A form wired to a server action, with a pending state and inline error message.
export function ActionForm({ action, children, submitLabel, className }: Props) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className={className}>
      {children}
      {state?.error && (
        <p role="alert" className="text-sm text-critical">
          {state.error}
        </p>
      )}
      <button type="submit" className="btn" disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
