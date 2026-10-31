# Admin Sistem: temuan

## P2: filter role berpotensi menggandakan kategori alias historis

**Akar masalah:** pilihan role mencampur role kanonis dan alias lawas. **Perbaikan:** UI memakai empat role kanonis; query filter tetap memasukkan alias lama melalui parameter SQL `ANY($n::text[])`. Filter Marketing berhasil mengembalikan Marketing dan `ADMIN_KANTOR` historis.

## P3: form akun reset ke role yang tidak lagi kanonis

**Akar masalah:** state reset setelah sukses memakai `ADMIN_KANTOR`, walau create API menolak alias. **Perbaikan:** reset ke `MARKETING`. Retest membuka modal baru setelah sukses dan memeriksa select menghasilkan `MARKETING`. Status: **FIXED & TESTED**.
