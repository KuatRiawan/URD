# Keputusan Role dan Permission

## Matriks tanggung jawab target

| Area | Marketing | Admin Kantor | Inspector/Ahli K3 | Pimpinan/Manager | Super Admin |
|---|---|---|---|---|---|
| Klien, PIC, PO, unit, repeat order | Kelola | Lihat sesuai kebutuhan operasi | Lihat unit yang ditugaskan | Lihat | Kelola master/dukungan |
| Penjadwalan dan penugasan | Ajukan/koordinasi sesuai SOP | Operasikan antrean | Menerima/menolak penugasan | Monitor | Kelola konfigurasi |
| Checklist, pengukuran, foto, temuan, kesimpulan | Tidak mengubah | QC/revisi sesuai kewenangan | Isi dan submit | Lihat detail | Dukungan terbatas/audit |
| LHPP dan BAP | Lihat status/permintaan klien | QC, proses administrasi, distribusi | Menyusun/finalisasi teknis sesuai kewenangan | Lihat | Kelola template dan akses |
| Suket, QR Sticker, BAST, arsip | Lihat status komersial | Kelola proses administrasi | Memberi data teknis | Monitor | Kelola master/retensi |
| Reminder klien dan follow-up | Owner relasi klien | Menindaklanjuti proses dokumen | Memberi konteks teknis bila diperlukan | Monitor | Konfigurasi/job/log |

## BD-01: Marketing versus Admin Kantor

**Kondisi sekarang:** `users.role` menerima keduanya, `authorize()` memperluas alias silang, dan banyak endpoint operasi memakai `ADMIN_KANTOR` yang pada middleware juga membuka `MARKETING`. Frontend juga menampilkan `ADMIN_KANTOR` sebagai Marketing. Ini membuktikan penggabungan teknis, bukan bukti bahwa tanggung jawab bisnis memang sama.

**Rekomendasi:** pertahankan role terpisah secara konseptual dan buat permission capability terpisah. Marketing tidak boleh mengubah checklist, QC, LHPP/BAP, Suket, atau distribusi hanya karena alias. Admin Kantor tidak otomatis mendapat fungsi komersial penuh.

**Alternatif:** satu role dengan capability tambahan. Ini lebih sederhana untuk organisasi kecil, tetapi berisiko memberi akses berlebih dan menyulitkan audit segregation of duties.

**Risiko jika salah:** perubahan PO/klien dapat bercampur dengan perubahan dokumen teknis; kesalahan distribusi sulit ditelusuri; pengguna melihat menu yang tidak relevan.

**Implementasi setelah disetujui:** buat permission matrix capability, map route per capability, migrasi role tanpa menghapus histori, ubah navigasi, notification recipient, dan test negative permission. Jangan menghapus alias lama sebelum data user dipetakan.

## BD-02: Inspector versus Ahli K3

**Kondisi sekarang:** akun `users`, tabel `inspectors`, kompetensi per kategori, sertifikat, `valid_from`, dan `valid_until` sudah ada. Namun `INSPECTOR` dan `AHLI_K3` diperlakukan sebagai alias dan signer masih memakai `AHLI_K3`.

**Rekomendasi:** gunakan `INSPECTOR` sebagai fungsi akun/pekerjaan, sedangkan Ahli K3 sebagai kualifikasi/otorisasi kompetensi yang melekat pada profil inspector. Penugasan harus memeriksa kategori, masa berlaku, dan status aktif kompetensi. Jangan menganggap semua akun Inspector otomatis kompeten untuk semua bidang.

**Alternatif:** menjadikan Ahli K3 role terpisah. Ini cocok bila perusahaan memiliki kewenangan formal yang benar-benar berbeda, tetapi memerlukan aturan signer dan assignment yang lebih kompleks.

**Implementasi setelah disetujui:** validasi assignment terhadap `inspector_competencies`, status masa berlaku, histori kompetensi, dan UI badge kompetensi. Jika diperlukan, tambahkan status verifikasi kompetensi, bukan mengganti role lama secara destruktif.

## BD-03: Manager/Pimpinan

Arahan terbaru menegaskan monitoring read-only. Middleware sudah memblokir POST/PUT/PATCH/DELETE untuk `PIMPINAN`/`MANAGER`, dan migration 015 memindahkan LHPP dari approval teknis ke `SIAP_PREVIEW`. Pertahankan ini. Approval administratif hanya boleh ditambahkan bila owner mendefinisikan objek, konsekuensi, dan audit trail-nya; tidak boleh disamakan dengan verifikasi teknis.

## Super Admin

Super Admin mengelola akun, master, template, konfigurasi, log, dan pemulihan operasional. Hak teknis untuk memperbaiki data produksi harus dicatat audit dan tidak boleh menjadi jalur bypass dokumen terbit atau audit log append-only.
