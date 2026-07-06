'use strict';

const { v4: uuidv4 } = require('uuid');
const supabase = require('./supabaseClient');

const BUCKET_NAME = 'canteen-images';

/**
 * Uploads a WebP image buffer to Supabase Storage and returns the public URL.
 * 
 * @param {Buffer} buffer - The compressed image buffer (WebP format expected)
 * @param {string} folder - The folder prefix (e.g., 'shops' or 'food')
 * @returns {Promise<string>} - The public URL of the uploaded image
 */
const uploadImageToSupabase = async (buffer, folder) => {
  // Generate a UUID filename
  const filename = `${uuidv4()}.webp`;
  const path = `${folder}/${filename}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, buffer, {
      contentType: 'image/webp',
      cacheControl: '3600',
      upsert: false // We use UUIDs to avoid collisions
    });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  // Retrieve the public URL
  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(path);

  return publicUrlData.publicUrl;
};

/**
 * Deletes an image from Supabase Storage given its public URL.
 * 
 * @param {string} publicUrl - The full public URL of the image
 */
const deleteImageFromSupabase = async (publicUrl) => {
  if (!publicUrl) return;

  // Extract the path from the URL
  // URL format: https://[project-ref].supabase.co/storage/v1/object/public/canteen-images/[folder]/[filename]
  try {
    const url = new URL(publicUrl);
    const pathParts = url.pathname.split(`/${BUCKET_NAME}/`);
    if (pathParts.length > 1) {
      const filePath = pathParts[1];
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath]);
      
      if (error) {
        console.error('[imageUpload] Failed to delete old image:', error.message);
      }
    }
  } catch (err) {
    console.error('[imageUpload] Invalid URL provided for deletion:', publicUrl);
  }
};

module.exports = {
  uploadImageToSupabase,
  deleteImageFromSupabase
};
