import { useCallback, useEffect, useMemo, useState } from 'react';
import { useInRouterContext, useSearchParams } from 'react-router';
import {
  Anchor,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CaretRight,
  CheckCircle,
  ClockCounterClockwise,
  Crane,
  Cube,
  DotsThreeVertical,
  Elevator,
  Engine,
  Eye,
  FileText,
  FireExtinguisher,
  Folder,
  GitBranch,
  Lightning,
  ListChecks,
  MagnifyingGlass,
  PencilSimple,
  Plus,
  ShieldCheck,
  Sliders,
  Trash,
  WarningCircle,
  X
} from '@phosphor-icons/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Badge } from '../../../components/ui/Badge.jsx';
import { Modal } from '../../../components/ui/Modal.jsx';
import { ActionMenu } from '../../../components/ui/ActionMenu.jsx';
import { useConfirm, useToast } from '../../../components/ui/FeedbackProvider.jsx';
import { api } from '../../../lib/api/axios.js';

// Mapping icon resmi untuk 7 bidang K3
const DOMAIN_ICON_MAP = {
  PAPA: Crane,
  PUBT: Engine,
  PTP: Sliders,
  ILPP: Lightning,
  IPK: FireExtinguisher,
  ELEVATOR_ESKALATOR: Elevator,
  ANCHOR_LIFELINE: Anchor
};

const INPUT_TYPES = [
  { value: 'CHOICE', label: 'Pilihan Sesuai / Tidak Sesuai (CHOICE)' },
  { value: 'NUMBER', label: 'Angka Pengukuran (NUMBER)' },
  { value: 'TEXT', label: 'Teks Singkat (TEXT)' },
  { value: 'LONG_TEXT', label: 'Uraian Catatan (LONG_TEXT)' },
  { value: 'DATE', label: 'Tanggal (DATE)' },
  { value: 'PHOTO', label: 'Bukti Foto Wajib (PHOTO)' }
];

export function ChecklistBuilderSection(props) {
  const inRouter = useInRouterContext();
  if (inRouter) {
    return <ChecklistBuilderWithRouter {...props} />;
  }
  return <ChecklistBuilderContent {...props} />;
}

function ChecklistBuilderWithRouter(props) {
  const [searchParams, setSearchParams] = useSearchParams();
  return <ChecklistBuilderContent {...props} searchParams={searchParams} setSearchParams={setSearchParams} />;
}

function ChecklistBuilderContent({
  checklistsData,
  selectedCategory,
  setSelectedCategory,
  filteredItems: propFilteredItems,
  onOpenCreateItem,
  onOpenEditItem,
  onDeleteItem,
  onPublishNewVersion,
  publishingVersion,
  searchParams: propSearchParams,
  setSearchParams: propSetSearchParams
} = {}) {
  const confirm = useConfirm();
  const toast = useToast();
  const [fallbackSearchParams, setFallbackSearchParams] = useState(() => new URLSearchParams());
  const searchParams = propSearchParams || fallbackSearchParams;
  const setSearchParams = propSetSearchParams || setFallbackSearchParams;

  // 1. Navigation State: Levels 1, 2, 3, 4
  const domainParam = searchParams.get('domain') || '';
  const typeIdParam = searchParams.get('typeId') || '';
  const nameIdParam = searchParams.get('nameId') || '';

  const [selectedDomainCode, setSelectedDomainCode] = useState(domainParam);
  const [selectedTypeId, setSelectedTypeId] = useState(typeIdParam);
  const [selectedNameId, setSelectedNameId] = useState(nameIdParam);

  // Sync state with URL params
  const updateNav = useCallback((domain = '', typeId = '', nameId = '') => {
    setSelectedDomainCode(domain);
    setSelectedTypeId(typeId);
    setSelectedNameId(nameId);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (domain) next.set('domain', domain); else next.delete('domain');
      if (typeId) next.set('typeId', typeId); else next.delete('typeId');
      if (nameId) next.set('nameId', nameId); else next.delete('nameId');
      return next;
    });
  }, [setSearchParams]);

  // Determine current active level: 1 = DOMAIN, 2 = TYPE, 3 = NAME, 4 = CHECKLIST
  const currentLevel = useMemo(() => {
    if (propFilteredItems && propFilteredItems.length > 0) return 4;
    if (selectedDomainCode && selectedTypeId && selectedNameId) return 4;
    if (selectedDomainCode && selectedTypeId) return 3;
    if (selectedDomainCode) return 2;
    return 1;
  }, [propFilteredItems, selectedDomainCode, selectedTypeId, selectedNameId]);

  // 2. Data Lists
  const [domains, setDomains] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [equipmentNames, setEquipmentNames] = useState([]);
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [templateItems, setTemplateItems] = useState([]);

  // Loading states
  const [loadingDomains, setLoadingDomains] = useState(false);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [loadingNames, setLoadingNames] = useState(false);
  const [loadingTemplate, setLoadingTemplate] = useState(false);

  // Search queries per level
  const [domainSearch, setDomainSearch] = useState('');
  const [typeSearch, setTypeSearch] = useState('');
  const [nameSearch, setNameSearch] = useState('');

  // Level 4 Section selection
  const [activeSection, setActiveSection] = useState('');

  // 3. Modals State
  const [domainModal, setDomainModal] = useState({ open: false, mode: 'create', data: null });
  const [typeModal, setTypeModal] = useState({ open: false, mode: 'create', data: null });
  const [nameModal, setNameModal] = useState({ open: false, mode: 'create', data: null });
  const [sectionModal, setSectionModal] = useState({ open: false, mode: 'create', originalName: '', name: '' });
  const [itemModal, setItemModal] = useState({ open: false, mode: 'create', item: null });
  const [itemForm, setItemForm] = useState({
    section: '',
    label: '',
    input_type: 'CHOICE',
    unit: '',
    min_value: '',
    max_value: '',
    is_required: true,
    requires_note: false,
    requires_photo: false
  });
  const [initTemplateModal, setInitTemplateModal] = useState({ open: false, name: '' });
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [versionHistory, setVersionHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 4. API Loaders
  // Load Domains
  const loadDomains = useCallback(async () => {
    try {
      setLoadingDomains(true);
      const res = await api.get('/equipment-types/domains');
      setDomains(res.data?.domains || res.data?.items || []);
    } catch {
      toast('Gagal memuat katalog Bidang Riksa Uji.', 'error');
    } finally {
      setLoadingDomains(false);
    }
  }, [toast]);

  // Load Jenis Alat (Equipment Types) for selected domain
  const loadEquipmentTypes = useCallback(async (domainCode) => {
    if (!domainCode) {
      setEquipmentTypes([]);
      return;
    }
    try {
      setLoadingTypes(true);
      const res = await api.get('/equipment-types/types', { params: { domainCode } });
      setEquipmentTypes(res.data?.items || []);
    } catch {
      toast('Gagal memuat katalog Jenis Alat.', 'error');
    } finally {
      setLoadingTypes(false);
    }
  }, [toast]);

  // Load Nama Alat (Equipment Names) for selected type
  const loadEquipmentNames = useCallback(async (groupId) => {
    if (!groupId) {
      setEquipmentNames([]);
      return;
    }
    try {
      setLoadingNames(true);
      const res = await api.get('/equipment-types/names', { params: { groupId } });
      setEquipmentNames(res.data?.items || []);
    } catch {
      toast('Gagal memuat katalog Nama Alat.', 'error');
    } finally {
      setLoadingNames(false);
    }
  }, [toast]);

  // Load Template for selected Nama Alat
  const loadTemplate = useCallback(async (nameId, domainCode) => {
    if (!nameId) {
      setActiveTemplate(null);
      setTemplateItems([]);
      return;
    }
    try {
      setLoadingTemplate(true);
      const res = await api.get('/inspections/templates', {
        params: { equipmentTypeId: nameId, domainCode }
      });
      const templates = res.data?.items || [];
      const matched = templates[0] || null;
      setActiveTemplate(matched);
      const items = matched?.items || [];
      setTemplateItems(items);

      // Set active section
      const uniqueSecs = Array.from(new Set(items.map((i) => i.section).filter(Boolean)));
      if (uniqueSecs.length > 0) {
        setActiveSection((prev) => (uniqueSecs.includes(prev) ? prev : uniqueSecs[0]));
      } else {
        setActiveSection('Pemeriksaan Visual & Fisik');
      }
    } catch {
      toast('Gagal memuat checklist pemeriksaan.', 'error');
    } finally {
      setLoadingTemplate(false);
    }
  }, [toast]);

  // Effects for Progressive Navigation

  useEffect(() => {
    loadDomains();
  }, [loadDomains]);

  useEffect(() => {
    if (selectedDomainCode) {
      loadEquipmentTypes(selectedDomainCode);
    }
  }, [selectedDomainCode, loadEquipmentTypes]);

  useEffect(() => {
    if (selectedTypeId) {
      loadEquipmentNames(selectedTypeId);
    }
  }, [selectedTypeId, loadEquipmentNames]);

  useEffect(() => {
    if (selectedNameId && selectedDomainCode) {
      loadTemplate(selectedNameId, selectedDomainCode);
    }
  }, [selectedNameId, selectedDomainCode, loadTemplate]);

  // Context objects for breadcrumb display
  const currentDomainObj = useMemo(() => {
    return domains.find((d) => d.code === selectedDomainCode) || null;
  }, [domains, selectedDomainCode]);

  const currentTypeObj = useMemo(() => {
    return equipmentTypes.find((t) => t.id === selectedTypeId) || null;
  }, [equipmentTypes, selectedTypeId]);

  const currentNameObj = useMemo(() => {
    return equipmentNames.find((n) => n.id === selectedNameId) || null;
  }, [equipmentNames, selectedNameId]);

  // Filtered lists for grids
  const filteredDomains = useMemo(() => {
    if (!domainSearch.trim()) return domains;
    const q = domainSearch.toLowerCase();
    return domains.filter(
      (d) => d.code.toLowerCase().includes(q) || d.name.toLowerCase().includes(q)
    );
  }, [domains, domainSearch]);

  const filteredTypes = useMemo(() => {
    if (!typeSearch.trim()) return equipmentTypes;
    const q = typeSearch.toLowerCase();
    return equipmentTypes.filter(
      (t) => t.name.toLowerCase().includes(q) || (t.code && t.code.toLowerCase().includes(q))
    );
  }, [equipmentTypes, typeSearch]);

  const filteredNames = useMemo(() => {
    if (!nameSearch.trim()) return equipmentNames;
    const q = nameSearch.toLowerCase();
    return equipmentNames.filter(
      (n) => n.name.toLowerCase().includes(q) || (n.code && n.code.toLowerCase().includes(q))
    );
  }, [equipmentNames, nameSearch]);

  // Sections and Items for Level 4
  const effectiveItems = useMemo(() => {
    if (propFilteredItems && propFilteredItems.length > 0) return propFilteredItems;
    return templateItems;
  }, [propFilteredItems, templateItems]);

  const sectionsList = useMemo(() => {
    const fromItems = Array.from(new Set(effectiveItems.map((i) => i.section).filter(Boolean)));
    if (activeSection && !fromItems.includes(activeSection)) {
      return [...fromItems, activeSection];
    }
    return fromItems.length > 0 ? fromItems : ['Pemeriksaan Visual & Fisik'];
  }, [effectiveItems, activeSection]);

  const itemsInActiveSection = useMemo(() => {
    return effectiveItems.filter((i) => i.section === activeSection);
  }, [effectiveItems, activeSection]);

  useEffect(() => {
    if (effectiveItems.length > 0) {
      const availableSections = Array.from(new Set(effectiveItems.map((i) => i.section).filter(Boolean)));
      if (availableSections.length > 0 && (!activeSection || !availableSections.includes(activeSection))) {
        setActiveSection(availableSections[0]);
      }
    }
  }, [effectiveItems, activeSection]);

  // ==========================================
  // LEVEL 1: DOMAIN CRUD
  // ==========================================
  const handleOpenAddDomain = () => {
    setDomainModal({
      open: true,
      mode: 'create',
      data: { code: '', name: '', description: '', displayOrder: (domains.length + 1) * 10 }
    });
  };

  const handleOpenEditDomain = (dm) => {
    setDomainModal({
      open: true,
      mode: 'edit',
      data: {
        code: dm.code,
        name: dm.name,
        description: dm.description || '',
        displayOrder: dm.display_order ?? 10
      }
    });
  };

  const handleSaveDomain = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name: domainModal.data.name.trim(),
        description: domainModal.data.description.trim() || null,
        displayOrder: Number(domainModal.data.displayOrder) || 10
      };
      if (domainModal.mode === 'create') {
        payload.code = domainModal.data.code.trim().toUpperCase();
        await api.post('/equipment-types/domains', payload);
        toast(`Bidang riksa uji ${payload.code} berhasil ditambahkan.`, 'success');
      } else {
        await api.put(`/equipment-types/domains/${domainModal.data.code}`, payload);
        toast(`Bidang riksa uji ${domainModal.data.code} berhasil diperbarui.`, 'success');
      }
      setDomainModal({ open: false, mode: 'create', data: null });
      await loadDomains();
    } catch (err) {
      toast(err.response?.data?.error?.message || err.response?.data?.message || 'Gagal menyimpan bidang riksa uji.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleDomainStatus = async (dm) => {
    try {
      const res = await api.patch(`/equipment-types/domains/${dm.code}/status`, {
        isActive: !dm.is_active
      });
      toast(res.data?.message || 'Status bidang berhasil diperbarui.', 'success');
      await loadDomains();
    } catch (err) {
      toast(err.response?.data?.error?.message || err.response?.data?.message || 'Gagal mengubah status bidang.', 'error');
    }
  };

  const handleDeleteDomain = async (dm) => {
    const ok = await confirm({
      title: `Hapus Bidang Riksa Uji [${dm.code}]`,
      message: `Apakah Anda yakin ingin menghapus bidang "${dm.name}"? Tindakan ini hanya diizinkan bila belum ada jenis alat atau objek riksa uji yang terdaftar di bawahnya.`,
      confirmLabel: 'Ya, Hapus Bidang',
      tone: 'danger'
    });
    if (!ok) return;

    try {
      await api.delete(`/equipment-types/domains/${dm.code}`);
      toast(`Bidang "${dm.name}" berhasil dihapus.`, 'success');
      await loadDomains();
    } catch (err) {
      toast(err.response?.data?.error?.message || err.response?.data?.message || 'Gagal menghapus bidang riksa uji.', 'error');
    }
  };

  // ==========================================
  // LEVEL 2: JENIS ALAT CRUD
  // ==========================================
  const handleOpenAddType = () => {
    setTypeModal({
      open: true,
      mode: 'create',
      data: {
        domainCode: selectedDomainCode,
        code: `GRP_${selectedDomainCode}_`,
        name: '',
        description: '',
        displayOrder: (equipmentTypes.length + 1) * 10
      }
    });
  };

  const handleOpenEditType = (t) => {
    setTypeModal({
      open: true,
      mode: 'edit',
      data: {
        id: t.id,
        domainCode: t.domain_code || selectedDomainCode,
        code: t.code,
        name: t.name,
        description: t.description || '',
        displayOrder: t.display_order ?? 10
      }
    });
  };

  const handleSaveType = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        domainCode: selectedDomainCode,
        name: typeModal.data.name.trim(),
        code: typeModal.data.code.trim().toUpperCase(),
        description: typeModal.data.description.trim() || null,
        displayOrder: Number(typeModal.data.displayOrder) || 10
      };
      if (typeModal.mode === 'create') {
        await api.post('/equipment-types/types', payload);
        toast(`Jenis alat "${payload.name}" berhasil ditambahkan.`, 'success');
      } else {
        await api.put(`/equipment-types/types/${typeModal.data.id}`, payload);
        toast(`Jenis alat "${payload.name}" berhasil diperbarui.`, 'success');
      }
      setTypeModal({ open: false, mode: 'create', data: null });
      await loadEquipmentTypes(selectedDomainCode);
    } catch (err) {
      toast(err.response?.data?.error?.message || err.response?.data?.message || 'Gagal menyimpan jenis alat.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleTypeStatus = async (t) => {
    try {
      const res = await api.patch(`/equipment-types/types/${t.id}/status`, {
        isActive: !t.is_active
      });
      toast(res.data?.message || 'Status jenis alat berhasil diperbarui.', 'success');
      await loadEquipmentTypes(selectedDomainCode);
    } catch (err) {
      toast(err.response?.data?.error?.message || err.response?.data?.message || 'Gagal mengubah status jenis alat.', 'error');
    }
  };

  const handleDeleteType = async (t) => {
    const ok = await confirm({
      title: `Hapus Jenis Alat [${t.name}]`,
      message: `Apakah Anda yakin ingin menghapus jenis alat "${t.name}"? Penghapusan permanen hanya diizinkan jika belum menaungi nama alat maupun objek riksa uji.`,
      confirmLabel: 'Ya, Hapus Jenis Alat',
      tone: 'danger'
    });
    if (!ok) return;

    try {
      await api.delete(`/equipment-types/types/${t.id}`);
      toast(`Jenis alat "${t.name}" berhasil dihapus.`, 'success');
      await loadEquipmentTypes(selectedDomainCode);
    } catch (err) {
      toast(err.response?.data?.error?.message || err.response?.data?.message || 'Gagal menghapus jenis alat.', 'error');
    }
  };

  // ==========================================
  // LEVEL 3: NAMA ALAT CRUD
  // ==========================================
  const handleOpenAddName = () => {
    setNameModal({
      open: true,
      mode: 'create',
      data: {
        domainCode: selectedDomainCode,
        groupId: selectedTypeId,
        code: '',
        name: '',
        description: ''
      }
    });
  };

  const handleOpenEditName = (n) => {
    setNameModal({
      open: true,
      mode: 'edit',
      data: {
        id: n.id,
        domainCode: n.domain_code || selectedDomainCode,
        groupId: n.group_id || selectedTypeId,
        code: n.code,
        name: n.name,
        description: n.description || ''
      }
    });
  };

  const handleSaveName = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        domainCode: selectedDomainCode,
        groupId: selectedTypeId,
        typeId: selectedTypeId,
        name: nameModal.data.name.trim(),
        code: nameModal.data.code.trim().toUpperCase() || nameModal.data.name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_'),
        description: nameModal.data.description.trim() || null
      };
      if (nameModal.mode === 'create') {
        await api.post('/equipment-types/names', payload);
        toast(`Nama alat "${payload.name}" berhasil ditambahkan.`, 'success');
      } else {
        await api.put(`/equipment-types/names/${nameModal.data.id}`, payload);
        toast(`Nama alat "${payload.name}" berhasil diperbarui.`, 'success');
      }
      setNameModal({ open: false, mode: 'create', data: null });
      await loadEquipmentNames(selectedTypeId);
    } catch (err) {
      toast(err.response?.data?.error?.message || err.response?.data?.message || 'Gagal menyimpan nama alat.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleNameStatus = async (n) => {
    try {
      const res = await api.patch(`/equipment-types/names/${n.id}/status`, {
        isActive: !n.is_active
      });
      toast(res.data?.message || 'Status nama alat berhasil diperbarui.', 'success');
      await loadEquipmentNames(selectedTypeId);
    } catch (err) {
      toast(err.response?.data?.error?.message || err.response?.data?.message || 'Gagal mengubah status nama alat.', 'error');
    }
  };

  const handleDeleteName = async (n) => {
    const ok = await confirm({
      title: `Hapus Nama Alat [${n.name}]`,
      message: `Apakah Anda yakin ingin menghapus nama alat "${n.name}"? Penghapusan permanen hanya diizinkan jika belum direferensikan dalam riksa uji atau objek unit.`,
      confirmLabel: 'Ya, Hapus Nama Alat',
      tone: 'danger'
    });
    if (!ok) return;

    try {
      await api.delete(`/equipment-types/names/${n.id}`);
      toast(`Nama alat "${n.name}" berhasil dihapus.`, 'success');
      await loadEquipmentNames(selectedTypeId);
    } catch (err) {
      toast(err.response?.data?.error?.message || err.response?.data?.message || 'Gagal menghapus nama alat.', 'error');
    }
  };

  // ==========================================
  // LEVEL 4: CHECKLIST SECTION & ITEM CRUD
  // ==========================================
  // Initialize Template
  const handleOpenInitTemplate = () => {
    setInitTemplateModal({
      open: true,
      name: `Checklist Riksa Uji ${currentNameObj?.name || 'Alat'} Lapangan`
    });
  };

  const handleCreateNewTemplate = async (e) => {
    e.preventDefault();
    if (!initTemplateModal.name.trim()) {
      toast('Nama template checklist wajib diisi.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const defaultItems = [
        {
          seq: 1,
          section: 'Pemeriksaan Visual & Fisik',
          label: 'Kondisi struktur utama dan nameplate fisik alat',
          inputType: 'CHOICE',
          isRequired: true,
          requiresNote: false,
          requiresPhoto: true
        },
        {
          seq: 2,
          section: 'Pemeriksaan Visual & Fisik',
          label: 'Sistem hidrolik dan pelumasan tidak bocor',
          inputType: 'CHOICE',
          isRequired: true,
          requiresNote: true,
          requiresPhoto: false
        },
        {
          seq: 3,
          section: 'Uji Fungsi & Pengukuran',
          label: 'Tekanan kerja sistem operasi / hidrolik',
          inputType: 'NUMBER',
          unit: 'bar',
          minValue: 100,
          maxValue: 250,
          isRequired: true,
          requiresNote: false,
          requiresPhoto: false
        },
        {
          seq: 4,
          section: 'Uji Fungsi & Pengukuran',
          label: 'Fungsi sistem rem dan tombol pengaman darurat (Emergency Stop)',
          inputType: 'CHOICE',
          isRequired: true,
          requiresNote: false,
          requiresPhoto: false
        }
      ];

      const payload = {
        name: initTemplateModal.name.trim(),
        domainCode: selectedDomainCode,
        equipmentGroupId: selectedTypeId,
        equipmentTypeId: selectedNameId,
        equipmentNameId: selectedNameId,
        isValidated: false,
        items: defaultItems
      };

      await api.post('/inspections/templates', payload);
      toast(`Checklist khusus untuk ${currentNameObj?.name} berhasil dibuat.`, 'success');
      setInitTemplateModal({ open: false, name: '' });
      await loadTemplate(selectedNameId, selectedDomainCode);
    } catch (err) {
      toast(err.response?.data?.error?.message || err.response?.data?.message || 'Gagal membuat checklist.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Section Add / Edit / Delete
  const handleOpenAddSection = () => {
    setSectionModal({ open: true, mode: 'create', originalName: '', name: '' });
  };

  const handleOpenEditSection = (secName) => {
    setSectionModal({ open: true, mode: 'edit', originalName: secName, name: secName });
  };

  const handleSaveSection = async (e) => {
    e.preventDefault();
    const newName = sectionModal.name.trim();
    if (!newName) return;

    if (sectionModal.mode === 'create') {
      setActiveSection(newName);
      setSectionModal({ open: false, mode: 'create', originalName: '', name: '' });
      toast(`Bagian "${newName}" ditambahkan. Silakan tambahkan butir pertanyaan.`, 'success');
    } else {
      // Update section name in all items
      const updated = effectiveItems.map((i) =>
        i.section === sectionModal.originalName ? { ...i, section: newName } : i
      );
      await persistTemplateItems(updated);
      setActiveSection(newName);
      setSectionModal({ open: false, mode: 'create', originalName: '', name: '' });
      toast(`Bagian berhasil diubah menjadi "${newName}".`, 'success');
    }
  };

  const handleDeleteSection = async (secName) => {
    const ok = await confirm({
      title: `Hapus Bagian [${secName}]`,
      message: `Apakah Anda yakin ingin menghapus bagian "${secName}" beserta seluruh butir pertanyaan di dalamnya?`,
      confirmLabel: 'Ya, Hapus Bagian',
      tone: 'danger'
    });
    if (!ok) return;

    const remaining = effectiveItems.filter((i) => i.section !== secName);
    await persistTemplateItems(remaining);
    const newSecs = Array.from(new Set(remaining.map((i) => i.section).filter(Boolean)));
    setActiveSection(newSecs[0] || 'Pemeriksaan Visual & Fisik');
    toast(`Bagian "${secName}" berhasil dihapus.`, 'success');
  };

  // Item Add / Edit / Delete / Reorder
  const handleOpenCreateItem = () => {
    setItemModal({ open: true, mode: 'create', item: null });
    setItemForm({
      section: activeSection || 'Pemeriksaan Visual & Fisik',
      label: '',
      input_type: 'CHOICE',
      unit: '',
      min_value: '',
      max_value: '',
      is_required: true,
      requires_note: false,
      requires_photo: false
    });
  };

  const handleOpenEditItem = (item) => {
    setItemModal({ open: true, mode: 'edit', item });
    setItemForm({
      section: item.section || activeSection,
      label: item.label,
      input_type: item.input_type || 'CHOICE',
      unit: item.unit || '',
      min_value: item.min_value ?? '',
      max_value: item.max_value ?? '',
      is_required: item.is_required !== false,
      requires_note: !!item.requires_note,
      requires_photo: !!item.requires_photo
    });
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!itemForm.label.trim()) {
      toast('Label / Pertanyaan pemeriksaan wajib diisi.', 'error');
      return;
    }

    let updatedItems = [];
    if (itemModal.mode === 'edit' && itemModal.item) {
      updatedItems = effectiveItems.map((i) =>
        i.seq === itemModal.item.seq ? { ...i, ...itemForm } : i
      );
    } else {
      const nextSeq = effectiveItems.length > 0 ? Math.max(...effectiveItems.map((i) => i.seq)) + 1 : 1;
      updatedItems = [
        ...effectiveItems,
        {
          seq: nextSeq,
          ...itemForm
        }
      ];
    }

    await persistTemplateItems(updatedItems);
    setItemModal({ open: false, mode: 'create', item: null });
    toast('Butir pemeriksaan berhasil disimpan.', 'success');
  };

  const handleDeleteItem = async (seq) => {
    const ok = await confirm({
      title: 'Hapus Butir Pemeriksaan',
      message: 'Apakah Anda yakin ingin menghapus butir pemeriksaan ini?',
      confirmLabel: 'Ya, Hapus Butir',
      tone: 'danger'
    });
    if (!ok) return;

    const remaining = effectiveItems.filter((i) => i.seq !== seq);
    await persistTemplateItems(remaining);
    toast('Butir pemeriksaan berhasil dihapus.', 'success');
  };

  const handleMoveItem = async (seq, direction) => {
    const sectionItems = [...itemsInActiveSection];
    const currentIndex = sectionItems.findIndex((i) => i.seq === seq);
    if (currentIndex < 0) return;

    const targetIndex = direction === 'UP' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sectionItems.length) return;

    const temp = sectionItems[currentIndex];
    sectionItems[currentIndex] = sectionItems[targetIndex];
    sectionItems[targetIndex] = temp;

    // Merge back into full item list with updated seqs
    const otherItems = effectiveItems.filter((i) => i.section !== activeSection);
    const combined = [...otherItems, ...sectionItems];
    await persistTemplateItems(combined);
  };

  const persistTemplateItems = async (items) => {
    if (!activeTemplate) return;
    setSubmitting(true);
    try {
      const payload = {
        name: activeTemplate.name,
        domainCode: selectedDomainCode,
        equipmentGroupId: selectedTypeId,
        equipmentTypeId: selectedNameId,
        equipmentNameId: selectedNameId,
        inspectionTypeCode: activeTemplate.inspection_type_code || null,
        isValidated: activeTemplate.is_validated ?? false,
        items: items.map((it, idx) => ({
          seq: idx + 1,
          section: it.section,
          label: it.label,
          inputType: it.input_type,
          unit: it.unit || null,
          minValue: it.min_value !== '' && it.min_value !== null ? Number(it.min_value) : null,
          maxValue: it.max_value !== '' && it.max_value !== null ? Number(it.max_value) : null,
          isRequired: it.is_required !== false,
          requiresNote: !!it.requires_note,
          requiresPhoto: !!it.requires_photo
        }))
      };

      await api.post('/inspections/templates', payload);
      await loadTemplate(selectedNameId, selectedDomainCode);
    } catch (err) {
      toast(err.response?.data?.error?.message || err.response?.data?.message || 'Gagal menyimpan perubahan template.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Publish New Version (Copy-on-Write)
  const handlePublishNewVersion = async () => {
    if (onPublishNewVersion) {
      onPublishNewVersion(selectedCategory || activeTemplate);
      return;
    }

    if (!activeTemplate?.id) return;
    const ok = await confirm({
      title: `Terbitkan Versi Baru [${activeTemplate.name}]`,
      message: `Anda akan menerbitkan versi baru untuk checklist ${currentNameObj?.name || 'unit ini'}. Versi sebelumnya (v${activeTemplate.active_version || 1}) akan diarsipkan secara utuh agar riksa uji historis tetap terlindungi.`,
      confirmLabel: 'Ya, Terbitkan Versi Baru',
      tone: 'default'
    });
    if (!ok) return;

    setSubmitting(true);
    try {
      await api.post(`/inspections/templates/${activeTemplate.id}/versions`);
      toast(`Versi baru checklist berhasil diterbitkan.`, 'success');
      await loadTemplate(selectedNameId, selectedDomainCode);
    } catch (err) {
      toast(err.response?.data?.error?.message || err.response?.data?.message || 'Gagal menerbitkan versi baru.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Load Version History
  const handleOpenHistory = async () => {
    if (!activeTemplate?.id) return;
    setHistoryModalOpen(true);
    try {
      setLoadingHistory(true);
      const res = await api.get(`/inspections/templates/${activeTemplate.id}/versions`);
      setVersionHistory(res.data?.versions || []);
    } catch {
      toast('Gagal memuat riwayat versi template.', 'error');
    } finally {
      setLoadingHistory(false);
    }
  };

  // =========================================================================
  // RENDER: BREADCRUMB COMPONENT
  // =========================================================================
  const renderBreadcrumb = () => (
    <nav aria-label="Hierarki Checklist" className="flex items-center gap-2 text-xs font-medium text-[#6E6E73] dark:text-[#98989D] overflow-x-auto scrollbar-none py-1">
      <button
        type="button"
        onClick={() => updateNav('', '', '')}
        className={`hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] transition-colors cursor-pointer whitespace-nowrap ${
          currentLevel === 1 ? 'font-bold text-[#1D1D1F] dark:text-[#F5F5F7]' : ''
        }`}
      >
        Katalog Riksa Uji
      </button>

      {selectedDomainCode && (
        <>
          <CaretRight size={12} className="text-[#86868B] shrink-0" />
          <button
            type="button"
            onClick={() => updateNav(selectedDomainCode, '', '')}
            className={`hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] transition-colors cursor-pointer whitespace-nowrap ${
              currentLevel === 2 ? 'font-bold text-[#1D1D1F] dark:text-[#F5F5F7]' : ''
            }`}
          >
            {selectedDomainCode}
          </button>
        </>
      )}

      {selectedTypeId && currentTypeObj && (
        <>
          <CaretRight size={12} className="text-[#86868B] shrink-0" />
          <button
            type="button"
            onClick={() => updateNav(selectedDomainCode, selectedTypeId, '')}
            className={`hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] transition-colors cursor-pointer whitespace-nowrap ${
              currentLevel === 3 ? 'font-bold text-[#1D1D1F] dark:text-[#F5F5F7]' : ''
            }`}
          >
            {currentTypeObj.name}
          </button>
        </>
      )}

      {selectedNameId && currentNameObj && (
        <>
          <CaretRight size={12} className="text-[#86868B] shrink-0" />
          <span className="font-bold text-[#1D1D1F] dark:text-[#F5F5F7] whitespace-nowrap">
            {currentNameObj.name}
          </span>
        </>
      )}
    </nav>
  );

  // =========================================================================
  // RENDER: LEVEL 1 — GRID: BIDANG RIKSA UJI (INSPECTION DOMAINS)
  // =========================================================================
  const renderLevel1DomainGrid = () => (
    <div className="space-y-5">
      {/* Level 1 Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-tight">
            Pilih Bidang Riksa Uji
          </h3>
          <p className="text-xs text-[#6E6E73] dark:text-[#98989D] mt-0.5">
            Pilih salah satu bidang riksa uji resmi untuk menjelajahi kelompok jenis alat dan checklist terkait.
          </p>
        </div>
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-60">
            <MagnifyingGlass size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#86868B]" />
            <input
              type="text"
              value={domainSearch}
              onChange={(e) => setDomainSearch(e.target.value)}
              placeholder="Cari bidang..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-black/[0.1] dark:border-white/[0.1] bg-white dark:bg-[#151821] text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#C81E1E]/20 focus:border-[#C81E1E]"
            />
          </div>
          <Button
            type="button"
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={handleOpenAddDomain}
          >
            Tambah Bidang
          </Button>
        </div>
      </div>

      {/* Grid: 3-4 cols desktop, 2-3 tablet, 1-2 mobile */}
      {loadingDomains ? (
        <div className="p-12 text-center text-xs text-[#86868B]">Memuat katalog bidang riksa uji...</div>
      ) : filteredDomains.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-black/[0.1] dark:border-white/[0.1] rounded-2xl bg-black/[0.01] dark:bg-white/[0.01]">
          <ShieldCheck size={36} className="mx-auto text-[#86868B] mb-2" />
          <p className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">Tidak ada bidang ditemukan</p>
          <p className="text-[11px] text-[#86868B] mt-0.5">Ubah kata kunci pencarian atau tambahkan bidang baru.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {filteredDomains.map((dm) => {
            const Icon = DOMAIN_ICON_MAP[dm.code] || ShieldCheck;
            return (
              <div
                key={dm.code}
                role="button"
                tabIndex={0}
                onClick={() => updateNav(dm.code, '', '')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    updateNav(dm.code, '', '');
                  }
                }}
                className="group relative flex flex-col justify-between p-4 rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#151821] hover:border-[#C81E1E]/40 hover:shadow-sm transition-all text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#C81E1E]"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="h-10 w-10 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] text-[#C81E1E] flex items-center justify-center shrink-0 group-hover:bg-[#C81E1E]/10 transition-colors">
                      <Icon size={22} weight="bold" />
                    </div>
                    <div className="flex items-center gap-1">
                      <ActionMenu
                        label="Opsi Bidang"
                        items={[
                          {
                            label: 'Ubah Informasi Bidang',
                            icon: PencilSimple,
                            onClick: () => handleOpenEditDomain(dm)
                          },
                          {
                            label: dm.is_active ? 'Nonaktifkan Bidang' : 'Aktifkan Bidang',
                            icon: ShieldCheck,
                            onClick: () => handleToggleDomainStatus(dm)
                          },
                          {
                            label: 'Hapus Bidang',
                            icon: Trash,
                            danger: true,
                            onClick: () => handleDeleteDomain(dm)
                          }
                        ]}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-black/[0.05] dark:bg-white/[0.08] text-[#1D1D1F] dark:text-[#F5F5F7]">
                        {dm.code}
                      </span>
                      {!dm.is_active && (
                        <Badge variant="secondary" size="sm" className="text-[10px]">Nonaktif</Badge>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-tight mt-1.5 leading-snug line-clamp-2">
                      {dm.name}
                    </h4>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between text-[11px] text-[#86868B]">
                  <span>{dm.total_types_count || 0} Jenis Alat</span>
                  <span className="flex items-center gap-0.5 font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] group-hover:text-[#C81E1E] transition-colors">
                    Buka <CaretRight size={12} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // =========================================================================
  // RENDER: LEVEL 2 — GRID: JENIS ALAT (EQUIPMENT TYPES)
  // =========================================================================
  const renderLevel2TypeGrid = () => (
    <div className="space-y-5">
      {/* Level 2 Navigation & Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            icon={ArrowLeft}
            onClick={() => updateNav('', '', '')}
            className="text-xs"
          >
            Kembali ke Bidang
          </Button>
          <div>
            <h3 className="text-base font-bold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-tight">
              Pilih Jenis Alat — Bidang {selectedDomainCode}
            </h3>
            <p className="text-xs text-[#6E6E73] dark:text-[#98989D] mt-0.5">
              {currentDomainObj?.name || selectedDomainCode} • {equipmentTypes.length} jenis alat terdaftar.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-60">
            <MagnifyingGlass size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#86868B]" />
            <input
              type="text"
              value={typeSearch}
              onChange={(e) => setTypeSearch(e.target.value)}
              placeholder="Cari jenis alat..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-black/[0.1] dark:border-white/[0.1] bg-white dark:bg-[#151821] text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#C81E1E]/20 focus:border-[#C81E1E]"
            />
          </div>
          <Button
            type="button"
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={handleOpenAddType}
          >
            Tambah Jenis Alat
          </Button>
        </div>
      </div>

      {/* Grid: 3-4 cols desktop, 2-3 tablet, 1-2 mobile */}
      {loadingTypes ? (
        <div className="p-12 text-center text-xs text-[#86868B]">Memuat daftar jenis alat...</div>
      ) : filteredTypes.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-black/[0.1] dark:border-white/[0.1] rounded-2xl bg-black/[0.01] dark:bg-white/[0.01] space-y-2">
          <Folder size={36} className="mx-auto text-[#86868B]" />
          <p className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">Belum ada jenis alat terdaftar</p>
          <p className="text-[11px] text-[#86868B]">Tambahkan jenis alat baru di bawah bidang {selectedDomainCode}.</p>
          <Button type="button" variant="primary" size="sm" icon={Plus} onClick={handleOpenAddType}>
            Tambah Jenis Alat
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {filteredTypes.map((t) => (
            <div
              key={t.id}
              role="button"
              tabIndex={0}
              onClick={() => updateNav(selectedDomainCode, t.id, '')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  updateNav(selectedDomainCode, t.id, '');
                }
              }}
              className="group relative flex flex-col justify-between p-4 rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#151821] hover:border-[#C81E1E]/40 hover:shadow-sm transition-all text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#C81E1E]"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="h-9 w-9 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center justify-center shrink-0 group-hover:bg-[#C81E1E]/10 group-hover:text-[#C81E1E] transition-colors">
                    <Folder size={20} weight="fill" />
                  </div>
                  <ActionMenu
                    label="Opsi Jenis Alat"
                    items={[
                      {
                        label: 'Ubah Jenis Alat',
                        icon: PencilSimple,
                        onClick: () => handleOpenEditType(t)
                      },
                      {
                        label: t.is_active ? 'Nonaktifkan' : 'Aktifkan',
                        icon: ShieldCheck,
                        onClick: () => handleToggleTypeStatus(t)
                      },
                      {
                        label: 'Hapus Jenis Alat',
                        icon: Trash,
                        danger: true,
                        onClick: () => handleDeleteType(t)
                      }
                    ]}
                  />
                </div>

                <div>
                  <h4 className="text-sm font-bold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-tight leading-snug">
                    {t.name}
                  </h4>
                  {t.code && (
                    <span className="font-mono text-[10px] text-[#86868B] block mt-0.5">
                      {t.code}
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between text-[11px] text-[#86868B]">
                <span>{t.total_types_count || t.total_names_count || 0} Nama Alat</span>
                <span className="flex items-center gap-0.5 font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] group-hover:text-[#C81E1E] transition-colors">
                  Buka <CaretRight size={12} />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // =========================================================================
  // RENDER: LEVEL 3 — GRID: NAMA ALAT (EQUIPMENT NAMES)
  // =========================================================================
  const renderLevel3NameGrid = () => (
    <div className="space-y-5">
      {/* Level 3 Navigation & Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            icon={ArrowLeft}
            onClick={() => updateNav(selectedDomainCode, '', '')}
            className="text-xs"
          >
            Kembali ke Jenis Alat
          </Button>
          <div>
            <h3 className="text-base font-bold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-tight">
              Pilih Nama Alat — {currentTypeObj?.name}
            </h3>
            <p className="text-xs text-[#6E6E73] dark:text-[#98989D] mt-0.5">
              Bidang: {selectedDomainCode} › {currentTypeObj?.name} • {equipmentNames.length} unit terdaftar.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-60">
            <MagnifyingGlass size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#86868B]" />
            <input
              type="text"
              value={nameSearch}
              onChange={(e) => setNameSearch(e.target.value)}
              placeholder="Cari nama alat..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-black/[0.1] dark:border-white/[0.1] bg-white dark:bg-[#151821] text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#C81E1E]/20 focus:border-[#C81E1E]"
            />
          </div>
          <Button
            type="button"
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={handleOpenAddName}
          >
            Tambah Nama Alat
          </Button>
        </div>
      </div>

      {/* Grid: 3-4 cols desktop, 2-3 tablet, 1-2 mobile */}
      {loadingNames ? (
        <div className="p-12 text-center text-xs text-[#86868B]">Memuat daftar nama alat...</div>
      ) : filteredNames.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-black/[0.1] dark:border-white/[0.1] rounded-2xl bg-black/[0.01] dark:bg-white/[0.01] space-y-2">
          <Cube size={36} className="mx-auto text-[#86868B]" />
          <p className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">Belum ada nama alat terdaftar</p>
          <p className="text-[11px] text-[#86868B]">Tambahkan nama unit alat baru di bawah kelompok {currentTypeObj?.name}.</p>
          <Button type="button" variant="primary" size="sm" icon={Plus} onClick={handleOpenAddName}>
            Tambah Nama Alat
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {filteredNames.map((n) => (
            <div
              key={n.id}
              role="button"
              tabIndex={0}
              onClick={() => updateNav(selectedDomainCode, selectedTypeId, n.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  updateNav(selectedDomainCode, selectedTypeId, n.id);
                }
              }}
              className="group relative flex flex-col justify-between p-4 rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#151821] hover:border-[#C81E1E]/40 hover:shadow-sm transition-all text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#C81E1E]"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="h-8 w-8 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] text-[#C81E1E] flex items-center justify-center shrink-0">
                    <ListChecks size={18} weight="bold" />
                  </div>
                  <ActionMenu
                    label="Opsi Nama Alat"
                    items={[
                      {
                        label: 'Ubah Nama Alat',
                        icon: PencilSimple,
                        onClick: () => handleOpenEditName(n)
                      },
                      {
                        label: n.is_active ? 'Nonaktifkan' : 'Aktifkan',
                        icon: ShieldCheck,
                        onClick: () => handleToggleNameStatus(n)
                      },
                      {
                        label: 'Hapus Nama Alat',
                        icon: Trash,
                        danger: true,
                        onClick: () => handleDeleteName(n)
                      }
                    ]}
                  />
                </div>

                <div>
                  <h4 className="text-xs font-bold font-mono tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7] leading-snug break-words">
                    {n.name}
                  </h4>
                  {n.code && n.code !== n.name && (
                    <span className="font-mono text-[10px] text-[#86868B] block mt-0.5">
                      {n.code}
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-2.5 mt-2.5 border-t border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between text-[11px]">
                <span className="text-[#86868B]">Checklist</span>
                <span className="flex items-center gap-0.5 font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] group-hover:text-[#C81E1E] transition-colors">
                  Atur Form <CaretRight size={12} />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // =========================================================================
  // RENDER: LEVEL 4 — DEDICATED CHECKLIST WORKSPACE (TWO-COLUMN DESKTOP)
  // =========================================================================
  const renderLevel4ChecklistWorkspace = () => {
    if (loadingTemplate) {
      return <div className="p-12 text-center text-xs text-[#86868B]">Memuat konfigurasi checklist pemeriksaan...</div>;
    }

    if (!activeTemplate && effectiveItems.length === 0) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              icon={ArrowLeft}
              onClick={() => updateNav(selectedDomainCode, selectedTypeId, '')}
              className="text-xs"
            >
              Kembali ke Daftar Nama Alat
            </Button>
          </div>

          <div className="p-10 text-center border border-dashed border-black/[0.1] dark:border-white/[0.1] rounded-2xl bg-black/[0.01] dark:bg-white/[0.01] space-y-3">
            <ListChecks size={40} className="mx-auto text-[#86868B]" weight="light" />
            <div>
              <h4 className="text-sm font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
                Belum Ada Checklist Khusus untuk {currentNameObj?.name || 'Unit Ini'}
              </h4>
              <p className="text-xs text-[#6E6E73] dark:text-[#98989D] max-w-md mx-auto mt-1">
                Pemeriksaan teknis lapangan untuk {currentNameObj?.name} memerlukan formulir checklist khusus yang independen dari unit lainnya.
              </p>
            </div>
            <Button
              type="button"
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={handleOpenInitTemplate}
            >
              Inisialisasi Checklist Khusus {currentNameObj?.name}
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-5">
        {/* Top Context Header Bar */}
        <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={ArrowLeft}
              onClick={() => updateNav(selectedDomainCode, selectedTypeId, '')}
              className="text-xs shrink-0"
            >
              Kembali
            </Button>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
                  {activeTemplate?.name || selectedCategory?.name || `Checklist ${currentNameObj?.name}`}
                </span>
                <Badge variant="default" size="sm">
                  Versi {activeTemplate?.active_version || selectedCategory?.active_version_no || 1} (AKTIF)
                </Badge>
                {(activeTemplate?.is_validated || selectedCategory?.is_validated) && (
                  <Badge variant="success" size="sm">
                    Tervalidasi Ahli K3
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-[#6E6E73] dark:text-[#98989D] mt-0.5">
                Bidang: <strong className="text-[#1D1D1F] dark:text-[#F5F5F7]">{selectedDomainCode}</strong> •
                Jenis Alat: <strong className="text-[#1D1D1F] dark:text-[#F5F5F7]">{currentTypeObj?.name || 'Kelompok'}</strong> •
                Nama Alat: <strong className="text-[#1D1D1F] dark:text-[#F5F5F7]">{currentNameObj?.name || 'Unit'}</strong> •
                Total {effectiveItems.length} butir pertanyaan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              icon={Eye}
              onClick={() => setPreviewModalOpen(true)}
            >
              Pratinjau
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              icon={ClockCounterClockwise}
              onClick={handleOpenHistory}
            >
              Riwayat Versi
            </Button>
            <Button
              type="button"
              size="sm"
              variant="primary"
              icon={GitBranch}
              disabled={submitting || publishingVersion}
              onClick={handlePublishNewVersion}
            >
              Terbitkan Versi Baru
            </Button>
          </div>
        </div>

        {/* Two-Column Workspace (Desktop) / Accordion (Mobile) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
          {/* Left Column: Sections Panel (Width: 4/12 md, 3/12 lg) */}
          <div className="md:col-span-4 lg:col-span-3 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7] uppercase tracking-wider">
                Bagian Pemeriksaan ({sectionsList.length})
              </h4>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                icon={Plus}
                onClick={handleOpenAddSection}
                title="Tambah Bagian Baru"
              />
            </div>

            <div className="space-y-1.5">
              {sectionsList.map((sec) => {
                const count = effectiveItems.filter((i) => i.section === sec).length;
                const isSelected = activeSection === sec;
                return (
                  <div
                    key={sec}
                    role="button"
                    tabIndex={0}
                    onClick={() => setActiveSection(sec)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setActiveSection(sec);
                      }
                    }}
                    className={`group w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-black/[0.06] dark:bg-white/[0.08] border-black/[0.12] dark:border-white/[0.12] text-[#1D1D1F] dark:text-[#F5F5F7] font-semibold'
                        : 'bg-white dark:bg-[#151821] border-black/[0.05] dark:border-white/[0.05] text-[#6E6E73] dark:text-[#98989D] hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs truncate">{sec}</p>
                      <span className="text-[10px] text-[#86868B] block mt-0.5">
                        {count} butir
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <ActionMenu
                        label="Opsi Bagian"
                        items={[
                          {
                            label: 'Ubah Nama Bagian',
                            icon: PencilSimple,
                            onClick: () => handleOpenEditSection(sec)
                          },
                          {
                            label: 'Hapus Bagian',
                            icon: Trash,
                            danger: true,
                            onClick: () => handleDeleteSection(sec)
                          }
                        ]}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Items Table / Workspace (Width: 8/12 md, 9/12 lg) */}
          <div className="md:col-span-8 lg:col-span-9 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.06]">
              <div>
                <h4 className="text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
                  {activeSection}
                </h4>
                <p className="text-[11px] text-[#86868B] mt-0.5">
                  {itemsInActiveSection.length} butir pertanyaan pada bagian ini.
                </p>
              </div>
              <Button
                type="button"
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={handleOpenCreateItem}
              >
                Tambah Butir Pemeriksaan
              </Button>
            </div>

            {/* Items List */}
            {itemsInActiveSection.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-black/[0.1] dark:border-white/[0.1] rounded-xl bg-black/[0.01] dark:bg-white/[0.01] space-y-2">
                <p className="text-xs text-[#86868B]">Belum ada butir pertanyaan pada bagian ini.</p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={Plus}
                  onClick={handleOpenCreateItem}
                >
                  Tambah Butir Pertama
                </Button>
              </div>
            ) : (
              <div className="border border-black/[0.08] dark:border-white/[0.08] rounded-xl overflow-hidden bg-white dark:bg-[#151821]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-black/[0.02] dark:bg-white/[0.02] border-b border-black/[0.06] dark:border-white/[0.06] text-[#6E6E73] dark:text-[#98989D]">
                      <tr>
                        <th className="py-2.5 px-3 w-10 text-center">No</th>
                        <th className="py-2.5 px-3">Pertanyaan / Parameter Uji</th>
                        <th className="py-2.5 px-3 w-32">Tipe Input</th>
                        <th className="py-2.5 px-3 w-32">Standar / Satuan</th>
                        <th className="py-2.5 px-3 w-28 text-center">Ketentuan</th>
                        <th className="py-2.5 px-3 w-24 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                      {itemsInActiveSection.map((it, idx) => (
                        <tr key={it.seq || idx} className="hover:bg-black/[0.01] dark:hover:bg-white/[0.01]">
                          <td className="py-2.5 px-3 text-center font-mono text-[#86868B]">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">
                            {it.label}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-[#6E6E73] dark:text-[#98989D]">
                            <span className="px-1.5 py-0.5 rounded bg-black/[0.04] dark:bg-white/[0.06]">
                              {it.input_type}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-[#6E6E73] dark:text-[#98989D]">
                            {it.min_value !== null || it.max_value !== null ? (
                              <span>
                                {it.min_value ?? '-'} s/d {it.max_value ?? '-'} {it.unit}
                              </span>
                            ) : it.unit ? (
                              <span>Satuan: {it.unit}</span>
                            ) : (
                              <span className="text-[#86868B]">-</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {it.is_required && (
                                <Badge variant="danger" size="sm" className="text-[10px]">Wajib</Badge>
                              )}
                              {it.requires_photo && (
                                <Badge variant="info" size="sm" className="text-[10px]">Foto</Badge>
                              )}
                              {it.requires_note && (
                                <Badge variant="warning" size="sm" className="text-[10px]">Note</Badge>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveItem(it.seq, 'UP')}
                                className="p-1 rounded text-[#86868B] hover:text-[#1D1D1F] disabled:opacity-30 cursor-pointer"
                                title="Geser ke Atas"
                              >
                                <ArrowUp size={13} />
                              </button>
                              <button
                                type="button"
                                disabled={idx === itemsInActiveSection.length - 1}
                                onClick={() => handleMoveItem(it.seq, 'DOWN')}
                                className="p-1 rounded text-[#86868B] hover:text-[#1D1D1F] disabled:opacity-30 cursor-pointer"
                                title="Geser ke Bawah"
                              >
                                <ArrowDown size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEditItem(it)}
                                className="p-1 rounded text-[#6E6E73] hover:text-[#1D1D1F] cursor-pointer"
                                title="Edit Butir"
                              >
                                <PencilSimple size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteItem(it.seq)}
                                className="p-1 rounded text-[#C81E1E] hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                                title="Hapus Butir"
                              >
                                <Trash size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // =========================================================================
  // MAIN RETURN
  // =========================================================================
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ListChecks size={22} className="text-[#C81E1E]" weight="bold" />
              <CardTitle>Master 7 Bidang K3 & Dynamic Checklist Builder (Per Nama Alat)</CardTitle>
            </div>
            <CardDescription>
              Navigasi hierarkis 4 tingkat untuk mengonfigurasi formulir riksa uji teknis secara database-driven.
            </CardDescription>
          </div>
        </div>

        {/* Global Breadcrumb Navigation */}
        <div className="pt-2 border-t border-black/[0.04] dark:border-white/[0.04]">
          {renderBreadcrumb()}
        </div>
      </CardHeader>

      <CardContent>
        {currentLevel === 1 && renderLevel1DomainGrid()}
        {currentLevel === 2 && renderLevel2TypeGrid()}
        {currentLevel === 3 && renderLevel3NameGrid()}
        {currentLevel === 4 && renderLevel4ChecklistWorkspace()}
      </CardContent>

      {/* =====================================================================
          MODAL DIALOGS
      ====================================================================== */}

      {/* 1. Modal: Tambah/Edit Bidang */}
      <Modal
        open={domainModal.open}
        onClose={() => setDomainModal({ open: false, mode: 'create', data: null })}
        title={domainModal.mode === 'create' ? 'Tambah Bidang Riksa Uji' : `Ubah Bidang [${domainModal.data?.code}]`}
        description="Konfigurasi bidang riksa uji resmi PJK3 URD."
        size="md"
      >
        <form onSubmit={handleSaveDomain} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] mb-1">
              Kode Bidang (Singkatan Resmi) *
            </label>
            <input
              type="text"
              required
              disabled={domainModal.mode === 'edit'}
              value={domainModal.data?.code || ''}
              onChange={(e) =>
                setDomainModal((prev) => ({
                  ...prev,
                  data: { ...prev.data, code: e.target.value.toUpperCase() }
                }))
              }
              placeholder="Contoh: PAPA, PUBT, PTP..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-black/[0.12] dark:border-white/[0.12] bg-white dark:bg-[#151821] text-[#1D1D1F] dark:text-[#F5F5F7] font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#C81E1E]/20 focus:border-[#C81E1E] disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] mb-1">
              Nama Lengkap Bidang Riksa Uji *
            </label>
            <input
              type="text"
              required
              value={domainModal.data?.name || ''}
              onChange={(e) =>
                setDomainModal((prev) => ({
                  ...prev,
                  data: { ...prev.data, name: e.target.value }
                }))
              }
              placeholder="Contoh: Pesawat Angkat & Angkut"
              className="w-full px-3 py-2 text-xs rounded-lg border border-black/[0.12] dark:border-white/[0.12] bg-white dark:bg-[#151821] text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#C81E1E]/20 focus:border-[#C81E1E]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] mb-1">
              Deskripsi / Ruang Lingkup Standar
            </label>
            <textarea
              rows={2}
              value={domainModal.data?.description || ''}
              onChange={(e) =>
                setDomainModal((prev) => ({
                  ...prev,
                  data: { ...prev.data, description: e.target.value }
                }))
              }
              placeholder="Opsional: Dasar hukum Permenaker, ruang lingkup riksa uji..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-black/[0.12] dark:border-white/[0.12] bg-white dark:bg-[#151821] text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#C81E1E]/20 focus:border-[#C81E1E]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setDomainModal({ open: false, mode: 'create', data: null })}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={submitting}>
              {submitting ? 'Menyimpan...' : 'Simpan Bidang'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 2. Modal: Tambah/Edit Jenis Alat */}
      <Modal
        open={typeModal.open}
        onClose={() => setTypeModal({ open: false, mode: 'create', data: null })}
        title={typeModal.mode === 'create' ? 'Tambah Jenis Alat Baru' : `Ubah Jenis Alat [${typeModal.data?.name}]`}
        description={`Kategori alat di bawah bidang ${selectedDomainCode}`}
        size="md"
      >
        <form onSubmit={handleSaveType} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] mb-1">
              Nama Jenis Alat *
            </label>
            <input
              type="text"
              required
              value={typeModal.data?.name || ''}
              onChange={(e) =>
                setTypeModal((prev) => ({
                  ...prev,
                  data: {
                    ...prev.data,
                    name: e.target.value,
                    code: prev.mode === 'create'
                      ? `GRP_${selectedDomainCode}_${e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`
                      : prev.data.code
                  }
                }))
              }
              placeholder="Contoh: Forklift, Mobile Crane..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-black/[0.12] dark:border-white/[0.12] bg-white dark:bg-[#151821] text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#C81E1E]/20 focus:border-[#C81E1E]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] mb-1">
              Kode Unik Jenis Alat *
            </label>
            <input
              type="text"
              required
              value={typeModal.data?.code || ''}
              onChange={(e) =>
                setTypeModal((prev) => ({
                  ...prev,
                  data: { ...prev.data, code: e.target.value.toUpperCase() }
                }))
              }
              className="w-full px-3 py-2 text-xs rounded-lg border border-black/[0.12] dark:border-white/[0.12] bg-white dark:bg-[#151821] text-[#1D1D1F] dark:text-[#F5F5F7] font-mono focus:outline-none focus:ring-2 focus:ring-[#C81E1E]/20 focus:border-[#C81E1E]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] mb-1">
              Deskripsi Jenis Alat
            </label>
            <textarea
              rows={2}
              value={typeModal.data?.description || ''}
              onChange={(e) =>
                setTypeModal((prev) => ({
                  ...prev,
                  data: { ...prev.data, description: e.target.value }
                }))
              }
              placeholder="Opsional: Keterangan cakupan unit..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-black/[0.12] dark:border-white/[0.12] bg-white dark:bg-[#151821] text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#C81E1E]/20 focus:border-[#C81E1E]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setTypeModal({ open: false, mode: 'create', data: null })}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={submitting}>
              {submitting ? 'Menyimpan...' : 'Simpan Jenis Alat'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 3. Modal: Tambah/Edit Nama Alat */}
      <Modal
        open={nameModal.open}
        onClose={() => setNameModal({ open: false, mode: 'create', data: null })}
        title={nameModal.mode === 'create' ? 'Tambah Nama Alat Baru' : `Ubah Nama Alat [${nameModal.data?.name}]`}
        description={`Unit spesifik di bawah kelompok ${currentTypeObj?.name}`}
        size="md"
      >
        <form onSubmit={handleSaveName} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] mb-1">
              Nama Resmi Alat *
            </label>
            <input
              type="text"
              required
              value={nameModal.data?.name || ''}
              onChange={(e) =>
                setNameModal((prev) => ({
                  ...prev,
                  data: {
                    ...prev.data,
                    name: e.target.value.toUpperCase(),
                    code: prev.mode === 'create'
                      ? e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '_')
                      : prev.data.code
                  }
                }))
              }
              placeholder="Contoh: FORKLIFT, REACH STACKER..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-black/[0.12] dark:border-white/[0.12] bg-white dark:bg-[#151821] text-[#1D1D1F] dark:text-[#F5F5F7] uppercase font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#C81E1E]/20 focus:border-[#C81E1E]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] mb-1">
              Kode Nama Alat *
            </label>
            <input
              type="text"
              required
              value={nameModal.data?.code || ''}
              onChange={(e) =>
                setNameModal((prev) => ({
                  ...prev,
                  data: { ...prev.data, code: e.target.value.toUpperCase() }
                }))
              }
              className="w-full px-3 py-2 text-xs rounded-lg border border-black/[0.12] dark:border-white/[0.12] bg-white dark:bg-[#151821] text-[#1D1D1F] dark:text-[#F5F5F7] font-mono focus:outline-none focus:ring-2 focus:ring-[#C81E1E]/20 focus:border-[#C81E1E]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] mb-1">
              Deskripsi Teknis Unit
            </label>
            <textarea
              rows={2}
              value={nameModal.data?.description || ''}
              onChange={(e) =>
                setNameModal((prev) => ({
                  ...prev,
                  data: { ...prev.data, description: e.target.value }
                }))
              }
              placeholder="Opsional: Batasan kapasitas, standar uji..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-black/[0.12] dark:border-white/[0.12] bg-white dark:bg-[#151821] text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#C81E1E]/20 focus:border-[#C81E1E]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setNameModal({ open: false, mode: 'create', data: null })}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={submitting}>
              {submitting ? 'Menyimpan...' : 'Simpan Nama Alat'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 4. Modal: Tambah/Edit Bagian Pemeriksaan (Section) */}
      <Modal
        open={sectionModal.open}
        onClose={() => setSectionModal({ open: false, mode: 'create', originalName: '', name: '' })}
        title={sectionModal.mode === 'create' ? 'Tambah Bagian Pemeriksaan' : 'Ubah Nama Bagian'}
        description="Kelompok pertanyaan pemeriksaan teknis."
        size="sm"
      >
        <form onSubmit={handleSaveSection} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] mb-1">
              Nama Bagian *
            </label>
            <input
              type="text"
              required
              value={sectionModal.name}
              onChange={(e) => setSectionModal((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Contoh: Pemeriksaan Visual, Uji Beban..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-black/[0.12] dark:border-white/[0.12] bg-white dark:bg-[#151821] text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#C81E1E]/20 focus:border-[#C81E1E]"
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setSectionModal({ open: false, mode: 'create', originalName: '', name: '' })}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Simpan Bagian
            </Button>
          </div>
        </form>
      </Modal>

      {/* 5. Modal: Tambah/Edit Butir Pemeriksaan */}
      <Modal
        open={itemModal.open}
        onClose={() => setItemModal({ open: false, mode: 'create', item: null })}
        title={itemModal.mode === 'create' ? 'Tambah Butir Pemeriksaan' : 'Edit Butir Pemeriksaan'}
        description={`Bagian: ${itemForm.section}`}
        size="md"
      >
        <form onSubmit={handleSaveItem} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] mb-1">
              Bagian Pemeriksaan *
            </label>
            <select
              value={itemForm.section}
              onChange={(e) => setItemForm({ ...itemForm, section: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-black/[0.12] dark:border-white/[0.12] bg-white dark:bg-[#151821] text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#C81E1E]/20 focus:border-[#C81E1E]"
            >
              {sectionsList.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] mb-1">
              Pertanyaan / Label Pemeriksaan *
            </label>
            <textarea
              required
              rows={2}
              value={itemForm.label}
              onChange={(e) => setItemForm({ ...itemForm, label: e.target.value })}
              placeholder="Contoh: Kondisi rem pengaman dan rantai pengangkat..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-black/[0.12] dark:border-white/[0.12] bg-white dark:bg-[#151821] text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#C81E1E]/20 focus:border-[#C81E1E]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] mb-1">
                Tipe Input *
              </label>
              <select
                value={itemForm.input_type}
                onChange={(e) => setItemForm({ ...itemForm, input_type: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-black/[0.12] dark:border-white/[0.12] bg-white dark:bg-[#151821] text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#C81E1E]/20 focus:border-[#C81E1E]"
              >
                {INPUT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] mb-1">
                Satuan Ukuran (Opsional)
              </label>
              <input
                type="text"
                value={itemForm.unit}
                onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                placeholder="Contoh: bar, mm, Volt, ton..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-black/[0.12] dark:border-white/[0.12] bg-white dark:bg-[#151821] text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#C81E1E]/20 focus:border-[#C81E1E]"
              />
            </div>
          </div>

          {itemForm.input_type === 'NUMBER' && (
            <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.06]">
              <div>
                <label className="block text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] mb-1">
                  Nilai Batas Minimum
                </label>
                <input
                  type="number"
                  step="any"
                  value={itemForm.min_value}
                  onChange={(e) => setItemForm({ ...itemForm, min_value: e.target.value })}
                  placeholder="Opsional"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-black/[0.12] dark:border-white/[0.12] bg-white dark:bg-[#151821] text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#C81E1E]/20 focus:border-[#C81E1E]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] mb-1">
                  Nilai Batas Maksimum
                </label>
                <input
                  type="number"
                  step="any"
                  value={itemForm.max_value}
                  onChange={(e) => setItemForm({ ...itemForm, max_value: e.target.value })}
                  placeholder="Opsional"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-black/[0.12] dark:border-white/[0.12] bg-white dark:bg-[#151821] text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#C81E1E]/20 focus:border-[#C81E1E]"
                />
              </div>
            </div>
          )}

          <div className="space-y-2 pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={itemForm.is_required}
                onChange={(e) => setItemForm({ ...itemForm, is_required: e.target.checked })}
                className="rounded border-gray-300 text-[#C81E1E] focus:ring-[#C81E1E]"
              />
              <span className="text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">
                Wajib Diisi oleh Ahli K3
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={itemForm.requires_photo}
                onChange={(e) => setItemForm({ ...itemForm, requires_photo: e.target.checked })}
                className="rounded border-gray-300 text-[#C81E1E] focus:ring-[#C81E1E]"
              />
              <span className="text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">
                Wajib Melampirkan Bukti Foto Lapangan
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={itemForm.requires_note}
                onChange={(e) => setItemForm({ ...itemForm, requires_note: e.target.checked })}
                className="rounded border-gray-300 text-[#C81E1E] focus:ring-[#C81E1E]"
              />
              <span className="text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">
                Wajib Memberikan Catatan Temuan Teknis jika Tidak Sesuai
              </span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setItemModal({ open: false, mode: 'create', item: null })}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={submitting}>
              {submitting ? 'Menyimpan...' : 'Simpan Butir'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 6. Modal: Inisialisasi Checklist Baru */}
      <Modal
        open={initTemplateModal.open}
        onClose={() => setInitTemplateModal({ open: false, name: '' })}
        title={`Inisialisasi Checklist: ${currentNameObj?.name}`}
        description="Buat formulir checklist mandiri untuk unit alat ini."
        size="md"
      >
        <form onSubmit={handleCreateNewTemplate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] mb-1">
              Nama Template Checklist *
            </label>
            <input
              type="text"
              required
              value={initTemplateModal.name}
              onChange={(e) => setInitTemplateModal((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 text-xs rounded-lg border border-black/[0.12] dark:border-white/[0.12] bg-white dark:bg-[#151821] text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#C81E1E]/20 focus:border-[#C81E1E]"
            />
          </div>

          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/30 text-xs text-emerald-800 dark:text-emerald-300">
            Sistem akan menyusun 4 butir pertanyaan awal (pemeriksaan fisik/nameplate, bebas kebocoran, tekanan kerja, dan rem darurat). Anda dapat mengubah, menambah, atau menyusun bagian baru setelah inisialisasi.
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setInitTemplateModal({ open: false, name: '' })}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={submitting}>
              {submitting ? 'Membuat...' : 'Buat Checklist'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 7. Modal: Pratinjau Form Lapangan Ahli K3 */}
      <Modal
        open={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        title={`Pratinjau Lapangan: ${activeTemplate?.name || currentNameObj?.name}`}
        description="Simulasi tampilan formulir digital yang diisi Ahli K3 saat riksa uji."
        size="lg"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between text-xs">
            <div>
              <p className="font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                Unit Target: {currentNameObj?.name || 'Unit Alat'}
              </p>
              <p className="text-[#86868B]">{selectedDomainCode} › {currentTypeObj?.name}</p>
            </div>
            <Badge variant="default" size="sm">
              Versi {activeTemplate?.active_version || 1}
            </Badge>
          </div>

          <div className="space-y-3">
            {effectiveItems.map((it, idx) => (
              <div
                key={it.seq || idx}
                className="p-3 rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-[#151821] space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-[#86868B]">
                      {it.section} • Butir #{idx + 1}
                    </span>
                    <h5 className="text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
                      {it.label} {it.is_required && <span className="text-rose-500">*</span>}
                    </h5>
                  </div>
                  <Badge variant="secondary" size="sm" className="text-[10px]">
                    {it.input_type}
                  </Badge>
                </div>

                {/* Input Simulation */}
                {it.input_type === 'CHOICE' && (
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold cursor-pointer"
                    >
                      ✓ Sesuai (Memenuhi Syarat K3)
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-lg border border-black/[0.1] dark:border-white/[0.1] text-xs font-semibold text-[#6E6E73] dark:text-[#98989D] cursor-pointer"
                    >
                      ✕ Tidak Sesuai
                    </button>
                  </div>
                )}

                {it.input_type === 'NUMBER' && (
                  <div className="flex items-center gap-2 pt-1 max-w-xs">
                    <input
                      type="number"
                      placeholder={`Standar: ${it.min_value ?? '-'} s/d ${it.max_value ?? '-'}`}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-black/[0.12] dark:border-white/[0.12] bg-white dark:bg-[#151821] text-[#1D1D1F] dark:text-[#F5F5F7]"
                      disabled
                    />
                    {it.unit && <span className="text-xs font-mono text-[#86868B]">{it.unit}</span>}
                  </div>
                )}

                {it.requires_photo && (
                  <div className="p-2 rounded-lg border border-dashed border-black/[0.12] dark:border-white/[0.12] text-center text-[11px] text-[#86868B] bg-black/[0.01] dark:bg-white/[0.01]">
                    📷 Lampiran foto bukti fisik di lokasi wajib diunggah
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setPreviewModalOpen(false)}
            >
              Tutup Pratinjau
            </Button>
          </div>
        </div>
      </Modal>

      {/* 8. Modal: Riwayat Versi Template */}
      <Modal
        open={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        title={`Riwayat Versi Checklist: ${activeTemplate?.name || currentNameObj?.name}`}
        description="Rekam jejak versi template. Riksa uji historis tetap terkunci pada versi masing-masing."
        size="md"
      >
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {loadingHistory ? (
            <p className="text-center py-4 text-xs text-[#86868B]">Memuat riwayat versi...</p>
          ) : versionHistory.length === 0 ? (
            <p className="text-center py-4 text-xs text-[#86868B]">Belum ada riwayat versi.</p>
          ) : (
            versionHistory.map((ver) => (
              <div
                key={ver.id}
                className={`p-3 rounded-xl border ${
                  ver.status === 'AKTIF'
                    ? 'border-emerald-500/40 bg-emerald-50/20 dark:bg-emerald-950/20'
                    : 'border-black/[0.06] dark:border-white/[0.06] bg-black/[0.01] dark:bg-white/[0.01]'
                } flex items-center justify-between`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
                      Versi {ver.version}
                    </span>
                    <Badge variant={ver.status === 'AKTIF' ? 'success' : 'secondary'} size="sm">
                      {ver.status}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-[#86868B] mt-0.5">
                    {ver.item_count || 0} butir pertanyaan • Digunakan oleh {ver.inspection_count || 0} riksa uji
                  </p>
                </div>
                <div className="text-right text-[11px] text-[#86868B]">
                  Diterbitkan oleh: <br />
                  <strong className="text-[#1D1D1F] dark:text-[#F5F5F7]">{ver.created_by_name || 'Admin Sistem'}</strong>
                </div>
              </div>
            ))
          )}
          <div className="flex justify-end pt-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setHistoryModalOpen(false)}
            >
              Tutup
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}
