"use client";

import { useState, type KeyboardEvent } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------- tags

export function TagInput({ initial }: { initial: string[] }) {
  const [tags, setTags] = useState<string[]>(initial);
  const [draft, setDraft] = useState("");

  function commit() {
    const value = draft.trim();
    if (value && !tags.includes(value) && tags.length < 12) setTags((prev) => [...prev, value]);
    setDraft("");
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit();
    } else if (e.key === "Backspace" && draft === "" && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
    }
  }

  return (
    <div>
      <input type="hidden" name="tagsJson" value={JSON.stringify(tags)} readOnly />
      <div className="flex min-h-11 flex-wrap items-center gap-2 rounded-md border border-input bg-white px-3 py-2">
        {tags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1.5 rounded-full bg-mist px-2.5 py-1 text-xs font-medium text-forest">
            {tag}
            <button type="button" onClick={() => setTags((prev) => prev.filter((t) => t !== tag))} aria-label={`Remove ${tag}`}>
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={commit}
          placeholder={tags.length === 0 ? "e.g. deep clean, after-builders" : ""}
          className="min-w-[8rem] flex-1 bg-transparent text-[0.9375rem] outline-none placeholder:text-sage"
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- extras

export type ExtraRow = { name: string; note: string };

export function ExtrasEditor({ initial }: { initial: ExtraRow[] }) {
  const [rows, setRows] = useState<ExtraRow[]>(initial);

  function update(index: number, patch: Partial<ExtraRow>) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name="extrasJson" value={JSON.stringify(rows.filter((r) => r.name.trim()))} readOnly />
      {rows.map((row, index) => (
        <div key={index} className="flex gap-2">
          <Input
            value={row.name}
            onChange={(e) => update(index, { name: e.target.value })}
            placeholder="e.g. Inside the oven"
            className="flex-1"
          />
          <Input
            value={row.note}
            onChange={(e) => update(index, { note: e.target.value })}
            placeholder="Note, optional — e.g. quoted on scope"
            className="flex-1"
          />
          <button
            type="button"
            onClick={() => setRows((prev) => prev.filter((_, i) => i !== index))}
            className="shrink-0 rounded-md p-2.5 text-sage hover:bg-[#fbe6e4] hover:text-destructive"
            aria-label="Remove extra"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => setRows((prev) => [...prev, { name: "", note: "" }])}>
        <Plus className="size-3.5" /> Add an extra
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------- faqs

export type FaqRow = { q: string; a: string };

export function FaqEditor({ initial }: { initial: FaqRow[] }) {
  const [rows, setRows] = useState<FaqRow[]>(initial);

  function update(index: number, patch: Partial<FaqRow>) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  return (
    <div className="space-y-4">
      <input
        type="hidden"
        name="faqsJson"
        value={JSON.stringify(rows.filter((r) => r.q.trim() && r.a.trim()))}
        readOnly
      />
      {rows.map((row, index) => (
        <div key={index} className="space-y-2 rounded-xl border border-border p-4">
          <div className="flex items-start gap-2">
            <Input
              value={row.q}
              onChange={(e) => update(index, { q: e.target.value })}
              placeholder="Question, e.g. Do you bring your own equipment?"
              className="flex-1"
            />
            <button
              type="button"
              onClick={() => setRows((prev) => prev.filter((_, i) => i !== index))}
              className="shrink-0 rounded-md p-2.5 text-sage hover:bg-[#fbe6e4] hover:text-destructive"
              aria-label="Remove FAQ"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
          <Textarea
            value={row.a}
            onChange={(e) => update(index, { a: e.target.value })}
            placeholder="Answer"
            className="min-h-[4.5rem]"
          />
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => setRows((prev) => [...prev, { q: "", a: "" }])}>
        <Plus className="size-3.5" /> Add a question
      </Button>
    </div>
  );
}
