# Tutorial: Setup Git & SSH Key untuk GitHub di VM Instance

Tutorial langkah demi langkah menambahkan **source control (Git)** di VM Instance dan menghubungkannya ke **GitHub via SSH key** agar bisa clone, push, dan pull repository.

---

## Daftar Isi

1. [Install Git](#1-install-git)
2. [Buat Repository di GitHub](#2-buat-repository-di-github)
3. [Generate SSH Key di VM](#3-generate-ssh-key-di-vm)
4. [Tambahkan SSH Key ke GitHub](#4-tambahkan-ssh-key-ke-github)
5. [Konfigurasi SSH Config](#5-konfigurasi-ssh-config)
6. [Test Koneksi SSH ke GitHub](#6-test-koneksi-ssh-ke-github)
7. [Clone Repository via SSH](#7-clone-repository-via-ssh)

---

## 1. Install Git

SSH ke VM Instance, lalu install Git:

```bash
$ sudo apt update
```
```
Hit:1 http://deb.debian.org/debian bookworm InRelease
...
Reading package lists... Done
```

```bash
$ sudo apt install git-all
```
```
Reading package lists... Done
Building dependency tree... Done
The following additional packages will be installed:
  git git-man ...
Do you want to continue? [Y/n] Y

Setting up git (1:2.39.x) ...
```

### Verifikasi

```bash
$ git --version
```
```
git version 2.39.x
```

### Set Identity (Wajib Sebelum Commit)

Git perlu tahu siapa yang melakukan commit:

```bash
$ git config --global user.name "Nama Kamu"
$ git config --global user.email "email@gmail.com"
```

Contoh:

```bash
$ git config --global user.name "funcodexai"
$ git config --global user.email "funcodexai@gmail.com"
```

Verifikasi:

```bash
$ git config --list
```
```
user.name=funcodexai
user.email=funcodexai@gmail.com
```

---

## 2. Buat Repository di GitHub

Buka **github.com** → klik **"+"** (kanan atas) → **"New repository"**.

```
┌───────────────────────────────────────────────────────────────────────┐
│  Create a new repository                                              │
│                                                                       │
│  Repository name *                                                    │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │ nama-project                                                  │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  Description (optional)                                               │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │ Deskripsi project                                             │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ● Public  ○ Private                                                  │
│                                                                       │
│  Initialize this repository with:                                     │
│  ☑ Add a README file                                                  │
│  ☑ Add .gitignore  →  template: Node                                  │
│  ☑ Choose a license →  MIT License                                    │
│                                                                       │
│                                    [Create repository]                │
└───────────────────────────────────────────────────────────────────────┘
```

| Setting | Nilai | Kenapa |
|---------|-------|--------|
| **README** | ☑ Centang | File deskripsi project — best practice, langsung ada file awal |
| **.gitignore** | Node | Otomatis ignore `node_modules/`, `.env`, `dist/`, dll |
| **License** | MIT | Open source license yang paling umum dan permissive |

Setelah create → repository sudah punya 3 file: `README.md`, `.gitignore`, `LICENSE`.

---

## 3. Generate SSH Key di VM

Kembali ke SSH terminal VM Instance.

### Kenapa SSH Key?

```
Clone via HTTPS:
  git clone https://github.com/user/repo.git
  → Setiap push/pull harus masukkan username + token
  → Ribet untuk workflow sehari-hari

Clone via SSH:
  git clone git@github.com:user/repo.git
  → Autentikasi otomatis via SSH key pair
  → Tidak perlu masukkan password setiap kali
  → Lebih aman dan praktis ✅
```

### Generate Key

```bash
$ ssh-keygen -t ed25519 -C "funcodexai@gmail.com"
```

| Parameter | Fungsi |
|-----------|--------|
| `-t ed25519` | Tipe key: Ed25519 (lebih modern dan aman dari RSA) |
| `-C "email"` | Comment/label — biasanya pakai email untuk identifikasi |

### Output Proses

```
Generating public/private ed25519 key pair.
Enter file in which to save the key (/home/funcodexai/.ssh/id_ed25519): 
→ [Enter] (pakai default path)

Enter passphrase (empty for no passphrase): 
→ [Enter] (kosongkan, atau isi untuk extra security)

Enter same passphrase again: 
→ [Enter]

Your identification has been saved in /home/funcodexai/.ssh/id_ed25519
Your public key has been saved in /home/funcodexai/.ssh/id_ed25519.pub
```

```
The key fingerprint is:
SHA256:8aZ0lI/rauxdZV1Cm7cjQqUGImC3nW6LJ8lR0DfHlmw funcodexai@gmail.com
The key's randomart image is:
+--[ED25519 256]--+
|   o.+.. .o ...  |
|  . . =.oo.Eo. o |
|     . +o B+  + o|
|      o  +oo   +o|
|     . oS =...oo.|
|    . =..+ ..o. .|
|     = +. . .    |
|      o oo .     |
|       oo.o      |
+----[SHA256]-----+
```

### Hasil: 2 File Key Pair

```
~/.ssh/
├── id_ed25519       ← PRIVATE key (JANGAN share ke siapapun!)
└── id_ed25519.pub   ← PUBLIC key (ini yang ditambahkan ke GitHub)
```

| File | Fungsi | Boleh dishare? |
|------|--------|---------------|
| `id_ed25519` | Private key — identitas kamu | ❌ TIDAK — rahasia |
| `id_ed25519.pub` | Public key — dipasang di GitHub | ✅ Ya — ini yang dikasih ke GitHub |

```
Cara kerja SSH Key:

  VM Instance                          GitHub
  ┌──────────────┐                    ┌──────────────┐
  │ Private Key  │ ── autentikasi ──► │ Public Key   │
  │ (id_ed25519) │                    │ (di-paste ke │
  │              │ ◄── verified ───── │  Settings)   │
  └──────────────┘                    └──────────────┘

  Private key = kunci rumah (simpan sendiri)
  Public key  = gembok rumah (dipasang di GitHub)
  Hanya kunci yang cocok dengan gembok yang bisa buka ✅
```

### Lihat Public Key

```bash
$ cat ~/.ssh/id_ed25519.pub
```
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIMhoFq8uuprWiQMd5vmhhpKkPZNsnIDfbxGHX0KLJmaB funcodexai@gmail.com
```

**Copy seluruh output ini** — akan di-paste ke GitHub di step selanjutnya.

---

## 4. Tambahkan SSH Key ke GitHub

### Buka GitHub Settings

```
GitHub.com → klik avatar (kanan atas) → Settings
→ sidebar kiri: SSH and GPG keys
→ klik [New SSH key]

URL langsung: https://github.com/settings/ssh/new
```

### Form Add SSH Key

```
┌───────────────────────────────────────────────────────────────────────┐
│  SSH keys / Add new                                                   │
│                                                                       │
│  Title                                                                │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │ GCE VM - bosani-nps-instance-1                                │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  Key type: Authentication Key                                         │
│                                                                       │
│  Key                                                                  │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │ ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIMhoFq8uuprWiQMd5vmh    │    │
│  │ hpKkPZNsnIDfbxGHX0KLJmaB funcodexai@gmail.com               │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  [Add SSH key]                                                        │
└───────────────────────────────────────────────────────────────────────┘
```

| Field | Isi | Tips |
|-------|-----|------|
| **Title** | Nama untuk identifikasi key ini | Pakai nama VM agar mudah dikenali |
| **Key type** | Authentication Key | Default — untuk git push/pull |
| **Key** | Paste isi `id_ed25519.pub` | Harus termasuk `ssh-ed25519` di awal dan email di akhir |

Klik **[Add SSH key]** → masukkan password GitHub untuk konfirmasi → selesai.

---

## 5. Konfigurasi SSH Config

Buat file config agar SSH otomatis pakai key yang benar saat connect ke GitHub:

```bash
$ nano ~/.ssh/config
```

Isi dengan:

```
Host github.com
  IdentityFile ~/.ssh/id_ed25519
  AddKeysToAgent yes
```

Simpan: **Ctrl+O** → **Enter** → **Ctrl+X**.

### Penjelasan

| Baris | Fungsi |
|-------|--------|
| `Host github.com` | Aturan ini berlaku saat SSH ke github.com |
| `IdentityFile ~/.ssh/id_ed25519` | Gunakan private key ini untuk autentikasi |
| `AddKeysToAgent yes` | Simpan key ke SSH agent agar tidak perlu load ulang |

### Set Permission (Penting)

```bash
$ chmod 600 ~/.ssh/config
$ chmod 600 ~/.ssh/id_ed25519
$ chmod 644 ~/.ssh/id_ed25519.pub
```

SSH akan menolak file yang permission-nya terlalu terbuka:

| File | Permission | Kenapa |
|------|-----------|--------|
| `config` | 600 (owner read/write only) | SSH reject config yang bisa dibaca orang lain |
| `id_ed25519` | 600 (owner read/write only) | Private key harus sangat terbatas |
| `id_ed25519.pub` | 644 (owner read/write, others read) | Public key boleh dibaca siapa saja |

---

## 6. Test Koneksi SSH ke GitHub

```bash
$ ssh -T git@github.com
```

Pertama kali akan muncul konfirmasi host:

```
The authenticity of host 'github.com (20.205.243.166)' can't be established.
ED25519 key fingerprint is SHA256:+DiY3wvvV6TuJJhbpZisF/zLDA0zPMSvHdkr4UvCOqU.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
→ ketik: yes lalu Enter

Warning: Permanently added 'github.com' (ED25519) to the list of known hosts.
Hi funcodexai! You've been successfully authenticated, but GitHub does not provide shell access.
```

### Cara Baca Hasil

```
$ ssh -T git@github.com
     │
     ▼
SSH client baca ~/.ssh/config
     │
     ▼
Pakai key: ~/.ssh/id_ed25519
     │
     ▼
Connect ke github.com
     │
     ├── Key cocok dengan public key di GitHub?
     │   └── ✅ "Hi funcodexai! You've been successfully authenticated"
     │       → SSH key sudah benar, siap clone/push/pull
     │
     └── Key tidak cocok?
         └── ❌ "Permission denied (publickey)"
             → Cek: sudah paste public key di GitHub Settings?
             → Cek: ~/.ssh/config sudah benar?
             → Cek: permission file sudah 600?
```

---

## 7. Clone Repository via SSH

Setelah koneksi berhasil, clone repository:

### Ambil SSH URL dari GitHub

```
GitHub → repository → klik [Code] → tab SSH → copy URL

  URL format: git@github.com:username/nama-repo.git
```

### Clone

```bash
$ git clone git@github.com:funcodexai/my-project.git
```
```
Cloning into 'my-project'...
remote: Enumerating objects: 5, done.
remote: Counting objects: 100% (5/5), done.
remote: Compressing objects: 100% (4/4), done.
Receiving objects: 100% (5/5), done.
remote: Total 5 (delta 0), reused 0 (delta 0), pack-reused 0
```

### Verifikasi

```bash
$ cd my-project
$ ls -a
```
```
.  ..  .git  .gitignore  LICENSE  README.md
```

3 file dari repository yang kita buat tadi: README.md, .gitignore, LICENSE.

```bash
$ git remote -v
```
```
origin  git@github.com:funcodexai/my-project.git (fetch)
origin  git@github.com:funcodexai/my-project.git (push)
```

Remote menggunakan `git@github.com:` (SSH) — push/pull tanpa perlu masukkan password.

---

## Ringkasan

```
Setup Source Control di VM Instance:

  VM Instance (Debian 12)
  │
  ├── 1. Install Git
  │   └── sudo apt update && sudo apt install git-all
  │
  ├── 2. Buat Repository di GitHub
  │   └── README ✅  .gitignore (Node) ✅  License (MIT) ✅
  │
  ├── 3. Generate SSH Key di VM
  │   ├── ssh-keygen -t ed25519 -C "email@gmail.com"
  │   ├── Private: ~/.ssh/id_ed25519 (JANGAN share!)
  │   └── Public:  ~/.ssh/id_ed25519.pub → paste ke GitHub
  │
  ├── 4. Add Public Key ke GitHub
  │   └── GitHub → Settings → SSH and GPG keys → New SSH key
  │
  ├── 5. Buat SSH Config
  │   └── nano ~/.ssh/config → Host github.com + IdentityFile
  │
  ├── 6. Test Koneksi
  │   └── ssh -T git@github.com → "Hi! authenticated" ✅
  │
  └── 7. Clone Repository via SSH
      └── git clone git@github.com:user/repo.git ✅
```

### Troubleshooting

| Error | Penyebab | Solusi |
|-------|----------|--------|
| `Permission denied (publickey)` | Key belum di-add ke GitHub | Paste `cat ~/.ssh/id_ed25519.pub` ke GitHub Settings |
| `Could not open a connection` | SSH config salah | Cek `~/.ssh/config` — pastikan Host dan IdentityFile benar |
| `Bad permissions` | File permission terlalu terbuka | `chmod 600 ~/.ssh/config ~/.ssh/id_ed25519` |
| `Host key verification failed` | Belum accept GitHub host | `ssh -T git@github.com` → ketik `yes` |

### Commands Cheatsheet

```bash
# SSH Key
ssh-keygen -t ed25519 -C "email@gmail.com"   # generate key pair
cat ~/.ssh/id_ed25519.pub                      # lihat public key
ssh -T git@github.com                          # test koneksi

# Git
git clone git@github.com:user/repo.git        # clone via SSH
git status                                      # cek status perubahan
git add .                                       # stage semua perubahan
git commit -m "pesan commit"                    # commit
git push origin main                            # push ke GitHub
git pull origin main                            # pull dari GitHub
git log --oneline                               # lihat history commit
```

---

*Tutorial ini berdasarkan VM Instance Debian 12 (Bookworm) dengan GitHub SSH authentication.*
