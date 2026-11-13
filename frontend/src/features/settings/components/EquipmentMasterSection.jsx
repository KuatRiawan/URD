import { useEffect, useState, useMemo } from 'react';
import {
  Archive,
  ArrowBendDownRight,
  ArrowsClockwise,
  CheckCircle,
  Clock,
  Cube,
  DotsThreeVertical,
  FileText,
  FolderPlus,
  Gauge,
  Info,
  ListChecks,
  MagnifyingGlass,
  PencilSimple,
  Plus,
  ShieldCheck,
  Tag,
  Trash,
  WarningCircle,
  X
} from '@phosphor-icons/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card.jsx';
import { Badge } from '../../../components/ui/Badge.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Modal } from '../../../components/ui/Modal.jsx';
import { Notice } from '../../../components/ui/Notice.jsx';
import { ActionMenu } from '../../../components/ui/ActionMenu.jsx';
import {
  TableWrapper,
  TableHead,
  TableBody,
  TableRow,
  TableCell
} from '../../../components/ui/TableWrapper.jsx';
import { PaginationBar } from '../../../components/feedback/StateViews.jsx';
import { useConfirm, useToast } from '../../../components/ui/FeedbackProvider.jsx';
import { api } from '../../../lib/api/axios.js';
import { formatDate } from '../../../lib/utils/format.js';

const DOMAIN_TONES = {
  PAPA: 'danger',
  PUBT: 'warning',
  PTP: 'info',
  ILPP: 'neutral',
  IPK: 'danger',
  ELEVATOR_ESKALATOR: 'warning',
  ANCHOR_LIFELINE: 'neutral'
};

export function EquipmentMasterSection({
  categories = [],
  calibrationTools = [],
  onRefreshData,
  onFeedback,
  onError
}) {
  const confirm = useConfirm();
  const toast = useToast();

  // Subtab internal
  const [activeSection, setActiveSection] = useState('EQUIPMENT_GROUPS'); // 'EQUIPMENT_GROUPS' | 'EQUIPMENT_TYPES' | 'DOMAINS' | 'INSPECTION_TYPES'

  // Pagination State
  const [groupPage, setGroupPage] = useState(1);
  const groupLimit = 10;

  const [unitPage, setUnitPage] = useState(1);
  const unitLimit = 15;

  const [toolPage, setToolPage] = useState(1);
  const toolLimit = 10;

  // Master Data State
  const [domains, setDomains] = useState(() => {
    if (Array.isArray(categories) && categories.length > 0) {
      return categories.map((c) => ({
        id: c.id,
        code: c.code || 'PAPA',
        name: c.name || 'Pesawat Angkat & Pesawat Angkut',
        regulation_reference: c.regulation_reference || 'Permenaker No. 08 Tahun 2020',
        active_types_count: 0
      }));
    }
    return [];
  });
  const [equipmentGroups, setEquipmentGroups] = useState([]);
  const [inspectionTypes, setInspectionTypes] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [localTools, setLocalTools] = useState(calibrationTools);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedDomainFilter, setSelectedDomainFilter] = useState('ALL');
  const [selectedGroupFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'INACTIVE'

  // Modal State Kelompok Alat (Tambah / Ubah)
  const [groupModal, setGroupModal] = useState(null); // { mode: 'ADD' | 'EDIT', item? }
  const [groupForm, setGroupForm] = useState({
    domainCode: 'PAPA',
    code: '',
    name: '',
    description: '',
    isActive: true,
    displayOrder: 0
  });
  const [savingGroup, setSavingGroup] = useState(false);
  const [deleteGroupModal, setDeleteGroupModal] = useState(null); // { item }
  const [deletingGroup, setDeletingGroup] = useState(false);

  // Modal State Jenis Unit (Tambah / Ubah)
  const [unitModal, setUnitModal] = useState(null); // { mode: 'ADD' | 'EDIT', item?, parentItem? }
  const [unitForm, setUnitForm] = useState({
    domainCode: 'PAPA',
    groupId: '',
    parentId: '',
    code: '',
    name: '',
    description: '',
    attributeSchema: [],
    isActive: true,
    displayOrder: 0
  });
  const [savingUnit, setSavingUnit] = useState(false);

  // Modal Konfirmasi Hapus / Nonaktifkan
  const [deleteModal, setDeleteModal] = useState(null); // { item }
  const [deletingUnit, setDeletingUnit] = useState(false);

  // Modal Alat Kalibrasi
  const [toolModal, setToolModal] = useState(null);
  const [toolForm, setToolForm] = useState({
    code: '',
    name: '',
    brand: '',
    serialNo: '',
    category: 'PUBT / PAA',
    certNo: '',
    calibrationLab: 'Lab Kalibrasi KAN - PT Sucofindo',
    calibratedAt: '',
    validUntil: ''
  });
  const [savingTool, setSavingTool] = useState(false);

  // 1. Fetch Domains, Groups, Inspection Types, & Equipment Types
  const fetchEquipmentMasterData = async () => {
    setLoading(true);
    try {
      const [domRes, grpRes, inspRes, eqRes] = await Promise.all([
        api.get('/equipment-types/domains'),
        api.get('/equipment-types/groups'),
        api.get('/equipment-types/inspection-types'),
        api.get('/equipment-types?includeInactive=true')
      ]);

      if (domRes.data?.domains) setDomains(domRes.data.domains);
      if (grpRes.data?.items) setEquipmentGroups(grpRes.data.items);
      if (inspRes.data?.inspectionTypes) setInspectionTypes(inspRes.data.inspectionTypes);
      if (eqRes.data?.items) setEquipmentTypes(eqRes.data.items);
    } catch (err) {
      if (onError) onError(err.response?.data?.error?.message || 'Gagal memuat master data jenis unit.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipmentMasterData();
  }, []);

  useEffect(() => {
    if (Array.isArray(categories) && categories.length > 0) {
      setDomains((prev) => {
        if (prev.length === 0) {
          return categories.map((c) => ({
            id: c.id,
            code: c.code || 'PAPA',
            name: c.name || 'Pesawat Angkat & Pesawat Angkut',
            regulation_reference: c.regulation_reference || 'Permenaker No. 08 Tahun 2020',
            active_types_count: 0
          }));
        }
        return prev;
      });
    }
  }, [categories]);

  const loadCalibrationTools = async () => {
    try {
      const res = await api.get('/system-settings/calibration-tools');
      if (res.data?.items) {
        setLocalTools(res.data.items);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (Array.isArray(calibrationTools) && calibrationTools.length > 0) {
      setLocalTools(calibrationTools);
    } else {
      loadCalibrationTools();
    }
  }, [calibrationTools]);

  const handleOpenAddTool = () => {
    setToolModal({ mode: 'ADD' });
    setToolForm({
      code: '',
      name: '',
      brand: '',
      serialNo: '',
      category: 'PAPA',
      certNo: '',
      calibrationLab: 'Lab Kalibrasi KAN - PT Sucofindo',
      calibratedAt: new Date().toISOString().slice(0, 10),
      validUntil: ''
    });
  };

  const handleOpenEditTool = (tool) => {
    setToolModal({ mode: 'EDIT', originalCode: tool.code });
    setToolForm({
      code: tool.code || '',
      name: tool.name || '',
      brand: tool.brand || '',
      serialNo: tool.serialNo || '',
      category: tool.category || 'PAPA',
      certNo: tool.certNo || '',
      calibrationLab: tool.calibrationLab || '',
      calibratedAt: tool.calibratedAt ? String(tool.calibratedAt).slice(0, 10) : '',
      validUntil: tool.validUntil ? String(tool.validUntil).slice(0, 10) : ''
    });
  };

  const handleDeleteTool = async (tool) => {
    const ok = await confirm({
      title: 'Hapus Alat Ukur Kalibrasi',
      message: `Apakah Anda yakin ingin menghapus alat ukur "${tool.name}" (${tool.code}) dengan nomor sertifikat KAN "${tool.certNo || '-'}" dari registri kalibrasi? Tindakan ini tidak dapat dibatalkan.`,
      confirmLabel: 'Ya, Hapus Alat Ukur',
      tone: 'danger'
    });
    if (!ok) return;

    try {
      const res = await api.delete(`/system-settings/calibration-tools/${encodeURIComponent(tool.code)}`);
      if (res.data?.items) {
        setLocalTools(res.data.items);
      } else {
        setLocalTools((prev) => prev.filter((t) => t.code.toUpperCase() !== tool.code.toUpperCase()));
      }
      toast(res.data?.message || `Alat ukur ${tool.name} berhasil dihapus dari registri.`, 'success');
      if (onFeedback) onFeedback(res.data?.message || `Alat ukur ${tool.name} berhasil dihapus dari registri.`);
      if (onRefreshData) await onRefreshData();
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Gagal menghapus alat ukur dari registri.';
      toast(errMsg, 'error');
      if (onError) onError(errMsg);
    }
  };

  // Reset pagination on filter or tab change
  useEffect(() => {
    setGroupPage(1);
    setUnitPage(1);
    setToolPage(1);
  }, [selectedDomainFilter, selectedGroupFilter, searchQuery, statusFilter, activeSection]);

  // Filtered Equipment Types
  const filteredTypes = useMemo(() => {
    return equipmentTypes.filter((t) => {
      if (selectedDomainFilter !== 'ALL' && t.domain_code !== selectedDomainFilter) {
        return false;
      }
      if (selectedGroupFilter !== 'ALL' && t.group_id !== selectedGroupFilter) {
        return false;
      }
      if (statusFilter === 'ACTIVE' && !t.is_active) return false;
      if (statusFilter === 'INACTIVE' && t.is_active) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (t.name || '').toLowerCase().includes(q);
        const matchesCode = (t.code || '').toLowerCase().includes(q);
        const matchesDesc = (t.description || '').toLowerCase().includes(q);
        const matchesParent = (t.parent_name || '').toLowerCase().includes(q);
        const matchesGroup = (t.group_name || '').toLowerCase().includes(q);
        return matchesName || matchesCode || matchesDesc || matchesParent || matchesGroup;
      }
      return true;
    });
  }, [equipmentTypes, selectedDomainFilter, selectedGroupFilter, statusFilter, searchQuery]);

  // Paginated Equipment Types
  const paginatedTypes = useMemo(() => {
    const start = (unitPage - 1) * unitLimit;
    return filteredTypes.slice(start, start + unitLimit);
  }, [filteredTypes, unitPage, unitLimit]);

  // Filtered Equipment Groups
  const filteredGroups = useMemo(() => {
    return equipmentGroups.filter((g) => {
      if (selectedDomainFilter !== 'ALL' && g.domain_code !== selectedDomainFilter) {
        return false;
      }
      if (statusFilter === 'ACTIVE' && !g.is_active) return false;
      if (statusFilter === 'INACTIVE' && g.is_active) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (g.name || '').toLowerCase().includes(q);
        const matchesCode = (g.code || '').toLowerCase().includes(q);
        const matchesDesc = (g.description || '').toLowerCase().includes(q);
        return matchesName || matchesCode || matchesDesc;
      }
      return true;
    });
  }, [equipmentGroups, selectedDomainFilter, statusFilter, searchQuery]);

  // Paginated Equipment Groups
  const paginatedGroups = useMemo(() => {
    const start = (groupPage - 1) * groupLimit;
    return filteredGroups.slice(start, start + groupLimit);
  }, [filteredGroups, groupPage, groupLimit]);

  // Paginated Calibration Tools
  const paginatedTools = useMemo(() => {
    const start = (toolPage - 1) * toolLimit;
    return localTools.slice(start, start + toolLimit);
  }, [localTools, toolPage, toolLimit]);

  // Group Handlers
  const handleOpenAddGroup = (defaultDomain = null) => {
    const domain = defaultDomain || (selectedDomainFilter !== 'ALL' ? selectedDomainFilter : 'PAPA');
    setGroupForm({
      domainCode: domain,
      code: '',
      name: '',
      description: '',
      isActive: true,
      displayOrder: 0
    });
    setGroupModal({ mode: 'ADD' });
  };

  const handleOpenEditGroup = (item) => {
    setGroupForm({
      domainCode: item.domain_code,
      code: item.code,
      name: item.name,
      description: item.description || '',
      isActive: item.is_active,
      displayOrder: item.display_order || 0
    });
    setGroupModal({ mode: 'EDIT', item });
  };

  const handleSaveGroup = async (e) => {
    e.preventDefault();
    setSavingGroup(true);
    try {
      if (groupModal.mode === 'EDIT' && groupModal.item) {
        const res = await api.put(`/equipment-types/groups/${groupModal.item.id}`, {
          domainCode: groupForm.domainCode,
          code: groupForm.code.trim().toUpperCase(),
          name: groupForm.name.trim(),
          description: groupForm.description.trim() || null,
          isActive: groupForm.isActive,
          displayOrder: Number(groupForm.displayOrder) || 0
        });
        if (onFeedback) onFeedback(res.data?.message || 'Kelompok alat berhasil diperbarui.');
      } else {
        const res = await api.post('/equipment-types/groups', {
          domainCode: groupForm.domainCode,
          code: groupForm.code.trim().toUpperCase(),
          name: groupForm.name.trim(),
          description: groupForm.description.trim() || null,
          isActive: groupForm.isActive,
          displayOrder: Number(groupForm.displayOrder) || 0
        });
        if (onFeedback) onFeedback(res.data?.message || 'Kelompok alat berhasil ditambahkan.');
      }
      setGroupModal(null);
      await fetchEquipmentMasterData();
      if (onRefreshData) await onRefreshData();
    } catch (err) {
      if (onError) onError(err.response?.data?.error?.message || 'Gagal menyimpan kelompok alat.');
    } finally {
      setSavingGroup(false);
    }
  };

  const handleToggleGroupStatus = async (item) => {
    try {
      const newStatus = !item.is_active;
      const res = await api.patch(`/equipment-types/groups/${item.id}/status`, { isActive: newStatus });
      if (onFeedback) onFeedback(res.data?.message || 'Status kelompok alat berhasil diubah.');
      await fetchEquipmentMasterData();
    } catch (err) {
      if (onError) onError(err.response?.data?.error?.message || 'Gagal mengubah status kelompok alat.');
    }
  };

  const handleConfirmDeleteGroup = async () => {
    if (!deleteGroupModal?.item) return;
    setDeletingGroup(true);
    try {
      const res = await api.delete(`/equipment-types/groups/${deleteGroupModal.item.id}`);
      if (onFeedback) onFeedback(res.data?.message || 'Kelompok alat berhasil dihapus permanen.');
      setDeleteGroupModal(null);
      await fetchEquipmentMasterData();
      if (onRefreshData) await onRefreshData();
    } catch (err) {
      if (onError) onError(err.response?.data?.error?.message || 'Gagal menghapus kelompok alat.');
    } finally {
      setDeletingGroup(false);
    }
  };

  // Open Modal Tambah Jenis Unit
  const handleOpenAddUnit = (parent = null, defaultDomain = null, defaultGroup = null) => {
    const domain = defaultDomain || parent?.domain_code || (selectedDomainFilter !== 'ALL' ? selectedDomainFilter : 'PAPA');
    setUnitForm({
      domainCode: domain,
      groupId: defaultGroup || parent?.group_id || (selectedGroupFilter !== 'ALL' ? selectedGroupFilter : ''),
      parentId: parent ? parent.id : '',
      code: '',
      name: '',
      description: '',
      attributeSchema: parent?.attribute_schema ? [...parent.attribute_schema] : [],
      isActive: true,
      displayOrder: 0
    });
    setUnitModal({ mode: 'ADD', parentItem: parent });
  };

  // Open Modal Ubah Jenis Unit
  const handleOpenEditUnit = (item) => {
    setUnitForm({
      domainCode: item.domain_code,
      groupId: item.group_id || '',
      parentId: item.parent_id || '',
      code: item.code,
      name: item.name,
      description: item.description || '',
      attributeSchema: Array.isArray(item.attribute_schema) ? item.attribute_schema : [],
      isActive: item.is_active,
      displayOrder: item.display_order || 0
    });
    setUnitModal({ mode: 'EDIT', item });
  };

  // Save / Submit Jenis Unit
  const handleSaveUnit = async (e) => {
    e.preventDefault();
    setSavingUnit(true);
    try {
      if (unitModal.mode === 'EDIT' && unitModal.item) {
        const res = await api.put(`/equipment-types/${unitModal.item.id}`, {
          domainCode: unitForm.domainCode,
          groupId: unitForm.groupId || null,
          code: unitForm.code.trim().toUpperCase(),
          name: unitForm.name.trim(),
          parentId: unitForm.parentId || null,
          description: unitForm.description.trim() || null,
          attributeSchema: unitForm.attributeSchema,
          isActive: unitForm.isActive,
          displayOrder: Number(unitForm.displayOrder) || 0
        });
        if (onFeedback) onFeedback(res.data?.message || 'Jenis unit berhasil diperbarui.');
      } else {
        const res = await api.post('/equipment-types', {
          domainCode: unitForm.domainCode,
          groupId: unitForm.groupId || null,
          code: unitForm.code.trim().toUpperCase(),
          name: unitForm.name.trim(),
          parentId: unitForm.parentId || null,
          description: unitForm.description.trim() || null,
          attributeSchema: unitForm.attributeSchema,
          isActive: unitForm.isActive,
          displayOrder: Number(unitForm.displayOrder) || 0
        });
        if (onFeedback) onFeedback(res.data?.message || 'Jenis unit baru berhasil ditambahkan.');
      }
      setUnitModal(null);
      await fetchEquipmentMasterData();
      if (onRefreshData) await onRefreshData();
    } catch (err) {
      if (onError) onError(err.response?.data?.error?.message || 'Gagal menyimpan data jenis unit.');
    } finally {
      setSavingUnit(false);
    }
  };

  // Toggle Status Aktif / Nonaktif
  const handleToggleStatus = async (item) => {
    try {
      const newStatus = !item.is_active;
      const res = await api.patch(`/equipment-types/${item.id}/status`, { isActive: newStatus });
      if (onFeedback) onFeedback(res.data?.message || `Status jenis unit berhasil diubah.`);
      await fetchEquipmentMasterData();
    } catch (err) {
      if (onError) onError(err.response?.data?.error?.message || 'Gagal mengubah status jenis unit.');
    }
  };

  // Open Delete Confirmation
  const handleOpenDelete = (item) => {
    setDeleteModal({ item });
  };

  // Execute Permanent Delete (if unreferenced) or Soft Deactivate
  const handleConfirmDelete = async () => {
    if (!deleteModal?.item) return;
    setDeletingUnit(true);
    try {
      const res = await api.delete(`/equipment-types/${deleteModal.item.id}`);
      if (onFeedback) onFeedback(res.data?.message || 'Jenis unit berhasil dihapus permanen.');
      setDeleteModal(null);
      await fetchEquipmentMasterData();
      if (onRefreshData) await onRefreshData();
    } catch (err) {
      if (onError) onError(err.response?.data?.error?.message || 'Gagal menghapus jenis unit.');
    } finally {
      setDeletingUnit(false);
    }
  };

  // Helper Attributes Manipulation in Modal
  const handleAddAttribute = () => {
    setUnitForm((prev) => ({
      ...prev,
      attributeSchema: [
        ...prev.attributeSchema,
        { key: '', label: '', unit: '', required: false }
      ]
    }));
  };

  const handleUpdateAttribute = (idx, field, value) => {
    setUnitForm((prev) => {
      const updated = [...prev.attributeSchema];
      updated[idx] = { ...updated[idx], [field]: value };
      if (field === 'label' && !updated[idx].key) {
        // Auto-generate key from label
        updated[idx].key = value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_+|_+$/g, '');
      }
      return { ...prev, attributeSchema: updated };
    });
  };

  const handleRemoveAttribute = (idx) => {
    setUnitForm((prev) => ({
      ...prev,
      attributeSchema: prev.attributeSchema.filter((_, i) => i !== idx)
    }));
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Segmented Subtab Navigation */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Cube size={22} className="text-[#C81E1E]" weight="bold" />
                <CardTitle>Master 7 Kategori Objek Uji K3 &amp; Skema Atribut Teknis</CardTitle>
              </div>
              <CardDescription>
                Pusat konfigurasi klasifikasi unit 7 bidang K3, katalog jenis unit, subjenis, jenis pemeriksaan, dan parameter teknis riksa uji URD.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={ArrowsClockwise}
                loading={loading}
                onClick={fetchEquipmentMasterData}
              >
                Segarkan
              </Button>
              {activeSection === 'EQUIPMENT_GROUPS' && (
                <Button
                  variant="primary"
                  size="sm"
                  icon={Plus}
                  onClick={() => handleOpenAddGroup()}
                >
                  Tambah Jenis Alat
                </Button>
              )}
              {activeSection === 'EQUIPMENT_TYPES' && (
                <Button
                  variant="primary"
                  size="sm"
                  icon={Plus}
                  onClick={() => handleOpenAddUnit()}
                >
                  Tambah Nama Alat
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Subtab Bar */}
          <div className="flex items-center gap-1.5 p-1 bg-black/[0.04] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] rounded-xl overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveSection('DOMAINS')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeSection === 'DOMAINS'
                  ? 'bg-white dark:bg-[#1C1F2B] text-[#1D1D1F] dark:text-[#F5F5F7] shadow-xs'
                  : 'text-[#6E6E73] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7]'
              }`}
            >
              <ShieldCheck size={16} weight={activeSection === 'DOMAINS' ? 'bold' : 'regular'} />
              <span>1. Bidang Riksa Uji</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-black/[0.06] dark:bg-white/[0.1] text-inherit">
                {domains.length || 7}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('EQUIPMENT_GROUPS')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeSection === 'EQUIPMENT_GROUPS'
                  ? 'bg-white dark:bg-[#1C1F2B] text-[#1D1D1F] dark:text-[#F5F5F7] shadow-xs'
                  : 'text-[#6E6E73] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7]'
              }`}
            >
              <FolderPlus size={16} weight={activeSection === 'EQUIPMENT_GROUPS' ? 'bold' : 'regular'} />
              <span>2. Jenis Alat</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-black/[0.06] dark:bg-white/[0.1] text-inherit">
                {equipmentGroups.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('EQUIPMENT_TYPES')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeSection === 'EQUIPMENT_TYPES'
                  ? 'bg-white dark:bg-[#1C1F2B] text-[#1D1D1F] dark:text-[#F5F5F7] shadow-xs'
                  : 'text-[#6E6E73] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7]'
              }`}
            >
              <Cube size={16} weight={activeSection === 'EQUIPMENT_TYPES' ? 'bold' : 'regular'} />
              <span>3. Nama Alat</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-black/[0.06] dark:bg-white/[0.1] text-inherit">
                {equipmentTypes.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('INSPECTION_TYPES')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeSection === 'INSPECTION_TYPES'
                  ? 'bg-white dark:bg-[#1C1F2B] text-[#1D1D1F] dark:text-[#F5F5F7] shadow-xs'
                  : 'text-[#6E6E73] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7]'
              }`}
            >
              <ListChecks size={16} weight={activeSection === 'INSPECTION_TYPES' ? 'bold' : 'regular'} />
              <span>4. Jenis Pemeriksaan</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-black/[0.06] dark:bg-white/[0.1] text-inherit">
                {inspectionTypes.length || 4}
              </span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 0: KELOMPOK ALAT (EQUIPMENT GROUPS) */}
      {activeSection === 'EQUIPMENT_GROUPS' && (
        <div className="space-y-4">
          {/* Domain Pills Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedDomainFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                selectedDomainFilter === 'ALL'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                  : 'bg-black/[0.04] dark:bg-white/[0.06] text-[#6E6E73] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7]'
              }`}
            >
              <span>Semua Bidang</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-black/[0.1] dark:bg-white/[0.15]">
                {equipmentGroups.length}
              </span>
            </button>

            {domains.map((dom) => {
              const isSelected = selectedDomainFilter === dom.code;
              const grpCount = equipmentGroups.filter((g) => g.domain_code === dom.code).length;
              return (
                <button
                  key={dom.code}
                  type="button"
                  onClick={() => setSelectedDomainFilter(dom.code)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                      : 'bg-black/[0.04] dark:bg-white/[0.06] text-[#6E6E73] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7]'
                  }`}
                >
                  <span className="font-mono font-bold">{dom.code}</span>
                  <span>· {dom.name}</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-black/[0.1] dark:bg-white/[0.15]">
                    {grpCount}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#151821] p-3 rounded-2xl border border-black/[0.06] dark:border-white/[0.07] shadow-xs">
            <div className="relative flex-1">
              <MagnifyingGlass
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#86868B]"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari kelompok alat, kode, atau deskripsi..."
                className="w-full h-9 pl-9 pr-8 text-xs bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] rounded-xl text-[#1D1D1F] dark:text-[#F5F5F7] placeholder-[#86868B] focus:outline-hidden focus:ring-1 focus:ring-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#86868B] hover:text-[#1D1D1F] cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 px-3 text-xs bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] rounded-xl text-[#1D1D1F] dark:text-[#F5F5F7] cursor-pointer"
              >
                <option value="ALL">Semua Status</option>
                <option value="ACTIVE">Hanya Aktif</option>
                <option value="INACTIVE">Hanya Nonaktif</option>
              </select>

              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => handleOpenAddGroup(selectedDomainFilter !== 'ALL' ? selectedDomainFilter : 'PAPA')}
              >
                Tambah Kelompok
              </Button>
            </div>
          </div>

          {/* Tabel Kelompok Alat */}
          <TableWrapper className="min-w-[900px]">
            <TableHead>
              <tr>
                <TableCell isHeader className="w-[300px]">Kelompok Alat &amp; Kode</TableCell>
                <TableCell isHeader className="w-[180px]">Bidang Riksa Uji</TableCell>
                <TableCell isHeader className="w-[180px]">Jumlah Jenis Unit</TableCell>
                <TableCell isHeader className="w-[140px]">Unit Objek Uji</TableCell>
                <TableCell isHeader className="w-[110px]">Status</TableCell>
                <TableCell isHeader align="right" className="w-[80px]">Aksi</TableCell>
              </tr>
            </TableHead>
            <TableBody>
              {filteredGroups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-[#86868B]">
                    Tidak ada kelompok alat yang cocok dengan filter.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedGroups.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell className="text-xs">
                      <div className="flex items-start gap-2.5">
                        <FolderPlus size={16} className="mt-0.5 text-[#C81E1E] shrink-0" weight="bold" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
                              {group.name}
                            </span>
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-black/[0.05] dark:bg-white/[0.08] text-[#1D1D1F] dark:text-[#E5E5EA]">
                              {group.code}
                            </span>
                          </div>
                          {group.description && (
                            <p className="text-[11px] text-[#6E6E73] dark:text-[#98989D] mt-0.5 line-clamp-1">
                              {group.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-xs">
                      <Badge tone={DOMAIN_TONES[group.domain_code] || 'neutral'}>
                        {group.domain_code}
                      </Badge>
                      <div className="text-[11px] text-[#6E6E73] dark:text-[#98989D] mt-1 truncate max-w-[170px]">
                        {group.domain_name}
                      </div>
                    </TableCell>

                    <TableCell className="text-xs">
                      <div className="space-y-0.5">
                        <span className="font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
                          {group.total_types_count || 0} Jenis Unit
                        </span>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                          {group.active_types_count || 0} aktif tersedia
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-xs">
                      <Badge
                        tone={group.usage_count > 0 ? 'info' : 'neutral'}
                        size="xs"
                        icon={Cube}
                      >
                        {group.usage_count || 0} Unit
                      </Badge>
                    </TableCell>

                    <TableCell className="text-xs">
                      <Badge tone={group.is_active ? 'success' : 'neutral'}>
                        {group.is_active ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </TableCell>

                    <TableCell align="right">
                      <ActionMenu
                        items={[
                          {
                            label: 'Tambah Unit di Kelompok Ini',
                            icon: Plus,
                            onClick: () => handleOpenAddUnit(null, group.domain_code, group.id)
                          },
                          {
                            label: 'Ubah Data Kelompok',
                            icon: PencilSimple,
                            onClick: () => handleOpenEditGroup(group)
                          },
                          {
                            label: group.is_active ? 'Nonaktifkan Kelompok' : 'Aktifkan Kelompok',
                            icon: group.is_active ? Archive : CheckCircle,
                            onClick: () => handleToggleGroupStatus(group)
                          },
                          {
                            label: 'Hapus Kelompok',
                            icon: Trash,
                            danger: true,
                            onClick: () => setDeleteGroupModal({ item: group })
                          }
                        ]}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </TableWrapper>

          {filteredGroups.length > groupLimit && (
            <PaginationBar
              page={groupPage}
              limit={groupLimit}
              total={filteredGroups.length}
              onPageChange={setGroupPage}
              itemLabel="kelompok / jenis alat"
            />
          )}
        </div>
      )}

      {/* SECTION 1: KATALOG JENIS UNIT & SUBJENIS */}
      {activeSection === 'EQUIPMENT_TYPES' && (
        <div className="space-y-4">
          {/* Domain Pills Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedDomainFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                selectedDomainFilter === 'ALL'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                  : 'bg-black/[0.04] dark:bg-white/[0.06] text-[#6E6E73] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7]'
              }`}
            >
              <span>Semua Bidang</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-black/[0.1] dark:bg-white/[0.15]">
                {equipmentTypes.length}
              </span>
            </button>

            {domains.map((dom) => {
              const isSelected = selectedDomainFilter === dom.code;
              return (
                <button
                  key={dom.code}
                  type="button"
                  onClick={() => setSelectedDomainFilter(dom.code)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                      : 'bg-black/[0.04] dark:bg-white/[0.06] text-[#6E6E73] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7]'
                  }`}
                >
                  <span className="font-mono font-bold">{dom.code}</span>
                  <span>· {dom.name}</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-black/[0.1] dark:bg-white/[0.15]">
                    {dom.active_types_count ?? dom.total_types_count ?? 0}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#151821] p-3 rounded-2xl border border-black/[0.06] dark:border-white/[0.07] shadow-xs">
            <div className="relative flex-1">
              <MagnifyingGlass
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#86868B]"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari jenis unit, kode, subjenis, atau spesifikasi..."
                className="w-full h-9 pl-9 pr-8 text-xs bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] rounded-xl text-[#1D1D1F] dark:text-[#F5F5F7] placeholder-[#86868B] focus:outline-hidden focus:ring-1 focus:ring-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#86868B] hover:text-[#1D1D1F] cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 px-3 text-xs bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] rounded-xl text-[#1D1D1F] dark:text-[#F5F5F7] cursor-pointer"
              >
                <option value="ALL">Semua Status</option>
                <option value="ACTIVE">Hanya Aktif</option>
                <option value="INACTIVE">Hanya Nonaktif</option>
              </select>
            </div>
          </div>

          {/* Table Data Nama Alat */}
          <TableWrapper className="min-w-[960px]">
            <TableHead>
              <tr>
                <TableCell isHeader className="w-[280px]">Nama Alat &amp; Kode</TableCell>
                <TableCell isHeader className="w-[180px]">Bidang Riksa Uji</TableCell>
                <TableCell isHeader className="w-[180px]">Jenis Alat</TableCell>
                <TableCell isHeader className="w-[180px]">Penggunaan Unit</TableCell>
                <TableCell isHeader className="w-[120px]">Status</TableCell>
                <TableCell isHeader align="right" className="w-[100px]">Aksi</TableCell>
              </tr>
            </TableHead>
            <TableBody>
              {filteredTypes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-[#86868B]">
                    <Cube size={32} className="mx-auto mb-2 opacity-40" />
                    <p className="font-semibold text-xs text-[#1D1D1F] dark:text-[#F5F5F7]">
                      Tidak ada nama alat yang cocok dengan kriteria pencarian.
                    </p>
                    <p className="text-[11px] mt-0.5">
                      Ubah kata kunci pencarian atau tambahkan nama alat baru.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTypes.map((item) => {
                  const isReferenced = (item.usage_count || 0) > 0 || (item.templates_count || 0) > 0 || (item.subtypes_count || 0) > 0;

                  return (
                    <TableRow key={item.id}>
                      {/* 1. Nama & Kode */}
                      <TableCell className="text-xs">
                        <div className="flex items-start gap-2.5">
                          <Cube size={16} className="mt-0.5 text-slate-700 dark:text-slate-300 shrink-0" weight="bold" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
                                {item.name}
                              </span>
                              <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-black/[0.05] dark:bg-white/[0.08] text-[#1D1D1F] dark:text-[#E5E5EA]">
                                {item.code}
                              </span>
                            </div>
                            {item.description && (
                              <p className="text-[11px] text-[#6E6E73] dark:text-[#98989D] mt-0.5 line-clamp-1">
                                {item.description}
                              </p>
                            )}
                            {Array.isArray(item.attribute_schema) && item.attribute_schema.length > 0 && (
                              <p className="text-[10px] text-[#86868B] dark:text-[#8E8E93] mt-0.5">
                                {item.attribute_schema.length} spesifikasi nameplate terkonfigurasi
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* 2. Bidang Riksa Uji */}
                      <TableCell className="text-xs">
                        <Badge tone={DOMAIN_TONES[item.domain_code] || 'neutral'}>
                          {item.domain_code}
                        </Badge>
                        <div className="text-[11px] text-[#6E6E73] dark:text-[#98989D] mt-1 truncate max-w-[170px]">
                          {item.domain_name}
                        </div>
                      </TableCell>

                      {/* 3. Jenis Alat */}
                      <TableCell className="text-xs">
                        {item.group_name || item.type_name ? (
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800 dark:text-slate-200">
                            <FolderPlus size={13} className="text-[#C81E1E]" weight="bold" />
                            <span className="truncate max-w-[150px]">{item.group_name || item.type_name}</span>
                          </div>
                        ) : (
                          <span className="text-[#86868B]">-</span>
                        )}
                      </TableCell>

                      {/* 4. Penggunaan Unit */}
                      <TableCell className="text-xs">
                        <div className="flex flex-col gap-1 items-start">
                          <Badge
                            tone={item.usage_count > 0 ? 'info' : 'neutral'}
                            size="xs"
                            icon={Cube}
                          >
                            {item.usage_count || 0} Unit Terdaftar
                          </Badge>
                          <Badge
                            tone={item.templates_count > 0 ? 'success' : 'neutral'}
                            size="xs"
                            icon={FileText}
                          >
                            {item.templates_count > 0 ? `${item.templates_count} Template Khusus` : 'Standar Bidang'}
                          </Badge>
                        </div>
                      </TableCell>

                      {/* 5. Status */}
                      <TableCell className="text-xs">
                        <Badge tone={item.is_active ? 'success' : 'neutral'}>
                          {item.is_active ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </TableCell>

                      {/* 6. Aksi ActionMenu */}
                      <TableCell align="right">
                        <ActionMenu
                          items={[
                            {
                              label: 'Ubah Data Nama Alat',
                              icon: PencilSimple,
                              onClick: () => handleOpenEditUnit(item)
                            },
                            {
                              label: item.is_active ? 'Nonaktifkan Alat' : 'Aktifkan Kembali',
                              icon: Archive,
                              onClick: () => handleToggleStatus(item)
                            },
                            {
                              label: isReferenced ? 'Hapus / Kelola Proteksi' : 'Hapus Permanen',
                              icon: Trash,
                              tone: 'danger',
                              onClick: () => handleOpenDelete(item)
                            }
                          ]}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </TableWrapper>

          {filteredTypes.length > unitLimit && (
            <PaginationBar
              page={unitPage}
              limit={unitLimit}
              total={filteredTypes.length}
              onPageChange={setUnitPage}
              itemLabel="nama alat"
            />
          )}
        </div>
      )}

      {/* SECTION 2: 7 BIDANG RIKSA UJI K3 */}
      {activeSection === 'DOMAINS' && (
        <div className="space-y-4">
          <Notice tone="info">
            Tujuh bidang riksa uji K3 resmi URD telah terintegrasi dengan regulasi Kemenaker RI.
            Super Admin dapat mengelola jenis unit, spesifikasi teknis, serta ruang lingkup BAP untuk setiap bidang.
          </Notice>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {domains.map((dom) => (
              <div
                key={dom.code}
                className="p-4 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821] shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-black/[0.05] dark:border-white/[0.06]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-[#C81E1E]">
                        {dom.code}
                      </span>
                      <h4 className="font-bold text-sm text-[#1D1D1F] dark:text-[#F5F5F7]">
                        {dom.name}
                      </h4>
                    </div>
                    {dom.legacy_category_name && (
                      <p className="text-[11px] text-[#86868B] mt-0.5">
                        Pemetaan Legacy: [{dom.legacy_category_code}] {dom.legacy_category_name}
                      </p>
                    )}
                  </div>
                  <Badge tone={dom.is_active ? 'success' : 'neutral'}>
                    {dom.is_active ? 'Regulasi Aktif' : 'Nonaktif'}
                  </Badge>
                </div>

                <p className="text-xs text-[#6E6E73] dark:text-[#98989D] leading-relaxed">
                  {dom.description || 'Tidak ada deskripsi regulasi.'}
                </p>

                <div className="pt-2 flex items-center justify-between text-xs border-t border-black/[0.05] dark:border-white/[0.06]">
                  <span className="text-[#6E6E73] dark:text-[#98989D]">
                    Jenis Unit Terdaftar:
                  </span>
                  <span className="font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
                    {dom.active_types_count ?? 0} Jenis Aktif
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    variant="secondary"
                    size="xs"
                    icon={Plus}
                    onClick={() => handleOpenAddUnit(null, dom.code)}
                  >
                    Tambah Jenis Unit {dom.code}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: JENIS PEMERIKSAAN RESMI */}
      {activeSection === 'INSPECTION_TYPES' && (
        <div className="space-y-4">
          <Notice tone="info">
            Klasifikasi jenis pemeriksaan menentukan alur pengujian teknis, validitas sertifikasi K3, serta templat checklist yang diterapkan saat riksa uji.
          </Notice>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {inspectionTypes.map((it) => (
              <div
                key={it.code}
                className="p-4 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821] shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-sm text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center gap-2">
                    <span className="font-mono px-2 py-0.5 rounded bg-black/[0.05] dark:bg-white/[0.08] text-xs">
                      {it.code}
                    </span>
                    <span>{it.name}</span>
                  </h4>
                  <Badge tone={it.is_active ? 'success' : 'neutral'}>
                    {it.is_active ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                </div>
                <p className="text-xs text-[#6E6E73] dark:text-[#98989D]">
                  {it.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. REGISTRI ALAT UKUR & KALIBRASI */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Gauge size={22} className="text-[#C81E1E]" weight="bold" />
                <CardTitle>Registri Alat Ukur Riksa Uji &amp; Sertifikat Kalibrasi KAN</CardTitle>
              </div>
              <CardDescription>
                Data sertifikasi kalibrasi alat ukur berstandar KAN yang dicantumkan pada LHPP dan BAP resmi.
              </CardDescription>
            </div>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={handleOpenAddTool}
            >
              Tambah Alat Ukur
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <TableWrapper className="min-w-[850px]">
            <TableHead>
              <tr>
                <TableCell isHeader>Kode &amp; Nama Alat Ukur</TableCell>
                <TableCell isHeader>Nomor Seri &amp; Merk</TableCell>
                <TableCell isHeader>Kategori Bidang</TableCell>
                <TableCell isHeader>Sertifikat Kalibrasi KAN</TableCell>
                <TableCell isHeader>Masa Berlaku Kalibrasi</TableCell>
                <TableCell isHeader align="right">Aksi</TableCell>
              </tr>
            </TableHead>
            <TableBody>
              {localTools.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-[#86868B]">
                    Belum ada alat ukur kalibrasi terdaftar.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTools.map((tool) => (
                  <TableRow key={tool.code}>
                    <TableCell className="text-xs">
                      <div className="font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">{tool.name}</div>
                      <div className="font-mono text-[11px] text-[#86868B]">{tool.code}</div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">{tool.brand || '-'}</div>
                      <div className="font-mono text-[11px] text-[#6E6E73] dark:text-[#98989D]">SN: {tool.serialNo || '-'}</div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <Badge tone="info" size="xs">{tool.category || 'Umum'}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="font-mono text-[11px] text-[#1D1D1F] dark:text-[#F5F5F7]">{tool.certNo || '-'}</div>
                      <div className="text-[10px] text-[#86868B]">{tool.calibrationLab || '-'}</div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="font-mono tabular-nums text-[#1D1D1F] dark:text-[#F5F5F7]">
                        s/d {tool.validUntil ? formatDate(tool.validUntil) : '-'}
                      </div>
                      <div className="mt-0.5">
                        {tool.validityStatus === 'EXPIRED' ? (
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                            Kedaluwarsa
                          </span>
                        ) : tool.validityStatus === 'EXPIRING_SOON' ? (
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                            Sisa {tool.daysRemaining} hari
                          </span>
                        ) : (
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            Valid ({tool.daysRemaining ? `${tool.daysRemaining} hari` : 'Aktif'})
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell align="right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="secondary"
                          size="xs"
                          icon={PencilSimple}
                          onClick={() => handleOpenEditTool(tool)}
                        >
                          Ubah
                        </Button>
                        <Button
                          variant="danger"
                          size="xs"
                          icon={Trash}
                          onClick={() => handleDeleteTool(tool)}
                        >
                          Hapus
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </TableWrapper>

          {localTools.length > toolLimit && (
            <PaginationBar
              page={toolPage}
              limit={toolLimit}
              total={localTools.length}
              onPageChange={setToolPage}
              itemLabel="alat ukur kalibrasi"
            />
          )}
        </CardContent>
      </Card>

      {/* MODAL: TAMBAH / UBAH NAMA ALAT */}
      {unitModal && (
        <Modal
          open={Boolean(unitModal)}
          onClose={() => setUnitModal(null)}
          title={unitModal.mode === 'EDIT' ? 'Ubah Data Nama Alat' : 'Tambah Nama Alat Baru'}
          subtitle="Konfigurasi klasifikasi nama alat resmi URD dan parameter teknis nameplate."
          size="lg"
        >
          <form onSubmit={handleSaveUnit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
                  Bidang Riksa Uji (Domain) *
                </label>
                <select
                  required
                  value={unitForm.domainCode}
                  onChange={(e) => {
                    const newDom = e.target.value;
                    const firstGrp = equipmentGroups.find((g) => g.domain_code === newDom);
                    setUnitForm({
                      ...unitForm,
                      domainCode: newDom,
                      groupId: firstGrp ? firstGrp.id : '',
                      parentId: ''
                    });
                  }}
                  className="w-full h-10 px-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 cursor-pointer font-medium"
                >
                  {domains.map((dom) => (
                    <option key={dom.code} value={dom.code}>
                      [{dom.code}] {dom.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
                  Jenis Alat (Equipment Type) *
                </label>
                <select
                  required
                  value={unitForm.groupId}
                  onChange={(e) => setUnitForm({ ...unitForm, groupId: e.target.value })}
                  className="w-full h-10 px-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 cursor-pointer font-medium"
                >
                  <option value="">-- Pilih Jenis Alat --</option>
                  {equipmentGroups
                    .filter((g) => g.domain_code === unitForm.domainCode)
                    .map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.code})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
                  Kode Nama Alat * (Uppercase Snake Case)
                </label>
                <input
                  type="text"
                  required
                  value={unitForm.code}
                  onChange={(e) =>
                    setUnitForm({
                      ...unitForm,
                      code: e.target.value.toUpperCase().replace(/\s+/g, '_')
                    })
                  }
                  placeholder="Contoh: FORKLIFT atau REACH_STACKER"
                  className="w-full h-10 px-3 font-mono border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
                  Nama Resmi Alat *
                </label>
                <input
                  type="text"
                  required
                  value={unitForm.name}
                  onChange={(e) => setUnitForm({ ...unitForm, name: e.target.value })}
                  placeholder="Contoh: FORKLIFT atau REACH STACKER"
                  className="w-full h-10 px-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
                Deskripsi &amp; Cakupan Teknis
              </label>
              <textarea
                rows={2}
                value={unitForm.description}
                onChange={(e) => setUnitForm({ ...unitForm, description: e.target.value })}
                placeholder="Penjelasan teknis peralatan, standar rujukan, dan kegunaan di lapangan..."
                className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            {/* Parameter Teknis Nameplate (Dynamic Attribute Schema) */}
            <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-slate-900 dark:text-slate-100">
                    Spesifikasi Teknis &amp; Nameplate Unit
                  </h5>
                  <p className="text-[11px] text-[#86868B]">
                    Kolom isian teknis yang muncul saat tim Marketing / Inspector mendaftarkan unit ini.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="xs"
                  icon={Plus}
                  onClick={handleAddAttribute}
                >
                  Tambah Atribut
                </Button>
              </div>

              {unitForm.attributeSchema.length === 0 ? (
                <p className="text-xs text-[#86868B] italic p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                  Belum ada atribut teknis khusus. Unit ini akan menggunakan kolom nameplate standar.
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {unitForm.attributeSchema.map((attr, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800"
                    >
                      <input
                        type="text"
                        required
                        value={attr.label}
                        onChange={(e) => handleUpdateAttribute(idx, 'label', e.target.value)}
                        placeholder="Label (mis: Kapasitas Beban)"
                        className="flex-1 h-8 px-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                      />
                      <input
                        type="text"
                        value={attr.unit || ''}
                        onChange={(e) => handleUpdateAttribute(idx, 'unit', e.target.value)}
                        placeholder="Satuan (mis: Ton, Bar, kVA)"
                        className="w-28 h-8 px-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                      />
                      <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300 cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={Boolean(attr.required)}
                          onChange={(e) => handleUpdateAttribute(idx, 'required', e.target.checked)}
                          className="h-3.5 w-3.5 rounded text-[#C81E1E] focus:ring-[#C81E1E]"
                        />
                        <span>Wajib</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttribute(idx)}
                        className="p-1.5 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                        title="Hapus Atribut"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Status Aktif */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={unitForm.isActive}
                  onChange={(e) => setUnitForm({ ...unitForm, isActive: e.target.checked })}
                  className="h-4 w-4 rounded text-[#C81E1E] focus:ring-[#C81E1E]"
                />
                <span>Status Aktif (Tersedia untuk pendaftaran unit baru di Marketing)</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => setUnitModal(null)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={savingUnit}
              >
                {unitModal.mode === 'EDIT' ? 'Simpan Perubahan' : 'Tambahkan Jenis Unit'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: KONFIRMASI HAPUS & PROTEKSI REFERENSI */}
      {deleteModal && (
        <Modal
          open={Boolean(deleteModal)}
          onClose={() => setDeleteModal(null)}
          title="Kelola Penghapusan / Proteksi Unit"
          subtitle={`Jenis Unit: ${deleteModal.item.name} (${deleteModal.item.code})`}
          size="md"
        >
          <div className="space-y-4 text-xs">
            {((deleteModal.item.usage_count || 0) > 0 ||
              (deleteModal.item.templates_count || 0) > 0 ||
              (deleteModal.item.subtypes_count || 0) > 0) ? (
              <div className="space-y-3">
                <Notice tone="warning">
                  <div className="space-y-1">
                    <p className="font-bold">
                      Unit ini dilindungi dan tidak dapat dihapus permanen!
                    </p>
                    <p>
                      Jenis unit ini masih terhubung dengan data operasional riksa uji:
                    </p>
                    <ul className="list-disc pl-5 mt-1 space-y-0.5 font-semibold">
                      {(deleteModal.item.usage_count || 0) > 0 && (
                        <li>{deleteModal.item.usage_count} unit objek uji klien terdaftar</li>
                      )}
                      {(deleteModal.item.templates_count || 0) > 0 && (
                        <li>{deleteModal.item.templates_count} template checklist riksa uji</li>
                      )}
                      {(deleteModal.item.subtypes_count || 0) > 0 && (
                        <li>{deleteModal.item.subtypes_count} subjenis unit di bawahnya</li>
                      )}
                    </ul>
                  </div>
                </Notice>

                <p className="text-[#6E6E73] dark:text-[#98989D] leading-relaxed">
                  Menghapus jenis unit yang memiliki riwayat operasional akan merusak integritas dokumen LHPP, BAP, dan Suket resmi.
                  Sebagai solusinya, Anda dapat <strong>Menonaktifkan</strong> unit ini agar tidak lagi muncul sebagai opsi pendaftaran alat baru.
                </p>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={() => setDeleteModal(null)}
                  >
                    Batal
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    icon={Archive}
                    onClick={async () => {
                      await handleToggleStatus({ ...deleteModal.item, is_active: true });
                      setDeleteModal(null);
                    }}
                  >
                    Nonaktifkan Jenis Unit Saja
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Notice tone="danger">
                  Apakah Anda yakin ingin menghapus permanen jenis unit{' '}
                  <strong>"{deleteModal.item.name}"</strong> ({deleteModal.item.code})?
                  Tindakan ini tidak dapat dibatalkan.
                </Notice>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={() => setDeleteModal(null)}
                  >
                    Batal
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="md"
                    loading={deletingUnit}
                    icon={Trash}
                    onClick={handleConfirmDelete}
                  >
                    Hapus Permanen
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* MODAL: TAMBAH / UBAH KELOMPOK ALAT */}
      {groupModal && (
        <Modal
          open={Boolean(groupModal)}
          onClose={() => setGroupModal(null)}
          title={groupModal.mode === 'EDIT' ? 'Ubah Data Kelompok Alat' : 'Tambah Kelompok Alat Baru'}
          subtitle="Kelompok alat menaungi jenis-jenis unit alat riksa uji K3 dalam satu kategori operasional."
          size="md"
        >
          <form onSubmit={handleSaveGroup} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
                  Bidang Riksa Uji *
                </label>
                <select
                  required
                  value={groupForm.domainCode}
                  onChange={(e) => setGroupForm({ ...groupForm, domainCode: e.target.value })}
                  className="w-full h-10 px-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 cursor-pointer"
                >
                  {domains.map((dom) => (
                    <option key={dom.code} value={dom.code}>
                      [{dom.code}] {dom.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
                  Kode Kelompok * (Uppercase)
                </label>
                <input
                  type="text"
                  required
                  value={groupForm.code}
                  onChange={(e) =>
                    setGroupForm({
                      ...groupForm,
                      code: e.target.value.toUpperCase().replace(/\s+/g, '_')
                    })
                  }
                  placeholder="Misal: FORKLIFT / MOBILE_CRANE"
                  className="w-full h-10 px-3 font-mono border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
                Nama Kelompok Alat *
              </label>
              <input
                type="text"
                required
                value={groupForm.name}
                onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                placeholder="Misal: Forklift, Mobile Crane, Overhead Crane"
                className="w-full h-10 px-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
                Deskripsi Kelompok
              </label>
              <textarea
                rows={2}
                value={groupForm.description}
                onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                placeholder="Ruang lingkup kelompok alat dan standar K3 yang terkait..."
                className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={groupForm.isActive}
                  onChange={(e) => setGroupForm({ ...groupForm, isActive: e.target.checked })}
                  className="h-4 w-4 rounded text-[#C81E1E] focus:ring-[#C81E1E]"
                />
                <span>Status Aktif (Tersedia dalam hierarki registrasi alat)</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => setGroupModal(null)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={savingGroup}
              >
                {groupModal.mode === 'EDIT' ? 'Simpan Perubahan' : 'Tambahkan Kelompok'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: KONFIRMASI HAPUS & PROTEKSI KELOMPOK ALAT */}
      {deleteGroupModal && (
        <Modal
          open={Boolean(deleteGroupModal)}
          onClose={() => setDeleteGroupModal(null)}
          title="Kelola Penghapusan / Proteksi Kelompok Alat"
          subtitle={`Kelompok: ${deleteGroupModal.item.name} (${deleteGroupModal.item.code})`}
          size="md"
        >
          <div className="space-y-4 text-xs">
            {((deleteGroupModal.item.usage_count || 0) > 0 ||
              (deleteGroupModal.item.total_types_count || 0) > 0) ? (
              <div className="space-y-3">
                <Notice tone="warning">
                  <div className="space-y-1">
                    <p className="font-bold">
                      Kelompok ini dilindungi dan tidak dapat dihapus permanen!
                    </p>
                    <p>
                      Kelompok ini masih menaungi data operasional riksa uji:
                    </p>
                    <ul className="list-disc pl-5 mt-1 space-y-0.5 font-semibold">
                      {(deleteGroupModal.item.total_types_count || 0) > 0 && (
                        <li>{deleteGroupModal.item.total_types_count} jenis unit di bawah kelompok ini</li>
                      )}
                      {(deleteGroupModal.item.usage_count || 0) > 0 && (
                        <li>{deleteGroupModal.item.usage_count} unit objek uji klien terdaftar</li>
                      )}
                    </ul>
                  </div>
                </Notice>

                <p className="text-[#6E6E73] dark:text-[#98989D] leading-relaxed">
                  Menghapus kelompok yang menaungi jenis unit atau riwayat pengujian akan merusak integritas sistem.
                  Anda dapat <strong>Menonaktifkan</strong> kelompok ini agar tidak muncul pada pendaftaran unit baru.
                </p>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={() => setDeleteGroupModal(null)}
                  >
                    Batal
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    icon={Archive}
                    onClick={async () => {
                      await handleToggleGroupStatus({ ...deleteGroupModal.item, is_active: true });
                      setDeleteGroupModal(null);
                    }}
                  >
                    Nonaktifkan Kelompok Saja
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Notice tone="danger">
                  Apakah Anda yakin ingin menghapus permanen kelompok alat{' '}
                  <strong>"{deleteGroupModal.item.name}"</strong> ({deleteGroupModal.item.code})?
                  Tindakan ini tidak dapat dibatalkan.
                </Notice>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={() => setDeleteGroupModal(null)}
                  >
                    Batal
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="md"
                    loading={deletingGroup}
                    icon={Trash}
                    onClick={handleConfirmDeleteGroup}
                  >
                    Hapus Permanen
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* MODAL: ALAT UKUR KALIBRASI (TAMBAH / EDIT) */}
      {toolModal && (
        <Modal
          open={Boolean(toolModal)}
          onClose={() => setToolModal(null)}
          title={toolModal.mode === 'EDIT' ? 'Ubah Data Kalibrasi Alat Ukur' : 'Tambah Alat Ukur Baru'}
          subtitle="Registri alat ukur pengujian K3 berstandar laboratorium kalibrasi KAN."
          size="md"
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setSavingTool(true);
              try {
                if (toolModal.mode === 'EDIT' && toolModal.originalCode) {
                  const res = await api.put(
                    `/system-settings/calibration-tools/${encodeURIComponent(toolModal.originalCode)}`,
                    toolForm
                  );
                  if (res.data?.items) setLocalTools(res.data.items);
                  toast(res.data?.message || 'Data alat ukur berhasil diperbarui.', 'success');
                  if (onFeedback) onFeedback(res.data?.message || 'Data alat ukur berhasil diperbarui.');
                } else {
                  const res = await api.post('/system-settings/calibration-tools', toolForm);
                  if (res.data?.items) setLocalTools(res.data.items);
                  toast(res.data?.message || 'Alat ukur baru berhasil ditambahkan.', 'success');
                  if (onFeedback) onFeedback(res.data?.message || 'Alat ukur baru berhasil ditambahkan.');
                }
                setToolModal(null);
                if (onRefreshData) await onRefreshData();
              } catch (err) {
                const errMsg = err.response?.data?.message || 'Gagal menyimpan alat ukur.';
                toast(errMsg, 'error');
                if (onError) onError(errMsg);
              } finally {
                setSavingTool(false);
              }
            }}
            className="space-y-4 text-xs"
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">Kode Alat *</label>
                <input
                  type="text"
                  required
                  value={toolForm.code}
                  onChange={(e) => setToolForm({ ...toolForm, code: e.target.value.toUpperCase() })}
                  placeholder="Misal: UT-001"
                  className="w-full h-9 px-3 font-mono border border-black/[0.12] dark:border-white/[0.15] rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">Nama Alat Ukur *</label>
                <input
                  type="text"
                  required
                  value={toolForm.name}
                  onChange={(e) => setToolForm({ ...toolForm, name: e.target.value })}
                  placeholder="Misal: Ultrasonic Thickness Gauge"
                  className="w-full h-9 px-3 border border-black/[0.12] dark:border-white/[0.15] rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">Merk / Brand *</label>
                <input
                  type="text"
                  required
                  value={toolForm.brand}
                  onChange={(e) => setToolForm({ ...toolForm, brand: e.target.value })}
                  placeholder="Misal: Olympus 38DL PLUS"
                  className="w-full h-9 px-3 border border-black/[0.12] dark:border-white/[0.15] rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">Nomor Seri (SN)</label>
                <input
                  type="text"
                  value={toolForm.serialNo}
                  onChange={(e) => setToolForm({ ...toolForm, serialNo: e.target.value })}
                  placeholder="Misal: SN-88219"
                  className="w-full h-9 px-3 font-mono border border-black/[0.12] dark:border-white/[0.15] rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">Bidang / Kategori Riksa Uji *</label>
                <select
                  required
                  value={toolForm.category}
                  onChange={(e) => setToolForm({ ...toolForm, category: e.target.value })}
                  className="w-full h-9 px-3 border border-black/[0.12] dark:border-white/[0.15] rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="PAPA">PAPA (Pesawat Angkat &amp; Angkut)</option>
                  <option value="PUBT">PUBT (Pesawat Uap &amp; Bejana Tekan)</option>
                  <option value="PTP">PTP (Pesawat Tenaga &amp; Produksi)</option>
                  <option value="ILPP">ILPP (Instalasi Listrik &amp; Penyalur Petir)</option>
                  <option value="IPK">IPK (Instalasi Proteksi Kebakaran)</option>
                  <option value="Elevator / Eskalator">Elevator / Eskalator</option>
                  <option value="Anchor / Lifeline">Anchor / Lifeline</option>
                  <option value="Umum / Multi-Bidang">Umum / Multi-Bidang</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">Nomor Sertifikat KAN *</label>
                <input
                  type="text"
                  required
                  value={toolForm.certNo}
                  onChange={(e) => setToolForm({ ...toolForm, certNo: e.target.value })}
                  placeholder="Misal: KAL-2026-0081/KAN"
                  className="w-full h-9 px-3 font-mono border border-black/[0.12] dark:border-white/[0.15] rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">Lab Kalibrasi KAN</label>
                <input
                  type="text"
                  value={toolForm.calibrationLab}
                  onChange={(e) => setToolForm({ ...toolForm, calibrationLab: e.target.value })}
                  placeholder="Misal: PT Sucofindo / Balai Metrologi"
                  className="w-full h-9 px-3 border border-black/[0.12] dark:border-white/[0.15] rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">Tanggal Kalibrasi</label>
                <input
                  type="date"
                  value={toolForm.calibratedAt}
                  onChange={(e) => setToolForm({ ...toolForm, calibratedAt: e.target.value })}
                  className="w-full h-9 px-3 border border-black/[0.12] dark:border-white/[0.15] rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">Masa Berlaku Kalibrasi *</label>
              <input
                type="date"
                required
                value={toolForm.validUntil}
                onChange={(e) => setToolForm({ ...toolForm, validUntil: e.target.value })}
                className="w-full h-9 px-3 border border-black/[0.12] dark:border-white/[0.15] rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/[0.08] dark:border-white/[0.10]">
              <Button type="button" variant="secondary" size="md" onClick={() => setToolModal(null)}>
                Batal
              </Button>
              <Button type="submit" variant="primary" size="md" loading={savingTool}>
                {toolModal.mode === 'EDIT' ? 'Simpan Perubahan' : 'Tambahkan Alat Ukur'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

          </div>
  );
}
