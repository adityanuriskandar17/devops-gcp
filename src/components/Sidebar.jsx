import { useState, useEffect, useRef, useCallback } from 'react';
import { searchFiles, createFolder, createFile, updateFolderOrder, deleteFolder } from '../utils/api';

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

export default function Sidebar({ tree, activeFile, onSelectFile, onRefresh, collapsed, onToggle }) {
  const [expanded, setExpanded] = useState({});
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [orderMode, setOrderMode] = useState(false);
  const [draftList, setDraftList] = useState([]);
  const [dragIdx, setDragIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [actionBusy, setActionBusy] = useState(false);
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

  // Nomor urut belajar untuk setiap folder (berdasarkan posisi di tree).
  const folderByName = {};
  const folderNames = [];
  for (const item of tree) {
    if (item.type === 'folder') {
      folderNames.push(item.name);
      folderByName[item.name] = item;
    }
  }
  // Saat orderMode: dari draftList (bisa ter-reorder); selain itu: dari tree order.
  const displayFolders = orderMode ? draftList : folderNames;
  const folderOrder = {};
  displayFolders.forEach((n, i) => { folderOrder[n] = String(i + 1).padStart(2, '0'); });
  const rootFiles = tree.filter((t) => t.type === 'file');

  const enterOrderMode = () => {
    setDraftList([...folderNames]);
    setOrderMode(true);
    setActionError(null);
  };

  const cancelOrderMode = () => {
    setOrderMode(false);
    setDraftList([]);
    setDragIdx(null);
    setDragOverIdx(null);
    setActionError(null);
  };

  const moveItem = (from, to) => {
    if (from < 0 || to < 0 || from >= draftList.length || to >= draftList.length || from === to) return;
    setDraftList((list) => {
      const next = [...list];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const saveOrder = async () => {
    setActionBusy(true);
    setActionError(null);
    try {
      await updateFolderOrder(draftList);
      await onRefresh?.();
      setOrderMode(false);
      setDraftList([]);
      setDragIdx(null);
      setDragOverIdx(null);
    } catch (e) {
      setActionError(e.message || 'Gagal menyimpan urutan');
    } finally {
      setActionBusy(false);
    }
  };

  const handleRemoveFolder = async (name) => {
    const folderItem = tree.find((t) => t.type === 'folder' && t.name === name);
    const count = folderItem?.files.length ?? 0;
    const confirmMsg = count > 0
      ? `Folder "${name}" berisi ${count} file .md. Hapus SEMUA file dan folder?`
      : `Hapus folder "${name}"?`;
    if (!window.confirm(confirmMsg)) return;
    setActionBusy(true);
    setActionError(null);
    try {
      await deleteFolder(name, { force: count > 0 });
      await onRefresh?.();
    } catch (e) {
      setActionError(e.message || 'Gagal menghapus folder');
    } finally {
      setActionBusy(false);
    }
  };

  const handleCreateMenu = async ({ name, file, mdFileName }) => {
    setActionBusy(true);
    setActionError(null);
    try {
      await createFolder(name);
      if (file) {
        const text = await file.text();
        const finalName = (mdFileName || file.name || 'README.md').trim();
        const safeName = finalName.toLowerCase().endsWith('.md') ? finalName : `${finalName}.md`;
        await createFile(`${name}/${safeName}`, text);
      }
      await onRefresh?.();
      setShowCreateMenu(false);
    } catch (e) {
      setActionError(e.message || 'Gagal membuat menu baru');
    } finally {
      setActionBusy(false);
    }
  };

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

      {/* Action bar */}
      <div className="px-4 pb-2 flex gap-2">
        <button
          onClick={() => { setShowCreateMenu(true); setActionError(null); }}
          disabled={actionBusy || orderMode}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-2 text-[12px] font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="Buat menu baru + upload .md">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Menu Baru
        </button>
        {orderMode ? (
          <>
            <button
              onClick={saveOrder}
              disabled={actionBusy}
              className="inline-flex items-center justify-center gap-1 px-2.5 py-2 text-[12px] font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors disabled:opacity-50">
              Simpan
            </button>
            <button
              onClick={cancelOrderMode}
              disabled={actionBusy}
              className="inline-flex items-center justify-center px-2.5 py-2 text-[12px] font-semibold rounded-lg bg-white/10 text-slate-200 hover:bg-white/15 transition-colors disabled:opacity-50">
              Batal
            </button>
          </>
        ) : (
          <button
            onClick={enterOrderMode}
            disabled={actionBusy || folderNames.length < 2}
            className="inline-flex items-center justify-center gap-1 px-2.5 py-2 text-[12px] font-semibold rounded-lg bg-white/10 text-slate-200 hover:bg-white/15 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Atur urutan menu">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h13M3 12h9m-9 5h13M17 7l4 4-4 4" />
            </svg>
            Urutan
          </button>
        )}
      </div>

      {actionError && (
        <div className="mx-4 mb-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-[11px] text-red-300">
          {actionError}
        </div>
      )}

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
          {rootFiles.map((item) => {
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
          })}

          {orderMode && displayFolders.length > 0 && (
            <div className="px-3 pt-2 pb-1 text-[10px] text-slate-500">
              Seret folder untuk mengatur urutan. Nomor akan otomatis menyesuaikan.
            </div>
          )}

          {displayFolders.map((name, idx) => {
            const item = folderByName[name];
            if (!item) return null;
            const orderNumber = folderOrder[name];

            if (orderMode) {
              const isDragging = dragIdx === idx;
              const isDragOver = dragOverIdx === idx && dragIdx !== idx;
              return (
                <div
                  key={name}
                  draggable
                  onDragStart={(e) => { setDragIdx(idx); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', name); } catch {} }}
                  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (dragOverIdx !== idx) setDragOverIdx(idx); }}
                  onDragLeave={() => { if (dragOverIdx === idx) setDragOverIdx(null); }}
                  onDrop={(e) => { e.preventDefault(); if (dragIdx !== null && dragIdx !== idx) moveItem(dragIdx, idx); setDragIdx(null); setDragOverIdx(null); }}
                  onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
                  className={`mb-0.5 flex items-center gap-2 px-2 py-2 rounded-lg border transition-all cursor-grab active:cursor-grabbing ${
                    isDragging
                      ? 'opacity-40 border-blue-500/60 bg-blue-500/10'
                      : isDragOver
                        ? 'border-blue-400 bg-blue-500/20 ring-2 ring-blue-400/50'
                        : 'border-white/10 bg-white/[0.03] hover:bg-white/10'
                  }`}
                >
                  <svg className="w-4 h-4 text-slate-500 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M7 4a1 1 0 11-2 0 1 1 0 012 0zm0 6a1 1 0 11-2 0 1 1 0 012 0zm0 6a1 1 0 11-2 0 1 1 0 012 0zm8-12a1 1 0 11-2 0 1 1 0 012 0zm0 6a1 1 0 11-2 0 1 1 0 012 0zm0 6a1 1 0 11-2 0 1 1 0 012 0z" />
                  </svg>
                  <span className="inline-flex items-center justify-center min-w-[24px] h-[22px] px-1.5 rounded-md bg-blue-500/20 text-blue-300 text-[11px] font-bold tabular-nums shrink-0">
                    {orderNumber}
                  </span>
                  <span className="flex-1 truncate text-[13px] font-semibold text-slate-200">{name}</span>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      onClick={() => moveItem(idx, idx - 1)}
                      disabled={idx === 0}
                      title="Pindah ke atas"
                      className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:hover:bg-transparent">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => moveItem(idx, idx + 1)}
                      disabled={idx === displayFolders.length - 1}
                      title="Pindah ke bawah"
                      className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:hover:bg-transparent">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            }

            const isExpanded = expanded[name] === true || (expanded[name] === undefined && activeFile?.startsWith(name + '/'));
            return (
              <div key={name} className="mb-0.5 group">
                <div className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-slate-300">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => toggle(name)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(name); } }}
                    className="flex items-center gap-2 flex-1 min-w-0 text-left cursor-pointer select-none"
                  >
                    <svg className={`w-3 h-3 transition-transform duration-200 text-slate-500 ${isExpanded ? 'rotate-90' : ''}`}
                      fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="inline-flex items-center justify-center min-w-[22px] h-[20px] px-1.5 rounded-md bg-blue-500/15 text-blue-400 text-[10px] font-bold tabular-nums shrink-0">
                      {orderNumber}
                    </span>
                    <span className="flex-1 truncate text-[13px] font-semibold">{name}</span>
                    <span className="text-[11px] text-slate-600 font-normal">{item.files.length}</span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRemoveFolder(name); }}
                    disabled={actionBusy}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-30"
                    title={`Hapus folder "${name}"`}>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                    </svg>
                  </button>
                </div>
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

      {showCreateMenu && (
        <CreateMenuModal
          onClose={() => { setShowCreateMenu(false); setActionError(null); }}
          onSubmit={handleCreateMenu}
          busy={actionBusy}
          error={actionError}
        />
      )}
    </aside>
  );
}

function CreateMenuModal({ onClose, onSubmit, busy, error }) {
  const [name, setName] = useState('');
  const [file, setFile] = useState(null);
  const [mdFileName, setMdFileName] = useState('');
  const fileInputRef = useRef(null);

  const NAME_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{0,39}$/;
  const nameValid = NAME_RE.test(name);

  const handleFile = (f) => {
    if (!f) { setFile(null); return; }
    if (!f.name.toLowerCase().endsWith('.md')) {
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      alert('File harus berformat .md');
      return;
    }
    setFile(f);
    if (!mdFileName) setMdFileName(f.name);
  };

  const canSubmit = nameValid && !busy;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-100">Buat Menu Baru</h3>
          <button onClick={onClose} className="p-1 rounded-md text-slate-500 hover:text-white hover:bg-white/10">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">Nama Menu / Folder</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="contoh: Cloud-Run"
              autoFocus
              className="w-full px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500/60"
            />
            <p className="mt-1.5 text-[10px] text-slate-500">
              Gunakan huruf, angka, <code className="text-slate-400">-</code>, atau <code className="text-slate-400">_</code>. Tanpa spasi. Maks 40 karakter.
            </p>
            {name && !nameValid && (
              <p className="mt-1 text-[10px] text-red-400">Format nama tidak valid.</p>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">Upload File .md <span className="text-slate-600 font-normal">(opsional)</span></label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,text/markdown"
              onChange={(e) => handleFile(e.target.files?.[0])}
              className="block w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-slate-200 hover:file:bg-white/15 file:cursor-pointer cursor-pointer"
            />
            {file && (
              <div className="mt-2">
                <label className="block text-[10px] text-slate-500 mb-1">Simpan sebagai</label>
                <input
                  type="text"
                  value={mdFileName}
                  onChange={(e) => setMdFileName(e.target.value)}
                  placeholder="README.md"
                  className="w-full px-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500/60"
                />
              </div>
            )}
          </div>

          {error && (
            <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-[11px] text-red-300">{error}</div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-white/10 flex justify-end gap-2 bg-white/[0.02]">
          <button onClick={onClose} disabled={busy}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-300 hover:bg-white/10 disabled:opacity-50">
            Batal
          </button>
          <button
            onClick={() => canSubmit && onSubmit({ name, file, mdFileName })}
            disabled={!canSubmit}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
            {busy ? 'Membuat…' : 'Buat Menu'}
          </button>
        </div>
      </div>
    </div>
  );
}
