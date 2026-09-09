"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

const KEY = "sofresh-announcement-dismissed";

export function AnnouncementBar({ text }: { text: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(sessionStorage.getItem(KEY) !== text);
    } catch {
      setVisible(true);
    }
  }, [text]);

  if (!visible) return null;

  return (
    <div className="bg-forest-deep text-white">
      <div className="shell flex items-center justify-between gap-4 py-2.5">
        <p className="text-[0.8125rem] leading-snug text-champagne-soft">{text}</p>
        <button
          type="button"
          onClick={() => {
            try {
              sessionStorage.setItem(KEY, text);
            } catch {
              /* private mode — just hide for now */
            }
            setVisible(false);
          }}
          aria-label="Dismiss announcement"
          className="-mr-1 shrink-0 rounded p-1 text-white/60 transition-colors hover:text-white"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
