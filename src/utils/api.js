const BASE = '/api';

export async function fetchFileTree() {
  const res = await fetch(`${BASE}/files`);
  if (!res.ok) throw new Error('Failed to fetch file tree');
  return res.json();
}

export async function fetchFile(filePath) {
  const res = await fetch(`${BASE}/files/${filePath}`);
  if (!res.ok) throw new Error('Failed to fetch file');
  return res.json();
}

export async function saveFile(filePath, content) {
  const res = await fetch(`${BASE}/files/${filePath}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error('Failed to save file');
  return res.json();
}

export async function createFile(filePath, content = '') {
  const res = await fetch(`${BASE}/files/${filePath}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error('Failed to create file');
  return res.json();
}

export async function deleteFile(filePath) {
  const res = await fetch(`${BASE}/files/${filePath}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete file');
  return res.json();
}

export async function uploadImage(file, folder) {
  const formData = new FormData();
  formData.append('image', file);
  const endpoint = folder ? `${BASE}/upload/${folder}` : `${BASE}/upload`;
  const res = await fetch(endpoint, { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Failed to upload image');
  return res.json();
}

export async function fetchImages(folder) {
  const endpoint = folder ? `${BASE}/images/${folder}` : `${BASE}/images`;
  const res = await fetch(endpoint);
  if (!res.ok) throw new Error('Failed to fetch images');
  return res.json();
}

export async function searchFiles(query) {
  const res = await fetch(`${BASE}/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Failed to search');
  return res.json();
}
