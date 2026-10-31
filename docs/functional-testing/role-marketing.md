# Pengujian Role Marketing

Role utama pada seed: `MARKETING`. Kode juga menerima alias kompatibilitas `ADMIN_KANTOR` pada sebagian permission dan label UI. Akun fixture Marketing digunakan; rahasia login tidak dicatat.

| Skenario | Status | Hasil |
|---|---|---|
| Login pada browser uji | PASS | Dashboard menampilkan identitas Marketing |
| Buka halaman klien | PASS | Route `/app/clients` merender halaman Klien |
| Buka Distribusi Dokumen | PASS | Route tersedia dan konten ter-render |
| Distribusi pada viewport 360px | PASS setelah perbaikan | Overflow 404px diperbaiki, lebar dokumen kembali 360px |
| Dashboard responsif | PASS | Tidak ada overflow horizontal pada 360, 390, 430, 768, 1024, 1366, 1440, 1920px |
| E2E membuat PO dan memproses unit | PASS | Dicakup integration test backend multi-unit |
| Seluruh CRUD klien/objek/PO dari UI | NOT RUN | Belum menguji semua variasi form dan persistensi reload di browser |
| Upload, filter, pagination, validasi negatif setiap form | NOT RUN | Belum diuji exhaustif |

Tidak ada blocker role Marketing yang tersisa dari uji ini. Temuan responsive ada di [laporan bug](bug-report.md).
