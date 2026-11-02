# Penemuan Infrastruktur & Kesiapan Server Staging (Infrastructure Discovery)

Tanggal: 2 November 2026  
Status Kesiapan Server: **BLOCKED (MENUNGGU PROVISI VPS & DNS DARI IT INFRASTRUKTUR)**  
Pemeriksa: Senior DevOps Engineer, Site Reliability Engineer (SRE) & Principal Product Engineer  

---

## 1. Hasil Audit Ketersediaan Server Staging Aktual

Berdasarkan mandat keselamatan dan audit lingkungan kerja:
1. Pemeriksaan dilakukan untuk mendeteksi apakah VPS staging remote, domain staging, atau kredensial SSH telah disiapkan oleh tim IT Infrastruktur.
2. Tidak ditemukan konfigurasi SSH host remote pada `~/.ssh/config` maupun environment variable workspace.
3. Kueri DNS publik (`8.8.8.8`) terhadap domain `staging.upayariksadaya.com` menghasilkan status **NXDOMAIN** (domain belum didaftarkan atau DNS record belum dipetakan).
4. Sesuai aturan non-negotiable: **Tidak mengarang alamat server remote, IP publik, username, ataupun kredensial**. Status pekerjaan server staging fisik dicatat secara jujur sebagai **BLOCKED**.

---

## 2. Inventaris Infrastruktur (Kondisi Nyata vs Target Staging)

Tabel berikut membandingkan kondisi mesin host pengujian lokal saat ini dengan spesifikasi target staging yang dibutuhkan untuk deployment operasional:

| Komponen | Lingkungan Lokal Saat Ini | Target VPS Staging Operasional | Status | Catatan Evaluasi |
|---|---|---|:---:|---|
| **Platform / VPS** | MacBook Pro (Darwin x86_64) | VPS Dedicated / Cloud Instance (Min. 2 vCPU, 4GB RAM) | **BLOCKED** | Menunggu provisi dari tim IT Ops |
| **Operating System** | macOS 26.7.2 (Darwin 25.6.0) | Ubuntu 24.04 LTS (x86_64) | **BLOCKED** | Konfigurasi hardening dirancang untuk Linux |
| **Node.js Runtime** | v22.20.0 | Node.js v20.x atau v22.x LTS | **READY** | Kode kompatibel dengan Node 20 & 22 |
| **PostgreSQL Database** | PostgreSQL 18.3 (Port 5433) | PostgreSQL 16.x atau 18.x (Port 5432) | **READY** | 19 migrasi skema terbukti kompatibel |
| **Nginx Web Server** | Tidak terpasang di host dev | Nginx 1.24+ (Reverse Proxy & Static Serve) | **CONFIG READY** | Konfigurasi reverse proxy telah disiapkan |
| **Process Manager** | Tidak terpasang di host dev | PM2 5.x+ (Ecosystem Single-Instance) | **CONFIG READY** | `ecosystem.config.cjs` telah disiapkan |
| **Domain Staging** | `localhost:5173` / `localhost:4000` | `staging.upayariksadaya.com` | **BLOCKED** | DNS NXDOMAIN, menunggu pendaftaran DNS A record |
| **TLS / SSL** | Self-signed / HTTP lokal | Let's Encrypt Certbot TLS 1.2/1.3 | **BLOCKED** | Membutuhkan domain aktif & port 80/443 |
| **Persistent Storage** | `./backend/storage/uploads` | `/var/urd/storage/uploads` (Min. 20GB disk) | **READY** | Struktur direktori dan permission telah dirancang |

---

## 3. Estimasi Kebutuhan Kapasitas Server Staging

Berdasarkan beban pengujian simulasi, arsitektur aplikasi Express, dan karakteristik operasional PJK3 URD:

1. **CPU (Prosesor):**
   - Minimum: 2 Core (vCPU).
   - Analisis Beban: Pemrosesan API Express bersifat single-threaded dan ringan. Lonjakan CPU terjadi saat pembangkitan dokumen PDF LHPP F4 (menggunakan engine `pdfkit` dan `qrcode`) serta manipulasi gambar foto lapangan (menggunakan `multer`). 2 vCPU memadai untuk concurrency 10-20 pengguna simultan di staging.

2. **Memory (RAM):**
   - Minimum: 4 GB RAM (Rekomendasi 8 GB bila database PostgreSQL berada pada satu VPS yang sama).
   - Alokasi:
     - Node.js backend: ~150 MB (dibatasi `max_memory_restart: 500M` di PM2).
     - PostgreSQL buffer cache (`shared_buffers`): ~512 MB - 1 GB.
     - Nginx & OS kernel: ~300 MB.
     - Buffer I/O untuk file upload & backup dump: ~500 MB.

3. **Penyimpanan Disk (Storage):**
   - Minimum: 25 GB NVMe / SSD.
   - Alokasi:
     - OS & Paket Sistem: ~6 GB.
     - Database PostgreSQL staging: ~3 GB (termasuk index dan snapshot audit log).
     - File storage dokumen (foto inspeksi, nameplate, PDF LHPP, BAP, BAST): ~10 GB.
     - Cadangan backup lokal terotasi (7 hari): ~5 GB.

4. **Konektivitas Jaringan (Network & Ports):**
   - Bandwidth: Minimum 20 Mbps unmetered.
   - Port Publik Terbuka: Port 80 (HTTP redirect) dan Port 443 (HTTPS).
   - Port Khusus Administrasi: Port 22 (SSH dengan whitelist IP bila memungkinkan).
   - Port Terisolasi (Hanya Localhost): Port 4000 (Express API) dan Port 5432 (PostgreSQL).

---

## 4. Daftar Prasyarat Tindakan untuk Tim IT Infrastruktur (Prerequisite Checklist)

Agar tim engineering dapat segera mengeksekusi deployment ke VPS staging tanpa hambatan, tim IT Infrastruktur wajib menyediakan:

- [ ] **1. Unit VPS Staging:** 1 unit server Ubuntu 24.04 LTS (2 vCPU, 4GB RAM, 25GB SSD).
- [ ] **2. Alamat IP Publik Statis:** Alamat IPv4 publik untuk server staging (misal: `203.0.113.10`).
- [ ] **3. Pendaftaran DNS:**
  - Tambahkan DNS `A record` untuk `staging.upayariksadaya.com` mengarah ke IP publik VPS.
  - TTL disetel ke 300 detik untuk memudahkan propagasi.
- [ ] **4. Akses SSH Administratif:**
  - Akun administrasi awal dengan sudo privileges.
  - Akses berbasis public key SSH (Ed25519), password authentication dinonaktifkan.
- [ ] **5. Firewall Provider / Security Group:**
  - Ingress: Izinkan TCP Port 22, 80, 443 dari internet (atau whitelist untuk SSH).
  - Ingress: Blokir seluruh port lain (termasuk 4000 dan 5432) dari internet publik.
- [ ] **6. Email Sandbox & Gateway WhatsApp:**
  - Kredensial Mailtrap / SMTP sandbox staging.
  - Token sandbox WhatsApp (bila simulasi channel aktif diperlukan).

---

## 5. Kesimpulan Penemuan Infrastruktur

Karena ketersediaan VPS dan domain staging berada di luar kewenangan mandiri repository code, status fase deployment server adalah **BLOCKED (Prerequisite Dependent)**. 

Namun, seluruh paket deployment, konfigurasi environment, migrasi database, skrip hardening, dan runbook operasional telah disiapkan secara lengkap dan siap dijalankan seketika akses VPS diserahkan.

