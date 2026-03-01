// Cloudinary configuration — graceful fallback when env vars are missing (dev mode)
import { v2 as cloudinary } from 'cloudinary';

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

const isConfigured = Boolean(CLOUD_NAME && API_KEY && API_SECRET);

if (isConfigured) {
  cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: API_KEY,
    api_secret: API_SECRET,
    secure: true,
  });
} else {
  console.warn(
    '[Cloudinary] CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET ' +
    'are not set. Image uploads will fall back to placeholder URLs in development mode.'
  );
}

export { cloudinary, isConfigured as cloudinaryConfigured };
