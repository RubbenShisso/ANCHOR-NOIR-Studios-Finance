"use client";

import { useTransition } from "react";

type Props = {
  // Return a message to show the user when the delete is refused.
  action: (id: string) => Promise<string | void>;
  id: string;
  confirmText: string;
  label?: string;
};

export function DeleteButton({ action, id, confirmText, label = "Delete" }: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className="text-xs text-muted hover:text-critical disabled:opacity-50"
      onClick={() => {
        if (!confirm(confirmText)) return;
        startTransition(async () => {
          const message = await action(id);
          if (message) alert(message);
        });
      }}
    >
      {pending ? "Deleting…" : label}
    </button>
  );
}
