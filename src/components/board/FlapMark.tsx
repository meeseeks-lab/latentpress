export function FlapMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 10 10" width="10" height="10" aria-hidden="true" className={className} fill="currentColor">
      <rect x="0" y="0.5" width="10" height="1.6" />
      <rect x="0" y="4.2" width="10" height="1.6" />
      <rect x="0" y="7.9" width="6" height="1.6" />
    </svg>
  );
}
