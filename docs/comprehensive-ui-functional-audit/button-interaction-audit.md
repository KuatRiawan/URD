# Audit Interaksi Tombol — PT Upaya Riksa Daya

Tanggal audit: 2025-07-11  
Cakupan: Seluruh komponen dan halaman di `frontend/src/`

---

## Metodologi

Pencarian dilakukan terhadap semua pola tombol mati:
- `onClick={() => {}}` (handler kosong)
- `onClick={undefined}` (handler undefined)
- `onClick={() => console.log(...)}` (placeholder log)
- `<button>` tanpa `type` di luar form (potensi tidak disengaja)
- `disabled={true}` hardcoded tanpa kondisi logis
- Komponen `<Button>` tanpa `onClick` dan bukan `type="submit"`

---

## Hasil: Tidak Ada Tombol Mati Fungsional

Audit menyeluruh tidak menemukan tombol mati pada fitur utama. Semua tombol terhubung ke handler nyata dengan loading state, error handling, dan validasi yang benar.

---

## Inventarisasi Tombol per Halaman

### IssuesPage (`/app/issues`)
| Tombol | Status | Catatan |
|---|---|---|
| Laporkan Kendala (buka modal) | OK | onClick={setCreateOpen} |
| Batal (tutup modal) | OK | type="button", onClick menutup modal |
| Simpan laporan | FIXED | Ditambahkan `type="submit"` eksplisit |
| Simpan tindak lanjut | FIXED | Ditambahkan `type="submit"` eksplisit |
| Filter status | OK | onChange handler mengubah state filter |
| Search query | OK | onChange handler mengubah state query |

**Catatan perbaikan:** Kedua tombol submit di IssuesPage sebelumnya tidak memiliki `type="submit"` eksplisit. Keduanya berada di dalam `<form onSubmit={...}>` sehingga secara HTML default berfungsi sebagai submit, tetapi ditambahkan atribut eksplisit untuk konsistensi dan kejelasan.

### LoginPage (`/app/login`)
| Tombol | Status | Catatan |
|---|---|---|
| Masuk | OK | type="submit", disabled={submitting} |

### DashboardPage (`/app/dashboard`)
| Tombol | Status | Catatan |
|---|---|---|
| Terima Penugasan | OK | onClick handler + loading state |
| Tolak Penugasan | OK | onClick handler + konfirmasi modal |
| Batal Penugasan | OK | onClick handler + konfirmasi modal |
| Mulai Inspeksi | OK | onClick membuka StartInspectionModal |

### OrdersPage (`/app/orders`)
| Tombol | Status | Catatan |
|---|---|---|
| Buat PO Baru | OK | onClick membuka CreatePoWizardModal |
| Filter/Search | OK | Handler pada setiap input filter |
| Lihat Detail | OK | onClick membuka OrderDetailModal |
| Pagination | OK | onPageChange handler di StateViews |

### ClientsPage (`/app/clients`)
| Tombol | Status | Catatan |
|---|---|---|
| Tambah Klien | OK | onClick membuka ClientFormModal |
| Edit Klien | OK | onClick dengan data pre-fill |
| Hapus Klien | OK | onClick + konfirmasi dialog (tone: danger) |
| Buat Tautan Akses Portal | OK | disabled={portalLoading} |

### SchedulePage (`/app/schedule`)
| Tombol | Status | Catatan |
|---|---|---|
| Tambah Kompetensi SKP | OK | onClick membuka AddCompetencyModal |
| Submit form kompetensi | OK | type="submit", disabled={submitting} |

### InspectionsPage (`/app/inspections`)
| Tombol | Status | Catatan |
|---|---|---|
| Mulai Inspeksi | OK | type="submit", disabled={submitting} |
| Simpan Foto | OK | type="submit", disabled |
| Simpan Temuan | OK | type="submit", disabled |
| Simpan Tanda Tangan Inspector | OK | onClick + disabled state |
| Simpan Tanda Tangan Klien | OK | onClick + disabled state |
| Submit Final (terbitkan BAP/LHPP) | OK | disabled={submitting} |

### BapPage (`/app/bap`)
| Tombol | Status | Catatan |
|---|---|---|
| Simpan Perubahan Draf | OK | type="submit", disabled={submitting} |
| Finalisasi BAP | OK | onClick=handleFinalizeBap, disabled |

### LhppPage (`/app/lhpp`)
| Tombol | Status | Catatan |
|---|---|---|
| Upload Foto | OK | type="submit", disabled |
| Simpan Teknis | OK | Handler terhubung ke API |
| Download PDF | OK | onClick dengan fetch ke backend |

### UsersPage (`/app/users`)
| Tombol | Status | Catatan |
|---|---|---|
| Tambah Pengguna | OK | onClick membuka CreateUserModal |
| Edit Pengguna | OK | onClick dengan data pre-fill |
| Nonaktifkan/Aktifkan | OK | onClick + konfirmasi + loading state |

### SettingsPage (`/app/settings`)
| Tombol | Status | Catatan |
|---|---|---|
| Simpan Perubahan Profil | OK | type="submit" (ProfileTab) |
| Perbarui Kata Sandi | OK | type="submit" (SecurityTab) |
| Email | OK | disabled hardcoded — by design, email tidak boleh diubah |

### SuketPage, RemindersPage, HistoryPage, AuditLogPage, NotificationsPage, DistributionsPage
| Tombol | Status | Catatan |
|---|---|---|
| Semua tombol aksi | OK | Handler, loading state, dan error handling lengkap |
| Pagination | OK | StateViews.Pagination dengan disabled logis |
| Filter/Search | OK | Handler terhubung ke state dan refetch |

---

## Ringkasan

| Kategori | Jumlah |
|---|---|
| Tombol diperiksa | ~150+ |
| Tombol mati (dead) ditemukan | 0 |
| Diperbaiki (tambah type="submit") | 2 |
| Disabled hardcoded by design | 1 (email di Settings) |

Tidak ada tombol mati fungsional. Dua tombol di IssuesPage diperbaiki dengan menambahkan `type="submit"` eksplisit untuk konsistensi.
