import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { uploadImage } from '../utils/api';

function rehypeSourceLines() {
  return (tree) => {
    (function walk(node) {
      if (node.type === 'element' && node.position?.start?.line) {
        node.properties = node.properties || {};
        node.properties['dataSourceLine'] = String(node.position.start.line);
      }
      if (node.children) node.children.forEach(walk);
    })(tree);
  };
}

function splitIntoPages(content) {
  if (!content) return [{ title: '', markdown: '', startLine: 1, endLine: 1 }];
  const lines = content.split('\n');
  const pages = [];
  let currentStart = 0;
  let currentTitle = '';
  let inCodeBlock = false;

  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const h1 = lines[i].match(/^# (.+)/);
    if (h1) { currentTitle = h1[1].trim(); break; }
  }
  if (!currentTitle) currentTitle = 'Pendahuluan';

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trimStart().startsWith('```')) inCodeBlock = !inCodeBlock;
    if (inCodeBlock) continue;
    const match = lines[i].match(/^## (.+)/);
    if (match) {
      pages.push({ title: currentTitle, markdown: lines.slice(currentStart, i).join('\n'), startLine: currentStart + 1, endLine: i });
      currentStart = i;
      currentTitle = match[1].trim();
    }
  }
  pages.push({ title: currentTitle, markdown: lines.slice(currentStart).join('\n'), startLine: currentStart + 1, endLine: lines.length });
  return pages;
}

function findPageForLine(pages, targetLine) {
  for (let i = 0; i < pages.length; i++) {
    if (targetLine >= pages[i].startLine && targetLine <= pages[i].endLine) return i;
  }
  return 0;
}

function ImageWithZoom({ src, alt }) {
  const [zoomed, setZoomed] = useState(false);
  return (
    <span className="block my-5">
      <img src={src} alt={alt || ''} onClick={() => setZoomed(true)}
        className="max-w-full border-2 border-ink shadow-md cursor-zoom-in hover:shadow-lg transition-shadow duration-200" />
      {alt && <span className="block mt-2 text-xs text-ink-40 italic">{alt}</span>}
      {zoomed && (
        <span className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 backdrop-blur-sm cursor-zoom-out"
          role="dialog" onClick={() => setZoomed(false)}>
          <img src={src} alt={alt || ''} className="max-w-[90vw] max-h-[90vh] border-4 border-paper shadow-2xl" />
        </span>
      )}
    </span>
  );
}

function parseHeadings(content) {
  const lines = content.split('\n');
  const headings = [{ label: 'Di awal dokumen', line: 0 }];
  let inCodeBlock = false;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trimStart().startsWith('```')) inCodeBlock = !inCodeBlock;
    if (inCodeBlock) continue;
    const match = lines[i].match(/^(#{1,3})\s+(.+)/);
    if (match) {
      const level = match[1].length;
      const prefix = level === 1 ? '' : level === 2 ? '  ' : '    ';
      headings.push({ label: `${prefix}${match[2]}`, line: i });
    }
  }
  headings.push({ label: 'Di akhir dokumen', line: lines.length });
  return headings;
}

function PositionPicker({ headings, onSelect, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="hard-panel w-full max-w-md max-h-[70vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-5 border-b-2 border-ink bg-paper-2">
          <h3 className="font-display font-extrabold uppercase text-lg text-ink">Pilih Posisi Gambar</h3>
          <p className="font-mono text-xs text-ink-40 mt-1.5">Klik posisi di mana gambar akan disisipkan</p>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {headings.map((h, i) => (
            <button key={i} onClick={() => onSelect(h)}
              className="w-full text-left px-6 py-3 text-sm font-mono border-2 border-transparent hover:bg-paper-2 hover:border-ink transition-colors flex items-center gap-3">
              <span className="w-2 h-2 bg-ink-40 shrink-0" />
              <span className="whitespace-pre text-ink-70">{h.label}</span>
            </button>
          ))}
        </div>
        <div className="px-6 py-4 border-t-2 border-ink">
          <button onClick={onClose} className="hard-btn w-full py-2.5 text-sm">
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}

function PageHeader({ pages, currentPage, onPageChange }) {
  if (pages.length <= 1) return null;
  const [tocOpen, setTocOpen] = useState(false);
  const progress = ((currentPage + 1) / pages.length) * 100;

  return (
    <div className="mb-8 hard-panel">
      {/* Progress bar */}
      <div className="h-2 bg-paper-2 border-b-2 border-ink">
        <div className="h-full bg-accent transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }} />
      </div>

      <div className="px-5 py-4 flex items-center justify-between gap-4">
        {/* Section title + TOC toggle */}
        <div className="relative flex-1 min-w-0">
          <button onClick={() => setTocOpen(!tocOpen)}
            className="hard-btn-ghost flex items-center gap-3 w-full text-left -mx-2 px-2 py-1.5">
            <span className="w-8 h-8 border-2 border-ink bg-ink text-paper flex items-center justify-center text-xs font-mono font-bold shrink-0">
              {currentPage + 1}
            </span>
            <span className="truncate font-mono text-sm uppercase tracking-wide font-bold">{pages[currentPage].title}</span>
            <svg className={`w-4 h-4 shrink-0 transition-transform ${tocOpen ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {tocOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setTocOpen(false)} />
              <div className="absolute left-0 top-full mt-2 z-50 bg-paper border-2 border-ink shadow-xl max-h-80 overflow-y-auto w-[360px]">
                <div className="p-2">
                  {pages.map((p, i) => (
                    <button key={i} onClick={() => { onPageChange(i); setTocOpen(false); }}
                      className={`w-full text-left px-3 py-2.5 text-sm font-mono border-2 border-transparent flex items-center gap-3 transition-colors mb-1 ${
                        i === currentPage ? 'bg-accent text-oncover border-ink' : 'hover:bg-paper-2 hover:border-ink text-ink-70'
                      }`}>
                      <span className={`w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0 border-2 ${
                        i === currentPage ? 'bg-ink text-paper border-ink' : 'bg-paper-2 text-ink-40 border-rule'
                      }`}>
                        {i + 1}
                      </span>
                      <span className="truncate">{p.title}</span>
                      {i === currentPage && (
                        <svg className="w-4 h-4 ml-auto text-oncover shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Quick nav arrows + counter */}
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 0}
            className="hard-btn w-9 h-9 p-0 flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="folio tabular-nums w-14 text-center">
            {currentPage + 1}/{pages.length}
          </span>
          <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === pages.length - 1}
            className="hard-btn w-9 h-9 p-0 flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function PageFooterNav({ pages, currentPage, onPageChange }) {
  if (pages.length <= 1) return null;
  const prev = currentPage > 0 ? pages[currentPage - 1] : null;
  const next = currentPage < pages.length - 1 ? pages[currentPage + 1] : null;

  return (
    <div className="mt-14 pt-8 border-t-4 border-double border-ink">
      <div className="grid grid-cols-2 gap-6">
        {prev ? (
          <button onClick={() => onPageChange(currentPage - 1)}
            className="group text-left p-5 bg-paper border-2 border-ink shadow-md hover:shadow-lg hover:bg-paper-2 hover:-translate-y-0.5 transition-all duration-150">
            <span className="folio flex items-center gap-1.5 text-ink-40">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Sebelumnya
            </span>
            <span className="block mt-2 font-display font-bold uppercase text-base text-ink group-hover:text-accent-ink transition-colors truncate">
              {prev.title}
            </span>
          </button>
        ) : <div />}

        {next ? (
          <button onClick={() => onPageChange(currentPage + 1)}
            className="group text-right p-5 bg-paper border-2 border-ink shadow-md hover:shadow-lg hover:bg-paper-2 hover:-translate-y-0.5 transition-all duration-150">
            <span className="folio flex items-center justify-end gap-1.5 text-ink-40">
              Selanjutnya
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </span>
            <span className="block mt-2 font-display font-bold uppercase text-base text-ink group-hover:text-accent-ink transition-colors truncate">
              {next.title}
            </span>
          </button>
        ) : <div />}
      </div>
    </div>
  );
}

export default function MarkdownViewer({ content, onEdit, onInsertImage, activeFolder, activeFile, scrollToLine }) {
  const [uploading, setUploading] = useState(false);
  const [pendingImage, setPendingImage] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pdfMode, setPdfMode] = useState(null); // null | 'page' | 'all' | 'range'
  const [pdfRange, setPdfRange] = useState(null); // { from, to } (1-based inclusive)
  const [pdfMenuOpen, setPdfMenuOpen] = useState(false);
  const [rangePickerOpen, setRangePickerOpen] = useState(false);
  const fileInputRef = useRef(null);
  const articleRef = useRef(null);
  const pdfRef = useRef(null);

  const pages = useMemo(() => splitIntoPages(content), [content]);

  useEffect(() => { setCurrentPage(0); }, [content]);

  useEffect(() => {
    if (!scrollToLine?.line) return;
    const targetLine = scrollToLine.line;
    const pageIdx = findPageForLine(pages, targetLine);
    setCurrentPage(pageIdx);

    const timer = setTimeout(() => {
      if (!articleRef.current) return;
      const relativeLine = targetLine - pages[pageIdx].startLine + 1;
      const els = articleRef.current.querySelectorAll('[data-source-line]');
      let best = null;
      let bestDiff = Infinity;
      for (const el of els) {
        const line = parseInt(el.getAttribute('data-source-line'), 10);
        if (isNaN(line)) continue;
        const diff = Math.abs(line - relativeLine);
        if (diff < bestDiff) { bestDiff = diff; best = el; }
      }
      if (best) {
        best.scrollIntoView({ behavior: 'smooth', block: 'center' });
        best.style.transition = 'background-color 0.4s ease';
        best.style.backgroundColor = 'rgba(250, 204, 21, 0.4)';
        best.style.borderRadius = '6px';
        setTimeout(() => {
          best.style.backgroundColor = '';
          setTimeout(() => { best.style.transition = ''; }, 500);
        }, 3000);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [scrollToLine, pages]);

  const handlePageChange = useCallback((idx) => {
    if (idx < 0 || idx >= pages.length) return;
    setCurrentPage(idx);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pages.length]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
      if (pages.length <= 1) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); handlePageChange(currentPage - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); handlePageChange(currentPage + 1); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentPage, pages.length, handlePageChange]);

  const headings = parseHeadings(content);

  const baseFilename = useMemo(() => {
    if (activeFile) {
      const name = activeFile.split('/').pop().replace(/\.md$/i, '');
      return name || 'document';
    }
    return 'document';
  }, [activeFile]);

  const pdfContent = useMemo(() => {
    if (!pdfMode) return '';
    if (pdfMode === 'page') return pages[currentPage]?.markdown || '';
    if (pdfMode === 'range' && pdfRange) {
      const from = Math.max(1, Math.min(pages.length, pdfRange.from));
      const to = Math.max(from, Math.min(pages.length, pdfRange.to));
      return pages.slice(from - 1, to).map((p) => p.markdown).join('\n\n');
    }
    return content;
  }, [pdfMode, pages, currentPage, content, pdfRange]);

  const pdfFilename = useMemo(() => {
    if (pdfMode === 'page' && pages.length > 1) {
      const pageTitle = pages[currentPage]?.title?.replace(/[^a-zA-Z0-9\s-]/g, '').trim().replace(/\s+/g, '-').toLowerCase();
      return `${baseFilename}-${pageTitle || `hal-${currentPage + 1}`}`;
    }
    if (pdfMode === 'range' && pdfRange) {
      return `${baseFilename}-hal-${pdfRange.from}-${pdfRange.to}`;
    }
    return baseFilename;
  }, [pdfMode, baseFilename, pages, currentPage, pdfRange]);

  const handleDownloadPdf = useCallback((mode) => {
    setPdfMenuOpen(false);
    if (mode === 'range') {
      setRangePickerOpen(true);
      return;
    }
    setPdfMode(mode);
  }, []);

  const handleRangeConfirm = useCallback((from, to) => {
    setRangePickerOpen(false);
    setPdfRange({ from, to });
    setPdfMode('range');
  }, []);

  useEffect(() => {
    if (!pdfMode || !pdfRef.current) return;
    let cancelled = false;

    const generate = async () => {
      await new Promise((r) => setTimeout(r, 500));
      if (cancelled || !pdfRef.current) return;

      const html2pdf = (await import('html2pdf.js')).default;

      await html2pdf()
        .set({
          margin: [12, 10, 12, 10],
          filename: `${pdfFilename}.pdf`,
          image: { type: 'jpeg', quality: 0.95 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
        })
        .from(pdfRef.current)
        .save();

      if (!cancelled) { setPdfMode(null); setPdfRange(null); }
    };

    generate();
    return () => { cancelled = true; };
  }, [pdfMode, pdfFilename]);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    setUploading(true);
    try {
      const result = await uploadImage(file, activeFolder);
      setPendingImage({ url: result.url, name: file.name });
    } catch (err) { alert('Upload gagal: ' + err.message); }
    finally { setUploading(false); }
  };

  const handlePaste = useCallback(async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) return;
        setUploading(true);
        try {
          const result = await uploadImage(file, activeFolder);
          setPendingImage({ url: result.url, name: file.name });
        } catch (err) { alert('Upload gagal: ' + err.message); }
        finally { setUploading(false); }
        return;
      }
    }
  }, [activeFolder]);

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setUploading(true);
    try {
      const result = await uploadImage(file, activeFolder);
      setPendingImage({ url: result.url, name: file.name });
    } catch (err) { alert('Upload gagal: ' + err.message); }
    finally { setUploading(false); }
  }, [activeFolder]);

  const handlePositionSelect = (heading) => {
    if (!pendingImage) return;
    const markdownImg = `![${pendingImage.name}](${pendingImage.url})`;
    onInsertImage(markdownImg, heading.line);
    setPendingImage(null);
  };

  const hasPagination = pages.length > 1;

  return (
    <div onPaste={handlePaste} onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
      {/* Toolbar */}
      <div className="flex items-center justify-end gap-3 mb-6">
        {uploading && (
          <span className="flex items-center gap-2 font-mono text-xs uppercase tracking-wide text-accent-ink bg-paper-2 border-2 border-ink px-3 py-1.5 mr-auto">
            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Uploading...
          </span>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
        <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
          className="hard-btn flex items-center gap-2 px-3 py-2 text-xs"
          title="Upload screenshot (Ctrl+V / drag-and-drop)">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Image
        </button>
        <div className="relative">
          <button onClick={() => !pdfMode && setPdfMenuOpen(!pdfMenuOpen)} disabled={!!pdfMode}
            className="hard-btn flex items-center gap-2 px-3 py-2 text-xs"
            title="Download sebagai PDF">
            {pdfMode ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
            {pdfMode ? 'Generating...' : 'PDF'}
            {!pdfMode && (
              <svg className={`w-3 h-3 transition-transform ${pdfMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>

          {pdfMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setPdfMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-2 z-50 bg-paper border-2 border-ink shadow-xl w-64 py-2">
                {pages.length > 1 && (
                  <button onClick={() => handleDownloadPdf('page')}
                    className="w-full text-left px-4 py-3 text-xs font-mono border-2 border-transparent hover:bg-paper-2 hover:border-ink transition-colors flex items-center gap-3">
                    <svg className="w-4 h-4 text-ink-40 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                    <div>
                      <span className="block font-bold uppercase tracking-wide text-ink">Halaman ini</span>
                      <span className="block text-xs text-ink-40 mt-0.5 normal-case tracking-normal font-normal">
                        {pages[currentPage]?.title}
                      </span>
                    </div>
                  </button>
                )}
                {pages.length > 1 && (
                  <button onClick={() => handleDownloadPdf('range')}
                    className="w-full text-left px-4 py-3 text-xs font-mono border-2 border-transparent hover:bg-paper-2 hover:border-ink transition-colors flex items-center gap-3">
                    <svg className="w-4 h-4 text-ink-40 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                    <div>
                      <span className="block font-bold uppercase tracking-wide text-ink">Rentang halaman…</span>
                      <span className="block text-xs text-ink-40 mt-0.5 normal-case tracking-normal font-normal">
                        Pilih dari halaman berapa sampai berapa
                      </span>
                    </div>
                  </button>
                )}
                <button onClick={() => handleDownloadPdf('all')}
                  className="w-full text-left px-4 py-3 text-xs font-mono border-2 border-transparent hover:bg-paper-2 hover:border-ink transition-colors flex items-center gap-3">
                    <svg className="w-4 h-4 text-ink-40 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div>
                    <span className="block font-bold uppercase tracking-wide text-ink">Semua halaman</span>
                    <span className="block text-xs text-ink-40 mt-0.5 normal-case tracking-normal font-normal">
                      Seluruh dokumen ({pages.length} halaman)
                    </span>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>
        <button onClick={onEdit}
          className="hard-btn hard-btn-accent flex items-center gap-2 px-4 py-2 text-xs">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit
        </button>
      </div>

      {/* Pagination header */}
      <PageHeader pages={pages} currentPage={currentPage} onPageChange={handlePageChange} />

      {/* Content */}
      <article className="markdown-body book-columns" ref={articleRef}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeSourceLines]}
          components={{
            img({ src, alt }) {
              return <ImageWithZoom src={src} alt={alt} />;
            },
            code({ inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              const codeString = String(children).replace(/\n$/, '');
              if (!inline && match) {
                return (
                  <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div"
                    customStyle={{ borderRadius: '12px', margin: '1.25rem 0', fontSize: '0.8125rem', lineHeight: '1.7' }}>
                    {codeString}
                  </SyntaxHighlighter>
                );
              }
              if (!inline && codeString.includes('\n')) {
                return (
                  <pre className="whitespace-pre overflow-x-auto" style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}>
                    <code {...props}>{children}</code>
                  </pre>
                );
              }
              return <code className={className} {...props}>{children}</code>;
            },
          }}
        >
          {pages[currentPage]?.markdown || ''}
        </ReactMarkdown>
      </article>

      {/* Footer nav */}
      <PageFooterNav pages={pages} currentPage={currentPage} onPageChange={handlePageChange} />

      {pendingImage && (
        <PositionPicker headings={headings} onSelect={handlePositionSelect} onClose={() => setPendingImage(null)} />
      )}

      {rangePickerOpen && (
        <PdfRangePicker
          pages={pages}
          currentPage={currentPage}
          onConfirm={handleRangeConfirm}
          onClose={() => setRangePickerOpen(false)}
        />
      )}

      {pdfMode && (
        <div style={{ position: 'fixed', left: '-9999px', top: 0, width: '210mm', zIndex: -1 }}>
          <div ref={pdfRef} className="markdown-body"
            style={{ padding: '24px 20px', background: '#fff', fontSize: '11px', lineHeight: '1.6', color: '#1e293b' }}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                img({ src, alt }) {
                  return <img src={src} alt={alt || ''} style={{ maxWidth: '100%', borderRadius: '8px', margin: '8px 0' }} />;
                },
                code({ inline, className, children, ...props }) {
                  const codeString = String(children).replace(/\n$/, '');
                  if (!inline && codeString.includes('\n')) {
                    return (
                      <pre style={{
                        background: '#1e293b', color: '#e2e8f0', padding: '12px', borderRadius: '8px',
                        fontSize: '9px', lineHeight: '1.5', overflow: 'hidden', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                      }}>
                        <code>{children}</code>
                      </pre>
                    );
                  }
                  return <code style={{ background: '#f1f5f9', padding: '1px 4px', borderRadius: '3px', fontSize: '9px' }} {...props}>{children}</code>;
                },
              }}
            >
              {pdfContent}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}

function PdfRangePicker({ pages, currentPage, onConfirm, onClose }) {
  const total = pages.length;
  const [from, setFrom] = useState(String(Math.min(currentPage + 1, total)));
  const [to, setTo] = useState(String(total));

  const fromNum = parseInt(from, 10);
  const toNum = parseInt(to, 10);
  const validFrom = Number.isFinite(fromNum) && fromNum >= 1 && fromNum <= total;
  const validTo = Number.isFinite(toNum) && toNum >= 1 && toNum <= total;
  const validRange = validFrom && validTo && fromNum <= toNum;
  const selectedCount = validRange ? (toNum - fromNum + 1) : 0;

  const handleSubmit = () => { if (validRange) onConfirm(fromNum, toNum); };
  const handleKey = (e) => { if (e.key === 'Enter') handleSubmit(); };

  const preview = validRange
    ? pages.slice(fromNum - 1, toNum)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md bg-paper border-2 border-ink shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-5 border-b-2 border-ink bg-paper-2">
          <h3 className="font-display font-extrabold uppercase text-lg text-ink">Download PDF — Rentang Halaman</h3>
          <p className="font-mono text-xs text-ink-40 mt-1.5">
            Pilih rentang halaman yang ingin di-export (total {total} halaman).
          </p>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="stamp-label block text-xs text-ink-70 mb-1.5">Dari halaman</label>
              <input
                type="number"
                min="1"
                max={total}
                value={from}
                autoFocus
                onChange={(e) => setFrom(e.target.value)}
                onKeyDown={handleKey}
                className={`hard-input w-full px-3 py-2 text-sm ${validFrom ? '' : 'hard-input-invalid'}`}
              />
            </div>
            <div>
              <label className="stamp-label block text-xs text-ink-70 mb-1.5">Sampai halaman</label>
              <input
                type="number"
                min="1"
                max={total}
                value={to}
                onChange={(e) => setTo(e.target.value)}
                onKeyDown={handleKey}
                className={`hard-input w-full px-3 py-2 text-sm ${validTo ? '' : 'hard-input-invalid'}`}
              />
            </div>
          </div>

          {!validRange && (from || to) && (
            <p className="font-mono text-xs text-flag-ink">
              Rentang tidak valid. Pastikan 1 ≤ dari ≤ sampai ≤ {total}.
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => { setFrom('1'); setTo(String(total)); }}
              className="hard-btn px-2.5 py-1 text-xs">
              Semua ({total})
            </button>
            <button type="button" onClick={() => { setFrom(String(currentPage + 1)); setTo(String(currentPage + 1)); }}
              className="hard-btn px-2.5 py-1 text-xs">
              Halaman ini ({currentPage + 1})
            </button>
            <button type="button" onClick={() => { setFrom(String(currentPage + 1)); setTo(String(total)); }}
              className="hard-btn px-2.5 py-1 text-xs">
              Dari sini sampai akhir
            </button>
            <button type="button" onClick={() => { setFrom('1'); setTo(String(currentPage + 1)); }}
              className="hard-btn px-2.5 py-1 text-xs">
              Dari awal sampai sini
            </button>
          </div>

          {validRange && (
            <div className="border-2 border-ink bg-paper-2 p-3 max-h-40 overflow-y-auto">
              <p className="stamp-label text-xs text-ink-70 mb-2">
                Preview ({selectedCount} halaman):
              </p>
              <ol className="space-y-1.5">
                {preview.map((p, i) => (
                  <li key={fromNum + i} className="flex items-center gap-2 font-mono text-xs text-ink">
                    <span className="w-5 h-5 bg-accent text-oncover text-[10px] font-bold flex items-center justify-center shrink-0">
                      {fromNum + i}
                    </span>
                    <span className="truncate">{p.title}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t-2 border-ink flex justify-end gap-2 bg-paper-2">
          <button onClick={onClose} className="hard-btn px-4 py-2 text-xs">
            Batal
          </button>
          <button onClick={handleSubmit} disabled={!validRange}
            className="hard-btn hard-btn-accent px-4 py-2 text-xs">
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}
