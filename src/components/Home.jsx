import { useMemo } from 'react';
import TopicIcon from './TopicIcon';
import { TOPICS, CATEGORIES } from '../data/topics';

export default function Home({ tree, onSelectFile }) {
  const cards = useMemo(() => {
    const byName = {};
    for (const item of tree) {
      if (item.type === 'folder') byName[item.name] = item;
    }
    return TOPICS
      .map((topic) => {
        const folder = byName[topic.folder];
        if (!folder || folder.files.length === 0) return null;
        const readme = folder.files.find((f) => f.name.toLowerCase() === 'readme.md');
        return { ...topic, name: folder.name, count: folder.files.length, firstPath: (readme || folder.files[0]).path };
      })
      .filter(Boolean);
  }, [tree]);

  const totalDocs = cards.reduce((sum, c) => sum + c.count, 0);

  return (
    <div>
      {/* ─── Hero ─── */}
      <div className="bg-cover text-oncover border-2 border-ink px-6 sm:px-10 lg:px-16 py-12 lg:py-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 border-2 border-oncover bg-accent flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-oncover" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-oncover-dim">Field Manual — Vol. 01</span>
        </div>

        <h1 className="font-display font-black uppercase text-4xl sm:text-5xl lg:text-6xl leading-[0.95] tracking-tight max-w-3xl">
          DevOps, dari Terminal Sampai Production
        </h1>

        <p className="font-mono text-sm sm:text-base text-oncover-dim mt-6 max-w-2xl leading-relaxed">
          Kumpulan modul belajar cloud-agnostic (Linux, Bash, Git, Networking, Docker) sampai
          seluruh stack Google Cloud Platform — ditulis sebagai buku pegangan kerja, bukan
          slide presentasi.
        </p>

        <div className="flex flex-wrap items-center gap-3 mt-8">
          {cards.length > 0 && (
            <button
              onClick={() => onSelectFile(cards[0].firstPath)}
              className="hard-btn hard-btn-accent px-5 py-3 text-sm"
            >
              Mulai dari Bab 01 →
            </button>
          )}
          <span className="stamp-label text-xs border-2 border-oncover-dim px-3 py-2 text-oncover-dim">
            {cards.length} Bab
          </span>
          <span className="stamp-label text-xs border-2 border-oncover-dim px-3 py-2 text-oncover-dim">
            {totalDocs} Dokumen
          </span>
        </div>
      </div>

      {/* ─── Grid ─── */}
      <div className="border-2 border-t-0 border-ink px-6 sm:px-10 lg:px-16 py-12 lg:py-16 bg-paper">
        <div className="flex items-center gap-4 mb-10">
          <span className="stamp-label text-xs text-ink-40">Pilih Materi</span>
          <div className="flex-1 h-px bg-rule" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {cards.map((card, i) => (
            <button
              key={card.folder}
              onClick={() => onSelectFile(card.firstPath)}
              className="group text-left border-2 border-ink bg-paper shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-150 flex flex-col"
            >
              <div className="aspect-square border-b-2 border-ink bg-paper-2 flex items-center justify-center overflow-hidden">
                <TopicIcon name={card.icon} className="w-20 h-20 text-ink group-hover:text-accent-ink transition-colors" />
              </div>
              <div className="p-5 flex flex-col gap-2 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] font-bold text-accent-ink tracking-wide">
                    BAB {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-wide text-ink-40 border border-ink-40/40 px-1.5 py-0.5">
                    {CATEGORIES[card.category]?.chip}
                  </span>
                </div>
                <h3 className="font-display font-extrabold uppercase text-lg leading-tight text-ink">
                  {card.name}
                </h3>
                <p className="font-mono text-xs leading-relaxed text-ink-70 flex-1">
                  {card.description}
                </p>
                <span className="font-mono text-[11px] text-ink-40 mt-1">{card.count} dokumen →</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
