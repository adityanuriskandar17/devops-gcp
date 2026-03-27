import { useState, useEffect, useRef, useCallback } from 'react';
import { searchFiles } from '../utils/api';

function highlightMatch(text, query) {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-300/80 text-yellow-900 rounded-sm px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export default function Sidebar({ tree, activeFile, onSelectFile, collapsed, onToggle }) {
  const [expanded, setExpanded] = useState({});
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  const toggle = (folder) => setExpanded((prev) => ({ ...prev, [folder]: !prev[folder] }));

  const doSearch = useCallback(async (q) => {
    if (q.length < 2) { setResults([]); setShowResults(false); return; }
    setSearching(true);
    try {
      const data = await searchFiles(q);
      setResults(data);
      setShowResults(true);
    } catch { setResults([]); }
    finally { setSearching(false); }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, doSearch]);

  const handleResultClick = (result) => {
    onSelectFile(result.file, result.line);
    setShowResults(false);
    setQuery('');
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    inputRef.current?.focus();
  };

  const grouped = {};
  for (const r of results) {
    if (!grouped[r.file]) grouped[r.file] = [];
    grouped[r.file].push(r);
  }

  return (
    <aside className={`fixed top-0 left-0 h-full bg-[#0f1729] text-white z-30 transition-all duration-300 flex flex-col ${
      collapsed ? 'w-0 overflow-hidden' : 'w-[280px]'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <span className="text-sm font-bold tracking-tight text-slate-100">DevOps Docs</span>
        </div>
        <button onClick={onToggle} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white" title="Collapse sidebar">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Search */}
      <div className="px-4 pb-4">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setShowResults(true)}
            placeholder="Cari dokumen..."
            className="w-full pl-9 pr-8 py-2.5 text-sm bg-white/5 border border-white/10 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:bg-white/10 focus:border-blue-500/50 transition-all"
          />
          {query && (
            <button onClick={handleClear} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          {searching && (
            <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
        </div>
      </div>

      {/* Search results or file tree */}
      {showResults && results.length > 0 ? (
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-2 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-medium">{results.length} hasil</span>
            <button onClick={() => setShowResults(false)} className="text-[11px] text-blue-400 hover:text-blue-300 font-medium">Tutup</button>
          </div>
          {Object.entries(grouped).map(([file, matches]) => (
            <div key={file} className="mb-0.5">
              <div className="px-4 py-1.5 text-[11px] font-medium text-slate-500 truncate">{file}</div>
              {matches.slice(0, 5).map((r, i) => (
                <button key={`${file}-${r.line}-${i}`} onClick={() => handleResultClick(r)}
                  className="w-full text-left px-4 py-2.5 hover:bg-white/5 transition-colors">
                  {r.heading && <div className="text-[11px] text-blue-400/80 truncate mb-0.5">{r.heading}</div>}
                  <div className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{highlightMatch(r.match, query)}</div>
                  <div className="text-[10px] text-slate-600 mt-0.5">Baris {r.line}</div>
                </button>
              ))}
              {matches.length > 5 && (
                <div className="px-4 py-1 text-[10px] text-slate-600">+{matches.length - 5} lainnya</div>
              )}
            </div>
          ))}
        </div>
      ) : showResults && query.length >= 2 && !searching ? (
        <div className="px-5 py-10 text-center">
          <p className="text-xs text-slate-500">Tidak ada hasil untuk &quot;{query}&quot;</p>
        </div>
      ) : (
        <nav className="flex-1 overflow-y-auto px-3 py-1">
          {tree.map((item) => {
            if (item.type === 'file') {
              const isActive = activeFile === item.path;
              return (
                <button key={item.path} onClick={() => onSelectFile(item.path)}
                  className={`w-full text-left px-3 py-2 text-[13px] rounded-lg flex items-center gap-2.5 transition-all mb-0.5 ${
                    isActive
                      ? 'bg-blue-600/15 text-blue-400 font-medium'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`}>
                  <svg className="w-4 h-4 shrink-0 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="truncate">{item.name}</span>
                </button>
              );
            }

            const isExpanded = expanded[item.name] === true || (expanded[item.name] === undefined && activeFile?.startsWith(item.name + '/'));
            return (
              <div key={item.name} className="mb-0.5">
                <button onClick={() => toggle(item.name)}
                  className="w-full text-left px-3 py-2.5 text-[13px] font-semibold flex items-center gap-2.5 hover:bg-white/5 rounded-lg transition-colors text-slate-300">
                  <svg className={`w-3 h-3 transition-transform duration-200 text-slate-500 ${isExpanded ? 'rotate-90' : ''}`}
                    fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <svg className="w-4 h-4 shrink-0 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  <span className="flex-1">{item.name}</span>
                  <span className="text-[11px] text-slate-600 font-normal">{item.files.length}</span>
                </button>
                {isExpanded && (
                  <div className="ml-3 pl-3 border-l border-white/5">
                    {item.files.map((file) => {
                      const isActive = activeFile === file.path;
                      return (
                        <button key={file.path} onClick={() => onSelectFile(file.path)}
                          className={`w-full text-left px-3 py-1.5 text-[13px] rounded-lg flex items-center gap-2 transition-all mb-0.5 ${
                            isActive
                              ? 'bg-blue-600/15 text-blue-400 font-medium'
                              : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'
                          }`}>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? 'bg-blue-400' : 'bg-slate-600'}`} />
                          <span className="truncate">{file.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      )}

      <div className="px-5 py-3 border-t border-white/5 text-[11px] text-slate-600 font-medium">
        GCP Documentation
      </div>
    </aside>
  );
}
