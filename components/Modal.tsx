"use client";

import { useEffect, useRef } from "react";
import { XIcon } from "./icons";

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="m-0 mt-auto max-h-[92dvh] w-full max-w-none overflow-y-auto rounded-t-3xl border border-white/10 bg-navy-900 p-0 text-navy-100 shadow-2xl sm:m-auto sm:max-w-lg sm:rounded-3xl"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/5 bg-navy-900/95 px-5 py-4 backdrop-blur sm:px-6">
        <h2 className="font-display text-lg font-semibold text-white">{title}</h2>
        <button onClick={onClose} className="-mr-2 cursor-pointer rounded-lg p-2 text-navy-300 hover:bg-white/5 hover:text-white" aria-label="Close">
          <XIcon />
        </button>
      </div>
      <div className="px-5 py-5 sm:px-6">{children}</div>
    </dialog>
  );
}
