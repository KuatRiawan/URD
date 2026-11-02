# Rencana & Lembar Uji Asap Pasca-Deployment (Post-Deployment Smoke Test) — URD Phase 2

Tanggal: 2 November 2026  
Status: **VERIFIED PROCEDURAL CHECKLIST**  
Lingkungan Target: Staging Server (`https://staging.upayariksadaya.com`)  
Pelaksana: QA Lead & Senior Full-Stack Engineer  

---

## 1. Tujuan Smoke Test

Pengujian asap (*Smoke Test*) bertujuan memvalidasi bahwa seluruh komponen utama sistem (Frontend SPA, Backend API, Database PostgreSQL, Penyimpanan Media, Generator PDF, dan Autentikasi RBAC) telah terhubung secara harmonis di server staging dan tidak mengalami regresi atau kegagalan konfigurasi lingkungan.

---

## 2. Lembar Verifikasi 14 Skenario Kunci

Pengujian dijalankan langsung pada antarmuka web staging dan permintaan HTTP API:

| No | Modul / Alur Uji | Peran Pelaksana | Prosedur Uji | Kriteria Sukses (Expected Result) | Status |
|:---:|:---|:---:|:---|:---|:---:|
| 01 | **Autentikasi & Sesi** | Seluruh Peran | Login via `/login`, verifikasi JWT cookie HttpOnly, refresh token, lalu logout | Berhasil login, dashboard terbuka sesuai role, cookie terhapus saat logout | **PASS** |
| 02 | **Registrasi Klien & PIC** | Marketing | Akses menu `/app/clients`, buat klien "PT Staging Smoke Test", tambahkan 1 PIC | Klien dan kontak PIC tersimpan di PostgreSQL, muncul di daftar tabel | **PASS** |
| 03 | **Pendaftaran PO & Unit** | Marketing | Buat PO baru "PO-STAGING-001", tambahkan 2 unit (Overhead Crane & Bejana Tekan) | Record tersimpan di `orders` dan `order_objects`, unit status awal `TERJADWAL` | **PASS** |
| 04 | **Work Queue Kantor** | Admin Kantor | Buka `/app/dashboard`, periksa widget antrean kerja (*Work Queue*) | PO baru dan unit yang perlu dijadwalkan tampil akurat pada antrean | **PASS** |
| 05 | **Buka Penugasan Lapangan** | Inspector A | Login sebagai Ahli K3, buka menu `/app/inspections`, cek penugasan unit | Hanya unit yang ditugaskan ke Inspector A yang muncul di daftar | **PASS** |
| 06 | **Penyimpanan Draf Checklist** | Inspector A | Buka modal inspeksi, isi beberapa butir checklist, klik Simpan Draf | Draf tersimpan di PostgreSQL (`inspections.results`), status tetap `DRAF` | **PASS** |
| 07 | **Unggah Foto Temuan** | Inspector A | Unggah foto nameplate alat (JPG/PNG) dengan caption teknis | Berkas tersimpan di disk `/var/lib/urd/staging-uploads`, metadata tercatat di DB | **PASS** |
| 08 | **Pratinjau PDF LHPP** | Admin Kantor | Buka menu `/app/lhpp`, klik Pratinjau Dokumen LHPP (Bab I s/d V) | PDF laporan F4 ter-render sempurna di browser dengan watermark "DRAF / PREVIEW" | **PASS** |
| 09 | **Pratinjau PDF BAP** | Admin Kantor | Buka menu `/app/bap`, klik Cetak / Pratinjau Lembar BAP | Lembar BAP ter-render rapi lengkap dengan nama unit, tanggal, dan tanda tangan | **PASS** |
| 10 | **Verifikasi Stiker QR** | Publik / Tamu | Pindai atau akses URL `/verifikasi/:verification_code` dari peramban tanpa login | Halaman verifikasi publik terbuka, menampilkan validitas dokumen resmi | **PASS** |
| 11 | **Akses Portal Klien** | Klien (Test Token) | Buka tautan `/portal/:token` menggunakan token akses uji | Portal klien terbuka, menampilkan daftar unit, status, dan berkas sertifikat K3 | **PASS** |
| 12 | **Pengawasan Pimpinan** | Pimpinan | Login sebagai Pimpinan, buka dashboard statistik dan detail order | Data analitik tampil jelas; tombol edit, hapus, dan approval teknis tidak ada | **PASS** |
| 13 | **Konfigurasi Super Admin** | Super Admin | Buka `/app/users` dan `/app/audit-logs` | Matriks pengguna tampil; riwayat audit log append-only dapat ditelusuri | **PASS** |
| 14 | **Isolasi Domain & Lalu Lintas** | DevOps / QA | Buka Network Tab di DevTools browser, periksa seluruh URL request | 100% request mengarah ke `staging.upayariksadaya.com`, 0 request ke production | **PASS** |

---

## 3. Verifikasi Database Staging Terhadap Data Masuk

Setelah rangkaian smoke test dijalankan, dilakukan audit query cepat pada database `urd_staging`:

```sql
-- 1. Pastikan order dan unit masuk dengan benar
SELECT o.order_no, c.name AS client, count(oo.id) AS total_units
FROM orders o
JOIN clients c ON c.id = o.client_id
JOIN order_objects oo ON oo.order_id = o.id
WHERE o.order_no = 'PO-STAGING-001'
GROUP BY o.order_no, c.name;

-- 2. Pastikan file attachment tersimpan di disk dan DB
SELECT id, original_name, storage_path, mime_type, file_size 
FROM file_attachments 
ORDER BY created_at DESC LIMIT 5;

-- 3. Pastikan audit log mencatat aksi smoke test
SELECT action, entity, user_id, created_at 
FROM audit_logs 
ORDER BY created_at DESC LIMIT 10;
```

---

## 4. Kriteria Kelulusan Smoke Test (Acceptance Gate)

Lingkungan staging dinyatakan **LULUS SMOKE TEST** apabila:
1. Ke-14 skenario di atas berstatus **PASS**.
2. Tidak ada error fatal HTTP 500 pada log Nginx atau log PM2.
3. Tidak ada kebocoran request jaringan yang mengarah ke server produksi atau layanan eksternal publik.

