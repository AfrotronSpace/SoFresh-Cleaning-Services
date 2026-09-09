export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-live="polite">
      <span className="sr-only">Loading</span>
      <span className="h-px w-24 animate-pulse bg-champagne" />
    </div>
  );
}
