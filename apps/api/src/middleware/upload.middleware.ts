// Multer middleware for image uploads — uses memory storage so buffers can be
// streamed directly to Cloudinary without writing to disk.
import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_FILES_BULK = 10;

function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) {
  if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Unsupported file type: ${file.mimetype}. Only JPEG, PNG, WebP and GIF images are allowed.`
      )
    );
  }
}

const storage = multer.memoryStorage();

const baseMulter = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

// Single image — field name: "image"
export const uploadSingle = baseMulter.single('image');

// Multiple images — field name: "images", up to MAX_FILES_BULK files
export const uploadMultiple = baseMulter.array('images', MAX_FILES_BULK);
