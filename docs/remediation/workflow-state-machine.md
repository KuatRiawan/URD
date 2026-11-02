# State Machine Workflow

Status PO dan unit harus mengikuti status pekerjaan yang diizinkan pada service workflow. Penyelesaian satu unit tidak boleh menyelesaikan PO jika unit lain belum selesai; PO selesai hanya setelah seluruh unit memenuhi gate.

UI work queue kini diarahkan pada status dan aksi yang relevan, bukan sekadar daftar tombol. Aksi yang tidak cocok dengan status harus tetap ditolak oleh backend.

Pemetaan status legacy dan alias role masih perlu dipusatkan agar route, UI, dan laporan tidak memiliki definisi berbeda.
