# Rekomendasi Fitur dan Prioritas

| Prioritas | Kebutuhan | Keputusan |
|---|---|---|
| P0 / MUST | Menjaga data lintas role dan histori kendala; validasi akses objek; transaksi untuk operasi penting. | Diimplementasikan untuk alur kendala, lampiran, audit dan pencarian isu; cakupan regresi tercantum pada test-results. |
| P1 / MUST | Melaporkan kendala lapangan dan menindaklanjuti lintas role. | Diimplementasikan sebagai modul Kendala terhubung FE/API/PostgreSQL. |
| P1 / MUST | Histori PO agar revisi dasar dapat ditelusuri. | Snapshot versi dicatat pada PO awal, penambahan unit dan impor CSV. Ini belum change-order penuh. |
| P1 / MUST | Perubahan jadwal dengan alasan dan notifikasi Inspector. | Riwayat dan notifikasi terhubung, diuji melalui API. |
| P1 / SHOULD | Change order unit tambahan/revisi klien dengan persetujuan dan dampak operasional. | Belum diimplementasikan; perlu aturan bisnis dan bukti persetujuan klien. |
| P1 / SHOULD | Penggantian Inspector dengan kompetensi, ketersediaan dan histori. | Belum diverifikasi atau ditambahkan. |
| P1 / SHOULD | Pembatalan aman setelah pekerjaan parsial. | Perlu pengujian dan alur khusus sebelum dinyatakan memenuhi. |
| P2 / SHOULD | Ringkasan backlog, keterlambatan, beban dan dokumen per PO. | Modul yang ada menjadi dasar; metrik/SLA belum ditetapkan dan belum diuji pada edge case. |
| P2 / SHOULD | Global search untuk nomor kendala sesuai permission. | Diimplementasikan dan dites untuk hasil isu milik Inspector. |
| P3 / NICE | Tren performa, reminder otomatis dan micro-interaction. | Tidak dipaksakan karena tidak diperlukan untuk memperbaiki masalah inti. |

## Keputusan UX

Satu halaman Kendala dipakai bersama dengan izin berbasis role. Inspector masuk dari konteks inspeksi; Marketing/Admin mengelola tindakan; Pimpinan membaca. Ini mengurangi duplikasi antrean dan menjaga konteks kerja.
