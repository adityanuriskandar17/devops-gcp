import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOCS_ROOT = __dirname;
const ALLOWED_FOLDERS = ['Asset-Management', 'Cloud-Armor', 'Cloud-CDN', 'Cloud-KMS', 'Cloud-Monitoring', 'Cloud-Storage', 'Cloud-SQL', 'Compute-Engine', 'GKE', 'IAM', 'Review-IT', 'Tutorial-GCE'];
const IMAGES_DIR = path.join(DOCS_ROOT, 'images');

if (!existsSync(IMAGES_DIR)) mkdirSync(IMAGES_DIR, { recursive: true });

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
