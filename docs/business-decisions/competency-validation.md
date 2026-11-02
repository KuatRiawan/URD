# Validasi Kompetensi Inspector

## Implemented

- Assignment hanya menerima user aktif dengan role `INSPECTOR` atau legacy `AHLI_K3`.
- Setiap kategori unit dibandingkan dengan `inspector_competencies.category_id`.
- `valid_from` harus kosong atau sudah berlaku pada tanggal jadwal.
- `valid_until` wajib mencakup tanggal jadwal.
- Kompetensi kategori lain ditolak dengan `COMPETENCY_INVALID`.
- Skema input menolak rentang `validFrom` setelah `validUntil`.

## Status kompetensi

Belum ada kolom status kompetensi eksplisit pada schema. Status efektif saat ini adalah user aktif dan rentang tanggal sertifikat. Menambahkan status formal (`AKTIF`, `DIBEKUKAN`, dan sebagainya) adalah keputusan/model lanjutan, bukan asumsi yang dibuat pada patch ini.

## Histori dan signer

Riwayat sertifikat dan tanda tangan tidak dihapus. Label penandatangan tetap menggunakan data signer inspection; otoritas formal Ahli K3 masih membutuhkan SOP owner.
