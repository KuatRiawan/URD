# Audit Inspector

## Yang dibuktikan

- API suite menjalankan assignment, membuka inspeksi, checklist, temuan, submit, LHPP dan BAP.
- Owner/assignment dicek pada akses inspeksi, LHPP dan BAP. Nama, telepon, atau prefiks email serupa tidak lagi memberi akses dokumen.
- Test regresi menolak akses dokumen tanpa assignment dan menerima assignment aktif.
- Inspector tidak dapat memfinalisasi LHPP/BAP. Marketing ditolak saat mengubah foto teknis LHPP.
- PDF final terunduh dengan byte yang sama seperti attachment yang disimpan dan di-hash.

## Belum dibuktikan

- Login browser Inspector, kamera HP, autosave setelah tab ditutup, offline recovery, tanda tangan stylus, dan tiap langkah pada enam viewport belum dites manual.
- Seluruh test workflow belum mewajibkan tanda tangan Inspector dan PIC hadir sebelum submit inspeksi.

Severity tersisa: P1 untuk konsistensi prasyarat tanda tangan sebelum submit; P2 untuk E2E browser mobile.
