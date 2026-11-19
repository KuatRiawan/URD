import { useState, useRef, useEffect } from 'react';
import {
  Camera,
  CheckCircle,
  WarningCircle,
  Signature,
  PenNib,
  UploadSimple,
  Trash,
  Eraser,
  SealCheck,
  ArrowClockwise,
  Sparkle
} from '@phosphor-icons/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Badge } from '../../../components/ui/Badge.jsx';
import { ROLE_LABELS, formatDate } from '../../../lib/utils/format.js';

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

/**
 * Filter cerdas pembersih latar belakang kertas putih pada foto tanda tangan.
 * Mengubah piksel putih/abu-abu kertas menjadi transparan (Alpha 0) dengan feathering halus pada tepi goresan tinta.
 */
async function processImageToTransparentPng(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const brightness = (r * 299 + g * 587 + b * 114) / 1000;
          const isNearMonochrome = Math.abs(r - g) < 30 && Math.abs(g - b) < 30 && Math.abs(r - b) < 30;

          if (brightness > 218 && isNearMonochrome) {
            // Latar putih atau abu-abu kertas -> jadikan transparan
            data[i + 3] = 0;
          } else if (brightness > 180 && isNearMonochrome) {
            // Feathering lembut di pinggir goresan tinta
            const alphaFactor = (218 - brightness) / 38;
            data[i + 3] = Math.round(data[i + 3] * Math.max(0, Math.min(1, alphaFactor)));
          }
        }

        ctx.putImageData(imgData, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const cleanFile = new File(
              [blob],
              file.name.replace(/\.[^.]+$/, '') + '-transparent.png',
              { type: 'image/png' }
            );
            resolve(cleanFile);
          } else {
            resolve(file);
          }
        }, 'image/png');
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ProfileTab({
  user,
  meData,
  profileForm,
  setProfileForm,
  profileLoading,
  profileError,
  onUpdateProfile,
  onAvatarUpload,
  onSaveSignature,
  onDeleteSignature,
  signatureLoading = false,
  getRoleBadgeColor
}) {
  const fileInputRef = useRef(null);
  const sigFileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);

  const [sigMode, setSigMode] = useState('draw'); // 'draw' | 'upload'
  const [hasDrawn, setHasDrawn] = useState(false);
  const [uploadedSigFile, setUploadedSigFile] = useState(null);
  const [uploadedSigPreview, setUploadedSigPreview] = useState(null);
  const [autoCleanBg, setAutoCleanBg] = useState(true);
  const [cleaningBg, setCleaningBg] = useState(false);
  const [saveSigError, setSaveSigError] = useState('');
  const [signerTitleInput, setSignerTitleInput] = useState(
    user?.signerTitle || profileForm.signerTitle || ''
  );
  const [showEditSig, setShowEditSig] = useState(!user?.signatureUrl);

  const avatarSrc = profileForm.avatarUrl || user?.avatarUrl;
  const currentSignatureUrl = user?.signatureUrl;

  // Status evaluasi tanda tangan digital
  const isSignatureReady = Boolean(currentSignatureUrl && (user?.signerTitle || profileForm.signerTitle));
  const isSignatureNeedUpdate = Boolean(currentSignatureUrl && !(user?.signerTitle || profileForm.signerTitle));
  const isSignatureEmpty = !currentSignatureUrl;

  useEffect(() => {
    if (user?.signerTitle) {
      setSignerTitleInput(user.signerTitle);
    }
  }, [user?.signerTitle]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && onAvatarUpload) {
      onAvatarUpload(file);
    }
  };

  const handleSigFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSaveSigError('');
    if (autoCleanBg) {
      try {
        setCleaningBg(true);
        const processedFile = await processImageToTransparentPng(file);
        setUploadedSigFile(processedFile);
        const objectUrl = URL.createObjectURL(processedFile);
        setUploadedSigPreview(objectUrl);
      } catch (err) {
        console.warn('Gagal memproses transparansi otomatis:', err);
        setUploadedSigFile(file);
        setUploadedSigPreview(URL.createObjectURL(file));
      } finally {
        setCleaningBg(false);
      }
    } else {
      setUploadedSigFile(file);
      setUploadedSigPreview(URL.createObjectURL(file));
    }
  };

  // Canvas Drawing Handlers
  const handlePointerDown = (e) => {
    const canvas = canvasRef.current;
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
    isDrawingRef.current = true;
    setHasDrawn(true);
  };

  const handlePointerMove = (e) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / (rect.width || 1);
    const scaleY = canvas.height / (rect.height || 1);
    const ctx = canvas.getContext('2d');
    ctx.lineTo((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
    ctx.stroke();
  };

  const handlePointerUp = (e) => {
    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      try {
        if (e.target.hasPointerCapture?.(e.pointerId)) {
          e.target.releasePointerCapture?.(e.pointerId);
        }
      } catch {
        // ignore
      }
      const canvas = canvasRef.current;
      if (canvas && hasCanvasDrawing(canvas)) {
        setHasDrawn(true);
      }
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    setSaveSigError('');
  };

  const handleSubmitSignature = async (e) => {
    e.preventDefault();
    setSaveSigError('');
    if (!onSaveSignature) return;

    if (!signerTitleInput.trim()) {
      setSaveSigError('Gelar atau spesialisasi penandatangan wajib diisi untuk pencantuman pada dokumen BAP & LHPP.');
      return;
    }

    if (sigMode === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas || !hasDrawn) {
        setSaveSigError('Silakan goreskan tanda tangan pada kanvas terlebih dahulu.');
        return;
      }
      const dataUrl = canvas.toDataURL('image/png');
      const ok = await onSaveSignature({
        dataUrl,
        signerTitle: signerTitleInput.trim()
      });
      if (ok) {
        setShowEditSig(false);
        clearCanvas();
      } else {
        setSaveSigError('Gagal menyimpan tanda tangan digital ke server.');
      }
    } else {
      if (!uploadedSigFile) {
        setSaveSigError('Silakan pilih berkas gambar tanda tangan terlebih dahulu.');
        return;
      }
      const ok = await onSaveSignature({
        file: uploadedSigFile,
        signerTitle: signerTitleInput.trim()
      });
      if (ok) {
        setShowEditSig(false);
        setUploadedSigFile(null);
        setUploadedSigPreview(null);
      } else {
        setSaveSigError('Gagal menyimpan berkas tanda tangan digital ke server.');
      }
    }
  };

  // Gaya latar bermotif papan catur transparan (Checkerboard)
  const checkerboardStyle = {
    backgroundImage:
      'linear-gradient(45deg, #e2e8f0 25%, transparent 25%), linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e8f0 75%), linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)',
    backgroundSize: '16px 16px',
    backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px'
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Ringkasan Akun & Foto Profil */}
      <div className="lg:col-span-1 space-y-6">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Kartu Identitas Pengguna</CardTitle>
            <CardDescription>Foto profil dan identitas otorisasi Anda</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <div className="flex flex-col items-center text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="relative group">
                <div className="h-20 w-20 rounded-full bg-brand-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-md overflow-hidden ring-4 ring-white dark:ring-slate-800">
                  {avatarSrc ? (
                    <img src={avatarSrc} alt={user?.fullName} className="h-full w-full object-cover" />
                  ) : (
                    user?.fullName
                      ?.split(' ')
                      .slice(0, 2)
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase() || 'U'
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Ubah Foto Profil"
                  className="absolute bottom-0 right-0 p-1.5 rounded-full bg-slate-900 text-white hover:bg-[#C81E1E] transition-colors shadow-sm cursor-pointer"
                >
                  <Camera size={14} weight="bold" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2.5 text-xs font-bold text-brand-600 dark:text-rose-400 hover:underline cursor-pointer"
              >
                Ganti Foto Profil
              </button>

              <h3 className="mt-2 font-bold text-sm text-slate-900 dark:text-slate-100">
                {user?.fullName || 'Pengguna'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
              <span
                className={`mt-2.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getRoleBadgeColor()}`}
              >
                {ROLE_LABELS[user?.role] || user?.role}
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Status Akun</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle size={14} weight="fill" />
                  Aktif Terverifikasi
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Nomor Telepon</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {user?.phone || 'Belum diisi'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Terdaftar Sejak</span>
                <span className="font-medium text-slate-600 dark:text-slate-400">
                  {meData?.createdAt ? formatDate(meData.createdAt) : '2024'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Kolom Kanan: Form Profil & Tanda Tangan Saya */}
      <div className="lg:col-span-2 space-y-6">
        {/* Form Perubahan Profil */}
        <Card>
          <CardHeader>
            <CardTitle>Perbarui Informasi Pribadi</CardTitle>
            <CardDescription>
              Sesuaikan nama lengkap dan kontak yang digunakan pada dokumen operasional
            </CardDescription>
          </CardHeader>
          <CardContent>
            {profileError && (
              <div className="mb-4 flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-400 font-medium">
                <WarningCircle size={15} className="shrink-0 text-[#C81E1E]" weight="bold" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={onUpdateProfile} className="space-y-4">
              <div>
                <label
                  htmlFor="emailDisabled"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Alamat Email (Akun Utama)
                </label>
                <input
                  id="emailDisabled"
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Alamat email terdaftar terkunci secara sistem dan hanya dapat diubah oleh Administrator Utama.
                </p>
              </div>

              <div>
                <label
                  htmlFor="fullName"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Nama Lengkap Beserta Gelar *
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  value={profileForm.fullName}
                  onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Contoh: Ir. Budi Santoso, S.T., M.K3"
                />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Nomor Telepon / WhatsApp
                </label>
                <input
                  id="phone"
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Contoh: 081234567890"
                />
              </div>

              <div>
                <label
                  htmlFor="signerTitleProfile"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Gelar / Jabatan Penandatangan Standar
                </label>
                <input
                  id="signerTitleProfile"
                  type="text"
                  value={profileForm.signerTitle || ''}
                  onChange={(e) => {
                    setProfileForm({ ...profileForm, signerTitle: e.target.value });
                    setSignerTitleInput(e.target.value);
                  }}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Contoh: Ahli K3 Spesialis Pesawat Angkat dan Angkut / Direktur Utama"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Jabatan ini akan otomatis dicantumkan di bawah nama Anda pada berkas BAP dan LHPP resmi.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <Button type="submit" variant="primary" loading={profileLoading}>
                  Simpan Perubahan Profil
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Card Tanda Tangan Saya */}
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-[#C81E1E]">
                  <Signature size={20} weight="bold" />
                </div>
                <div>
                  <CardTitle>Tanda Tangan Saya</CardTitle>
                  <CardDescription>
                    Tanda tangan digital resmi untuk pengesahan otomatis pada dokumen BAP &amp; LHPP tanpa tanda tangan berulang
                  </CardDescription>
                </div>
              </div>

              {/* Status Badge Dinamis */}
              <div>
                {isSignatureReady && (
                  <Badge variant="success" className="gap-1 py-1 px-2.5">
                    <SealCheck size={14} weight="fill" />
                    <span>Tersimpan &amp; Siap Digunakan</span>
                  </Badge>
                )}
                {isSignatureNeedUpdate && (
                  <Badge variant="warning" className="gap-1 py-1 px-2.5">
                    <WarningCircle size={14} weight="fill" />
                    <span>Perlu Diperbarui (Gelar Belum Diisi)</span>
                  </Badge>
                )}
                {isSignatureEmpty && (
                  <Badge variant="neutral" className="gap-1 py-1 px-2.5">
                    <WarningCircle size={14} weight="bold" />
                    <span>Belum Tersedia</span>
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200">
              <p className="leading-relaxed">
                <strong>Otomatisasi Tanda Tangan Lapangan &amp; Kantor:</strong> Dengan menyimpan tanda tangan di sini, sistem secara otomatis menyematkan tanda tangan resmi Anda pada Berita Acara (BAP) dan Laporan Hasil Pemeriksaan (LHPP) yang Anda terbitkan tanpa perlu menggores layar berulang kali di lokasi riksa uji.
              </p>
            </div>

            {saveSigError && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-400 font-medium">
                <WarningCircle size={15} className="shrink-0 text-[#C81E1E]" weight="bold" />
                <span>{saveSigError}</span>
              </div>
            )}

            {/* Pratinjau Tanda Tangan yang Sudah Tersimpan */}
            {currentSignatureUrl && !showEditSig && (
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    Pratinjau Tanda Tangan Aktif:
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Proporsi Asli (Latar Transparan)
                  </span>
                </div>

                {/* Kanvas Motif Papan Catur untuk Menjamin Transparansi */}
                <div
                  style={checkerboardStyle}
                  className="h-32 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center p-3 shadow-inner overflow-hidden"
                >
                  <img
                    src={currentSignatureUrl}
                    alt="Tanda Tangan Tersimpan"
                    className="max-h-24 max-w-full object-contain filter drop-shadow-xs"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs pt-1 border-t border-slate-200/80 dark:border-slate-800">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Gelar / Jabatan: </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {user?.signerTitle || profileForm.signerTitle || '(Belum diatur)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowEditSig(true)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                    >
                      <ArrowClockwise size={13} weight="bold" />
                      Ganti Tanda Tangan
                    </button>
                    {onDeleteSignature && (
                      <button
                        type="button"
                        onClick={onDeleteSignature}
                        disabled={signatureLoading}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer transition-colors disabled:opacity-50"
                      >
                        <Trash size={13} weight="bold" />
                        Hapus
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Form Gores atau Unggah Tanda Tangan */}
            {showEditSig && (
              <form onSubmit={handleSubmitSignature} className="space-y-4 pt-1">
                <div>
                  <label
                    htmlFor="signerTitleInput"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Gelar / Spesialisasi Penandatangan Standar *
                  </label>
                  <input
                    id="signerTitleInput"
                    type="text"
                    required
                    value={signerTitleInput}
                    onChange={(e) => setSignerTitleInput(e.target.value)}
                    placeholder="Contoh: Ahli K3 Spesialis Pesawat Angkat dan Angkut"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Gelar ini akan dicantumkan di bawah nama dan tanda tangan Anda pada BAP &amp; LHPP.
                  </p>
                </div>

                {/* Switcher Tab: Gores Kanvas vs Unggah File */}
                <div>
                  <div className="flex border-b border-slate-200 dark:border-slate-700 mb-3">
                    <button
                      type="button"
                      onClick={() => setSigMode('draw')}
                      className={`pb-2 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 cursor-pointer ${
                        sigMode === 'draw'
                          ? 'border-[#C81E1E] text-[#C81E1E]'
                          : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
                      }`}
                    >
                      <PenNib size={14} weight="bold" />
                      Gores di Layar (Jari / Stylus / Mouse)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSigMode('upload')}
                      className={`pb-2 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 cursor-pointer ${
                        sigMode === 'upload'
                          ? 'border-[#C81E1E] text-[#C81E1E]'
                          : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
                      }`}
                    >
                      <UploadSimple size={14} weight="bold" />
                      Unggah Berkas Gambar (PNG / Foto Kertas)
                    </button>
                  </div>

                  {sigMode === 'draw' ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          Goreskan tanda tangan Anda pada kotak berikut:
                        </span>
                        <button
                          type="button"
                          onClick={clearCanvas}
                          className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-[#C81E1E] cursor-pointer font-bold"
                        >
                          <Eraser size={13} weight="bold" />
                          Bersihkan Kanvas
                        </button>
                      </div>

                      <div
                        style={{ touchAction: 'none' }}
                        className="rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white overflow-hidden p-1 flex justify-center shadow-inner relative"
                      >
                        <canvas
                          ref={canvasRef}
                          width={440}
                          height={140}
                          onPointerDown={handlePointerDown}
                          onPointerMove={handlePointerMove}
                          onPointerUp={handlePointerUp}
                          onPointerLeave={handlePointerUp}
                          className="cursor-crosshair touch-none w-full max-w-[440px] h-[140px]"
                        />
                        {!hasDrawn && (
                          <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-xs text-slate-400">
                            Tanda tangani di sini dengan jari, stylus, atau kursor mouse
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Toggle Pembersihan Latar Putih Otomatis */}
                      <label className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-300 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={autoCleanBg}
                          onChange={(e) => setAutoCleanBg(e.target.checked)}
                          className="rounded border-amber-300 text-[#C81E1E] focus:ring-[#C81E1E]"
                        />
                        <div className="flex items-center gap-1.5 font-semibold">
                          <Sparkle size={14} className="text-amber-600 dark:text-amber-400" weight="fill" />
                          <span>Bersihkan &amp; Transparansikan Latar Kertas Putih Otomatis</span>
                        </div>
                      </label>

                      <div className="p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-center space-y-2">
                        {cleaningBg ? (
                          <div className="py-6 text-center text-xs text-slate-500">
                            Sedang memproses transparansi tanda tangan...
                          </div>
                        ) : uploadedSigPreview ? (
                          <div className="space-y-2">
                            <div
                              style={checkerboardStyle}
                              className="h-28 flex items-center justify-center rounded-lg p-2 border border-slate-200 dark:border-slate-700 overflow-hidden shadow-inner"
                            >
                              <img
                                src={uploadedSigPreview}
                                alt="Pratinjau Berkas"
                                className="max-h-24 max-w-full object-contain mx-auto filter drop-shadow-xs"
                              />
                            </div>
                            <p className="text-xs text-emerald-600 font-bold">
                              Berkas siap: {uploadedSigFile?.name}
                            </p>
                          </div>
                        ) : (
                          <div className="py-4 space-y-2">
                            <UploadSimple size={32} className="mx-auto text-slate-400" />
                            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                              Pilih berkas foto tanda tangan di atas kertas putih atau berkas PNG transparan
                            </p>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => sigFileInputRef.current?.click()}
                          className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          {uploadedSigFile ? 'Pilih Berkas Lain' : 'Pilih Berkas Tanda Tangan'}
                        </button>
                        <input
                          type="file"
                          ref={sigFileInputRef}
                          accept="image/png,image/jpeg,image/webp"
                          onChange={handleSigFileChange}
                          className="hidden"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {currentSignatureUrl && (
                    <button
                      type="button"
                      onClick={() => setShowEditSig(false)}
                      disabled={signatureLoading}
                      className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      Batal
                    </button>
                  )}
                  <Button
                    type="submit"
                    variant="primary"
                    loading={signatureLoading}
                    icon={PenNib}
                  >
                    Simpan Tanda Tangan Digital
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
