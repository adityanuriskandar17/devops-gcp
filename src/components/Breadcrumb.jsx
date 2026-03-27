export default function Breadcrumb({ path }) {
  if (!path) return null;
  const parts = path.split('/');

  return (
    <nav className="flex items-center gap-1 text-[13px] mb-6">
      {parts.map((part, i) => {
        const isLast = i === parts.length - 1;
        return (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && (
              <svg className="w-3.5 h-3.5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            )}
            <span className={isLast ? 'text-slate-800 font-semibold' : 'text-slate-400'}>
              {part}
            </span>
          </span>
        );
      })}
    </nav>
  );
}
