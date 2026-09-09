"use client";
import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="bottom-center"
      toastOptions={{
        classNames: {
          toast: "!rounded-xl !border-border !bg-white !text-ink !font-sans !shadow-[var(--shadow-lift)]",
          description: "!text-sage",
          actionButton: "!bg-forest !text-white",
        },
      }}
    />
  );
}
