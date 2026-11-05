import { FloppyDisk, Buildings, SealCheck } from '@phosphor-icons/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card.jsx';
import { Button } from '../../../components/ui/Button.jsx';

export function CompanyProfileSection({
  companyForm,
  setCompanyForm,
  handleSaveCompanyProfile,
  savingKey
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Buildings size={20} className="text-[#C81E1E]" weight="bold" />
          <CardTitle>Profil Resmi & Identitas Lembaga PJK3</CardTitle>
        </div>
        <CardDescription>
          Data ini digunakan secara dinamis pada kop surat resmi, footer laporan teknis, dan lembar pengesahan seluruh dokumen resmi (Surat Tugas, BAP, LHPP, Lembar Temuan, dan BAST).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSaveCompanyProfile} className="space-y-6 text-xs">
          {/* Kelompok 1: Legalitas & Lisensi Kemnaker */}
          <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/40 space-y-3">
            <h4 className="font-bold text-[11px] uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <SealCheck size={16} className="text-emerald-600 dark:text-emerald-400" weight="bold" />
              <span>Legalitas Badan Usaha & SKP PJK3 Kemnaker RI</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Badan Hukum Resmi (Kop Dokumen) *
                </label>
                <input
                  type="text"
                  required
                  value={companyForm.company_name}
                  onChange={(e) => setCompanyForm({ ...companyForm, company_name: e.target.value })}
                  placeholder="PT UPAYA RIKSA DAYA"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-bold focus:border-[#C81E1E] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nomor SKP PJK3 Kemnaker RI *
                </label>
                <input
                  type="text"
                  required
                  value={companyForm.pjk3_license_no}
                  onChange={(e) => setCompanyForm({ ...companyForm, pjk3_license_no: e.target.value })}
                  placeholder="Contoh: KEP.5/123/AS.01.03/I/2024"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono focus:border-[#C81E1E] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Klasifikasi Layanan PJK3
                </label>
                <input
                  type="text"
                  value={companyForm.tagline || 'Perusahaan Jasa Keselamatan dan Kesehatan Kerja (PJK3)'}
                  onChange={(e) => setCompanyForm({ ...companyForm, tagline: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:border-[#C81E1E] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Direktur / Penanggung Jawab PJK3 *
                </label>
                <input
                  type="text"
                  required
                  value={companyForm.director_name}
                  onChange={(e) => setCompanyForm({ ...companyForm, director_name: e.target.value })}
                  placeholder="Ir. Direktur URD, M.T."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-medium focus:border-[#C81E1E] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Kelompok 2: Kontak Kantor Operasional & Surat-Menyurat */}
          <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/40 space-y-3">
            <h4 className="font-bold text-[11px] uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Alamat Kantor & Kontak Resmi
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Alamat Lengkap Kantor Pusat / Operasional *
                </label>
                <input
                  type="text"
                  required
                  value={companyForm.address}
                  onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                  placeholder="Jl. Pondasi No. 50B RT. 003 RW. 002, Kel. Kayu Putih, Kec. Pulo Gadung, Jakarta Timur 13210"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:border-[#C81E1E] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nomor Telepon Kantor *
                </label>
                <input
                  type="text"
                  required
                  value={companyForm.phone}
                  onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                  placeholder="(021) 489 1409"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono focus:border-[#C81E1E] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Alamat Email Resmi Perusahaan *
                </label>
                <input
                  type="email"
                  required
                  value={companyForm.email}
                  onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                  placeholder="urd@upayariksadaya.com"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:border-[#C81E1E] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Website Resmi Lembaga
                </label>
                <input
                  type="text"
                  value={companyForm.website}
                  onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
                  placeholder="https://upayariksadaya.com"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:border-[#C81E1E] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Pratinjau Kop Surat Resmi */}
          <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-center space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Pratinjau Kop Surat Dokumen (Header Preview)
            </span>
            <h5 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 tracking-wide">
              {companyForm.company_name || 'PT UPAYA RIKSA DAYA'}
            </h5>
            <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              {companyForm.tagline || 'Perusahaan Jasa Keselamatan dan Kesehatan Kerja (PJK3)'}
            </p>
            <p className="text-[10px] text-slate-500 font-mono">
              SKP Kemnaker RI No: {companyForm.pjk3_license_no || '-'}
            </p>
            <p className="text-[10px] text-slate-500">
              {companyForm.address} | Telp: {companyForm.phone} | Email: {companyForm.email}
            </p>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
            <Button
              type="submit"
              size="md"
              loading={savingKey === 'company'}
              icon={FloppyDisk}
            >
              Simpan Profil Perusahaan
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

