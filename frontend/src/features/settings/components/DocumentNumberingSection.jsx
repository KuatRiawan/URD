import { useCallback, useMemo } from 'react';
import { CheckCircle, FileText, FloppyDisk, SealCheck, Sparkle, WarningCircle } from '@phosphor-icons/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Badge } from '../../../components/ui/Badge.jsx';

export function DocumentNumberingSection({
  numberingForm,
  setNumberingForm,
  handleSaveNumbering,
  docTemplatesForm,
  setDocTemplatesForm,
  handleSaveDocTemplates,
  savingKey
}) {
  const now = new Date();
  const currentYear = String(now.getFullYear());
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
  const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  const currentRomanMonth = romanMonths[now.getMonth()] || 'XI';

  const simulateNumber = useCallback(
    (pattern, bidang = 'PUBT', counter = '0001') => {
      if (!pattern) return '-';
      return pattern
        .replace(/{YEAR}/g, currentYear)
        .replace(/{MONTH}/g, currentMonth)
        .replace(/{ROMAN_MONTH}/g, currentRomanMonth)
        .replace(/{BIDANG_CODE}/g, bidang)
        .replace(/{COUNTER}/g, counter);
    },
    [currentYear, currentMonth, currentRomanMonth]
  );

  const isPatternValid = (pattern) => {
    const str = String(pattern || '').trim();
    return str.length >= 5 && (str.includes('{COUNTER}') || str.includes('{SEQ}'));
  };

  const simulatedPreviews = useMemo(() => {
    return {
      po: simulateNumber(numberingForm.order_prefix || 'PO-URD/{YEAR}/{MONTH}/{COUNTER}'),
      st: simulateNumber(numberingForm.assignment_prefix || 'ST-URD/{YEAR}/{ROMAN_MONTH}/{COUNTER}'),
      bap: simulateNumber(numberingForm.bap_prefix || 'BAP/URD/{ROMAN_MONTH}/{YEAR}/{COUNTER}'),
      lhpp: simulateNumber(numberingForm.lhpp_prefix || '{COUNTER}/INSP-{BIDANG_CODE}/PJK3-URD/{ROMAN_MONTH}/{YEAR}', 'PAA'),
      suket: simulateNumber(numberingForm.suket_prefix || '566/{COUNTER}/DTKT/{YEAR}'),
      bast: simulateNumber(numberingForm.bast_prefix || 'BAST-URD/{YEAR}/{MONTH}/{COUNTER}')
    };
  }, [numberingForm, simulateNumber]);

  const docTemplateKeys = [
    { key: 'surat_tugas', label: 'Surat Tugas Pemeriksaan (ST)' },
    { key: 'bap', label: 'Berita Acara Pemeriksaan & Pengujian (BAP)' },
    { key: 'lhpp', label: 'Laporan Hasil Pemeriksaan & Pengujian (LHPP)' },
    { key: 'suket', label: 'Pengantar & Registri Suket K3 Disnaker' },
    { key: 'bast', label: 'Berita Acara Serah Terima Dokumen (BAST)' }
  ];

  const updateDocTemplateField = (docKey, field, value) => {
    if (!setDocTemplatesForm) return;
    setDocTemplatesForm((prev) => ({
      ...prev,
      [docKey]: {
        ...(prev?.[docKey] || {}),
        [field]: value
      }
    }));
  };

  return (
    <div className="space-y-6">
      {/* 1. Standar Format Penomoran Dokumen Otomatis */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText size={20} className="text-[#C81E1E]" weight="bold" />
            <CardTitle>Standar Format Penomoran Dokumen Otomatis</CardTitle>
          </div>
          <CardDescription>
            Konfigurasi pola penomoran dokumen resmi perusahaan. Setiap pola wajib menyertakan tag {'{COUNTER}'} agar nomor urut tetap unik. Dokumen yang telah terbit tidak akan berubah.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-xs">
          {/* Token Cheat-Sheet */}
          <div className="p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/50 space-y-2">
            <span className="font-bold text-[11px] uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
              Daftar Tag Token Dinamis yang Didukung:
            </span>
            <div className="flex flex-wrap gap-2 text-[11px]">
              <span className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono">
                <strong className="text-brand-600 dark:text-rose-400">{'{COUNTER}'}</strong> = Nomor Urut Dokumen (Wajib, 0001, 0002...)
              </span>
              <span className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono">
                <strong className="text-brand-600 dark:text-rose-400">{'{YEAR}'}</strong> = Tahun Empat Digit ({currentYear})
              </span>
              <span className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono">
                <strong className="text-brand-600 dark:text-rose-400">{'{MONTH}'}</strong> = Bulan Dua Digit ({currentMonth})
              </span>
              <span className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono">
                <strong className="text-brand-600 dark:text-rose-400">{'{ROMAN_MONTH}'}</strong> = Bulan Romawi ({currentRomanMonth})
              </span>
              <span className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono">
                <strong className="text-brand-600 dark:text-rose-400">{'{BIDANG_CODE}'}</strong> = Kode Bidang K3 (PAA, PUBT, dll)
              </span>
            </div>
          </div>

          <form onSubmit={handleSaveNumbering} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { field: 'order_prefix', label: 'Pola Nomor Purchase Order (PO) *', preview: simulatedPreviews.po },
                { field: 'assignment_prefix', label: 'Pola Nomor Surat Tugas Ahli K3 (ST) *', preview: simulatedPreviews.st },
                { field: 'bap_prefix', label: 'Pola Nomor Berita Acara (BAP) *', preview: simulatedPreviews.bap },
                { field: 'lhpp_prefix', label: 'Pola Nomor Laporan LHPP Resmi *', preview: simulatedPreviews.lhpp },
                { field: 'suket_prefix', label: 'Pola Nomor Registri Suket K3 Disnaker *', preview: simulatedPreviews.suket },
                { field: 'bast_prefix', label: 'Pola Nomor Berita Acara Serah Terima (BAST) *', preview: simulatedPreviews.bast }
              ].map((item) => {
                const valid = isPatternValid(numberingForm[item.field]);
                return (
                  <div
                    key={item.field}
                    className={`p-3.5 rounded-xl border bg-white dark:bg-slate-900 space-y-1.5 ${
                      valid
                        ? 'border-slate-200 dark:border-slate-800'
                        : 'border-rose-300 dark:border-rose-800 bg-rose-50/20'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <label className="block font-bold text-slate-800 dark:text-slate-200">
                        {item.label}
                      </label>
                      {valid ? (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                          <CheckCircle size={12} weight="fill" />
                          Pola Valid
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 inline-flex items-center gap-1">
                          <WarningCircle size={12} weight="fill" />
                          Wajib ada {'{COUNTER}'}
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      required
                      value={numberingForm[item.field] || ''}
                      onChange={(e) => setNumberingForm({ ...numberingForm, [item.field]: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono focus:border-[#C81E1E] focus:outline-none"
                    />
                    <div className="pt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                      <Sparkle size={13} className="text-amber-500 shrink-0" />
                      <span>
                        Simulasi Hasil: <strong className="font-mono text-slate-900 dark:text-slate-100">{item.preview}</strong>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <Button
                type="submit"
                size="md"
                loading={savingKey === 'numbering'}
                icon={FloppyDisk}
              >
                Simpan Format Nomor Dokumen
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 2. Standar Metadata & Klausul Template Dokumen Resmi PJK3 */}
      {docTemplatesForm && handleSaveDocTemplates && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <SealCheck size={20} className="text-[#C81E1E]" weight="bold" />
                  <CardTitle>Standar Template & Klausul Dokumen Resmi PJK3</CardTitle>
                </div>
                <CardDescription>
                  Konfigurasi dasar hukum regulasi Kemnaker RI, jabatan penandatangan, dan catatan kaki pada 5 dokumen resmi yang diterbitkan aplikasi.
                </CardDescription>
              </div>
              <Badge tone="success">5 Dokumen Resmi Aktif</Badge>
            </div>
          </CardHeader>
          <CardContent className="text-xs">
            <form onSubmit={handleSaveDocTemplates} className="space-y-4">
              <div className="grid grid-cols-1 gap-3.5">
                {docTemplateKeys.map(({ key, label }) => {
                  const item = docTemplatesForm[key] || {};
                  return (
                    <div
                      key={key}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/40 space-y-3"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-slate-900 text-white dark:bg-rose-600">
                            {item.code || key.toUpperCase()}
                          </span>
                          <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                            {label}
                          </h4>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                          Layout PDF/DOCX Tervalidasi
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Dasar Hukum / Acuan Regulasi K3 *
                          </label>
                          <input
                            type="text"
                            required
                            value={item.legal_basis || ''}
                            onChange={(e) => updateDocTemplateField(key, 'legal_basis', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Jabatan Otorisasi / Penandatangan *
                          </label>
                          <input
                            type="text"
                            required
                            value={item.signatory_title || ''}
                            onChange={(e) => updateDocTemplateField(key, 'signatory_title', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Catatan Kaki / Klausul Keabsahan Dokumen
                          </label>
                          <input
                            type="text"
                            value={item.footer_note || ''}
                            onChange={(e) => updateDocTemplateField(key, 'footer_note', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                <Button
                  type="submit"
                  size="md"
                  loading={savingKey === 'doc_templates'}
                  icon={FloppyDisk}
                >
                  Simpan Standar Template Dokumen
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

