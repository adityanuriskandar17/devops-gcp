// Small geometric line-icons, one per topic — kept as plain primitives
// (rect/circle/line/path) rather than illustrative art, to match the
// schematic/blueprint feel of the rest of the "Field Manual" system.

const shared = {
  viewBox: '0 0 48 48',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

const ICONS = {
  terminal: (
    <>
      <rect x="6" y="8" width="36" height="32" />
      <polyline points="13,20 20,24 13,28" />
      <line x1="24" y1="28" x2="34" y2="28" />
    </>
  ),
  shebang: (
    <>
      <rect x="6" y="8" width="36" height="32" />
      <text x="24" y="31" textAnchor="middle" fontSize="16" fontFamily="'JetBrains Mono', monospace" stroke="none" fill="currentColor">#!</text>
    </>
  ),
  branch: (
    <>
      <circle cx="14" cy="10" r="3" />
      <circle cx="14" cy="38" r="3" />
      <circle cx="35" cy="24" r="3" />
      <line x1="14" y1="13" x2="14" y2="35" />
      <path d="M14 22 C14 22 26 22 32 24" />
    </>
  ),
  globe: (
    <>
      <circle cx="24" cy="24" r="16" />
      <ellipse cx="24" cy="24" rx="16" ry="6" />
      <line x1="8" y1="24" x2="40" y2="24" />
      <line x1="24" y1="8" x2="24" y2="40" />
    </>
  ),
  crate: (
    <>
      <rect x="8" y="12" width="32" height="24" />
      <line x1="8" y1="24" x2="40" y2="24" />
      <line x1="24" y1="12" x2="24" y2="36" />
    </>
  ),
  server: (
    <>
      <rect x="9" y="7" width="30" height="9" />
      <circle cx="33" cy="11.5" r="1.3" fill="currentColor" stroke="none" />
      <rect x="9" y="19.5" width="30" height="9" />
      <circle cx="33" cy="24" r="1.3" fill="currentColor" stroke="none" />
      <rect x="9" y="32" width="30" height="9" />
      <circle cx="33" cy="36.5" r="1.3" fill="currentColor" stroke="none" />
    </>
  ),
  'shield-key': (
    <>
      <path d="M24 6 L40 12 V23 C40 33 32 41 24 44 C16 41 8 33 8 23 V12 Z" />
      <circle cx="24" cy="21" r="4" />
      <line x1="24" y1="25" x2="24" y2="32" />
    </>
  ),
  bucket: (
    <>
      <ellipse cx="24" cy="12" rx="13" ry="3" />
      <path d="M11 12 L15 40 H33 L37 12" />
    </>
  ),
  database: (
    <>
      <ellipse cx="24" cy="12" rx="14" ry="5" />
      <path d="M10 12 V36 C10 39 16 41 24 41 C32 41 38 39 38 36 V12" />
      <path d="M10 24 C10 27 16 29 24 29 C32 29 38 27 38 24" />
    </>
  ),
  cdn: (
    <>
      <circle cx="24" cy="24" r="9" />
      <circle cx="8" cy="8" r="2.4" />
      <circle cx="40" cy="8" r="2.4" />
      <circle cx="8" cy="40" r="2.4" />
      <circle cx="40" cy="40" r="2.4" />
      <line x1="24" y1="24" x2="9.7" y2="9.7" />
      <line x1="24" y1="24" x2="38.3" y2="9.7" />
      <line x1="24" y1="24" x2="9.7" y2="38.3" />
      <line x1="24" y1="24" x2="38.3" y2="38.3" />
    </>
  ),
  'shield-check': (
    <>
      <path d="M24 6 L40 12 V23 C40 33 32 41 24 44 C16 41 8 33 8 23 V12 Z" />
      <polyline points="16,23 22,29 33,17" />
    </>
  ),
  key: (
    <>
      <circle cx="16" cy="24" r="8" />
      <line x1="23" y1="24" x2="41" y2="24" />
      <line x1="34" y1="24" x2="34" y2="31" />
      <line x1="41" y1="24" x2="41" y2="31" />
    </>
  ),
  cluster: (
    <>
      <rect x="18" y="5" width="12" height="12" />
      <rect x="4" y="30" width="12" height="12" />
      <rect x="32" y="30" width="12" height="12" />
      <line x1="22" y1="17" x2="12" y2="30" />
      <line x1="28" y1="17" x2="36" y2="30" />
      <line x1="16" y1="36" x2="32" y2="36" />
    </>
  ),
  chart: (
    <>
      <rect x="6" y="6" width="36" height="36" />
      <polyline points="12,30 19,23 25,28 33,15 40,20" />
      <circle cx="33" cy="15" r="1.6" fill="currentColor" stroke="none" />
    </>
  ),
  checklist: (
    <>
      <rect x="9" y="9" width="6" height="6" />
      <line x1="21" y1="12" x2="40" y2="12" />
      <rect x="9" y="21" width="6" height="6" />
      <line x1="21" y1="24" x2="40" y2="24" />
      <rect x="9" y="33" width="6" height="6" />
      <line x1="21" y1="36" x2="40" y2="36" />
    </>
  ),
  warning: (
    <>
      <path d="M24 6 L44 40 H4 Z" />
      <line x1="24" y1="18" x2="24" y2="28" />
      <circle cx="24" cy="33" r="1.6" fill="currentColor" stroke="none" />
    </>
  ),
};

export default function TopicIcon({ name, className }) {
  const glyph = ICONS[name] || ICONS.terminal;
  return (
    <svg className={className} {...shared} aria-hidden="true">
      {glyph}
    </svg>
  );
}
