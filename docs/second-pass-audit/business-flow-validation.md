# Validasi alur bisnis

## Alur API yang lulus

1. Marketing membuat PO multi-unit, menjadwalkan dan menugaskan Inspector.
2. Inspector mengisi checklist/temuan dan mengirim hasil pemeriksaan.
3. Sistem membuat LHPP `SIAP_PREVIEW`.
4. Marketing mempratinjau dan memfinalisasi LHPP. API menolak Inspector dan Pimpinan.
5. Sistem membuat BAP draf setelah LHPP.
6. Marketing memfinalisasi BAP. API menolak Inspector.
7. Marketing mencatat distribusi; histori dan penyelesaian PO diuji.

Backend suite menyelesaikan workflow multi-unit tiga unit pada PostgreSQL sementara dan menguji unit kategori berbeda.

## Batas bukti

- Bukti adalah request/response API dan assertion DB, bukan browser role E2E.
- Kamera HP, dialog print OS, email/WhatsApp live, dan penerimaan pihak luar tidak dijalankan.
- Prasyarat tanda tangan Inspector/PIC sebelum submit belum konsisten diwajibkan semua skenario.
- Preview/unduh final memakai attachment yang tersimpan; SHA-256 LHPP dan BAP cocok dengan database.

Workflow API: lulus pada kasus suite. Workflow browser: belum sign-off.
