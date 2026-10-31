import { useRef, useState } from 'react';
import { api } from '../../../lib/api/axios.js';

function hasCanvasDrawing(canvas) {
  if (!canvas) return false;
  try {
    const ctx = canvas.getContext('2d');
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 20) return true;
    }
  } catch {
    return false;
  }
  return false;
}

export function useInspectionSignatures({
  activeDetail,
  user,
  setError,
  setFeedback,
  openDetail,
  setSubmitting: externalSetSubmitting
}) {
  const [inspectorSigName, setInspectorSigName] = useState(user?.fullName || 'Ir. Budi Santoso');
  const [inspectorSigTitle, setInspectorSigTitle] = useState('Ahli K3 Spesialis');
  const [clientSigName, setClientSigName] = useState('');
  const [clientSigTitle, setClientSigTitle] = useState('Pemilik Alat / PIC Klien');
  const [reSigningInspector, setReSigningInspector] = useState(false);
  const [reSigningClient, setReSigningClient] = useState(false);

  // Status loading dan notifikasi lokal per tanda tangan
  const [savingInspector, setSavingInspector] = useState(false);
  const [savingClient, setSavingClient] = useState(false);
  const [sigErrorInspector, setSigErrorInspector] = useState('');
  const [sigErrorClient, setSigErrorClient] = useState('');
  const [sigFeedbackInspector, setSigFeedbackInspector] = useState('');
  const [sigFeedbackClient, setSigFeedbackClient] = useState('');

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
    setSigErrorInspector('');
    setSigErrorClient('');
    setSigFeedbackInspector('');
    setSigFeedbackClient('');
  };

  const clearInspectorCanvas = () => {
    const canvas = inspectorCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawnInspectorSig(false);
    setSigErrorInspector('');
  };

  const handleInspectorPointerDown = (e) => {
    const canvas = inspectorCanvasRef.current;
    if (!canvas) return;
    try {
      e.target.setPointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / (rect.width || 1);
    const scaleY = canvas.height / (rect.height || 1);
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
    isDrawingInspectorRef.current = true;
    setHasDrawnInspectorSig(true);
    setSigErrorInspector('');
  };

  const handleInspectorPointerMove = (e) => {
    if (!isDrawingInspectorRef.current) return;
    const canvas = inspectorCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / (rect.width || 1);
    const scaleY = canvas.height / (rect.height || 1);
    const ctx = canvas.getContext('2d');
    ctx.lineTo((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
    ctx.stroke();
  };

  const handleInspectorPointerUp = (e) => {
    if (isDrawingInspectorRef.current) {
      isDrawingInspectorRef.current = false;
      try {
        if (e.target.hasPointerCapture?.(e.pointerId)) {
          e.target.releasePointerCapture?.(e.pointerId);
        }
      } catch {
        // ignore
      }
      const canvas = inspectorCanvasRef.current;
      if (canvas && hasCanvasDrawing(canvas)) {
        setHasDrawnInspectorSig(true);
      }
    }
  };

  const handleSaveInspectorSignature = async () => {
    setSigErrorInspector('');
    setSigFeedbackInspector('');

    if (!activeDetail?.inspection) {
      setSigErrorInspector('Data inspeksi tidak ditemukan.');
      return;
    }
    if (!inspectorSigName.trim()) {
      setSigErrorInspector('Nama Ahli K3 / Inspector wajib diisi.');
      return;
    }
    const canvas = inspectorCanvasRef.current;
    const hasDrawing = canvas && (hasCanvasDrawing(canvas) || hasDrawnInspectorSig);
    if (!canvas || !hasDrawing) {
      setSigErrorInspector('Silakan goreskan tanda tangan Ahli K3 pada kotak kanvas di atas.');
      return;
    }

    setSavingInspector(true);
    if (externalSetSubmitting) externalSetSubmitting(true);
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
      setSigFeedbackInspector('Tanda tangan digital Ahli K3 berhasil disimpan.');
      if (setFeedback) setFeedback('Tanda tangan digital Ahli K3 berhasil disimpan.');
      await openDetail(activeDetail.inspection.id);
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Gagal menyimpan tanda tangan digital Ahli K3.';
      setSigErrorInspector(msg);
      if (setError) setError(msg);
    } finally {
      setSavingInspector(false);
      if (externalSetSubmitting) externalSetSubmitting(false);
    }
  };

  const clearClientCanvas = () => {
    const canvas = clientCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawnClientSig(false);
    setSigErrorClient('');
  };

  const handleClientPointerDown = (e) => {
    const canvas = clientCanvasRef.current;
    if (!canvas) return;
    try {
      e.target.setPointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / (rect.width || 1);
    const scaleY = canvas.height / (rect.height || 1);
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
    isDrawingClientRef.current = true;
    setHasDrawnClientSig(true);
    setSigErrorClient('');
  };

  const handleClientPointerMove = (e) => {
    if (!isDrawingClientRef.current) return;
    const canvas = clientCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / (rect.width || 1);
    const scaleY = canvas.height / (rect.height || 1);
    const ctx = canvas.getContext('2d');
    ctx.lineTo((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
    ctx.stroke();
  };

  const handleClientPointerUp = (e) => {
    if (isDrawingClientRef.current) {
      isDrawingClientRef.current = false;
      try {
        if (e.target.hasPointerCapture?.(e.pointerId)) {
          e.target.releasePointerCapture?.(e.pointerId);
        }
      } catch {
        // ignore
      }
      const canvas = clientCanvasRef.current;
      if (canvas && hasCanvasDrawing(canvas)) {
        setHasDrawnClientSig(true);
      }
    }
  };

  const handleSaveClientSignature = async () => {
    setSigErrorClient('');
    setSigFeedbackClient('');

    if (!activeDetail?.inspection) {
      setSigErrorClient('Data inspeksi tidak ditemukan.');
      return;
    }
    if (!clientSigName.trim()) {
      setSigErrorClient('Nama PIC Perusahaan / Klien wajib diisi.');
      return;
    }
    const canvas = clientCanvasRef.current;
    const hasDrawing = canvas && (hasCanvasDrawing(canvas) || hasDrawnClientSig);
    if (!canvas || !hasDrawing) {
      setSigErrorClient('Silakan goreskan tanda tangan PIC Klien pada kotak kanvas di atas.');
      return;
    }

    setSavingClient(true);
    if (externalSetSubmitting) externalSetSubmitting(true);
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
      setSigFeedbackClient('Tanda tangan digital PIC Klien berhasil disimpan.');
      if (setFeedback) setFeedback('Tanda tangan digital PIC Klien berhasil disimpan.');
      await openDetail(activeDetail.inspection.id);
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Gagal menyimpan tanda tangan digital PIC Klien.';
      setSigErrorClient(msg);
      if (setError) setError(msg);
    } finally {
      setSavingClient(false);
      if (externalSetSubmitting) externalSetSubmitting(false);
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
    savingInspector,
    savingClient,
    sigErrorInspector,
    sigErrorClient,
    sigFeedbackInspector,
    sigFeedbackClient,
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
