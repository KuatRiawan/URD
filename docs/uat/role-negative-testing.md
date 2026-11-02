# Negative Testing Role dan Ownership

| ID | Actor | Attempt | Expected | Actual/status | Bukti |
|---|---|---|---|---|---|
| NEG-01 | Marketing | Membuat/mengubah klien, PO, follow-up | Diizinkan pada alur komersial | CODE REVIEWED | Route client/order/reminder |
| NEG-02 | Marketing | Finalisasi LHPP/BAP atau distribusi | 403 | CODE REVIEWED | Route LHPP/BAP/distributions |
| NEG-03 | Admin Kantor | Mengelola operasi dokumen | Diizinkan | PASS | API suite dan route authorization |
| NEG-04 | Inspector | Membuka order Inspector lain | 403/empty sesuai endpoint | PASS | ID manipulation test |
| NEG-05 | Inspector | Mengubah dokumen tanpa assignment | Ditolak | PASS | `document-ownership.test.js` |
| NEG-06 | Pimpinan | POST/PUT/PATCH/DELETE operasional | 403 | PASS | `authorize.js`, API test |
| NEG-07 | Admin Sistem | User, role, master, audit | Diizinkan | PASS | API suite |
| NEG-08 | Akun tidak aktif | Login/API | 401 | CODE REVIEWED | `authenticate.js`; belum test case terpisah untuk login akun nonaktif |
| NEG-09 | User | Mengganti ID klien/order/dokumen | Tidak boleh membaca data pihak lain | PASS WITH LIMITATION | Ownership tests; matriks seluruh endpoint belum lengkap |

Tidak ada perubahan role produksi atau klaim JWT selama UAT.
