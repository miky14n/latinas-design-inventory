"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function UserDialog({ children, titleId, busy, error, onClose }: {
  children: ReactNode;
  titleId: string;
  busy: boolean;
  error: string | null;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl backdrop:bg-zinc-950/40 sm:p-7"
    >
      {children}
      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    </dialog>
  );
}
