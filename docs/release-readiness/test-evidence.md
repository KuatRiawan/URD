# Bukti Pengujian

## Perintah dan hasil

| Perintah | Hasil |
|---|---|
| `npm --prefix backend test` | PASS, 6 file, 58 test |
| `npm --prefix backend run lint` | PASS |
| `npm --prefix frontend run lint` | PASS |
| `npm --prefix frontend test` | PASS, 3 file, 7 test |
| `npm --prefix frontend run build` | PASS |
| `git diff --check` | PASS |

## Cakupan yang terbukti

Auth/session, RBAC, ownership, assignment kompetensi, inspeksi, dokumen, multi-unit PO, reminder idempotensi, portal token, search, dan work queue memiliki test otomatis.

## Keterbatasan

- Tidak ada test penuh terhadap database staging/production.
- Tidak ada test browser responsive atau perangkat mobile nyata.
- Jadwal reminder resmi belum dipilih owner sehingga test hanya membuktikan perilaku kode saat ini.
- Skenario cancel/reissue dan retention belum dapat diuji karena fiturnya belum diputuskan/diimplementasikan.
