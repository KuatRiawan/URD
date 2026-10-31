# Analisis Kesenjangan Pimpinan / Manager

| Aktivitas | Kondisi saat ini | Kesenjangan yang ditemukan | Rekomendasi |
|---|---|---|---|
| Memantau volume dan progres | Dashboard manajemen, work queue, notifikasi, pencarian tersedia. | Tidak dilakukan simulasi backlog terlambat, beban Inspector, dan dokumen tertahan secara data penuh. | MUST: antrean berdasarkan keterlambatan dan langkah berikutnya; drill-down ke PO/unit. |
| Memantau kendala | Halaman Kendala menampilkan laporan, prioritas, status, penanggung jawab, bukti dan timeline. | Pimpinan hanya baca; API menolak perubahan. Uji UI membuktikan tampilan read-only. | Pertahankan batas ini; tim operasional menindaklanjuti. Tambahkan ringkasan umur kendala bila aturan SLA ditetapkan. |
| Dokumen belum terbit/terdistribusi | Modul LHPP, BAP dan distribusi sudah tersedia. | Kasus backlog dokumen dan kegagalan distribusi tidak disimulasikan pada putaran ini. | SHOULD: satukan indikator “belum terbit”, “gagal”, dan “belum dikirim” per pekerjaan. |
| Banyak pekerjaan tertunda / overload | Data tugas dan dashboard ada. | Ambang overload dan prioritas tidak diketahui, sehingga belum dapat dinilai atau diklaim. | Tentukan SLA dan kapasitas sebelum menambahkan alarm/angka risiko. |

## Bukti pengujian

API tes menolak perubahan kendala oleh Pimpinan. Browser menunjukkan detail dan riwayat kendala dengan keterangan pemantauan baca saja. Pimpinan dapat membuka rincian, tetapi tidak mengubah penanggung jawab/status.

## Prioritas

- **MUST HAVE:** tampilan baca saja yang konsisten dan drill-down kendala.
- **SHOULD HAVE:** antrean keterlambatan dan kelengkapan dokumen dengan definisi SLA yang disetujui.
- **NICE TO HAVE:** analitik tren lintas periode.
- **NOT NEEDED:** izin persetujuan hasil inspeksi atau pengubahan kendala untuk role Pimpinan.
