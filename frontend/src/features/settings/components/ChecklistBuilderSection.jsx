import { useState } from 'react';
import {
  CheckCircle,
  ClockCounterClockwise,
  GitBranch,
  ListChecks,
  PencilSimple,
  Plus,
  ShieldCheck,
  Trash
} from '@phosphor-icons/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Badge } from '../../../components/ui/Badge.jsx';

export function ChecklistBuilderSection({
  checklistsData,
  selectedCategory,
  setSelectedCategory,
  filteredItems,
  onOpenCreateItem,
  onOpenEditItem,
  onDeleteItem,
  onPublishNewVersion,
  publishingVersion
}) {
  const [activeSectionFilter, setActiveSectionFilter] = useState('ALL');
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  // Ambil daftar unique sections pada kategori terpilih
  const sections = Array.from(new Set(filteredItems.map((i) => i.section).filter(Boolean)));

  const displayedItems = activeSectionFilter === 'ALL'
    ? filteredItems
    : filteredItems.filter((i) => i.section === activeSectionFilter);

  const categoryVersions = (checklistsData?.versions || []).filter(
    (v) => v.category_id === selectedCategory?.id
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ListChecks size={20} className="text-[#C81E1E]" weight="bold" />
              <CardTitle>Master 7 Bidang K3 & Dynamic Checklist Builder</CardTitle>
            </div>
            <CardDescription>
              Kelola struktur pertanyaan pemeriksaan teknis lapangan yang wajib diisi dan dibuktikan oleh Ahli K3 saat riksa uji.
            </CardDescription>
          </div>
          {selectedCategory?.active_version_id && (
            <div className="flex flex-wrap items-center gap-2">
              {onPublishNewVersion && (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  icon={GitBranch}
                  loading={publishingVersion}
                  onClick={() => onPublishNewVersion(selectedCategory)}
                >
                  Terbitkan Versi Baru
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                icon={Plus}
                onClick={onOpenCreateItem}
              >
                Tambah Butir Ceklis
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Pemilihan 7 Bidang K3 */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Pilih Bidang Pengawasan K3:
          </label>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800 scrollbar-none">
            {(checklistsData?.categories || []).map((cat) => {
              const isSelected = selectedCategory?.id === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat);
                    setActiveSectionFilter('ALL');
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-slate-900 text-white dark:bg-rose-600 shadow-xs ring-1 ring-slate-900 dark:ring-rose-500'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className="font-mono">{cat.code}</span>
                  <span>- {cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Info Banner Bidang Terpilih & Proteksi Versi Historis */}
        {selectedCategory && (
          <div className="space-y-2.5">
            <div className="p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {selectedCategory.name} ({selectedCategory.code})
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-mono">
                    Versi Aktif: v{selectedCategory.active_version_no || 1}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    {selectedCategory.object_count || 0} Unit Alat Terdaftar
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-1.5">
                  <span>
                    ID Versi: <code className="font-mono text-[10px]">{selectedCategory.active_version_id?.slice(0, 8)}...</code> · Total: <strong>{filteredItems.length} butir pertanyaan</strong>
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">·</span>
                  <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                    <ShieldCheck size={13} weight="fill" />
                    Proteksi Historis Aktif (Inspeksi selesai tetap memakai snapshot versi saat diuji)
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                {categoryVersions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowVersionHistory(!showVersionHistory)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
                  >
                    <ClockCounterClockwise size={14} weight="bold" />
                    <span>Riwayat Versi ({categoryVersions.length})</span>
                  </button>
                )}
              </div>
            </div>

            {showVersionHistory && categoryVersions.length > 0 && (
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px] uppercase tracking-wider text-slate-500">
                    Riwayat Versi Template Bidang {selectedCategory.code}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Versi berstatus ARSIP tetap dikunci untuk rekaman riksa uji historis
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {categoryVersions.map((ver) => (
                    <div
                      key={ver.id}
                      className={`p-2.5 rounded-lg border flex items-center justify-between ${
                        ver.status === 'AKTIF'
                          ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                            Versi v{ver.version_no}
                          </span>
                          <Badge tone={ver.status === 'AKTIF' ? 'success' : 'neutral'}>
                            {ver.status}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {ver.item_count || 0} butir · Dipakai {ver.inspection_count || 0} inspeksi
                        </p>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400">
                        {ver.id.slice(0, 6)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Filter Section / Kelompok */}
            {sections.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pt-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase shrink-0">Bagian:</span>
                <button
                  type="button"
                  onClick={() => setActiveSectionFilter('ALL')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-colors ${
                    activeSectionFilter === 'ALL'
                      ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  Semua ({filteredItems.length})
                </button>
                {sections.map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setActiveSectionFilter(sec)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer whitespace-nowrap transition-colors ${
                      activeSectionFilter === sec
                        ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {sec}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Daftar Pertanyaan Checklist */}
        <div className="space-y-3">
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 text-xs shadow-2xs">
            {displayedItems.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                Belum ada butir pertanyaan pada kelompok ini. Klik "Tambah Butir Ceklis" untuk menambahkan butir pemeriksaan baru.
              </div>
            ) : (
              displayedItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-3.5 flex items-start sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-400 text-[11px] shrink-0">
                        #{idx + 1}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {item.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200/60 dark:border-slate-700">
                        Bagian: {item.section}
                      </span>

                      <span className="px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-mono text-[10px] font-bold border border-purple-200 dark:border-purple-800">
                        {item.input_type === 'CHOICE' && 'PILIHAN (Baik / Buruk)'}
                        {item.input_type === 'NUMBER' && 'NILAI ANGKA'}
                        {item.input_type === 'TEXT' && 'TEKS BEBAS'}
                        {item.input_type === 'DATE' && 'TANGGAL'}
                      </span>

                      {item.unit && (
                        <span className="font-mono text-slate-600 dark:text-slate-400">
                          Satuan: <strong>{item.unit}</strong>
                        </span>
                      )}

                      {item.min_value !== null && item.max_value !== null && (
                        <span className="font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                          Standar: {item.min_value} ~ {item.max_value} {item.unit}
                        </span>
                      )}

                      {item.is_required && (
                        <span className="font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-1.5 py-0.5 rounded border border-rose-200/80 dark:border-rose-900/60 text-[10px]">
                          Wajib Diisi
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onOpenEditItem(item)}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Edit Pertanyaan"
                    >
                      <PencilSimple size={15} weight="bold" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteItem(item.id)}
                      className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 dark:text-rose-400 dark:hover:text-rose-300 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Hapus Pertanyaan"
                    >
                      <Trash size={15} weight="bold" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

