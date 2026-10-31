# Audit backend

## Perubahan putaran kedua

- Menghapus fallback akses LHPP/BAP berdasarkan nama, telepon, dan prefiks email.
- Endpoint approval/reject LHPP lama memberi 410; finalisasi LHPP/BAP dibatasi ke Marketing/Admin Sistem.
- Membatasi upload/hapus foto LHPP dan edit/tanda tangan BAP dari Marketing.
- Endpoint PDF final menyajikan attachment yang di-hash ketika finalisasi.
- Backend ESLint lulus setelah membersihkan import/assignment mati.

## Batas audit

- Review semua kombinasi Joi/role/path, race condition, upload traversal/MIME, scheduler, SMTP/WhatsApp dan job retry belum lengkap.
- `ADMIN_KANTOR`/`AHLI_K3` masih alias kompatibilitas pada sejumlah route/schema. Migration 011 mengonversi data lama ke Marketing/Inspector, tetapi source belum sepenuhnya dibersihkan.
- Integrasi eksternal tidak diuji.

Backend: 51/51 test lulus pada database audit sementara.
