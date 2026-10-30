import { useRef, useState } from 'react';
import { api } from '../../../lib/api/axios.js';

export function useInspectionSignatures({ activeDetail, user, setError, setFeedback, openDetail }) {
  const [inspectorSigName, setInspectorSigName] = useState(user?.fullName || 'Ir. Budi Santoso');
  const [inspectorSigTitle, setInspectorSigTitle] = useState('Ahli K3 Spesialis');
  const [clientSigName, setClientSigName] = useState('');
  const [clientSigTitle, setClientSigTitle] = useState('Pemilik Alat / PIC Klien');
  const [reSigningInspector, setReSigningInspector] = useState(false);
  const [reSigningClient, setReSigningClient] = useState(false);

  const inspectorCanvasRef = useRef(null);
  const clientCanvasRef = useRef(null);
  const isDrawingInspectorRef = useRef(false);
  const isDrawingClientRef = useRef(false);
  const [hasDrawnInspectorSig, setHasDrawnInspectorSig] = useState(false);
  const [hasDrawnClientSig, setHasDrawnClientSig] = useState(false);

  const initSignatures = (data) => {
    setInspectorSigName(user?.fullName || 'Ir. Budi Santoso');
    setInspectorSigTitle('Ahli K3 Spesialis');
    setClientSigName(data.inspection?.contact_name || '');
    setClientSigTitle('Pemilik Alat / PIC Klien');
    setHasDrawnInspectorSig(false);
    setHasDrawnClientSig(false);
    setReSigningInspector(false);
    setReSigningClient(false);
  };

  const clearInspectorCanvas = () => {
    const canvas = inspectorCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawnInspectorSig(false);
  };

  const handleInspectorPointerDown = (e) => {
    const canvas = inspectorCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    isDrawingInspectorRef.current = true;
    setHasDrawnInspectorSig(true);
  };

  const handleInspectorPointerMove = (e) => {
    if (!isDrawingInspectorRef.current) return;
    const canvas = inspectorCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const handleInspectorPointerUp = () => {
    isDrawingInspectorRef.current = false;
  };

  const handleSaveInspectorSignature = async (setSubmitting) => {
    if (!activeDetail?.inspection || !inspectorSigName.trim()) {
      setError('Nama Ahli K3 / Inspector wajib diisi.');
      return;
    }
    const canvas = inspectorCanvasRef.current;
    if (!canvas || !hasDrawnInspectorSig) {
      setError('Silakan goreskan tanda tangan Ahli K3 pada kotak kanvas terlebih dahulu.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const dataUrl = canvas.toDataURL('image/png');
      await api.post(`/inspections/${activeDetail.inspection.id}/signatures`, {
        signerRole: 'AHLI_K3',
        signerName: inspectorSigName.trim(),
        signerTitle: inspectorSigTitle.trim() || 'Ahli K3 Spesialis',
        dataUrl
      });
      clearInspectorCanvas();
      setReSigningInspector(false);
      setFeedback('Tanda tangan digital Ahli K3 / Inspector berhasil disimpan.');
      await openDetail(activeDetail.inspection.id);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan tanda tangan digital Ahli K3.');
    } finally {
      setSubmitting(false);
    }
  };

  const clearClientCanvas = () => {
    const canvas = clientCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawnClientSig(false);
  };

  const handleClientPointerDown = (e) => {
    const canvas = clientCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    isDrawingClientRef.current = true;
    setHasDrawnClientSig(true);
  };

  const handleClientPointerMove = (e) => {
    if (!isDrawingClientRef.current) return;
    const canvas = clientCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const handleClientPointerUp = () => {
    isDrawingClientRef.current = false;
  };

  const handleSaveClientSignature = async (setSubmitting) => {
    if (!activeDetail?.inspection || !clientSigName.trim()) {
      setError('Nama PIC Perusahaan / Klien wajib diisi.');
      return;
    }
    const canvas = clientCanvasRef.current;
    if (!canvas || !hasDrawnClientSig) {
      setError('Silakan goreskan tanda tangan PIC Klien pada kotak kanvas terlebih dahulu.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const dataUrl = canvas.toDataURL('image/png');
      await api.post(`/inspections/${activeDetail.inspection.id}/signatures`, {
        signerRole: 'PERWAKILAN_KLIEN',
        signerName: clientSigName.trim(),
        signerTitle: clientSigTitle.trim() || 'Pemilik Alat / PIC Klien',
        dataUrl
      });
      clearClientCanvas();
      setReSigningClient(false);
      setFeedback('Tanda tangan digital PIC Klien / Pemilik Alat berhasil disimpan.');
      await openDetail(activeDetail.inspection.id);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan tanda tangan digital PIC Klien.');
    } finally {
      setSubmitting(false);
    }
  };

  return {
    inspectorSigName,
    setInspectorSigName,
    inspectorSigTitle,
    setInspectorSigTitle,
    clientSigName,
    setClientSigName,
    clientSigTitle,
    setClientSigTitle,
    reSigningInspector,
    setReSigningInspector,
    reSigningClient,
    setReSigningClient,
    inspectorCanvasRef,
    clientCanvasRef,
    hasDrawnInspectorSig,
    hasDrawnClientSig,
    initSignatures,
    clearInspectorCanvas,
    handleInspectorPointerDown,
    handleInspectorPointerMove,
    handleInspectorPointerUp,
    handleSaveInspectorSignature,
    clearClientCanvas,
    handleClientPointerDown,
    handleClientPointerMove,
    handleClientPointerUp,
    handleSaveClientSignature
  };
}
