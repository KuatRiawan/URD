# Audit Marketing

## Yang dibuktikan

- Test backend terisolasi menjalankan PO multi-unit, jadwal, assignment, inspeksi, finalisasi LHPP/BAP, distribusi dan histori.
- PRD v2.0 menempatkan pendaftaran klien/PO/unit, jadwal, monitoring, koordinasi dokumen dan distribusi pada Marketing.
- Finalisasi LHPP/BAP hanya diizinkan untuk Marketing (termasuk alias lama `ADMIN_KANTOR`) dan `ADMIN_SISTEM`.
- Marketing ditolak saat mengunggah foto LHPP, mengedit BAP teknis, atau mengubah tanda tangan.
- PDF final cocok dengan hash saat finalisasi.

## Belum dibuktikan

- Browser Marketing dari login, buat PO dengan tiga unit baru, refresh, edit, filter dan pencarian belum dijalankan.
- Upload PO, tombol reminder, dan seluruh aksi distribusi belum diperiksa manual.
- SMTP/WhatsApp eksternal tidak diuji.

Severity tersisa: P1 untuk browser E2E multi-unit pada data nyata; P2 untuk kanal distribusi eksternal.
