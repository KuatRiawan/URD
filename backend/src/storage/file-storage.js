import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { env } from '../config/env.js';
import { query } from '../database/pool.js';
import { AppError } from '../utils/http.js';

fs.mkdirSync(env.storageDir, { recursive: true });

const ALLOWED_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf'
]);

const EXT_BY_MIME = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/pdf': '.pdf'
};

export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxUploadBytes },
  fileFilter(_req, file, cb) {
    if (!ALLOWED_MIMES.has(file.mimetype)) {
      return cb(
        new AppError(
          400,
          'INVALID_FILE_TYPE',
          'Format berkas harus berupa JPG, PNG, WEBP, atau PDF.'
        )
      );
    }
    return cb(null, true);
  }
});

export async function saveUploadedFile(
  { buffer, originalName, mimeType, ownerType, ownerId, caption = null, uploadedBy },
  dbClient = null
) {
  if (!ALLOWED_MIMES.has(mimeType)) {
    throw new AppError(400, 'INVALID_FILE_TYPE', 'Tipe berkas tidak didukung.');
  }
  if (!buffer || buffer.length === 0) {
    throw new AppError(400, 'EMPTY_FILE', 'Berkas kosong tidak dapat disimpan.');
  }
  const ext = EXT_BY_MIME[mimeType] || '.bin';
  const storageKey = `${Date.now()}-${crypto.randomUUID()}${ext}`;
  const fullPath = path.join(env.storageDir, storageKey);
  fs.writeFileSync(fullPath, buffer);

  const runner = dbClient || { query };
  const safeName = path.basename(originalName || `berkas${ext}`).slice(0, 180);
  const { rows } = await runner.query(
    `INSERT INTO file_attachments
       (owner_type, owner_id, original_name, mime_type, size_bytes, storage_key, caption, uploaded_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, owner_type, owner_id, original_name, mime_type, size_bytes, caption, created_at`,
    [ownerType, ownerId, safeName, mimeType, buffer.length, storageKey, caption, uploadedBy]
  );
  return rows[0];
}

export async function saveDataUrlPng(
  { dataUrl, ownerType, ownerId, originalName = 'tanda-tangan.png', uploadedBy },
  dbClient = null
) {
  const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=\s]+)$/.exec(dataUrl || '');
  if (!match) {
    throw new AppError(400, 'INVALID_SIGNATURE_IMAGE', 'Format gambar tanda tangan tidak valid.');
  }
  const mimeType = `image/${match[1]}`;
  const buffer = Buffer.from(match[2], 'base64');
  return saveUploadedFile(
    { buffer, originalName, mimeType, ownerType, ownerId, uploadedBy },
    dbClient
  );
}

export function resolveAttachmentPath(storageKey) {
  const cleanKey = path.basename(storageKey);
  return path.join(env.storageDir, cleanKey);
}

