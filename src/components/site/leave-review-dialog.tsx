"use client";

import { useState } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ReviewForm, type ReviewFormDefaults } from "@/components/site/review-form";

export function LeaveReviewDialog({
  defaults,
  areas,
  label = "Leave a review",
  variant = "default",
  size = "lg",
}: {
  defaults?: ReviewFormDefaults | null;
  areas?: string[];
  label?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" variant={variant} size={size} onClick={() => setOpen(true)}>
        {label}
      </Button>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">How did we do?</DialogTitle>
          <DialogDescription>Had a clean with So Fresh? Tell other customers what it was like.</DialogDescription>
        </DialogHeader>
        <ReviewForm defaults={defaults} areas={areas} />
      </DialogContent>
    </Dialog>
  );
}
