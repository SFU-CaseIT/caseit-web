export function LoadingSpinner({ label = "Loading..." }: { label?: string }) {
  return (
    <span aria-live="polite" className="inline-flex items-center gap-3 text-sm font-semibold text-black" role="status">
      <span
        aria-hidden="true"
        className="size-5 animate-spin rounded-full border-2 border-black/20 border-t-redDark"
      />
      {label}
    </span>
  );
}
