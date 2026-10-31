# Laporan Reproduksi Bug Modul Inspector
**PT Upaya Riksa Daya**

---

## Kasus 1: Gagal Menyimpan Tanda Tangan Klien di Mobile ("ini ga bisa simpan ttd")
- **Kondisi Awal**:
  1. Inspector membuka lembar riksa uji pada perangkat mobile (iPhone/Android).
  2. Inspector mengisi data checklist di Step 1, lalu berpindah ke Step 2 (Kesimpulan & Tanda Tangan).
  3. Mengisi Nama PIC: "Bp. Teddy", Jabatan: "Pemilik Alat / PIC Klien".
  4. Menggoreskan tanda tangan pada kotak kanvas PIC Klien.
  5. Menekan tombol "Simpan TTD Klien".
- **Gejala Bug**:
  Tombol diklik tetapi tidak ada respons, spinner tidak muncul, dan tanda tangan tidak tersimpan.
- **Akar Masalah**:
  1. Canvas touch event pada mobile Safari memicu gesture recognizer browser yang membatalkan event pointer saat jari bergeser sedikit.
  2. State flag `hasDrawnClientSig` ter-reset menjadi `false` saat re-render atau autosave berlangsung di background.
  3. Pesan error ("Silakan goreskan tanda tangan PIC Klien pada kotak kanvas terlebih dahulu") hanya dicetak di header paling atas modal yang berada di luar layar mobile saat pengguna berada di bagian bawah.

---

## Kasus 2: Parameter Teknis LHPP K3 (Bab II) Tertinggal saat Submit Final
- **Kondisi Awal**:
  Inspector melengkapi spesifikasi teknis (kapasitas SWL aktual, panjang bentang/span, panjang runway, tipe rem, dll) di Step 1, lalu menekan tombol Kirim Formulir Final di Step 2 tanpa menekan "Simpan Draf" terlebih dahulu.
- **Gejala Bug**:
  Nilai parameter teknis pada lembar LHPP yang dicetak tetap kosong atau menggunakan nilai awal dari Marketing.
- **Akar Masalah**:
  Fungsi `handleSubmitFinal` di frontend dan endpoint `POST /submit` di backend belum memetakan kolom `objectAttributes` ke tabel `test_objects`.

