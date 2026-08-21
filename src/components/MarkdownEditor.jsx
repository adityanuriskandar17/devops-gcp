import { useState, useRef, useCallback } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { uploadImage } from '../utils/api';

export default function MarkdownEditor({ content, onSave, onCancel, saving, activeFolder }) {
  const [value, setValue] = useState(content);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleUpload = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setUploading(true);
    try {
      const result = await uploadImage(file, activeFolder);
      const markdownImg = `\n![${file.name}](${result.url})\n`;
      setValue((prev) => prev + markdownImg);
    } catch (err) {
      alert('Upload gagal: ' + err.message);
    } finally {
      setUploading(false);
    }
  }, [activeFolder]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    e.target.value = '';
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  }, [handleUpload]);

  const handlePaste = useCallback((e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) handleUpload(file);
        return;
      }
    }
  }, [handleUpload]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="stamp-label text-sm text-ink-70">Editing Mode</span>
          {uploading && (
            <span className="flex items-center gap-2 font-mono text-xs uppercase tracking-wide text-accent-ink bg-paper-2 border-2 border-ink px-3 py-1.5">
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Uploading image...
            </span>
          )}
        </div>
        <div className="flex gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="hard-btn flex items-center gap-2 px-3 py-2 text-xs"
            title="Upload screenshot (atau paste / drag-and-drop gambar)"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Upload Image
          </button>
          <button
            onClick={onCancel}
            className="hard-btn px-4 py-2 text-xs"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(value)}
            disabled={saving}
            className="hard-btn hard-btn-ok flex items-center gap-2 px-4 py-2 text-xs"
          >
            {saving ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Save
              </>
            )}
          </button>
        </div>
      </div>
      <div
        className="flex-1 min-h-0"
        data-color-mode="light"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onPaste={handlePaste}
      >
        <MDEditor
          value={value}
          onChange={setValue}
          height="calc(100vh - 200px)"
          preview="live"
          visibleDragbar={false}
        />
      </div>
      <p className="mt-3 font-mono text-xs text-ink-40">
        Tip: Anda bisa paste screenshot langsung (Ctrl+V) atau drag-and-drop gambar ke editor.
      </p>
    </div>
  );
}
