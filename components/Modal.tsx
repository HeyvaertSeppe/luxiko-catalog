"use client";

import { useEffect, useRef } from "react";
import { XIcon } from "./icons";

export function Modal({
  open,
  onClose,
  title,
  closeLabel = "Close",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  closeLabel?: string;
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
      className="m-0 mt-auto max-h-[92dvh] w-full max-w-none overflow-y-auto border-t-4 border-orange bg-white p-0 text-ink sm:m-auto sm:max-w-lg sm:border-4 sm:border-x-0 sm:border-b-0"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-white px-5 py-4 sm:px-6">
        <h2 className="text-2xl tracking-tight text-ink">{title}</h2>
        <button onClick={onClose} className="-mr-2 cursor-pointer p-2 text-grey hover:text-navy" aria-label={closeLabel}>
          <XIcon />
        </button>
      </div>
      <div className="px-5 py-5 sm:px-6">{children}</div>
    </dialog>
  );
}
