'use strict';

const sharp = require('sharp');

/**
 * Compresses an image buffer to WebP format.
 * - Resizes to max 1920x1920 while maintaining aspect ratio (only if larger)
 * - Converts to WebP format with quality 80
 * - Strips metadata for privacy and size
 *
 * @param {Buffer} buffer - The original image buffer
 * @returns {Promise<Buffer>} - The compressed WebP image buffer
 */
const compressImage = async (buffer) => {
  return await sharp(buffer)
    .resize({
      width: 1920,
      height: 1920,
      fit: sharp.fit.inside,
      withoutEnlargement: true // Do not enlarge if image is smaller than 1920x1920
    })
    .webp({ quality: 80 })
    .withMetadata(false) // Strip metadata
    .toBuffer();
};

module.exports = {
  compressImage
};
