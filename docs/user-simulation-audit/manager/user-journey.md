# Pimpinan: perjalanan pengguna

Login dengan akun Pimpinan resmi. Dashboard menampilkan ringkasan operasional dari data test. Buka daftar PO dalam tampilan ponsel dan detail `TEST-URD-2026-001`; tab jadwal menampilkan jadwal, catatan, Inspector, dan unit secara baca saja. Riwayat status juga tampil tanpa kontrol transisi.

Percobaan mengubah status melalui UI/API sebagai Pimpinan ditolak oleh API dengan 403 `MANAGER_READ_ONLY`; status database tetap `SEDANG_DIPERIKSA`. Preview dokumen final dan seluruh halaman drill-down belum diuji karena inspeksi belum sah untuk difinalisasi.
