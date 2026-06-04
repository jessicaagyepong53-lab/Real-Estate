import express from 'express';
import multer from 'multer';
import mongoose from 'mongoose';
import { Readable } from 'stream';
import Block from '../models/Block.js';
import { txBlock, txDoc } from '../utils/transform.js';
import { verifyJWT } from '../middleware/auth.js';
import cloudinary from '../config/cloudinary.js';
import { broadcast } from '../socket.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// POST /api/tenants/:tid/documents — upload file to Cloudinary, save metadata
router.post('/tenants/:tid/documents', verifyJWT, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });

    // Upload buffer to Cloudinary via stream
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'estatepro', resource_type: 'auto' },
        (err, result) => err ? reject(err) : resolve(result)
      );
      Readable.from(req.file.buffer).pipe(stream);
    });

    const block = await Block.findOne({
      'units.tenants._id': new mongoose.Types.ObjectId(req.params.tid),
    });
    if (!block) return res.status(404).json({ error: 'Tenant not found' });

    let tenant = null;
    for (const unit of block.units) {
      tenant = unit.tenants.id(req.params.tid);
      if (tenant) break;
    }

    tenant.documents.push({
      name:         req.file.originalname,
      mimeType:     req.file.mimetype,
      size:         req.file.size,
      category:     req.body.category || 'Other',
      note:         req.body.note || '',
      leasePeriod:  (() => {
        const sy = tenant.leaseStart ? new Date(tenant.leaseStart).getFullYear() : null;
        const ey = tenant.leaseEnd   ? new Date(tenant.leaseEnd).getFullYear()   : null;
        if (!sy) return null;
        return ey && ey !== sy ? `${sy}\u2013${ey}` : `${sy}`;
      })(),
      cloudinaryId: result.public_id,
      url:          result.secure_url,
      uploadedAt:   new Date(),
    });

    await block.save();

    // Return just the new document object
    const newDoc = tenant.documents[tenant.documents.length - 1];
    res.status(201).json(txDoc(newDoc));
    broadcast('blocks:changed', null);
  } catch (err) { next(err); }
});

// DELETE /api/documents/:did — remove from Cloudinary + DB
router.delete('/documents/:did', verifyJWT, async (req, res, next) => {
  try {
    const block = await Block.findOne({
      'units.tenants.documents._id': new mongoose.Types.ObjectId(req.params.did),
    });
    if (!block) return res.status(404).json({ error: 'Document not found' });

    let removed = null;
    outer: for (const unit of block.units) {
      for (const tenant of unit.tenants) {
        const doc = tenant.documents.id(req.params.did);
        if (doc) {
          removed = doc;
          tenant.documents.pull(req.params.did);
          break outer;
        }
      }
    }

    if (removed?.cloudinaryId) {
      await cloudinary.uploader.destroy(removed.cloudinaryId, { resource_type: 'raw' })
        .catch(() => {}); // non-fatal if already gone
    }

    await block.save();
    res.json({ ok: true });
    broadcast('blocks:changed', null);
  } catch (err) { next(err); }
});

// GET /api/documents/:did/file        — serve file inline (view)
// GET /api/documents/:did/file?dl=1  — serve file as download
router.get('/documents/:did/file', async (req, res, next) => {
  try {
    const block = await Block.findOne({
      'units.tenants.documents._id': new mongoose.Types.ObjectId(req.params.did),
    });
    if (!block) return res.status(404).send('Document not found');

    let doc = null;
    outer: for (const unit of block.units) {
      for (const tenant of unit.tenants) {
        const d = tenant.documents.id(req.params.did);
        if (d) { doc = d; break outer; }
      }
    }
    if (!doc?.cloudinaryId && !doc?.url) return res.status(404).send('No file stored');

    const isDownload = req.query.dl === '1';
    const safeName = (doc.name || 'file').replace(/["\\]/g, '');

    // Detect resource type from the stored URL path (most reliable source of truth)
    // URL format: https://res.cloudinary.com/CLOUD/{image|video|raw}/upload/...
    const resTypeMatch = doc.url?.match(/\/(\w+)\/upload\//);
    const resourceType = resTypeMatch?.[1] ||
      (doc.mimeType?.startsWith('image/') ? 'image' :
       doc.mimeType?.startsWith('video/') ? 'video' : 'raw');

    // File extension — needed for private_download_url so Cloudinary serves correct type
    const ext = (doc.name?.split('.').pop() || '').toLowerCase();

    if (doc.cloudinaryId) {
      // private_download_url generates an authenticated API-domain URL
      // (api.cloudinary.com) that works regardless of CDN signed-delivery settings.
      const expires = Math.floor(Date.now() / 1000) + 600;
      const authUrl = cloudinary.utils.private_download_url(
        doc.cloudinaryId,
        ext,
        { resource_type: resourceType, expires_at: expires },
      );

      if (isDownload) {
        // For download: just redirect — browser follows to Cloudinary API and saves the file
        return res.redirect(302, authUrl);
      }

      // For inline view: proxy the bytes so we can force Content-Disposition:inline
      // (private_download_url always sends attachment by default)
      const upstream = await fetch(authUrl);
      if (!upstream.ok) return res.status(502).send(`Storage error ${upstream.status}`);
      const buffer = await upstream.arrayBuffer();
      res.setHeader('Content-Type', doc.mimeType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `inline; filename="${safeName}"`);
      res.setHeader('Cache-Control', 'private, max-age=300');
      return res.send(Buffer.from(buffer));
    }

    // Fallback for legacy docs that only have a plain URL (no cloudinaryId)
    const upstream = await fetch(doc.url);
    if (!upstream.ok) return res.status(502).send(`Storage error ${upstream.status}`);
    const buffer = await upstream.arrayBuffer();
    const disposition = isDownload ? 'attachment' : 'inline';
    res.setHeader('Content-Type', doc.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `${disposition}; filename="${safeName}"`);
    return res.send(Buffer.from(buffer));
  } catch (err) { next(err); }
});

export default router;
