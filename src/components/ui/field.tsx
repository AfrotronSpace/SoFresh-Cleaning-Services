import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

/**
 * One wrapper for every form control so labels, hints and errors are
 * always announced in the same order to a screen reader.
 */
export function Field({
  label,
  hint,
  error,
  htmlFor,
  required,
  className,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  htmlFor?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const hintId = hint && htmlFor ? `${htmlFor}-hint` : undefined;
  const errorId = error && htmlFor ? `${htmlFor}-error` : undefined;

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="ml-1 text-champagne">*</span>}
        {!required && <span className="ml-1.5 text-xs font-normal text-sage">optional</span>}
      </Label>
      {hint && (
        <p id={hintId} className="text-[0.8125rem] leading-relaxed text-sage">
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p id={errorId} role="alert" className="text-[0.8125rem] font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
