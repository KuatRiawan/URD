# Owner Decision Blockers & Policy Register
**PT Upaya Riksa Daya (URD) — Register Keputusan Bisnis Tertunda**

---

## 1. Status Keputusan Bisnis Owner

Sesuai instruksi tata kelola produk, keputusan operasional dan hukum yang memerlukan persetujuan pemilik perusahaan (*Owner / Direksi PT Upaya Riksa Daya*) tidak diubah secara sepihak dan dipertahankan dalam status **DECISION REQUIRED**.

| No | Area Bisnis | Deskripsi Isu Kebijakan | Status Saat Ini | Opsi Keputusan yang Diajukan ke Owner | Dampak Teknis |
|---|---|---|---|---|---|
| **ODB-01** | **Jadwal Reminder Kadaluarsa Suket** | Interval waktu pengiriman notifikasi pengingat perpanjangan Suket Disnaker kepada klien. | `DECISION REQUIRED` | **Opsi A**: Interval agresif H-90, H-60, H-30, H-14, H-7, H-0.<br>**Opsi B**: Interval standar H-30, H-14, H-7 (saat ini aktif). | Perubahan konstanta hari cron pengingat di modul `reminders.js`. |
| **ODB-02** | **Mapping Akun Produksi** | Penetapan alamat email, nomor WhatsApp resmi, dan penanggung jawab definitif untuk akun awal produksi. | `DECISION REQUIRED` | Menunggu daftar resmi nama pimpinan, kepala admin, dan koordinator marketing untuk konfigurasi `production-seed`. | Penyiapan script migrasi akun resmi tanpa mengganggu data UAT. |
| **ODB-03** | **Alur Cancel / Correction / Reissue Dokumen** | Mekanisme penerbitan ulang LHPP/BAP pasca-status final/terbit jika terdapat kesalahan fatal dari klien. | `DECISION REQUIRED` | **Opsi A**: Strict Append-Only Reissue (memerlukan persetujuan Direktur & pembatalan nomor lama).<br>**Opsi B**: Koreksi nomor addendum versi (v1.1, v1.2) dengan audit log. | Implementasi endpoint mutasi addendum & penandaan nomor arsip BAP/LHPP. |
| **ODB-04** | **Kebijakan Retensi & Legal Hold** | Batas waktu penyimpanan dokumen elektronik dan bukti foto riksa uji sebelum diarsipkan ke cold storage. | `DECISION REQUIRED` | **Opsi A**: Retensi minimum 5 tahun sesuai regulasi K3 Kemenaker.<br>**Opsi B**: Retensi permanen (tanpa pembersihan otomatis). | Konfigurasi lifecycle storage S3/MinIO dan kebijakan backup berkala. |
| **ODB-05** | **Toleransi Masa Berlaku SKP Ahli K3** | Aturan sistem saat masa berlaku SKP (Surat Keputusan Penunjukan) Ahli K3 mendekati habis atau lewat tempo. | `DECISION REQUIRED` | **Opsi A**: Strict Freeze (Ahli K3 otomatis tidak bisa ditugaskan pada order baru jika SKP kadaluarsa).<br>**Opsi B**: Soft Warning (peringatan kepada Admin Kantor namun penugasan tetap diperbolehkan). | Penambahan guard validasi tanggal pada service penugasan inspektor (`assignments.js`). |

---

## 2. Pemblokir Infrastruktur (Environment)

| ID | Komponen | Deskripsi | Status | Tindakan Diperlukan |
|---|---|---|---|---|
| **INF-01** | VPS Staging | Server cloud Linux Ubuntu 22.04 LTS belum disediakan oleh pemilik/klien. | **BLOCKED** | Penyediaan IP VPS, user sudo, dan SSH key. |
| **INF-02** | DNS Domain | Domain / Subdomain (misal: `staging.upayariksadaya.com` atau `app.upayariksadaya.com`) belum diarahkan ke server. | **BLOCKED** | Konfigurasi DNS A record mengarah ke IP publik VPS. |

> **Catatan Produk**: Seluruh pengembangan aplikasi tetap dilanjutkan secara penuh dan diverifikasi 100% pada lingkungan lokal, tanpa menunda penyempurnaan UI/UX, backend integrity, maupun penjaminan mutu otomatis.

