export default function Breadcrumb({ path }) {
  if (!path) return null;
  const parts = path.split('/');

  return (
    <nav className="flex items-center gap-2 font-mono text-xs uppercase tracking-wide mb-6">
      {parts.map((part, i) => {
        const isLast = i === parts.length - 1;
        return (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && (
              <span className="text-ink-40 font-bold" aria-hidden="true">/</span>
            )}
            <span className={isLast ? 'text-ink font-bold' : 'text-ink-40'}>
              {part}
            </span>
          </span>
        );
      })}
    </nav>
  );
}
