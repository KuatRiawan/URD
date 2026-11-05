import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Certificate,
  CheckCircle,
  Clock,
  IdentificationBadge,
  PencilSimple,
  Plus,
  ShieldCheck,
  Trash,
  WarningCircle
} from '@phosphor-icons/react';
import { api } from '../../../lib/api/axios.js';
import { Card, CardContent, CardHeader } from '../../../components/ui/Card.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Badge } from '../../../components/ui/Badge.jsx';
import { Modal } from '../../../components/ui/Modal.jsx';
import { Notice } from '../../../components/ui/Notice.jsx';
import { useConfirm } from '../../../components/ui/FeedbackProvider.jsx';
import { formatDate } from '../../../lib/utils/format.js';

export function InspectorCompetencyTab() {
  const confirm = useConfirm();
  const [inspectors, setInspectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [validityFilter, setValidityFilter] = useState('ALL'); // ALL | AKTIF | AKAN_HABIS | KEDALUWARSA

  // Modal Tambah / Edit Kompetensi SKP
  const [competencyModal, setCompetencyModal] = useState(null); // { mode: 'ADD' | 'EDIT', inspectorId, inspectorName, compId? }
  const [compForm, setCompForm] = useState({
    categoryId: 1,
    certificateNo: '',
    validFrom: '',
    validUntil: ''
  });
  const [savingComp, setSavingComp] = useState(false);

  // Modal Edit Profil NIP / KTA Ahli K3
  const [profileModal, setProfileModal] = useState(null); // { inspectorId, inspectorName, employeeNo, notes }
  const [savingProfile, setSavingProfile] = useState(false);

  const k3Categories = [
    { id: 1, code: 'PAA', name: 'Pesawat Angkat & Angkut' },
    { id: 2, code: 'PTP', name: 'Pesawat Tenaga & Produksi' },
    { id: 3, code: 'PUBT', name: 'Pesawat Uap, Bejana Tekan & Tangki Timbun' },
    { id: 4, code: 'EES', name: 'Elevator & Eskalator' },
    { id: 5, code: 'IPK', name: 'Instalasi Proteksi Kebakaran' },
    { id: 6, code: 'ILP', name: 'Instalasi Listrik & Penyalur Petir' },
    { id: 7, code: 'LTK', name: 'Lingkungan Kerja & Bahan Berbahaya' }
  ];

  const loadInspectors = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/inspectors');
      setInspectors(res.data?.items || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat rekam kompetensi Ahli K3.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInspectors();
  }, [loadInspectors]);

  const stats = useMemo(() => {
    let totalSkp = 0;
    let activeSkp = 0;
    let expiringSkp = 0;
    let expiredSkp = 0;

    inspectors.forEach((ins) => {
      (ins.competencies || []).forEach((c) => {
        totalSkp += 1;
        const status = c.validityStatus || (c.isValid === false ? 'KEDALUWARSA' : 'AKTIF');
        if (status === 'KEDALUWARSA') {
          expiredSkp += 1;
        } else if (status === 'AKAN_HABIS') {
          expiringSkp += 1;
        } else {
          activeSkp += 1;
        }
      });
    });

    return {
      totalInspectors: inspectors.length,
      totalSkp,
      activeSkp,
      expiringSkp,
      expiredSkp
    };
  }, [inspectors]);

  const openAddCompetency = (ins) => {
    setCompetencyModal({
      mode: 'ADD',
      inspectorId: ins.id,
      inspectorName: ins.fullName
    });
    setCompForm({
      categoryId: 1,
      certificateNo: '',
      validFrom: '',
      validUntil: ''
    });
  };

  const openEditCompetency = (ins, comp) => {
    setCompetencyModal({
      mode: 'EDIT',
      inspectorId: ins.id,
      inspectorName: ins.fullName,
      compId: comp.id
    });
    setCompForm({
      categoryId: comp.categoryId || 1,
      certificateNo: comp.certificateNo || '',
      validFrom: comp.validFrom ? String(comp.validFrom).slice(0, 10) : '',
      validUntil: comp.validUntil ? String(comp.validUntil).slice(0, 10) : ''
    });
  };

  const handleSaveCompetency = async (e) => {
    e.preventDefault();
    if (!competencyModal?.inspectorId) return;
    setSavingComp(true);
    setError('');
    try {
      const payload = {
        categoryId: Number(compForm.categoryId),
        certificateNo: compForm.certificateNo.trim(),
        validFrom: compForm.validFrom || null,
        validUntil: compForm.validUntil
      };

      if (competencyModal.mode === 'EDIT' && competencyModal.compId) {
        await api.patch(`/inspectors/${competencyModal.inspectorId}/competencies/${competencyModal.compId}`, payload);
        setFeedback(`Lisensi SKP ${payload.certificateNo} berhasil diperbarui untuk ${competencyModal.inspectorName}.`);
      } else {
        await api.post(`/inspectors/${competencyModal.inspectorId}/competencies`, payload);
        setFeedback(`Lisensi SKP baru berhasil ditambahkan untuk ${competencyModal.inspectorName}.`);
      }

      setCompetencyModal(null);
      await loadInspectors();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan kompetensi Ahli K3.');
    } finally {
      setSavingComp(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileModal?.inspectorId) return;
    setSavingProfile(true);
    setError('');
    try {
      await api.patch(`/inspectors/${profileModal.inspectorId}`, {
        employeeNo: profileModal.employeeNo,
        notes: profileModal.notes
      });
      setFeedback(`Data kepegawaian Ahli K3 ${profileModal.inspectorName} berhasil diperbarui.`);
      setProfileModal(null);
      await loadInspectors();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memperbarui data kepegawaian Ahli K3.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleDeleteCompetency = async (inspectorId, compId, certNo) => {
    const ok = await confirm({
      title: 'Hapus Sertifikat Kompetensi SKP',
      message: `Hapus sertifikat kompetensi SKP No. ${certNo}? Tindakan ini akan membatalkan otorisasi penugasan inspektur untuk bidang K3 terkait.`,
      confirmLabel: 'Ya, Hapus Lisensi SKP',
      tone: 'danger'
    });
    if (!ok) return;
    setError('');
    try {
      await api.delete(`/inspectors/${inspectorId}/competencies/${compId}`);
      setFeedback(`Kompetensi SKP No. ${certNo} berhasil dihapus.`);
      await loadInspectors();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menghapus kompetensi.');
    }
  };

  return (
    <div className="space-y-5">
      {feedback && (
        <Notice tone="success" onClose={() => setFeedback('')}>
          {feedback}
        </Notice>
      )}

      {error && (
        <Notice tone="error" onClose={() => setError('')}>
          {error}
        </Notice>
      )}

      {/* Info Card Regulasi & Ringkasan Validitas SKP */}
      <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Certificate size={16} className="text-[#C81E1E]" weight="bold" />
              <span>Otorisasi Penugasan Berdasarkan SKP Kemnaker RI</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
              Hanya Ahli K3 dengan Surat Keputusan Penunjukan (SKP) yang sah dan masa berlaku aktif yang dapat ditugaskan pada order pengujian lapangan sesuai kategori objek uji.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <Badge tone="success">7 Bidang K3 Didukung</Badge>
          </div>
        </div>

        {/* Metrik & Filter Status Validitas SKP */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setValidityFilter('ALL')}
            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
              validityFilter === 'ALL'
                ? 'border-slate-900 dark:border-slate-300 bg-slate-900 text-white dark:bg-slate-800'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/40 text-slate-700 dark:text-slate-300'
            }`}
          >
            <span className="text-[10px] font-bold uppercase opacity-75 block">Total Lisensi SKP</span>
            <span className="text-base font-extrabold tabular-nums">{stats.totalSkp} Sertifikat</span>
          </button>

          <button
            type="button"
            onClick={() => setValidityFilter('AKTIF')}
            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
              validityFilter === 'AKTIF'
                ? 'border-emerald-600 bg-emerald-600 text-white'
                : 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300'
            }`}
          >
            <span className="text-[10px] font-bold uppercase opacity-80 block">SKP Berlaku Aktif</span>
            <span className="text-base font-extrabold tabular-nums">{stats.activeSkp} Bidang</span>
          </button>

          <button
            type="button"
            onClick={() => setValidityFilter('AKAN_HABIS')}
            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
              validityFilter === 'AKAN_HABIS'
                ? 'border-amber-600 bg-amber-600 text-white'
                : 'border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300'
            }`}
          >
            <span className="text-[10px] font-bold uppercase opacity-80 block">Akan Habis (≤30 Hari)</span>
            <span className="text-base font-extrabold tabular-nums">{stats.expiringSkp} Bidang</span>
          </button>

          <button
            type="button"
            onClick={() => setValidityFilter('KEDALUWARSA')}
            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
              validityFilter === 'KEDALUWARSA'
                ? 'border-rose-600 bg-rose-600 text-white'
                : 'border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300'
            }`}
          >
            <span className="text-[10px] font-bold uppercase opacity-80 block">SKP Kedaluwarsa</span>
            <span className="text-base font-extrabold tabular-nums">{stats.expiredSkp} Bidang</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400">
          Memuat rekam kredensial Ahli K3...
        </div>
      ) : inspectors.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
          Belum ada akun dengan peran Ahli K3 / Inspector terdaftar. Silakan buat akun Ahli K3 terlebih dahulu di tab "Daftar Akun Pengguna".
        </div>
      ) : (
        <div className="space-y-4">
          {inspectors.map((ins) => {
            const visibleCompetencies = (ins.competencies || []).filter((c) => {
              if (validityFilter === 'ALL') return true;
              const st = c.validityStatus || (c.isValid === false ? 'KEDALUWARSA' : 'AKTIF');
              return st === validityFilter;
            });

            if (validityFilter !== 'ALL' && visibleCompetencies.length === 0) {
              return null;
            }

            return (
              <Card key={ins.id} className="overflow-hidden">
                <CardHeader className="bg-slate-50/70 dark:bg-slate-850/50 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="h-10 w-10 rounded-full bg-[#C81E1E] text-white flex items-center justify-center font-bold text-sm shrink-0">
                        {ins.fullName?.slice(0, 2).toUpperCase() || 'AK'}
                      </span>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          <span>{ins.fullName}</span>
                          {ins.isActive ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle size={12} weight="fill" />
                              Aktif
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
                              Nonaktif
                            </span>
                          )}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                          NIP / KTA: <strong className="text-slate-700 dark:text-slate-300">{ins.employeeNo || '-'}</strong> · {ins.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        icon={IdentificationBadge}
                        onClick={() =>
                          setProfileModal({
                            inspectorId: ins.id,
                            inspectorName: ins.fullName,
                            employeeNo: ins.employeeNo || '',
                            notes: ins.notes || ''
                          })
                        }
                      >
                        Edit NIP/KTA
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        icon={Plus}
                        onClick={() => openAddCompetency(ins)}
                      >
                        Tambah Lisensi SKP
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-4">
                  <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                    Bidang Kompetensi Riksa Uji Terdaftar ({visibleCompetencies.length} Bidang)
                  </h5>

                  {visibleCompetencies.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-3 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                      Belum ada lisensi SKP tercatat untuk personel ini. Klik "Tambah Lisensi SKP" untuk mengotorisasi bidang riksa uji.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {visibleCompetencies.map((c) => {
                        const status = c.validityStatus || (c.isValid === false ? 'KEDALUWARSA' : 'AKTIF');
                        const isExpired = status === 'KEDALUWARSA';
                        const isExpiring = status === 'AKAN_HABIS';

                        return (
                          <div
                            key={c.id}
                            className={`p-3 rounded-xl border transition-all text-xs flex flex-col justify-between gap-2 ${
                              isExpired
                                ? 'border-rose-300 dark:border-rose-900 bg-rose-50/40 dark:bg-rose-950/20'
                                : isExpiring
                                  ? 'border-amber-300 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/20'
                                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className="font-mono font-bold text-[11px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                                  {c.categoryCode}
                                </span>
                                {isExpired ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                                    <WarningCircle size={13} weight="fill" />
                                    Kedaluwarsa (Diblokir)
                                  </span>
                                ) : isExpiring ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                    <Clock size={13} weight="fill" />
                                    Akan Habis ({c.daysRemaining} hr)
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                                    <ShieldCheck size={13} weight="fill" />
                                    SKP Berlaku
                                  </span>
                                )}
                              </div>
                              <h6 className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                                {c.categoryName}
                              </h6>
                              <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1">
                                No: {c.certificateNo}
                              </p>
                            </div>

                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                              <span>
                                Berlaku s/d:{' '}
                                <strong
                                  className={
                                    isExpired
                                      ? 'text-rose-600'
                                      : isExpiring
                                        ? 'text-amber-600'
                                        : 'text-slate-700 dark:text-slate-300'
                                  }
                                >
                                  {formatDate(c.validUntil)}
                                </strong>
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => openEditCompetency(ins, c)}
                                  className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                                  title="Edit / Perpanjang Lisensi SKP"
                                  aria-label={`Edit SKP ${c.certificateNo}`}
                                >
                                  <PencilSimple size={14} weight="bold" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCompetency(ins.id, c.id, c.certificateNo)}
                                  className="text-rose-600 hover:text-rose-800 p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition-colors"
                                  title="Hapus Kompetensi"
                                  aria-label={`Hapus SKP ${c.certificateNo}`}
                                >
                                  <Trash size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal Tambah / Edit Lisensi SKP */}
      {competencyModal && (
        <Modal
          open={Boolean(competencyModal)}
          onClose={() => setCompetencyModal(null)}
          title={
            competencyModal.mode === 'EDIT'
              ? `Perbarui / Perpanjang SKP: ${competencyModal.inspectorName}`
              : `Tambah Lisensi SKP: ${competencyModal.inspectorName}`
          }
        >
          <form onSubmit={handleSaveCompetency} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Bidang Riksa Uji K3 *
              </label>
              <select
                value={compForm.categoryId}
                onChange={(e) => setCompForm({ ...compForm, categoryId: e.target.value })}
                className="w-full min-h-11 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-semibold"
              >
                {k3Categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    [{c.code}] {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nomor Surat Keputusan Penunjukan (SKP) / Sertifikat *
              </label>
              <input
                type="text"
                required
                value={compForm.certificateNo}
                onChange={(e) => setCompForm({ ...compForm, certificateNo: e.target.value })}
                placeholder="Contoh: KEP.P.5/345/AS.02.01/III/2024"
                className="w-full min-h-11 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tanggal Mulai Berlaku
                </label>
                <input
                  type="date"
                  value={compForm.validFrom}
                  onChange={(e) => setCompForm({ ...compForm, validFrom: e.target.value })}
                  className="w-full min-h-11 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tanggal Berakhir Berlaku *
                </label>
                <input
                  type="date"
                  required
                  value={compForm.validUntil}
                  onChange={(e) => setCompForm({ ...compForm, validUntil: e.target.value })}
                  className="w-full min-h-11 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => setCompetencyModal(null)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="md"
                variant="primary"
                loading={savingComp}
              >
                {competencyModal.mode === 'EDIT' ? 'Simpan Perubahan SKP' : 'Simpan Lisensi SKP'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Edit NIP / KTA Ahli K3 */}
      {profileModal && (
        <Modal
          open={Boolean(profileModal)}
          onClose={() => setProfileModal(null)}
          title={`Identitas Kepegawaian Ahli K3: ${profileModal.inspectorName}`}
        >
          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nomor Induk Pegawai (NIP) / Nomor KTA Ahli K3 *
              </label>
              <input
                type="text"
                required
                value={profileModal.employeeNo}
                onChange={(e) => setProfileModal({ ...profileModal, employeeNo: e.target.value })}
                placeholder="Contoh: URD-AK3-001"
                className="w-full min-h-11 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Catatan Penugasan / Spesialisasi Lapangan
              </label>
              <textarea
                rows={3}
                value={profileModal.notes}
                onChange={(e) => setProfileModal({ ...profileModal, notes: e.target.value })}
                placeholder="Catatan kualifikasi tambahan atau spesialisasi alat..."
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => setProfileModal(null)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="md"
                variant="primary"
                loading={savingProfile}
              >
                Simpan NIP / KTA
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

