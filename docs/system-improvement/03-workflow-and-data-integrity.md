# PT Upaya Riksa Daya (URD) — Verifikasi Alur Kerja Lintas Peran & Integritas Data

---

## 1. Verifikasi Alur Kerja Lintas 5 Peran (End-to-End Workflow)

Alur operasional riksa uji K3 berjalan tanpa hambatan dari ujung ke ujung:

```
[1. Marketing] ──> Input PO Multi-Unit & PIC Klien
      │
      ▼
[2. Admin Kantor] ──> Penjadwalan & Penugasan Inspector Berdasarkan SKP / Bidang (Deteksi Konflik)
      │
      ▼
[3. Inspector / Ahli K3] ──> Verifikasi Nameplate Fisik, Ceklis Dinamis, Parameter Teknis,
                             Foto Lapangan, Temuan K3, TTD Digital (Mendukung Offline-First)
      │
      ▼
[4. Admin Kantor] ──> Verifikasi QC Teknis, Evaluasi LHPP (Bisa Return jika perlu revisi),
                      Finalisasi LHPP ──> Otomatis Menerbitkan Draf BAP
      │
      ▼
[5. Admin Kantor & Inspector] ──> Finalisasi BAP Resmi (Diterbitkan setelah LHPP)
      │
      ▼
[6. Admin Kantor] ──> Registri Suket Disnaker, Pelacakan Distribusi Dokumen Fisik/Digital,
                      Cetak QR Sticker & Label Alat K3
      │
      ▼
[7. Pimpinan / Manager] ──> Pemantauan Eksekutif Terpadu (Monitoring Read-Only, Tanpa Blokir QC)
      │
      ▼
[8. Marketing & Admin] ──> Pengingat Otomatis Siklus Masa Berlaku (H-30/14/7) & Repeat Order
```

---

## 2. Poin Kritis Integritas Bisnis & Data yang Terverifikasi

1. **Prinsip PO Multi-Unit**:
   - Satu nomor PO dapat menampung banyak unit alat dengan kategori K3 berbeda (misal: PAA, PTP, PUBT).
   - Setiap unit memiliki status independen (`unit_status`), riwayat pengujian terpisah, temuan individual, dan masa berlaku masing-masing.
   - Status PO utama tidak dapat berubah menjadi `SELESAI` jika masih ada unit yang belum tuntas (`PO_UNITS_INCOMPLETE` gate).

2. **Urutan Penerbitan Dokumen Resmi**:
   - BAP diterbitkan **setelah** LHPP selesai dievaluasi dan difinalisasi oleh Admin Kantor (`created_after_lhpp`).
   - Setiap dokumen resmi dilengkapi kode verifikasi publik unik (`verification_code`) dan hash SHA-256 (`document_hash`) yang dapat diverifikasi publik tanpa login pada `/verify/:code`.

3. **Integritas Penilaian Lapangan**:
   - Tidak ada item checklist yang otomatis ditandai *Sesuai* (*compliant*). Nilai checklist merefleksikan input nyata Inspector.
   - Mode offline-first menyimpan draf dan foto ke IndexedDB/LocalStorage dan otomatis tersinkronisasi saat koneksi pulih.

4. **Keamanan & Otorisasi Hak Akses (RBAC)**:
   - Akses rute `/app/suket` diselaraskan untuk peran operasional berwenang (`ADMIN_SISTEM`, `ADMIN_KANTOR`, `PIMPINAN`).
   - Tabel log audit PostgreSQL terproteksi trigger tak terubah (*append-only*), menolak operasi `UPDATE` dan `DELETE`.

