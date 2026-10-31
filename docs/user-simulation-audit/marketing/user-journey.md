# Marketing: perjalanan pengguna

Login sebagai Marketing dengan autentikasi aplikasi. Dari dashboard membuka PO & Order Pemeriksaan, membuat klien uji PT DEMO INDUSTRI, lalu membuat PO `TEST-URD-2026-001` berisi Overhead Crane (`SIM-CRN-001`), Forklift (`SIM-FLK-002`), dan Fire Alarm (`SIM-FA-003`). Inspector Budi dipilih dan PO tersimpan. Setelah refresh, PO dan tiga unit tetap muncul. Penugasan terlihat oleh Inspector setelah login.

Percobaan mengganti tanggal pada wizard tidak mengubah tanggal pada halaman review/database; diduga keterbatasan input kalender pada otomasi browser, sehingga tidak diklaim sebagai bug aplikasi tanpa reproduksi manual. Lampiran PO tidak diunggah. Lihat [hasil uji](test-results.md) dan [temuan](bugs-found.md).
