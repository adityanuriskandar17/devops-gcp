import { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Breadcrumb from './components/Breadcrumb';
import MarkdownViewer from './components/MarkdownViewer';
import MarkdownEditor from './components/MarkdownEditor';
import { fetchFileTree, fetchFile, saveFile } from './utils/api';

export default function App() {
  const [tree, setTree] = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  const [content, setContent] = useState('');
  const [mode, setMode] = useState('view');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [error, setError] = useState(null);
  const [scrollToLine, setScrollToLine] = useState(null);
  const pendingLineRef = useRef(null);
  const scrollKeyRef = useRef(0);

  useEffect(() => {
    fetchFileTree()
      .then((data) => {
        setTree(data);
        for (const item of data) {
          if (item.type === 'file') { setActiveFile(item.path); return; }
          if (item.type === 'folder' && item.files.length > 0) { setActiveFile(item.files[0].path); return; }
        }
      })
      .catch(() => setError('Failed to load file tree. Is the server running?'))
      .finally(() => setLoading(false));
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
    <div className="min-h-screen bg-[#f6f8fb]">
      <Sidebar
        tree={tree}
        activeFile={activeFile}
        onSelectFile={handleSelectFile}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((c) => !c)}
      />

      {sidebarCollapsed && (
        <button onClick={() => setSidebarCollapsed(false)}
          className="fixed top-4 left-4 z-40 p-2.5 bg-slate-900 text-white rounded-xl shadow-lg hover:bg-slate-800 transition-colors"
          title="Open sidebar">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      <main className={`transition-all duration-300 min-h-screen ${sidebarCollapsed ? 'ml-0' : 'ml-[280px]'}`}>
        <div className="max-w-[52rem] mx-auto px-6 py-8">
          <Breadcrumb path={activeFile} />

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200/80 text-red-700 rounded-xl flex items-center gap-3 text-sm">
              <svg className="w-5 h-5 shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="flex-1">{error}</span>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-32">
              <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                <span className="text-slate-400 text-sm font-medium">Memuat dokumen...</span>
              </div>
            </div>
          ) : !activeFile ? (
            <div className="flex flex-col items-center justify-center py-32 text-slate-400">
              <div className="w-16 h-16 mb-5 rounded-2xl bg-slate-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-base font-semibold text-slate-500">Pilih dokumen</p>
              <p className="text-sm mt-1 text-slate-400">Pilih file dari sidebar untuk mulai membaca</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm px-8 py-8 lg:px-10">
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
