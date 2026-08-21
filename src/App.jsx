import { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Breadcrumb from './components/Breadcrumb';
import MarkdownViewer from './components/MarkdownViewer';
import MarkdownEditor from './components/MarkdownEditor';
import Home from './components/Home';
import { fetchFileTree, fetchFile, saveFile } from './utils/api';

export default function App() {
  const [tree, setTree] = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  const [content, setContent] = useState('');
  const [mode, setMode] = useState('view');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [error, setError] = useState(null);
  const [scrollToLine, setScrollToLine] = useState(null);
  const pendingLineRef = useRef(null);
  const scrollKeyRef = useRef(0);

  const loadTree = useCallback(async ({ selectFirst = false } = {}) => {
    try {
      const data = await fetchFileTree();
      setTree(data);
      if (selectFirst) {
        for (const item of data) {
          if (item.type === 'file') { setActiveFile(item.path); return; }
          if (item.type === 'folder' && item.files.length > 0) { setActiveFile(item.files[0].path); return; }
        }
      }
    } catch {
      setError('Failed to load file tree. Is the server running?');
    }
  }, []);

  useEffect(() => {
    loadTree().finally(() => setLoading(false));
  }, [loadTree]);

  const handleGoHome = useCallback(() => {
    setMode('view');
    setActiveFile(null);
    setSidebarCollapsed(true);
  }, []);

  useEffect(() => {
    if (!activeFile) return;
    setLoading(true);
    setError(null);
    fetchFile(activeFile)
      .then((data) => setContent(data.content))
      .catch(() => setError('Failed to load file'))
      .finally(() => setLoading(false));
  }, [activeFile]);

  useEffect(() => {
    if (loading || !pendingLineRef.current) return;
    const line = pendingLineRef.current;
    pendingLineRef.current = null;
    scrollKeyRef.current += 1;
    setScrollToLine({ line, key: scrollKeyRef.current });
  }, [loading, content]);

  const handleSelectFile = useCallback((path, lineNumber) => {
    pendingLineRef.current = lineNumber || null;
    setMode('view');
    setActiveFile((prev) => {
      if (prev === path && lineNumber) {
        scrollKeyRef.current += 1;
        setScrollToLine({ line: lineNumber, key: scrollKeyRef.current });
        return prev;
      }
      return path;
    });
  }, []);

  const handleSelectFileFromMenu = useCallback((path, lineNumber) => {
    handleSelectFile(path, lineNumber);
    setSidebarCollapsed(true);
  }, [handleSelectFile]);

  const handleSave = useCallback(async (newContent) => {
    setSaving(true);
    try {
      await saveFile(activeFile, newContent);
      setContent(newContent);
      setMode('view');
    } catch { setError('Failed to save file'); }
    finally { setSaving(false); }
  }, [activeFile]);

  const handleInsertImage = useCallback(async (markdownImg, atLine) => {
    const lines = content.split('\n');
    const insertAt = atLine === 0 ? 0 : atLine + 1;
    lines.splice(insertAt, 0, '', markdownImg, '');
    const newContent = lines.join('\n');
    try {
      await saveFile(activeFile, newContent);
      setContent(newContent);
    } catch { setError('Gagal menyimpan gambar'); }
  }, [activeFile, content]);

  return (
    <div className="min-h-screen bg-paper">
      <Sidebar
        tree={tree}
        activeFile={activeFile}
        onSelectFile={handleSelectFileFromMenu}
        onRefresh={loadTree}
        onGoHome={handleGoHome}
        collapsed={sidebarCollapsed}
      />

      {!sidebarCollapsed && (
        <div
          onClick={() => setSidebarCollapsed(true)}
          className="fixed inset-0 z-20 bg-ink/50"
          aria-hidden="true"
        />
      )}

      {/* Persistent menu bar — always visible, slides with the drawer */}
      <div className={`fixed top-6 z-50 flex items-center gap-2 transition-all duration-300 ${
        sidebarCollapsed ? 'left-6' : 'left-[316px]'
      }`}>
        <button onClick={() => setSidebarCollapsed((c) => !c)}
          className="hard-btn hard-btn-fill p-3"
          title={sidebarCollapsed ? 'Buka menu' : 'Tutup menu'}>
          {sidebarCollapsed ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </button>
        <button onClick={handleGoHome}
          className="hard-btn hard-btn-accent p-3"
          title="Ke halaman utama">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 11.5L12 4l9 7.5M5 10v10h5v-6h4v6h5V10" />
          </svg>
        </button>
      </div>

      <main className="min-h-screen">
        <div className="max-w-[92rem] mx-auto px-6 md:px-10 py-10 md:py-14 pt-24">
          <Breadcrumb path={activeFile} />

          {error && (
            <div className="hard-panel-flag mb-8 p-4 flex items-center gap-3">
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="flex-1 font-mono text-sm">{error}</span>
              <button onClick={() => setError(null)} className="hover:opacity-60 transition-opacity">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-32">
              <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-ink-40 border-t-accent animate-spin" />
                <span className="stamp-label text-ink-40 text-xs">Memuat dokumen...</span>
              </div>
            </div>
          ) : !activeFile ? (
            <Home tree={tree} onSelectFile={handleSelectFile} />
          ) : (
            <div className="book-frame px-6 sm:px-10 lg:px-16 py-10 lg:py-14">
              {mode === 'edit' ? (
                <MarkdownEditor
                  content={content}
                  onSave={handleSave}
                  onCancel={() => setMode('view')}
                  saving={saving}
                  activeFolder={activeFile?.split('/')[0]}
                />
              ) : (
                <MarkdownViewer
                  content={content}
                  onEdit={() => setMode('edit')}
                  onInsertImage={handleInsertImage}
                  activeFolder={activeFile?.split('/')[0]}
                  activeFile={activeFile}
                  scrollToLine={scrollToLine}
                />
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
