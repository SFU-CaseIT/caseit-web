export function LoadingSpinner({ label = "Loading...", light = false }: { label?: string; light?: boolean }) {
  return (
    <span aria-live="polite" className={`inline-flex items-center gap-3 text-sm font-semibold ${light ? "text-white" : "text-black"}`} role="status">
      <span
        aria-hidden="true"
        className={`size-5 animate-spin rounded-full border-2 ${light ? "border-white/30 border-t-white" : "border-black/20 border-t-redDark"}`}
      />
      {label}
    </span>
  );
}
