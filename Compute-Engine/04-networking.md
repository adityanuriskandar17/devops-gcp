# Networking

Semua halaman networking di GCP Console yang terkait Compute Engine.

---

## 1. VPC Networks

> **Console:** VPC network → **VPC networks**

### Create VPC Network

> **Console:** VPC network → VPC networks → **Create VPC network**

#### Name

Nama VPC. Contoh: `vpc-ftlgym`.

#### Subnet Creation Mode

> **Console:** Create VPC → **Subnet creation mode**

| Pilihan | Kelebihan | Kekurangan |
|---------|-----------|------------|
| **Automatic** | Otomatis buat 1 subnet per region, cepat setup | Tidak bisa kontrol IP range, range terlalu besar (/20), tidak efisien |
| **Custom** (recommended) | Kontrol penuh IP range, bisa buat subnet sesuai kebutuhan | Harus buat subnet manual satu per satu |

**Rekomendasi:** Selalu pilih **Custom** untuk production. Automatic hanya untuk quick testing.

#### New Subnet

> **Console:** Create VPC → Subnets → **Add subnet**

| Field | Keterangan | Contoh |
|-------|------------|--------|
| **Name** | Nama subnet | `subnet-web` |
| **Region** | Region subnet | `asia-southeast2` |
| **IP address range** | CIDR range | `10.0.1.0/24` (256 IP) |
| **Purpose** | Tipe subnet | None (reguler) / Regional Managed Proxy (untuk LB) |
| **Private Google Access** | Akses Google API tanpa external IP | On (recommended) |

##### IP Range Planning

| CIDR | Jumlah IP | Kapan pakai |
|------|-----------|-------------|
| /28 | 16 IP | Subnet sangat kecil (test) |
| /24 | 256 IP | Subnet standar (cukup untuk kebanyakan) |
| /20 | 4,096 IP | Subnet besar |
| /16 | 65,536 IP | Subnet sangat besar |

**Contoh planning project ftlgym:**

```
10.0.1.0/24   → Web & App servers (ftlgymweb, apiserver1, ftlhorizon1)
10.0.6.0/24   → Mobile backend (ftlgym-mobile)
10.0.10.0/24  → Proxy-only subnet (untuk Load Balancer)
10.0.100.0/24 → Database servers (dbserver1, dbserver2)
```

#### Dynamic Routing Mode

> **Console:** Create VPC → **Dynamic routing mode**

| Pilihan | Kelebihan | Kekurangan |
|---------|-----------|------------|
| **Regional** (default) | Sederhana, cukup kalau semua di 1 region | Cloud Router hanya share route di region itu |
| **Global** | Route di-share ke semua region | Lebih kompleks, biasanya tidak dibutuhkan |

**Rekomendasi:** Regional (default) kalau semua resource di 1 region.

#### DNS Policy

> **Console:** Create VPC → **DNS server policy**

| Pilihan | Keterangan |
|---------|------------|
| **None** (default) | Pakai Google DNS resolver |
| **Custom** | Pakai DNS server sendiri atau forward ke DNS lain |

#### Firewall Rules (bagian bawah form)

> **Console:** Create VPC → **Firewall rules**

Saat buat VPC, ada checkbox untuk auto-create firewall rules:

| Checkbox | Rule yang dibuat | Kelebihan | Kekurangan |
|----------|------------------|-----------|------------|
| ☐ allow-internal | Allow semua traffic internal (10.128.0.0/9) | Mudah komunikasi antar VM | Terlalu permisif |
| ☐ allow-icmp | Allow ping dari mana saja | Berguna untuk debugging | Expose info network |
| ☐ allow-ssh | Allow SSH (tcp:22) dari 0.0.0.0/0 | Bisa SSH dari mana saja | Tidak aman, harusnya pakai IAP |
| ☐ allow-rdp | Allow RDP (tcp:3389) dari 0.0.0.0/0 | Bisa RDP Windows VM | Sangat tidak aman |

**Rekomendasi:** **Jangan centang satupun**. Buat firewall rules manual yang lebih spesifik.

---

## 2. Firewall Rules (VPC Firewall)

> **Console:** VPC network → **Firewall**

### Create Firewall Rule

> **Console:** VPC network → Firewall → **Create Firewall Rule**

#### Direction

> **Console:** Create Firewall Rule → **Direction of traffic**

| Pilihan | Keterangan |
|---------|------------|
| **Ingress** | Traffic masuk ke VM |
| **Egress** | Traffic keluar dari VM |

#### Action on Match

| Pilihan | Keterangan |
|---------|------------|
| **Allow** | Izinkan traffic yang cocok |
| **Deny** | Blokir traffic yang cocok |

#### Targets

> **Console:** Create Firewall Rule → **Targets**

```
Targets:
┌────────────────────────────────────────────┐
│  All instances in the network            ▼ │
├────────────────────────────────────────────┤
│  All instances in the network              │  ← Berlaku ke semua VM
│  Specified target tags                     │  ← Hanya VM dengan tag tertentu
│  Specified service account                 │  ← Hanya VM dengan SA tertentu
└────────────────────────────────────────────┘
```

| Target | Kelebihan | Kekurangan | Kapan pakai |
|--------|-----------|------------|-------------|
| **All instances** | Simple, tidak perlu set tag | Terlalu luas, semua VM kena | Rule yang memang untuk semua (misal: deny all) |
| **Specified target tags** | Granular, hanya VM tertentu | Harus ingat tambah tag di VM | Recommended untuk kebanyakan rule |
| **Specified service account** | Paling aman, berdasarkan identitas | Lebih kompleks setup | Enterprise, strict security |

#### Source (untuk Ingress)

> **Console:** Create Firewall Rule → **Source filter**

| Source | Contoh | Kapan pakai |
|--------|--------|-------------|
| **IP ranges** | `35.235.240.0/20`, `10.0.1.0/24` | Paling umum |
| **Source tags** | `web-server` | Traffic antar VM berdasarkan tag |
| **Service accounts** | `sa-web@project.iam...` | Enterprise |

#### Protocols and Ports

> **Console:** Create Firewall Rule → **Protocols and ports**

| Pilihan | Keterangan |
|---------|------------|
| **Allow all** | Semua protocol dan port (tidak recommended) |
| **Specified protocols and ports** | Pilih protocol dan port tertentu |

Contoh yang umum:
- `tcp:22` → SSH
- `tcp:80` → HTTP
- `tcp:443` → HTTPS
- `tcp:3306` → MySQL
- `tcp:6379` → Redis
- `icmp` → Ping

#### Priority

> **Console:** Create Firewall Rule → **Priority**

Angka 0-65535. **Semakin kecil = semakin tinggi prioritas**.

| Priority | Keterangan |
|----------|------------|
| 0 | Tertinggi (paling dulu diproses) |
| 1000 | Default |
| 65535 | Terendah (implied rules) |

Kalau ada 2 rule yang match, yang priority lebih kecil menang.

#### Contoh Firewall Rules Project ftlgym

| Rule | Direction | Source | Target | Ports | Fungsi |
|------|-----------|--------|--------|-------|--------|
| allow-iap-ssh | Ingress | 35.235.240.0/20 | All | tcp:22 | SSH via IAP |
| allow-ingress-from-iap | Ingress | 35.235.240.0/20 | All | All | Semua traffic IAP |
| fw-allow-health-checks | Ingress | 35.191.0.0/16 | tag: allow-health-checks | tcp:80,443 | LB health check |
| allow-lb-proxy | Ingress | 10.0.10.0/24 | tag: lb-backend | tcp:80,443 | Traffic dari LB proxy |
| allow-internal-db | Ingress | 10.0.1.0/24 | tag: dbserver1 | tcp:3306-3310 | App → DB |

---

## 3. IP Addresses

> **Console:** VPC network → **IP addresses**

### External IP Addresses

> **Console:** IP addresses → **External IP addresses** tab

| Tipe | Kelebihan | Kekurangan | Harga |
|------|-----------|------------|-------|
| **Ephemeral** | Gratis saat VM running, otomatis di-assign | Berubah saat VM restart | Gratis (saat attached & running) |
| **Static** | IP tetap, tidak berubah | Bayar kalau tidak dipakai | ~$3/bln (idle), gratis saat attached |

> **Console:** IP addresses → **Reserve External Static Address**

### Internal IP Addresses

> **Console:** IP addresses → **Internal IP addresses** tab

Internal IP otomatis di-assign dari subnet. Bisa di-reserve juga supaya tidak berubah.

| Tipe | Kelebihan | Kekurangan |
|------|-----------|------------|
| **Ephemeral** (default) | Otomatis | Bisa berubah saat VM recreate |
| **Static** | Tetap, predictable | Harus manage sendiri |

---

## 4. Load Balancing

> **Console:** Network services → **Load balancing**

### Create Load Balancer

> **Console:** Load balancing → **Create Load Balancer**

#### Tipe Load Balancer

```
╔══════════════════════════════════════════════════════════════╗
║  Step 1: Application Load Balancer or Network Load Balancer ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  ○ Application Load Balancer (HTTP/S)                        ║
║    └─ Layer 7, routing berdasarkan URL/host/path             ║
║                                                              ║
║  ○ Network Load Balancer (TCP/UDP/SSL)                       ║
║    └─ Layer 4, routing berdasarkan IP/port                   ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  Step 2: Internet facing or Internal                        ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  ○ From Internet to my VMs (external)                        ║
║  ○ Only within my VPC (internal)                             ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  Step 3: Global or Regional                                 ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  ○ Global (semua region)                                     ║
║  ○ Regional (1 region saja)                                  ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

| Tipe | Kelebihan | Kekurangan | Kapan pakai |
|------|-----------|------------|-------------|
| **App LB External Global** | Anycast IP, DDoS protection, CDN integration | Lebih mahal, setup kompleks | Website global |
| **App LB External Regional** | Lebih murah, cukup untuk 1 region | Tidak ada anycast | **Project ftlgym pakai ini** (lb1) |
| **App LB Internal Regional** | Private, untuk microservice internal | Tidak bisa diakses dari internet | API internal antar service |
| **Network LB External** | TCP/UDP passthrough, performa tinggi | Tidak bisa routing berdasarkan URL | Game server, non-HTTP services |
| **Network LB Internal** | Internal TCP/UDP | Hanya internal | Database load balancing |

### Frontend Configuration

> **Console:** Create LB → **Frontend configuration**

| Field | Pilihan | Keterangan |
|-------|---------|------------|
| **Protocol** | HTTP / HTTPS | HTTPS butuh SSL certificate |
| **IP address** | Ephemeral / Static | Static recommended (untuk DNS) |
| **Port** | 80 / 443 / custom | 443 untuk HTTPS |
| **Certificate** | Pilih SSL cert | Managed (Google kelola) atau Self-managed |

#### SSL Certificate

> **Console:** Frontend → Certificate dropdown → **Create a new certificate**

| Tipe | Kelebihan | Kekurangan |
|------|-----------|------------|
| **Google-managed** | Otomatis provisioning & renewal, gratis | Butuh domain verification, proses bisa lama |
| **Self-managed** | Upload cert sendiri, instant | Harus renewal manual, bisa lupa expired |

**Contoh ftlgym:** `ftlgym-ssl-certificate3` (self-managed, wildcard `*.ftlgym.com`, expires 2026-06-06).

### Backend Configuration

> **Console:** Create LB → **Backend configuration** → **Create Backend Service**

| Field | Pilihan | Keterangan |
|-------|---------|------------|
| **Backend type** | Instance group / NEG / Serverless NEG | NEG lebih modern |
| **Protocol** | HTTP / HTTPS / HTTP/2 | HTTP paling umum (LB terminasi SSL) |
| **Health check** | Pilih atau buat baru | Wajib, LB cek apakah backend sehat |
| **Timeout** | 30s (default) | Naikkan kalau ada request lambat |
| **Session affinity** | None / Client IP / Cookie | None untuk stateless app |

#### Health Check

> **Console:** Backend Service → Health check → **Create health check**

| Field | Pilihan | Keterangan |
|-------|---------|------------|
| **Protocol** | HTTP / HTTPS / TCP | HTTP paling umum |
| **Port** | 80 / custom | Sesuai port app |
| **Request path** | `/` / `/health` / custom | Path yang return 200 OK |
| **Check interval** | 5s - 300s | Seberapa sering cek |
| **Timeout** | 5s (default) | Timeout per request |
| **Healthy threshold** | 2 (default) | Berapa kali sukses baru dianggap sehat |
| **Unhealthy threshold** | 2-10 | Berapa kali gagal baru dianggap mati |

### Routing Rules (URL Map)

> **Console:** Create LB → **Routing rules**

```
╔═══════════════════════════════════════════════╗
║  Routing Rules (URL Map: lb1)                ║
║                                               ║
║  Host: ftlgym.com                             ║
║    Path: /              → ftlgymweb           ║
║    Path: /outlet/*      → ftlgym-ads          ║
║    Path: /api/*         → ftlgym-ads          ║
║                                               ║
║  Host: dc.ftlgym.com   → ftlgymweb           ║
║  Host: api1.ftlgym.com → apiserver1           ║
║  Host: *.stridegym.id  → stridegymhorizon    ║
║                                               ║
║  Default: → ftlgymweb                         ║
╚═══════════════════════════════════════════════╝
```

| Mode | Kelebihan | Kekurangan |
|------|-----------|------------|
| **Simple host and path rule** | 1 backend untuk semua traffic, mudah | Tidak bisa split traffic |
| **Advanced host and path rule** | Routing berdasarkan domain & path | Setup lebih kompleks |

---

## 5. Network pada saat Create VM

> **Console:** Create Instance → **Advanced options** → **Networking**

| Field | Keterangan | Kelebihan | Kekurangan |
|-------|------------|-----------|------------|
| **Network tags** | Tag untuk firewall rules | Granular firewall control | Harus manage tag per VM |
| **Hostname** | Custom hostname | Readable hostname | Harus manage DNS sendiri |
| **Network interface** | VPC & subnet | Bisa multi-NIC | Multi-NIC kompleks |
| **External IP** | None/Ephemeral/Static | Lihat section IP di atas | |
| **Network tier** | Premium / Standard | | |

### Network Service Tier

> **Console:** Create Instance → Networking → Network interface → **Network tier**

| Tier | Kelebihan | Kekurangan |
|------|-----------|------------|
| **Premium** (default) | Low latency, Google backbone network | Lebih mahal |
| **Standard** | Lebih murah (~25% saving) | Traffic lewat public internet, latency lebih tinggi |

**Rekomendasi:** Premium untuk production. Standard untuk non-critical/dev.
