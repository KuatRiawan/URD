# Laporan Isolasi Layanan Eksternal (External Service Isolation Report)

Tanggal: 2 November 2026  
Status Isolasi: **PASSED (100% TERISOLASI, ZERO REAL CLIENT NOTIFICATIONS)**  
Penyusun: Senior DevOps Engineer & Application Security Engineer  

---

## 1. Prinsip Keselamatan Eksternal (External Safety Mandate)

Sistem operasional PT Upaya Riksa Daya memiliki fitur otomatisasi pengiriman pesan pengingat masa berlaku Suket K3 (H-30, H-14, H-7) kepada kontak person (PIC) klien. 

Dalam lingkungan staging:
**TIDAK BOLEH ADA SATUPUN PESAN NYATA (EMAIL MAUPUN WHATSAPP) YANG TERKIRIM KEPADA KLIEN ATAU NOMOR TELEPON ASLI**.

---

## 2. Mekanisme Isolasi Saluran Pengiriman

Implementasi pada `backend/src/services/notifier.js` dirancang dengan proteksi berlapis:

```javascript
export function isEmailConfigured() {
  return Boolean(env.smtp.host && env.smtp.user && env.smtp.pass) && !env.isTest;
}

export function isWhatsAppConfigured() {
  return Boolean(env.whatsapp.token) && !env.isTest;
}
```

### A. Saluran Email (SMTP Sandbox)
- **Konfigurasi Staging:** Menggunakan Mailtrap Staging Sandbox (`sandbox.smtp.mailtrap.io:2525`).
- **Tingkah Laku:** Seluruh email simulasi yang dikirimkan tertangkap di inbox virtual Mailtrap untuk diperiksa format HTML, header, dan kontennya oleh tim QA.
- **Fail-Safe Fallback:** Jika variabel `SMTP_HOST` atau kredensial kosong, fungsi `sendEmail()` otomatis mengembalikan status `{ mode: 'SIMULASI' }` tanpa memicu error ataupun mencoba koneksi keluar.

### B. Saluran WhatsApp (Mock Transport)
- **Konfigurasi Staging:** Variabel `WA_API_TOKEN` sengaja dikosongkan pada konfigurasi staging default.
- **Tingkah Laku:** Pemanggilan `sendWhatsApp()` memeriksa keberadaan token. Jika token kosong, sistem mencatat pesan pengingat ke database tabel `client_reminder_log` dengan mode `SIMULASI`.
- **Hasil:** Pesan tidak pernah dikirim ke gateway Fonnte, tetapi pengujian alur bisnis, teks pesan perpanjangan, dan pencatatan audit log tetap dapat diverifikasi secara akurat.

---

## 3. Isolasi Scheduler Pengingat Otomatis (`reminder-scheduler.js`)

Untuk memastikan tidak terjadi pengiriman massal tak terkendali di latar belakang:

1. **Variabel Pengendali:**
   ```ini
   CLIENT_REMINDER_ENABLED=false
   ```
2. **Pengujian Terkendali:**
   - Eksekusi pengingat hanya dapat dipicu secara manual oleh Admin Kantor melalui tombol simulasi antrean pengingat pada halaman *Reminders* (`POST /api/v1/reminders/dispatch-simulated`).
3. **Pencegahan Duplikasi:**
   - PM2 dijalankan dalam mode `fork` (single instance). Hal ini mengeliminasi risiko duplikasi cron job yang kerap terjadi pada mode `cluster`.

---

## 4. Isolasi Domain Tautan QR & Portal Publik Klien

1. **URL QR Code:**
   - Seluruh generator QR pada berkas LHPP F4 dan BAP menggunakan prefix domain staging:
     `https://staging.upayariksadaya.com/verify/doc/[hash]`
   - Tidak ada link yang mengarah ke domain produksi `upayariksadaya.com`.
2. **Akses Portal:**
   - Portal publik klien di staging (`/portal`) hanya dapat membaca token yang digenerate oleh database staging `urd_staging`. Dokumen produksi terlindungi dan tidak dapat diakses melalui portal staging.

