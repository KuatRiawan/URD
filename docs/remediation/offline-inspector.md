# Offline Inspector

Draft checklist disimpan per inspection dan foto disimpan pada IndexedDB. Saat koneksi kembali, satu mesin sinkronisasi mengirim draft lalu foto melalui API yang sama dengan sesi aktif.

Jika sebagian item gagal, item yang gagal tidak dihapus. Status UI membedakan `syncing`, `success`, `failed`, dan `offline`, sehingga Inspector dapat memperbaiki koneksi atau sesi tanpa kehilangan data lokal.

Sinkronisasi dilindungi guard proses agar event `online` yang berulang tidak menjalankan dua proses bersamaan. Implementasi belum menyelesaikan sinkronisasi tanda tangan sebagai artefak terpisah; keputusan dan test lanjutan diperlukan bila tanda tangan memang dibuat offline.
