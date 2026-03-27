# SSH Access & IAP

Cara mengakses VM instance dari GCP Console dan terminal.

---

## 1. SSH dari Console

> **Console:** Compute Engine → VM instances → klik VM → tombol **SSH**

### Tombol SSH

```
┌────────────────────────────────────────────────────┐
│  VM instances                                      │
│                                                    │
│  NAME          ZONE               STATUS    SSH    │
│  ftlgymweb     asia-southeast2-a  RUNNING   [SSH▼] │
│  apiserver1    asia-southeast2-a  RUNNING   [SSH▼] │
│  dbserver1     asia-southeast2-a  RUNNING   [SSH▼] │
└────────────────────────────────────────────────────┘
```

Klik dropdown SSH untuk melihat opsi:

```
SSH dropdown:
┌───────────────────────────────────────┐
│  Open in browser window               │  ← SSH di tab baru
│  Open in browser window on custom port│  ← Kalau SSH bukan port 22
│  View gcloud command                  │  ← Copy gcloud command
│  Use another SSH client               │  ← Download key
└───────────────────────────────────────┘
```

| Opsi | Kelebihan | Kekurangan | Kapan pakai |
|------|-----------|------------|-------------|
| **Open in browser window** | Tidak perlu install apapun, langsung dari browser | Lambat, copy-paste terbatas, koneksi sering putus | Quick check, emergency access |
| **Open on custom port** | Bisa SSH ke port non-standard | Sama seperti browser window | Kalau SSH daemon di port selain 22 |
| **View gcloud command** | Copy command untuk terminal lokal | Butuh gcloud CLI installed | Recommended untuk daily use |
| **Use another SSH client** | Download SSH key, pakai PuTTY/terminal sendiri | Harus manage key manual | Kalau butuh SSH client tertentu |

---

## 2. SSH via gcloud CLI (Recommended)

> **Console:** Cloud Shell (tombol terminal di kanan atas Console)  
> Atau terminal lokal dengan gcloud CLI installed.

### Basic SSH

```bash
gcloud compute ssh VM_NAME \
    --zone=asia-southeast2-a \
    --project=webserver-435507
```

### SSH sebagai user tertentu

```bash
gcloud compute ssh horizon@ftlgymweb \
    --zone=asia-southeast2-a \
    --project=webserver-435507
```

### SSH + langsung jalankan command

```bash
gcloud compute ssh ftlgymweb \
    --zone=asia-southeast2-a \
    --command="sudo systemctl status lsws" \
    --project=webserver-435507
```

### Perbandingan SSH Methods

| Method | Kelebihan | Kekurangan |
|--------|-----------|------------|
| **Browser SSH (Console)** | Tidak perlu install, from anywhere | Lambat, sering disconnect, limited copy-paste |
| **gcloud compute ssh** | Stabil, otomatis pakai IAP, key management otomatis | Butuh gcloud CLI installed |
| **ssh langsung** | Full control, custom config | Butuh external IP atau IAP tunnel manual, manage key sendiri |
| **Cloud Shell** | Tidak perlu install, gcloud sudah ready | Session timeout 20 menit idle, disk 5 GB saja |

---

## 3. IAP (Identity-Aware Proxy) for TCP

> **Console:** Security → **Identity-Aware Proxy**

IAP memungkinkan SSH ke VM **tanpa external IP** melalui tunnel yang aman lewat Google's network.

### Cara Kerja

```
╔════════════════════════════════════════════════════╗
║  Tanpa IAP (cara lama, tidak recommended):        ║
║                                                    ║
║  Laptop ──internet──► VM (external IP, port 22)   ║
║                       ↑ rawan di-brute-force       ║
╠════════════════════════════════════════════════════╣
║  Dengan IAP (recommended):                        ║
║                                                    ║
║  Laptop ──► Google IAP ──► VM (internal IP only)  ║
║             (verifikasi   (port 22, hanya dari    ║
║              IAM dulu)     35.235.240.0/20)        ║
║                                                    ║
║  + Tidak perlu external IP                         ║
║  + Tidak perlu VPN                                 ║
║  + Centralized access control via IAM              ║
║  + Audit log siapa yang SSH                        ║
╚════════════════════════════════════════════════════╝
```

### Setup IAP

#### Step 1: Firewall Rule

> **Console:** VPC network → Firewall → Create Firewall Rule

| Field | Value |
|-------|-------|
| Name | `allow-iap-ssh` |
| Direction | Ingress |
| Targets | All instances / atau tag tertentu |
| Source IP ranges | `35.235.240.0/20` |
| Protocols and ports | tcp: 22 |

#### Step 2: IAM Permission

> **Console:** IAM & Admin → IAM → member → **Add role**

User yang mau SSH harus punya salah satu role:

| Role | Keterangan |
|------|------------|
| `roles/iap.tunnelResourceAccessor` | Minimum role untuk SSH via IAP |
| `roles/compute.instanceAdmin.v1` | Bisa SSH + manage VM |
| `roles/owner` | Full access (terlalu luas) |

#### Step 3: SSH

```bash
# gcloud otomatis pakai IAP kalau VM tidak punya external IP
gcloud compute ssh ftlgymweb \
    --zone=asia-southeast2-a \
    --project=webserver-435507
```

### IAP TCP Tunneling (port selain SSH)

> **Console:** Tidak ada UI, hanya via gcloud CLI

```bash
# Tunnel port 3306 (MySQL) dari VM ke localhost
gcloud compute start-iap-tunnel dbserver1 3306 \
    --local-host-port=localhost:3306 \
    --zone=asia-southeast2-a \
    --project=webserver-435507
# Sekarang bisa: mysql -h 127.0.0.1 -P 3306 -u root -p

# Tunnel port 7080 (OpenLiteSpeed WebAdmin)
gcloud compute start-iap-tunnel ftlgymweb 7080 \
    --local-host-port=localhost:7080 \
    --zone=asia-southeast2-a
# Sekarang bisa: buka http://localhost:7080 di browser

# Tunnel port 8080
gcloud compute start-iap-tunnel ftlgymweb 8080 \
    --local-host-port=localhost:8080 \
    --zone=asia-southeast2-a
```

---

## 4. OS Login

> **Console:** Compute Engine → **Metadata** → **Edit** → `enable-oslogin: TRUE`

OS Login = centralized SSH key management via IAM (bukan manual SSH key).

### Enable OS Login

> **Console:** Compute Engine → Metadata → Add item: `enable-oslogin` = `TRUE`

Atau per VM:

> **Console:** VM instances → klik VM → Edit → Custom metadata → `enable-oslogin` = `TRUE`

| Setting | Kelebihan | Kekurangan |
|---------|-----------|------------|
| **OS Login OFF** (default) | SSH key di metadata, simple | Key tersebar di metadata, sulit di-audit |
| **OS Login ON** | Centralized di IAM, otomatis manage user Linux, audit log | Setup awal lebih ribet, butuh IAM roles tambahan |

### OS Login + 2FA

> **Console:** Metadata → `enable-oslogin-2fa` = `TRUE`

Tambahkan 2FA (two-factor authentication) untuk SSH. User harus verify OTP selain SSH key.

---

## 5. SCP (Copy File)

```bash
# Upload file ke VM
gcloud compute scp local-file.txt ftlgymweb:~/remote-file.txt \
    --zone=asia-southeast2-a

# Download file dari VM
gcloud compute scp ftlgymweb:~/remote-file.txt ./local-file.txt \
    --zone=asia-southeast2-a

# Upload folder (rekursif)
gcloud compute scp --recurse ./my-folder ftlgymweb:~/my-folder \
    --zone=asia-southeast2-a
```

---

## 6. Serial Console

> **Console:** Compute Engine → VM instances → klik VM → **Troubleshooting** → Connect to serial console

Untuk debug saat SSH gagal (VM boot loop, SSH daemon mati, network error).

### Lihat Serial Port Output

> **Console:** VM instances → klik VM → **Logs** → **Serial port 1 (console)**

Atau via CLI:

```bash
gcloud compute instances get-serial-port-output ftlgymweb \
    --zone=asia-southeast2-a | tail -100
```

### Interactive Serial Console

> **Console:** VM instances → klik VM → Troubleshooting → **Connect to serial console**

Harus enable dulu:

> **Console:** VM instances → klik VM → **Edit** → Remote access → ☑ **Enable connecting to serial ports**

| Kelebihan | Kekurangan |
|-----------|------------|
| Bisa akses VM meski SSH/network mati | Butuh di-enable dulu |
| Bisa lihat boot log & error | Interface text-only |
| Bisa login & jalankan command | Lambat |

---

## 7. Troubleshooting SSH

### Error: Code 4003 (IAP Failed)

> Yang muncul: "Connection via Cloud Identity-Aware Proxy Failed. Code 4003"

| Penyebab | Cara Cek | Solusi |
|----------|----------|--------|
| Firewall rule IAP belum ada | Console: VPC → Firewall → cari `35.235.240.0/20` | Buat rule allow tcp:22 dari 35.235.240.0/20 |
| IAM permission kurang | Console: IAM → cek role user | Tambah role `iap.tunnelResourceAccessor` |
| VM di VPC tanpa route ke IAP | Console: VPC → Routes | Pastikan ada default internet gateway route |

### Error: Connection Timed Out

| Penyebab | Cara Cek | Solusi |
|----------|----------|--------|
| VM mati | Console: VM instances → cek Status | Start VM |
| SSH daemon mati | Serial console → cek sshd | `sudo systemctl start sshd` via serial console |
| Firewall blocking | Console: VPC → Firewall → cek rules | Tambah/fix firewall rule |

### Error: Permission Denied (publickey)

| Penyebab | Cara Cek | Solusi |
|----------|----------|--------|
| SSH key tidak cocok | `~/.ssh/google_compute_engine` | Hapus key lama, gcloud ssh akan generate baru |
| User salah | `whoami` | Pakai `gcloud compute ssh USER@VM_NAME` |
| OS Login issue | Cek metadata `enable-oslogin` | Pastikan IAM role dan OS Login config benar |

### Checklist Debug SSH

```
1. [ ] VM status RUNNING?
      Console: Compute Engine → VM instances → cek kolom Status

2. [ ] Firewall rule IAP ada?
      Console: VPC → Firewall → cari source 35.235.240.0/20

3. [ ] IAM permission ada?
      Console: IAM → cek roles/iap.tunnelResourceAccessor

4. [ ] SSH daemon jalan di VM?
      Console: VM → Serial port log → cari "sshd"

5. [ ] Network tag di VM cocok dengan firewall target?
      Console: VM → Details → Network tags
```
