# Audit backend

Route modular yang diperiksa mencakup auth, clients, objects, orders, scheduling, inspections, LHPP, BAP, distributions, history, reminders, users, search, notifications dan audit logs. Query memakai helper pool dan parameterized SQL. Migrasi skema disimpan sebagai SQL bernomor.

Perbaikan sesi ini: aktivitas Inspector dibatasi user; submit idempotent memeriksa ownership; fallback kepemilikan berbasis identitas nonunik dihapus; secret JWT statis dihilangkan dari konfigurasi non-development.

Suite API dan PDF dijalankan penuh terhadap database sementara disposable. Pemeriksaan otomatis Joi untuk seluruh kombinasi query/path/role dan job eksternal belum lengkap.
