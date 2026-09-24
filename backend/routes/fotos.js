const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const Siniestro = require('../models/Siniestro');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/:folio', upload.array('fotos', 20), async (req, res) => {
  try {
    const { folio } = req.params;
    const siniestro = await Siniestro.findOne({ folio });
    if (!siniestro) return res.status(404).json({ error: 'Siniestro no encontrado' });

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No se enviaron archivos' });
    }

    const uploaded = [];
    for (const file of req.files) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: `capsin/${folio}`,
            resource_type: 'image',
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(file.buffer);
      });

      uploaded.push({
        url: result.secure_url,
        public_id: result.public_id,
        filename: file.originalname,
      });
    }

    siniestro.fotos.push(...uploaded);
    await siniestro.save();

    res.json({ message: `${uploaded.length} foto(s) subida(s)`, fotos: siniestro.fotos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
