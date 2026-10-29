export function errorHandler(err, _req, res, _next) {
  if (!err?.status || err?.status >= 500) {
    console.error('[SERVER ERROR]:', err);
  }
  if (err?.code === '23505') {
    return res.status(409).json({
      error: {
        code: 'DUPLICATE_RECORD',
        message: 'Data dengan nilai unik yang sama sudah terdaftar.'
      }
    });
  }

  if (err?.code === '23503') {
    return res.status(400).json({
      error: {
        code: 'REFERENCE_ERROR',
        message: 'Referensi data terkait tidak ditemukan atau masih digunakan.'
      }
    });
  }

  if (err?.name === 'MulterError') {
    return res.status(400).json({
      error: {
        code: 'UPLOAD_ERROR',
        message:
          err.code === 'LIMIT_FILE_SIZE'
            ? 'Ukuran berkas melebihi batas maksimum (10 MB).'
            : 'Berkas yang diunggah tidak sesuai ketentuan.'
      }
    });
  }

  const status = err.status || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message =
    status >= 500
      ? 'Terjadi kesalahan pada server. Silakan coba kembali.'
      : err.message || 'Permintaan tidak dapat diproses.';

  const payload = { error: { code, message } };
  if (err.details) payload.error.details = err.details;

  return res.status(status).json(payload);
}

