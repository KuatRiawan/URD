import { useState } from 'react';
import { Alarm, FloppyDisk, Sparkle } from '@phosphor-icons/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card.jsx';
import { Button } from '../../../components/ui/Button.jsx';

export function ReminderTemplatesSection({
  reminderForm,
  setReminderForm,
  handleSaveReminderTemplates,
  savingKey
}) {
  const [activeStage, setActiveStage] = useState('h30');

  const previewMessage = () => {
    const raw = activeStage === 'h30'
      ? reminderForm.h30_message
      : activeStage === 'h14'
        ? reminderForm.h14_message
        : reminderForm.h7_message;

    if (!raw) return '-';

    return raw
      .replace(/{COMPANY_NAME}/g, 'PT Wijaya Sentosa Kencana')
      .replace(/{OBJECT_NAME}/g, 'Overhead Crane 15 Ton')
      .replace(/{SERIAL_NUMBER}/g, 'OC-2021-9988')
      .replace(/{VALID_UNTIL}/g, '15 Desember 2026');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Alarm size={20} className="text-[#C81E1E]" weight="bold" />
          <CardTitle>Template Naskah Notifikasi & Pengingat Masa Berlaku Suket</CardTitle>
        </div>
        <CardDescription>
          Kustomisasi naskah pesan pengingat berkala otomatis untuk tahapan H-30, H-14, dan H-7 sebelum masa berlaku Suket K3 unit alat berakhir.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 text-xs">
        {/* Token Cheat Sheet */}
        <div className="p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/50 space-y-2">
          <span className="font-bold text-[11px] uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
            Variabel Dinamis yang Tersedia:
          </span>
          <div className="flex flex-wrap gap-2 text-[11px]">
            <span className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono">
              <strong className="text-brand-600 dark:text-rose-400">{'{COMPANY_NAME}'}</strong> = Nama Perusahaan Klien
            </span>
            <span className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono">
              <strong className="text-brand-600 dark:text-rose-400">{'{OBJECT_NAME}'}</strong> = Nama Objek / Unit Alat K3
            </span>
            <span className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono">
              <strong className="text-brand-600 dark:text-rose-400">{'{SERIAL_NUMBER}'}</strong> = Nomor Seri Unit Alat
            </span>
            <span className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono">
              <strong className="text-brand-600 dark:text-rose-400">{'{VALID_UNTIL}'}</strong> = Tanggal Berakhir Suket K3
            </span>
          </div>
        </div>

        {/* Tab Pemilihan Tahapan Pengingat */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button
            type="button"
            onClick={() => setActiveStage('h30')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeStage === 'h30'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Tahap H-30 (Pemberitahuan Awal)
          </button>
          <button
            type="button"
            onClick={() => setActiveStage('h14')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeStage === 'h14'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Tahap H-14 (Peringatan Penting)
          </button>
          <button
            type="button"
            onClick={() => setActiveStage('h7')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeStage === 'h7'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Tahap H-7 (Peringatan Mendesak)
          </button>
        </div>

        <form onSubmit={handleSaveReminderTemplates} className="space-y-4">
          {activeStage === 'h30' && (
            <div className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Subjek Email Notifikasi (H-30) *
                </label>
                <input
                  type="text"
                  required
                  value={reminderForm.h30_subject || ''}
                  onChange={(e) => setReminderForm({ ...reminderForm, h30_subject: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-semibold focus:border-[#C81E1E] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Isi Pesan WhatsApp & Email (H-30) *
                </label>
                <textarea
                  rows={6}
                  required
                  value={reminderForm.h30_message || ''}
                  onChange={(e) => setReminderForm({ ...reminderForm, h30_message: e.target.value })}
                  className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono text-[11px] focus:border-[#C81E1E] focus:outline-none"
                />
              </div>
            </div>
          )}

          {activeStage === 'h14' && (
            <div className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Subjek Email Notifikasi (H-14) *
                </label>
                <input
                  type="text"
                  required
                  value={reminderForm.h14_subject || ''}
                  onChange={(e) => setReminderForm({ ...reminderForm, h14_subject: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-semibold focus:border-[#C81E1E] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Isi Pesan WhatsApp & Email (H-14) *
                </label>
                <textarea
                  rows={6}
                  required
                  value={reminderForm.h14_message || ''}
                  onChange={(e) => setReminderForm({ ...reminderForm, h14_message: e.target.value })}
                  className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono text-[11px] focus:border-[#C81E1E] focus:outline-none"
                />
              </div>
            </div>
          )}

          {activeStage === 'h7' && (
            <div className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Subjek Email Notifikasi (H-7) *
                </label>
                <input
                  type="text"
                  required
                  value={reminderForm.h7_subject || ''}
                  onChange={(e) => setReminderForm({ ...reminderForm, h7_subject: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-semibold focus:border-[#C81E1E] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Isi Pesan WhatsApp & Email (H-7) *
                </label>
                <textarea
                  rows={6}
                  required
                  value={reminderForm.h7_message || ''}
                  onChange={(e) => setReminderForm({ ...reminderForm, h7_message: e.target.value })}
                  className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono text-[11px] focus:border-[#C81E1E] focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Live Preview Box */}
          <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-2">
            <span className="font-bold text-[11px] uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkle size={14} className="text-amber-500" />
              <span>Pratinjau Teks Pesan Diterima Klien (Tahap {activeStage.toUpperCase()}):</span>
            </span>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 font-sans text-xs whitespace-pre-wrap leading-relaxed">
              {previewMessage()}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
            <Button
              type="submit"
              size="md"
              loading={savingKey === 'reminders'}
              icon={FloppyDisk}
            >
              Simpan Template Naskah Pengingat
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

