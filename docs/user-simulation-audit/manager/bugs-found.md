# Pimpinan: temuan

## P2: panel jadwal kosong dan kontrol status memberi kesan dapat mengubah

**Akar masalah:** tampilan detail tidak menyediakan konten baca saja untuk jadwal/riwayat, sementara kontrol perubahan status tampil untuk role monitoring. **Perbaikan:** tampilkan jadwal, tim dan daftar unit; status menampilkan riwayat untuk role read-only; transisi hanya tersedia untuk role pengelola. **Retest:** browser memperlihatkan konten detail; API Pimpinan menerima 403 saat mencoba patch, status DB tidak berubah. Status: **FIXED & TESTED**.
