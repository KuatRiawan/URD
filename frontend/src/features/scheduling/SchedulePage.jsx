import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../app/providers/AuthProvider.jsx';
import { ErrorBanner, LoadingState } from '../../components/feedback/StateViews.jsx';
import { Notice } from '../../components/ui/Notice.jsx';
import { useConfirm } from '../../components/ui/FeedbackProvider.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { api } from '../../lib/api/axios.js';
import { ScheduleAgendaSection } from './components/ScheduleAgendaSection.jsx';
import { InspectorCompetencySection } from './components/InspectorCompetencySection.jsx';
import { AddCompetencyModal } from './components/AddCompetencyModal.jsx';

export function SchedulePage() {
  const confirm = useConfirm();
  const { user } = useAuth();
  const canManage = ['ADMIN_SISTEM', 'ADMIN_KANTOR'].includes(user?.role);

  const [schedules, setSchedules] = useState([]);
  const [inspectors, setInspectors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  const [compModalOpen, setCompModalOpen] = useState(false);
  const [selectedInspector, setSelectedInspector] = useState(null);
  const [compForm, setCompForm] = useState({
    categoryId: '',
    certificateNo: '',
    validFrom: new Date().toISOString().slice(0, 10),
    validUntil: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10)
  });
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [schedRes, inspRes, catRes] = await Promise.all([
        api.get('/schedules'),
        api.get('/inspectors'),
        api.get('/objects/categories').catch(() => ({ data: { categories: [] } }))
      ]);
      setSchedules(schedRes.data?.items || []);
      setInspectors(inspRes.data?.items || []);
      setCategories(catRes.data?.categories || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat jadwal dan matriks Ahli K3.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openAddCompetency = (inspector) => {
    setSelectedInspector(inspector);
    setCompForm({
      categoryId: categories[0]?.id ? String(categories[0].id) : '',
      certificateNo: '',
      validFrom: new Date().toISOString().slice(0, 10),
      validUntil: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10)
    });
    setCompModalOpen(true);
  };

  const handleAddCompetency = async (e) => {
    e.preventDefault();
    if (!selectedInspector) return;
    setSubmitting(true);
    setError('');
    try {
      await api.post(`/inspectors/${selectedInspector.id}/competencies`, {
        categoryId: Number(compForm.categoryId),
        certificateNo: compForm.certificateNo,
        validFrom: compForm.validFrom || null,
        validUntil: compForm.validUntil
      });
      setCompModalOpen(false);
      setFeedback(`Kompetensi SKP untuk ${selectedInspector.fullName} berhasil disimpan.`);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan kompetensi Ahli K3.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCompetency = async (inspectorId, compId) => {
    const ok = await confirm({
      title: 'Hapus Kompetensi SKP',
      message: 'Data kompetensi ini akan dihapus dan Ahli K3 tidak dapat ditugaskan pada bidang tersebut.',
      confirmLabel: 'Ya, Hapus',
      tone: 'danger'
    });
    if (!ok) return;
    setError('');
    try {
      await api.delete(`/inspectors/${inspectorId}/competencies/${compId}`);
      setFeedback('Data kompetensi SKP telah dihapus.');
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menghapus kompetensi Ahli K3.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Jadwal Pemeriksaan & Matriks Kompetensi Ahli K3"
        subtitle="Pantau agenda inspeksi lapangan beserta masa berlaku SKP penunjukan Ahli K3 di setiap bidang riksa uji."
      />

      {feedback && (
        <Notice tone="success" onClose={() => setFeedback('')}>
          {feedback}
        </Notice>
      )}

      {error && <ErrorBanner message={error} onRetry={loadData} />}

      {loading ? (
        <LoadingState label="Memuat kalender jadwal dan matriks kompetensi..." />
      ) : (
        <div className="space-y-6">
          <ScheduleAgendaSection schedules={schedules} />

          <InspectorCompetencySection
            inspectors={inspectors}
            canManage={canManage}
            onOpenAddCompetency={openAddCompetency}
            onDeleteCompetency={handleDeleteCompetency}
          />
        </div>
      )}

      <AddCompetencyModal
        open={compModalOpen}
        onClose={() => setCompModalOpen(false)}
        selectedInspector={selectedInspector}
        compForm={compForm}
        setCompForm={setCompForm}
        categories={categories}
        submitting={submitting}
        onSubmit={handleAddCompetency}
      />
    </div>
  );
}
