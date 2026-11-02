# Keamanan Portal Klien

Token portal baru dibuat acak, disimpan sebagai SHA-256 hash, dan token mentah hanya dikembalikan pada response pembuatan. Endpoint daftar token tidak mengembalikan token database.

Endpoint publik hanya read-only, memeriksa status aktif dan masa berlaku, serta mendukung token legacy yang belum bermigrasi. Token aktif dapat dicabut oleh administrator dan aksi pencabutan dicatat pada audit.

Token legacy tetap merupakan risiko transisi karena nilainya masih tersimpan mentah. Migrasi penuh perlu direncanakan setelah seluruh link lama diperbarui atau kedaluwarsa.
