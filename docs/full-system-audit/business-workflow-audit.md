# Audit business workflow PO sampai LHPP

Suite backend menjalankan Marketing membuat PO tiga unit, menjadwalkan dan menugaskan Inspector, memproses unit sesuai kategori, menyimpan checklist/foto/signature, submit pemeriksaan, memfinalisasi LHPP, membuat BAP setelah LHPP, mencatat distribusi dan riwayat, lalu menyelesaikan PO saat seluruh unit selesai.

Aturan assignment Inspector, data pemeriksaan per unit, dokumen historis, dan larangan mutasi Pimpinan diuji dalam suite. Regression test sesi ini memastikan submit idempotent tidak membuka inspeksi milik Inspector lain.

Belum diverifikasi di browser: pembuatan PO dan alur HP Inspector dengan sesi role nyata, preview visual setiap template asli, serta pengiriman kanal email/WhatsApp eksternal. Status legacy approval Pimpinan masih tampak pada query/label dan perlu transisi data yang aman.
