# Marketing: hasil uji

| Skenario | Hasil | Bukti |
|---|---|---|
| Login dan dashboard | Lulus | Login normal sebagai Marketing. |
| Buat klien lalu PO tiga unit | Lulus | UI menyimpan PO `TEST-URD-2026-001`; refresh mempertahankan data. |
| Penugasan Inspector | Lulus | PO terlihat oleh Inspector yang ditugaskan; SQL mencatat 1 assignment. |
| Integritas PO dan unit | Lulus | SQL baca saja: 3 `order_objects`, 3 nomor seri individual, status PO `SEDANG_DIPERIKSA`. |
| Upload lampiran PO | Belum diuji | Tidak ada file PO sumber untuk unggah. |
| Perubahan tanggal | Belum terkonfirmasi | Pengisian otomasi tidak tercermin di review; perlu uji interaksi kalender manual. |

Database uji yang digunakan tetap disimpan. Tidak ada operasi reset atau penghapusan data.
