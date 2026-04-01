# Review Kondisi IT Department - FTL GYM

> **Penulis:** IT Developer  
> **Tanggal:** 18 Maret 2026  
> **Kategori:** Internal Review & Evaluasi Proses Kerja IT

---

## Daftar Isi

1. [Ringkasan Eksekutif](#ringkasan-eksekutif)
2. [Struktur Organisasi IT Saat Ini](#struktur-organisasi-it-saat-ini)
3. [Masalah Utama](#masalah-utama)
4. [Flow Kerja Saat Ini vs Idealnya](#flow-kerja-saat-ini-vs-idealnya)
5. [Bukti Task Overload](#bukti-task-overload)
6. [Temuan Keamanan (Security Vulnerabilities)](#temuan-keamanan)
7. [Root Cause Analysis](#root-cause-analysis)
8. [Rekomendasi Perbaikan](#rekomendasi-perbaikan)

---

## Ringkasan Eksekutif

Departemen IT di FTL GYM saat ini mengalami masalah sistemik yang serius dalam hal **manajemen proyek, komunikasi, dan standar kerja**. Tidak adanya Product Requirements Document (PRD), Project Manager, dan standup meeting menyebabkan chaos dalam proses development. Meskipun ada UI/UX Designer dan QA/Tester, masing-masing **hanya 1 orang** yang harus menangani seluruh project sehingga sering **overload** — design terlambat atau tidak sempat dibuat, testing tidak menyeluruh, dan bug lolos ke production. Developer dipaksa bekerja langsung dengan user yang tidak memahami aspek teknis, menghasilkan loop perubahan tanpa akhir, technical debt yang menumpuk, dan burnout pada seluruh tim IT.

---

## Struktur Organisasi IT Saat Ini

```
┌──────────────────────────────────────────────────────────────┐
│                     KONDISI SAAT INI                          │
│                (Struktur Minim & Overload)                    │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│   ┌──────────┐    Direct Request    ┌──────────────────────┐ │
│   │  User A   │───────────────────▶│                       │ │
│   └──────────┘                      │  Developer (1 orang) │ │
│   ┌──────────┐    Direct Request    │  ┌────────────────┐  │ │
│   │  User B   │───────────────────▶│  │ 15+ project    │  │ │
│   └──────────┘                      │  │ bersamaan      │  │ │
│   ┌──────────┐    Direct Request    │  └────────────────┘  │ │
│   │  User C   │───────────────────▶│                       │ │
│   └──────────┘                      └───────────┬──────────┘ │
│   ┌──────────┐    Direct Request                │            │
│   │  User D   │─────────────────────────────────┘            │
│   └──────────┘                                               │
│                                                               │
│   ┌───────────────────────┐  ┌────────────────────────────┐  │
│   │  UI/UX Designer       │  │  QA / Tester               │  │
│   │  (1 orang, OVERLOAD)  │  │  (1 orang, OVERLOAD)       │  │
│   │  - Handle semua       │  │  - Handle semua testing     │  │
│   │    design request     │  │    untuk semua project      │  │
│   │  - Sering tidak       │  │  - Sering tidak sempat     │  │
│   │    sempat deliver     │  │    test menyeluruh          │  │
│   │    design tepat waktu │  │  - Bug lolos ke production  │  │
│   └───────────────────────┘  └────────────────────────────┘  │
│                                                               │
│   ❌ Tidak ada Project Manager                                │
│   ❌ Tidak ada Product Owner                                  │
│   ❌ Tidak ada Business Analyst                               │
│   ⚠️  UI/UX Designer ada tapi cuma 1, sering overload        │
│   ⚠️  QA/Tester ada tapi cuma 1, sering overload             │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## Masalah Utama

### 1. Tidak Ada PRD (Product Requirements Document)

| Aspek | Kondisi Saat Ini | Dampak |
|-------|-------------------|--------|
| Requirements | Verbal / chat seadanya | Miskomunikasi, scope tidak jelas |
| Acceptance Criteria | Tidak ada | Developer tidak tahu kapan "selesai" |
| Scope | Berubah-ubah | Scope creep tanpa batas |
| Dokumentasi | Tidak ada | Fitur sama bisa di-request ulang |

### 2. Tidak Ada Project Manager

- Tidak ada yang mengatur **prioritas** task
- Tidak ada yang menjadi **buffer** antara user dan developer
- Developer harus handle komunikasi langsung dengan banyak user sekaligus
- Tidak ada yang memastikan **timeline** dan **resource** seimbang

### 3. UI/UX Designer Ada Tapi Overload (1 Orang)

```
BOTTLENECK DESIGN:

  15+ project butuh design ──▶ 1 UI/UX Designer ──▶ Antrian panjang
                                     │
                          ┌──────────┴──────────┐
                          │                     │
                          ▼                     ▼
                   Design terlambat      Design tidak sempat
                          │              dibuat sama sekali
                          ▼                     │
                   Developer nunggu             ▼
                   atau langsung code    Developer code tanpa
                   tanpa design          design ──▶ REWORK
```

```
SIKLUS KETIKA DESIGN TERLAMBAT/TIDAK ADA:

    Developer selesai ──▶ User review ──▶ "Ini bukan seperti yang saya mau"
         ▲                                          │
         │                                          │
         └──────────── Rework / Redesign ◀──────────┘
                    (Loop tanpa akhir)
```

- UI/UX Designer ada **1 orang** tapi harus handle design untuk **semua project sekaligus**
- Akibatnya design sering **terlambat** atau **tidak sempat dibuat**
- Developer terpaksa langsung code tanpa design, lalu kena rework
- Tidak ada API contract / specification
- Perubahan design setelah development selesai = **buang waktu & effort**

### 4. QA/Tester Ada Tapi Overload (1 Orang)

```
BOTTLENECK TESTING:

  15+ project butuh testing ──▶ 1 QA/Tester ──▶ Testing seadanya
                                     │
                          ┌──────────┴──────────┐
                          │                     │
                          ▼                     ▼
                   Testing tidak          Skip testing,
                   menyeluruh             langsung deploy
                          │                     │
                          ▼                     ▼
                   Bug lolos ke          Bug ditemukan user
                   production            di production
                          │                     │
                          └──────────┬──────────┘
                                     ▼
                              Hotfix darurat
                           (interrupt developer lagi)
```

- QA/Tester ada **1 orang** tapi harus test **semua project dari semua developer**
- Testing sering tidak menyeluruh karena volume terlalu banyak
- Bug lolos ke production, menghasilkan **hotfix darurat** yang interrupt workflow developer
- Tidak ada automated testing, semua manual

### 5. Context Switching yang Brutal

```
Timeline Developer dalam 1 Hari:

09:00 ┤ Mulai kerja Project A (Face Recognition)
09:30 ┤ ⚡ INTERRUPT: "Tolong fix bug Project B"
10:00 ┤ Kembali ke Project A
10:15 ┤ ⚡ INTERRUPT: "Bikin API baru untuk Project C"
11:00 ┤ ⚡ INTERRUPT: "Ubah design Project A, user minta beda"
12:00 ┤ Istirahat (masih mikirin semua project)
13:00 ┤ Coba lanjut Project C
13:30 ┤ ⚡ INTERRUPT: "Project D urgent, deadline besok"
14:00 ┤ Bingung mau ngerjain yang mana
      ┤ ...
17:00 ┤ Pulang, tidak ada yang selesai sempurna
```

### 6. User "Meremehkan" Kompleksitas (Efek AI)

- User menganggap karena ada AI (Cursor, ChatGPT, dll), semua bisa instant
- **Realita:** AI membantu, tapi tetap butuh:
  - Arsitektur yang benar
  - Testing
  - Security review
  - Code review
  - Deployment & monitoring
- Developer dianggap "ecek-ecek" karena ada AI tools

### 7. Bisnis Development Terlalu Fleksibel

```
FLOW PERMINTAAN FITUR (SAAT INI):

  User minta fitur ──▶ BizDev langsung setuju ──▶ Lempar ke Developer
       │                       │
       │                  Tanpa filter:           Tanpa:
       │                  - Apakah feasible?      - Timeline
       │                  - Apakah perlu?          - Prioritas
       │                  - Apakah sesuai roadmap? - Spec
       │
       ▼
  SEMUA fitur dibuatkan, termasuk yang seharusnya TIDAK fleksibel
```

- Bisnis development memanjakan user, semua permintaan di-approve
- Fitur yang seharusnya rigid/standard malah di-customize
- Ketika developer menjelaskan ketidakmungkinan teknis, **tidak didengar**
- BizDev keras kepala, semua harus diikuti

### 8. Tidak Ada Standup Meeting

- Tidak ada daily check progress
- Tidak ada visibility blocker/hambatan
- Management tidak tahu beban kerja developer
- Tidak ada forum untuk eskalasi masalah

---

## Flow Kerja Saat Ini vs Idealnya

### Flow Saat Ini (Chaotic)

```
┌───────────────────────────────────────────────────────────────--─┐
│                    FLOW SAAT INI (BROKEN)                        │
│                                                                  │
│  User ──(request verbal)──▶ Developer ──(langsung code)──▶ Demo  │
│    │                             │                           │   │
│    │                        ┌────┴────┐                      │   │
│    │                        │ UI/UX?  │                      │   │
│    │                        │ OVERLOAD│ ──▶ Design belum ada │   │
│    │                        │ skip!   │     atau terlambat   │   │
│    │                        └────┬────┘                      │   │
│    │   "Bukan gitu maksudnya"    │     "Ubah lagi ya"        │   │
│    │◀────────────────────────────│◀──────────────────────────┘   │
│    │                             │                               │
│    │   "Tambah fitur ini juga"   │                               │
│    │────────────────────────────▶│                               │
│    │                             │                               │
│    │   "Oh iya, design-nya ganti"│                               │
│    │────────────────────────────▶│──(rework dari awal)──▶ Demo   │
│    │                             │                           │   │
│    │                        ┌────┴────┐                      │   │
│    │                        │  QA?    │                      │   │
│    │                        │ OVERLOAD│ ──▶ Testing seadanya │   │
│    │                        │ skip!   │     bug lolos prod   │   │
│    │                        └────┬────┘                      │   │
│    │   "Hmm masih kurang..."     │                           │   │
│    │◀────────────────────────────│◀──────────────────────────┘   │
│    │                             │                               │
│    ▼                             ▼                               │
│  LOOP TANPA AKHIR          BURNOUT SELURUH TIM                   │
│                                                                  │
└─────────────────────────────────────────────────────────-────────┘
```

### Flow Ideal (Best Practice)

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLOW IDEAL (STRUCTURED)                      │
│                                                                 │
│  User ──▶ BizDev/PM ──▶ PRD ──▶ Design ──▶ Dev ──▶ QA ──▶ Live  │
│              │            │        │         │       │          │
│              │            │        │         │       │          │
│           Filter &     Detail:  UI/UX:    Code:   Test:         │
│           Prioritas    - Scope  - Mockup  - Dev   - Unit        │
│                        - AC     - API     - CR    - UAT         │
│                        - Flow     Spec    - Test  - Staging     │
│                        - Timeline                               │
│                                                                 │
│  ✅ Setiap tahap ada approval sebelum lanjut                    │
│  ✅ Perubahan hanya bisa via Change Request formal              │
│  ✅ Standup meeting harian untuk tracking progress              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Bukti Task Overload

Berdasarkan data dari **Bitrix24 Task Management** (Maret 2026), berikut project yang sedang berjalan **secara bersamaan**:

| No | Project / Task | Tanggal Dibuat | Deadline | Status |
|----|---------------|----------------|----------|--------|
| 1 | Ubahan-ubahan Perjalanan Dinas | 18 Mar 2026 | **Tidak ada** | Active |
| 2 | Blockir Member by Face Recognition | 18 Mar 2026 | **Tidak ada** | Active |
| 3 | Re-design Retake Face Recognition | 18 Mar 2026 | **Tidak ada** | Active |
| 4 | API Face Recognition Prospek | 18 Mar 2026 | **Tidak ada** | Active |
| 5 | API Face Recognition Self Registration | 18 Mar 2026 | **Tidak ada** | Active |
| 6 | Enhancement Face Recognition | 18 Mar 2026 | **Tidak ada** | Active |
| 7 | Enhancement Asset Management - Add Master Alat, Design Surat Jalan & Flow Approval | 18 Mar 2026 | **Tidak ada** | Active |
| 8 | Face Recognition - Limit Detection Area ke Frame Box (Reduce Sensitivity) | 17 Mar 2026 | **Tidak ada** | Active |
| 9 | Sistem Validasi Conduct PT dengan Face Recognition | 12 Mar 2026 | **Tidak ada** | Active |
| 10 | Implementasi Endpoint Members API Update | 5 Mar 2026 | **Tidak ada** | Active |
| 11 | Fixing TV Pilates | 5 Mar 2026 | **Tidak ada** | Active |
| 12 | Horizon Member Sync - Integration Face Recog + Trigger Re-Enroll | 5 Mar 2026 | **Tidak ada** | Active |
| 13 | Modul HRIS Mutasi, Promosi, Demosi | 5 Mar 2026 | **Tidak ada** | Active |
| 14 | User Blacklist Update FR Konfigurasi | 5 Mar 2026 | **Tidak ada** | Active |
| 15 | Enhancement Asset Management | 2 Mar 2026 | **Tidak ada** | Active |

**Temuan Kritis:**
- **15+ project aktif** dalam 1 bulan untuk **1 developer**
- **SEMUA task tidak memiliki deadline** ("Tidak ada tenggat")
- Domain project sangat beragam: Face Recognition, HRIS, Asset Management, API, TV Fixing, Member Sync
- Tanpa deadline = tanpa prioritas = semuanya "urgent"

---

## Temuan Keamanan

Selain masalah proses, ditemukan juga **vulnerability pada infrastruktur** yang menunjukkan kurangnya perhatian terhadap keamanan:

| Severity | Vulnerability | URL | Risiko |
|----------|--------------|-----|--------|
| MEDIUM | CVE-2023-5561 (WordPress User Enum) | `ftlgym.com/wp-json/wp/v2/users` | Attacker bisa enumerate user |
| MEDIUM | Django Debug Mode Enabled | `cbpanel.ftlgym.com` | Informasi sensitif terexpose |
| MEDIUM | Git Config Exposed | `uat-api.ftlgym.com/.git/config` | Source code & credentials bocor |

> **Catatan:** Vulnerability ini muncul karena tidak ada waktu dan prosedur untuk melakukan security review. Developer terlalu sibuk mengejar fitur baru tanpa sempat mengamankan infrastruktur yang ada.

---

## Root Cause Analysis

```
                        ROOT CAUSE DIAGRAM
                        ==================

                    ┌─────────────────────┐
                    │   TIDAK ADA PROSES  │
                    │   SDLC YANG BENAR   │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
     ┌────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
     │ Tidak ada   │  │ Tidak ada    │  │ UI/UX & QA   │ │ Tidak ada    │
     │ PRD         │  │ PM / Buffer  │  │ ada tapi     │ │ Standar &    │
     │             │  │ Layer        │  │ cuma 1 orang │ │ Meeting      │
     └──────┬─────┘  └──────┬───────┘  └──────┬───────┘  └──────--┬─────┘
            │               │                  │                  │
            ▼               ▼                  ▼                  ▼
     ┌────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────-┐
     │ Scope creep│  │ Developer    │  │ Design       │  │ Tidak ada     │
     │ & rework   │  │ langsung     │  │ terlambat,   │  │ visibility    │
     │ tanpa akhir│  │ hadapi user  │  │ testing      │  │ progress      │
     └──────┬─────┘  └──────┬───────┘  │ tidak        │  └──────-┬───────┘
            │               │          │ menyeluruh   │          │
            │               │          └──────┬───────┘          │
            │               │                 │                  │
            └───────────────┴─────────────────┴──────────────────┘
                                      │
                                      ▼
                    ┌──────────────────────────────┐
                    │         HASIL AKHIR:         │
                    │  - Technical debt             │
                    │  - Burnout seluruh tim        │
                    │  - Security issues            │
                    │  - Kualitas rendah            │
                    │  - Fitur tambal sulam         │
                    │  - Bug lolos ke production    │
                    │  - Rework karena design       │
                    │    terlambat/tidak ada         │
                    └──────────────────────────────┘
```

---

## Entity Relationship - Proses Kerja Ideal

```
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│   STAKEHOLDER│       │  PROJECT     │       │   DOCUMENT  │
├─────────────┤       ├──────────────┤       ├─────────────┤
│ id          │──1:N─▶│ id           │──1:1─▶│ id          │
│ nama        │       │ nama         │       │ project_id  │
│ role        │       │ stakeholder_id│      │ prd_file    │
│ department  │       │ pm_id        │       │ design_file │
└─────────────┘       │ priority     │       │ api_spec    │
                      │ status       │       │ test_plan   │
      ┌───────────┐   │ deadline     │       └─────────────┘
      │ DEVELOPER │   │ sprint_id    │
      ├───────────┤   └──────┬───────┘
      │ id        │          │
      │ nama      │◀──N:1────┘
      │ capacity  │          │
      │ skill_set │   ┌──────┴───────┐       ┌─────────────┐
      └───────────┘   │   SPRINT     │       │   TASK      │
                      ├──────────────┤       ├─────────────┤
                      │ id           │──1:N─▶│ id          │
                      │ project_id   │       │ sprint_id   │
                      │ start_date   │       │ title       │
                      │ end_date     │       │ dev_id      │
                      │ goal         │       │ priority    │
                      └──────────────┘       │ story_point │
                                             │ status      │
                                             │ deadline    │
                                             └─────────────┘
```

---

## Rekomendasi Perbaikan

### Prioritas Tinggi (Harus Segera)

| No | Rekomendasi | Penjelasan |
|----|------------|------------|
| 1 | **Hire/Assign Project Manager** | Menjadi buffer antara user dan developer, mengatur prioritas |
| 2 | **Wajibkan PRD sebelum development** | Minimal: scope, acceptance criteria, timeline |
| 3 | **Adakan daily standup (15 menit)** | Sync progress, blocker, dan prioritas harian |
| 4 | **Batasi WIP (Work In Progress)** | Max 2-3 project aktif per developer, sisanya masuk backlog |

### Prioritas Sedang

| No | Rekomendasi | Penjelasan |
|----|------------|------------|
| 5 | **Tambah resource UI/UX Designer** | 1 designer untuk 15+ project = bottleneck, design selalu terlambat |
| 6 | **Tambah resource QA/Tester** | 1 tester untuk semua project = testing tidak menyeluruh, bug lolos |
| 7 | **Wajibkan design selesai sebelum dev** | Pastikan designer punya waktu deliver, baru developer mulai code |
| 8 | **API Design/Contract dulu baru develop** | Gunakan OpenAPI/Swagger spec sebelum coding |
| 9 | **Sprint planning 2 mingguan** | Atur beban kerja dalam sprint yang terukur |
| 10 | **BizDev harus filter permintaan user** | Tidak semua request harus dibuatkan, ada evaluasi feasibility |

### Prioritas Jangka Panjang

| No | Rekomendasi | Penjelasan |
|----|------------|------------|
| 11 | **Implementasi SDLC yang proper** | Requirement > Design > Dev > Test > Deploy |
| 12 | **Tambah resource developer** | 15+ project untuk 1 orang = tidak sustainable |
| 13 | **Implementasi automated testing** | Kurangi beban manual QA, tangkap bug lebih awal |
| 14 | **Security review berkala** | Fix vulnerability yang ada, cegah yang baru |
| 15 | **Edukasi stakeholder tentang IT** | Agar user & BizDev paham batasan teknis |

---

## Kesimpulan

Kondisi IT di FTL GYM saat ini **tidak sustainable**. Tim IT yang ada sangat minim — 1 developer, 1 UI/UX designer, dan 1 QA/tester — harus menangani 15+ project secara bersamaan tanpa PRD, tanpa PM, tanpa standup, dengan user yang langsung request dan BizDev yang tidak memfilter permintaan. UI/UX designer dan QA yang ada pun **overload**, sehingga design sering terlambat dan testing tidak menyeluruh. Hasilnya adalah:

- **Code quality rendah** karena terburu-buru dan banyak tambalan
- **Security vulnerabilities** karena tidak ada waktu review
- **Burnout seluruh tim IT** (developer, designer, QA) karena overload
- **Rework berulang** karena design terlambat atau tidak sempat dibuat
- **Bug lolos ke production** karena QA tidak mampu test semua project menyeluruh
- **Technical debt** menumpuk yang akan makin sulit dibayar

> *"Memberikan 15 project ke tim yang hanya berisi 1 developer, 1 designer, dan 1 QA tanpa PRD dan PM itu seperti menyuruh 3 orang membangun 15 rumah sekaligus — yang satu gambar denah, yang satu bangun, yang satu cek kualitas — semuanya kewalahan, tidak ada yang selesai dengan benar."*

---

*Dokumen ini dibuat sebagai bahan evaluasi internal untuk perbaikan proses kerja IT Department FTL GYM.*
