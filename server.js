import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOCS_ROOT = __dirname;
const IMAGES_DIR = path.join(DOCS_ROOT, 'images');
const CONFIG_FILE = path.join(DOCS_ROOT, 'folders.config.json');

// Default learning order; used only if config file belum ada.
const DEFAULT_ORDER = [
  'Tutorial-GCE',
  'IAM',
  'Compute-Engine',
  'Cloud-Storage',
  'Cloud-SQL',
  'Cloud-CDN',
  'Cloud-Armor',
  'Cloud-KMS',
  'GKE',
  'Cloud-Monitoring',
  'Review-IT',
  'GCP-error',
];

// List folder aktif (urutan = urutan belajar). Dimutasi via endpoint dan persisted ke CONFIG_FILE.
let ALLOWED_FOLDERS = [];

const FOLDER_NAME_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{0,39}$/;
const RESERVED_NAMES = new Set(['images', 'node_modules', 'src', 'public', '.git', '.vscode', 'dist', 'build']);

function isValidFolderName(name) {
  if (typeof name !== 'string') return false;
  if (!FOLDER_NAME_RE.test(name)) return false;
  if (RESERVED_NAMES.has(name)) return false;
  return true;
}

function readConfigSync() {
  try {
    const raw = readFileSync(CONFIG_FILE, 'utf-8');
    const data = JSON.parse(raw);
    if (Array.isArray(data?.order)) return data.order.filter((x) => typeof x === 'string');
  } catch {}
  return null;
}

async function saveConfig() {
  await fs.writeFile(CONFIG_FILE, JSON.stringify({ order: ALLOWED_FOLDERS }, null, 2), 'utf-8');
}

// Sinkronkan ALLOWED_FOLDERS dengan disk: pertahankan urutan dari config,
// tambahkan folder baru yang muncul di disk di akhir, buang folder yang tidak ada di disk.
async function reconcileFolders() {
  const stored = readConfigSync() ?? DEFAULT_ORDER;

  let diskDirs = [];
  try {
    const entries = await fs.readdir(DOCS_ROOT, { withFileTypes: true });
    diskDirs = entries
      .filter((e) => e.isDirectory() && isValidFolderName(e.name))
      .map((e) => e.name);
  } catch {}

  const diskSet = new Set(diskDirs);
  const ordered = stored.filter((n) => diskSet.has(n));
  for (const d of diskDirs) {
    if (!ordered.includes(d)) ordered.push(d);
  }

  ALLOWED_FOLDERS = ordered;
  await saveConfig();
}

if (!existsSync(IMAGES_DIR)) mkdirSync(IMAGES_DIR, { recursive: true });
await reconcileFolders();

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    const subfolder = _req.params.folder;
    const dest = subfolder && ALLOWED_FOLDERS.includes(subfolder)
      ? path.join(IMAGES_DIR, subfolder)
      : IMAGES_DIR;
    if (!existsSync(dest)) mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename(_req, file, cb) {
    const ts = Date.now();
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${ts}-${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (/^image\/(png|jpe?g|gif|webp|svg\+xml)$/.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Serve uploaded images as static files
app.use('/images', express.static(IMAGES_DIR));

function isValidPath(folder, file) {
  if (!ALLOWED_FOLDERS.includes(folder)) return false;
  if (file && !file.endsWith('.md')) return false;
  if (file && file.includes('..')) return false;
  return true;
}

// List all folders and files
app.get('/api/files', async (_req, res) => {
  try {
    const tree = [];

    // Add root README
    try {
      await fs.access(path.join(DOCS_ROOT, 'README.md'));
      tree.push({ type: 'file', name: 'README.md', path: 'README.md' });
    } catch {}

    for (const folder of ALLOWED_FOLDERS) {
      const folderPath = path.join(DOCS_ROOT, folder);
      try {
        const entries = await fs.readdir(folderPath);
        const files = entries
          .filter(f => f.endsWith('.md'))
          .sort()
          .map(f => ({ type: 'file', name: f, path: `${folder}/${f}` }));

        tree.push({ type: 'folder', name: folder, files });
      } catch {
        // folder doesn't exist, skip
      }
    }

    res.json(tree);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === Folder (menu) management ===

// List folders + urutan saat ini
app.get('/api/folders', (_req, res) => {
  res.json({ order: ALLOWED_FOLDERS });
});

// Buat folder baru (ditambahkan di akhir urutan)
app.post('/api/folders', async (req, res) => {
  const { name } = req.body || {};
  if (!isValidFolderName(name)) {
    return res.status(400).json({ error: 'Nama folder tidak valid. Gunakan huruf, angka, - atau _ (maks 40 karakter).' });
  }
  if (ALLOWED_FOLDERS.includes(name)) {
    return res.status(409).json({ error: 'Folder sudah ada.' });
  }
  try {
    const folderPath = path.join(DOCS_ROOT, name);
    await fs.mkdir(folderPath, { recursive: true });
    ALLOWED_FOLDERS.push(name);
    await saveConfig();
    res.status(201).json({ success: true, order: ALLOWED_FOLDERS });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Simpan urutan baru (array nama folder)
app.put('/api/folders/order', async (req, res) => {
  const { order } = req.body || {};
  if (!Array.isArray(order) || order.some((n) => typeof n !== 'string')) {
    return res.status(400).json({ error: 'Payload order harus array of string.' });
  }
  const current = new Set(ALLOWED_FOLDERS);
  const incoming = new Set(order);
  if (order.length !== ALLOWED_FOLDERS.length || order.some((n) => !current.has(n))) {
    return res.status(400).json({ error: 'Urutan harus berisi semua folder yang ada, tanpa duplikat/tambahan.' });
  }
  if (incoming.size !== order.length) {
    return res.status(400).json({ error: 'Terdapat folder duplikat dalam urutan.' });
  }
  ALLOWED_FOLDERS = [...order];
  await saveConfig();
  res.json({ success: true, order: ALLOWED_FOLDERS });
});

// Hapus folder (hanya jika kosong; gambar folder ikut dihapus bila kosong)
app.delete('/api/folders/:folder', async (req, res) => {
  const { folder } = req.params;
  const { force } = req.query;
  if (!ALLOWED_FOLDERS.includes(folder)) {
    return res.status(404).json({ error: 'Folder tidak ditemukan.' });
  }
  const folderPath = path.join(DOCS_ROOT, folder);
  try {
    const entries = await fs.readdir(folderPath);
    const mdFiles = entries.filter((f) => f.endsWith('.md'));
    if (mdFiles.length > 0 && force !== 'true') {
      return res.status(409).json({ error: `Folder berisi ${mdFiles.length} file .md. Hapus file dulu atau gunakan force=true.` });
    }
    if (force === 'true') {
      await fs.rm(folderPath, { recursive: true, force: true });
    } else {
      await fs.rmdir(folderPath).catch(async () => {
        await fs.rm(folderPath, { recursive: true, force: true });
      });
    }
    const imgDir = path.join(IMAGES_DIR, folder);
    await fs.rm(imgDir, { recursive: true, force: true }).catch(() => {});
    ALLOWED_FOLDERS = ALLOWED_FOLDERS.filter((f) => f !== folder);
    await saveConfig();
    res.json({ success: true, order: ALLOWED_FOLDERS });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Read root README
app.get('/api/files/README.md', async (_req, res) => {
  try {
    const filePath = path.join(DOCS_ROOT, 'README.md');
    const content = await fs.readFile(filePath, 'utf-8');
    res.json({ content, path: 'README.md' });
  } catch (err) {
    res.status(404).json({ error: 'File not found' });
  }
});

// Read a file
app.get('/api/files/:folder/:file', async (req, res) => {
  const { folder, file } = req.params;
  if (!isValidPath(folder, file)) return res.status(400).json({ error: 'Invalid path' });

  try {
    const filePath = path.join(DOCS_ROOT, folder, file);
    const content = await fs.readFile(filePath, 'utf-8');
    res.json({ content, path: `${folder}/${file}` });
  } catch {
    res.status(404).json({ error: 'File not found' });
  }
});

// Update a file
app.put('/api/files/:folder/:file', async (req, res) => {
  const { folder, file } = req.params;
  const { content } = req.body;
  if (!isValidPath(folder, file)) return res.status(400).json({ error: 'Invalid path' });
  if (typeof content !== 'string') return res.status(400).json({ error: 'Content required' });

  try {
    const filePath = path.join(DOCS_ROOT, folder, file);
    await fs.writeFile(filePath, content, 'utf-8');
    res.json({ success: true, path: `${folder}/${file}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new file
app.post('/api/files/:folder/:file', async (req, res) => {
  const { folder, file } = req.params;
  const { content } = req.body;
  if (!isValidPath(folder, file)) return res.status(400).json({ error: 'Invalid path' });

  try {
    const filePath = path.join(DOCS_ROOT, folder, file);
    try {
      await fs.access(filePath);
      return res.status(409).json({ error: 'File already exists' });
    } catch {}

    await fs.writeFile(filePath, content || `# ${file.replace('.md', '')}\n`, 'utf-8');
    res.status(201).json({ success: true, path: `${folder}/${file}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a file
app.delete('/api/files/:folder/:file', async (req, res) => {
  const { folder, file } = req.params;
  if (!isValidPath(folder, file)) return res.status(400).json({ error: 'Invalid path' });
  if (file === 'README.md') return res.status(403).json({ error: 'Cannot delete README' });

  try {
    const filePath = path.join(DOCS_ROOT, folder, file);
    await fs.unlink(filePath);
    res.json({ success: true });
  } catch {
    res.status(404).json({ error: 'File not found' });
  }
});

// Upload image (with optional folder context)
app.post('/api/upload/:folder?', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

  const subfolder = req.params.folder;
  const relativePath = subfolder
    ? `/images/${subfolder}/${req.file.filename}`
    : `/images/${req.file.filename}`;

  res.json({
    success: true,
    url: relativePath,
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
  });
});

// List images for a folder
app.get('/api/images/:folder?', async (req, res) => {
  try {
    const subfolder = req.params.folder;
    const dir = subfolder && ALLOWED_FOLDERS.includes(subfolder)
      ? path.join(IMAGES_DIR, subfolder)
      : IMAGES_DIR;

    try {
      const entries = await fs.readdir(dir);
      const images = entries
        .filter(f => /\.(png|jpe?g|gif|webp|svg)$/i.test(f))
        .sort()
        .map(f => ({
          name: f,
          url: subfolder ? `/images/${subfolder}/${f}` : `/images/${f}`,
        }));
      res.json(images);
    } catch {
      res.json([]);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete an image
app.delete('/api/images/:folder/:filename', async (req, res) => {
  const { folder, filename } = req.params;
  if (!ALLOWED_FOLDERS.includes(folder)) return res.status(400).json({ error: 'Invalid folder' });
  if (filename.includes('..')) return res.status(400).json({ error: 'Invalid filename' });

  try {
    await fs.unlink(path.join(IMAGES_DIR, folder, filename));
    res.json({ success: true });
  } catch {
    res.status(404).json({ error: 'Image not found' });
  }
});

// Search across all markdown files
app.get('/api/search', async (req, res) => {
  const query = (req.query.q || '').trim().toLowerCase();
  if (!query || query.length < 2) return res.json([]);

  try {
    const results = [];

    // Search root README
    try {
      const content = await fs.readFile(path.join(DOCS_ROOT, 'README.md'), 'utf-8');
      const matches = findMatches(content, query, 'README.md');
      results.push(...matches);
    } catch {}

    // Search all folders
    for (const folder of ALLOWED_FOLDERS) {
      const folderPath = path.join(DOCS_ROOT, folder);
      try {
        const entries = await fs.readdir(folderPath);
        for (const file of entries.filter(f => f.endsWith('.md'))) {
          const content = await fs.readFile(path.join(folderPath, file), 'utf-8');
          const matches = findMatches(content, query, `${folder}/${file}`);
          results.push(...matches);
        }
      } catch {}
    }

    res.json(results.slice(0, 50));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function findMatches(content, query, filePath) {
  const lines = content.split('\n');
  const matches = [];
  let currentHeading = '';

  for (let i = 0; i < lines.length; i++) {
    const headingMatch = lines[i].match(/^#{1,3}\s+(.+)/);
    if (headingMatch) currentHeading = headingMatch[1];

    if (lines[i].toLowerCase().includes(query)) {
      const contextStart = Math.max(0, i - 1);
      const contextEnd = Math.min(lines.length - 1, i + 1);
      const context = lines.slice(contextStart, contextEnd + 1).join('\n');

      matches.push({
        file: filePath,
        line: i + 1,
        heading: currentHeading,
        match: lines[i].trim().substring(0, 200),
        context: context.substring(0, 400),
      });
    }
  }
  return matches;
}

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
  console.log(`Serving docs from: ${DOCS_ROOT}`);
  console.log(`Images directory: ${IMAGES_DIR}`);
});
