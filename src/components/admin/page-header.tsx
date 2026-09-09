export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-[1.75rem] leading-tight md:text-[2rem]">{title}</h1>
        {description && <p className="mt-2 max-w-[62ch] text-[0.9375rem] leading-relaxed text-sage">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Panel({
  title,
  description,
  children,
  footer,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-white">
      {(title || description) && (
        <header className="border-b border-border px-6 py-5">
          {title && <h2 className="font-display text-lg text-ink">{title}</h2>}
          {description && <p className="mt-1.5 max-w-[68ch] text-sm leading-relaxed text-sage">{description}</p>}
        </header>
      )}
      <div className="p-6">{children}</div>
      {footer && <footer className="border-t border-border bg-haze/60 px-6 py-4">{footer}</footer>}
    </section>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-white p-10 text-center">
      <h2 className="font-display text-lg text-ink">{title}</h2>
      <p className="mx-auto mt-2.5 max-w-[52ch] text-[0.9375rem] leading-relaxed text-sage">{body}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
