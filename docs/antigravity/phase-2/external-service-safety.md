# Prosedur Keamanan Layanan Eksternal & Isolasi Staging — URD Phase 2

Tanggal: 2 November 2026  
Status: **VERIFIED & ENFORCED**  
Tujuan: Mencegah Pengiriman Notifikasi atau Data Staging ke Klien Nyata  
Pelaksana: Application Security Engineer & QA Lead  

---

## 1. Prinsip Perlindungan Eksternal (External Safety Gates)

Dalam proses pengujian lingkungan staging, aplikasi PT Upaya Riksa Daya berpotensi memproses ribuan data alat, nomor telepon, dan email yang menyerupai data klien nyata. Untuk mencegah terjadinya insiden operasional serius (seperti klien menerima pesan pengingat tagihan atau riksa uji palsu dari server staging), arsitektur URD menerapkan **Safety Gates Tiga Lapis**:

```
[ Pemicu Notifikasi / Scheduler ]
               │
               ▼
   ( Layer 1: Flag Lingkungan )
   CLIENT_REMINDER_ENABLED === 'false' ?
   ├──► YA  ──► HENTIKAN PENGIRIMAN (ABORT)
   └──► TIDAK
         │
         ▼
   ( Layer 2: Validasi Kredensial Notifier )
   isEmailConfigured() & isWhatsAppConfigured() ?
   ├──► TIDAK (Token Kosong / Sandbox) ──► ALIKHAN KE MODE 'SIMULASI'
   └──► YA
         │
         ▼
   ( Layer 3: Filter Domain Penerima )
   Penerima internal / sandbox saja (Mailtrap / Test Number)
```

---

## 2. Rincian Pengamanan Tiap Kanal Integrasi

### A. Pengaman Kanal WhatsApp
- **Implementasi Kode:** `backend/src/services/notifier.js`
  ```javascript
  export function isWhatsAppConfigured() {
    return Boolean(env.whatsapp.token) && !env.isTest;
  }
  ```
- **Prosedur Staging:**
  - Pada berkas `.env` staging, variabel `WA_API_TOKEN` **wajib dikosongkan** atau diisi token akun pengujian internal perusahaan.
  - Ketika `WA_API_TOKEN` kosong, fungsi `sendWhatsApp()` otomatis mengembalikan status `{ mode: 'SIMULASI' }` tanpa memanggil HTTP POST ke gateway Fonnte.
  - Riwayat pengiriman tetap dicatat pada tabel `client_reminder_log` dengan status `SIMULASI`, memungkinkan tim QA memverifikasi logika bisnis tanpa ada pulsa atau pesan WhatsApp nyata yang terkirim.

### B. Pengaman Kanal Email (SMTP)
- **Implementasi Kode:** `backend/src/services/notifier.js`
  ```javascript
  export function isEmailConfigured() {
    return Boolean(env.smtp.host && env.smtp.user && env.smtp.pass) && !env.isTest;
  }
  ```
- **Prosedur Staging:**
  - Menggunakan layanan SMTP Sandbox (seperti Mailtrap, MailHog, atau inbox uji internal `@staging.upayariksadaya.com`).
  - Seluruh email pengingat, draf LHPP, dan notifikasi akun yang dipicu oleh backend staging akan tertampung di dashboard Mailtrap untuk inspeksi visual tim QA, tanpa pernah mencapai server email klien korporat.

### C. Pengaman Penjadwal Otomatis (Cron Scheduler)
- **Implementasi Kode:** `backend/src/jobs/reminder-scheduler.js` & `backend/src/config/env.js`
- **Prosedur Staging:**
  - Menetapkan konfigurasi eksplisit: `CLIENT_REMINDER_ENABLED=false` pada environment staging.
  - Pengecekan status:
    ```javascript
    export function channelStatus() {
      return {
        enabled: env.clientRemindersEnabled, // false di staging
        email: isEmailConfigured() ? 'AKTIF' : 'SIMULASI',
        whatsapp: isWhatsAppConfigured() ? 'AKTIF' : 'SIMULASI'
      };
    }
    ```
  - Admin Kantor yang membuka halaman `/app/reminders` pada staging akan melihat indikator visual jelas: **Status Pengiriman: MODE SIMULASI (Non-Aktif)**.

### D. Keamanan Verifikasi Stiker QR & Portal Klien
1. **Target URL Staging:**
   - URL verifikasi yang disematkan pada PDF hasil cetak staging mengarah ke domain staging:
     `https://staging.upayariksadaya.com/verifikasi/:verification_code`.
   - Tidak ada tautan yang mengarah ke domain produksi `upayariksadaya.com`.
2. **Isolasi Token Portal Klien:**
   - Berdasarkan migrasi `019_hashed_portal_tokens.sql`, token portal klien disimpan dalam bentuk hash SHA-256 terenkripsi di database `urd_staging`.
   - Token portal staging tidak dapat digunakan untuk membuka dokumen di server produksi, dan sebaliknya (*Strict Environment Separation*).

---

## 3. Matriks Status Pengamanan Layanan Eksternal

| Layanan Eksternal | Konfigurasi Staging | Output Respon Sistem | Resiko Kebocoran ke Klien |
|:---|:---|:---|:---:|
| **WhatsApp Gateway** | `WA_API_TOKEN=""` | `{ mode: 'SIMULASI' }` dicatat ke log | **NIL (0%)** |
| **Email SMTP** | Mailtrap / Dummy Host | Email tersaring di inbox sandbox | **NIL (0%)** |
| **Scheduler Pengingat** | `CLIENT_REMINDER_ENABLED=false` | Evaluasi berjalan, pengiriman diblokir | **NIL (0%)** |
| **Stiker QR Verifikasi** | Domain Staging Resmi | Verifikasi merujuk DB staging | **NIL (0%)** |
| **Token Portal Dokumen** | SHA-256 Hash di DB Staging | Dibatasi ke record staging | **NIL (0%)** |

---

## 4. SOP Verifikasi Sebelum Deployment

Sebelum backend staging dihidupkan:
1. Jalankan pemeriksaan cepat terhadap berkas `.env` staging:
   ```bash
   grep "CLIENT_REMINDER_ENABLED" /var/www/urd/backend/.env
   grep "WA_API_TOKEN" /var/www/urd/backend/.env
   ```
2. Pastikan `CLIENT_REMINDER_ENABLED=false` dan `WA_API_TOKEN` kosong atau sandbox.
3. Jalankan pengujian integrasi contract test `npm test` untuk memastikan mock notifier berfungsi.

