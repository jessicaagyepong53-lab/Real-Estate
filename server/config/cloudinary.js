import { v2 as cloudinary } from 'cloudinary';
import 'dotenv/config';

// Parse CLOUDINARY_URL (cloudinary://key:secret@cloud_name) as fallback
// so this works whether Render has individual vars OR just CLOUDINARY_URL
let cloudName = process.env.CLOUDINARY_CLOUD_NAME;
let apiKey    = process.env.CLOUDINARY_API_KEY;
let apiSecret = process.env.CLOUDINARY_API_SECRET;

if ((!cloudName || !apiKey || !apiSecret) && process.env.CLOUDINARY_URL) {
  try {
    const u   = new URL(process.env.CLOUDINARY_URL);
    cloudName = cloudName || u.hostname;
    apiKey    = apiKey    || u.username;
    apiSecret = apiSecret || decodeURIComponent(u.password);
  } catch { /* ignore parse errors */ }
}

cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });

export default cloudinary;
