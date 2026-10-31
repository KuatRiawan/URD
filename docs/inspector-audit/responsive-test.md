# Pengujian Responsif Modul Inspector
**PT Upaya Riksa Daya**

---

## 1. Lingkup Breakpoint & Perangkat Uji
1. **Mobile Portrait (375px - 414px, misal iPhone SE, iPhone 14/15/16)**:
   - Bottom navigation bar 3 kolom dengan tap target nyaman.
   - Task card satu kolom penuh tanpa overflow horizontal.
   - Canvas tanda tangan responsif menyesuaikan lebar container dan koordinat sentuhan akurat.
2. **Tablet & Phablet (768px - 834px, misal iPad Mini, iPad Air)**:
   - Layout grid 2 kolom pada daftar kartu unit.
   - Kolom tanda tangan digital berdampingan secara proporsional.
3. **Desktop (1024px - 1440px+)**:
   - Sidebar navigasi profesional PT Upaya Riksa Daya.
   - Opsi tampilan Tabel Terpadu atau Kartu Grid.

---

## 2. Hasil Verifikasi Pengujian
| Fitur / Halaman | Mobile (375px) | Tablet (768px) | Desktop (1440px) | Hasil |
|---|---|---|---|---|
| Dasbor Tugas Saya | Lolos (1 kolom) | Lolos (2 kolom) | Lolos (Grid/Tabel) | Memenuhi Standar |
| Filter & Search Bar | Lolos (Scroll horizontal aman) | Lolos | Lolos | Memenuhi Standar |
| Form Riksa Uji Step 1 | Lolos (Scroll vertikal mulus) | Lolos | Lolos | Memenuhi Standar |
| Form Riksa Uji Step 2 | Lolos (Inline feedback terlihat) | Lolos | Lolos | Memenuhi Standar |
| Goresan Canvas Tanda Tangan | Lolos (DPI scale tepat, no offset) | Lolos | Lolos | Memenuhi Standar |
| Bottom Navigation Bar | Lolos (3 kolom lega) | Hidden (Pindah ke Sidebar) | Hidden | Memenuhi Standar |

