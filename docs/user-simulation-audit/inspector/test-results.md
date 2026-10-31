# Inspector: hasil uji

| Skenario | Hasil | Bukti/batasan |
|---|---|---|
| Login, daftar tugas dan unit PO | Lulus | Akun Inspector resmi seed, bukan penggantian role. |
| Terima penugasan | Lulus | Status assignment `DITERIMA` terlihat setelah muat ulang; DB ikut berubah. |
| Mulai dua inspeksi | Lulus | SQL: dua inspeksi `DRAF`, pada objek terpisah. |
| Nilai default setelah perbaikan | Lulus | Draf baru 0/23; kesimpulan kosong. |
| Checklist berdasarkan observasi, ukuran, temuan | Tidak dijalankan | Tidak ada data observasi teknis resmi; tidak mengarang nilai. |
| Foto/kamera/preview/autosave/offline | Belum diuji | Tidak mengklaim workflow offline. |
| Tanda tangan dan submit | Belum diuji lewat browser | API suite menguji syarat tanda tangan; tidak membuat tanda tangan palsu. |
| Multi-unit isolasi | Sebagian | SQL memperlihatkan inspeksi terpisah per objek; tidak menyelesaikan unit. |
| Responsive enam lebar | Sebagian | Form inspeksi belum melewati seluruh matriks. |
