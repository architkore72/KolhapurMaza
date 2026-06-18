/**
 * @file imageUtils.js
 * Client-side image compression using the Canvas API.
 * No external library required — works in all modern browsers.
 */

/**
 * Compress an image File to JPEG with a target max size and dimension.
 *
 * @param {File} file          - The original image file from an <input type="file">
 * @param {Object} opts
 * @param {number} opts.maxWidth   - Max output width  (default: 1200px)
 * @param {number} opts.maxHeight  - Max output height (default: 1200px)
 * @param {number} opts.quality    - JPEG quality 0–1  (default: 0.80)
 * @param {number} opts.maxSizeKB  - Target max output size in KB (default: 250KB)
 * @returns {Promise<File>}    - Compressed image as a new File (image/jpeg)
 */
export async function compressImage(file, {
  maxWidth  = 1200,
  maxHeight = 1200,
  quality   = 0.80,
  maxSizeKB = 250,
} = {}) {
  // If already small enough and JPEG, skip compression
  if (file.size <= maxSizeKB * 1024 && file.type === 'image/jpeg') return file;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      // Calculate scaled dimensions
      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width  = Math.round(width  * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width  = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      // White background for PNGs with transparency
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      // Iteratively lower quality until size target is met
      let q = quality;
      const tryCompress = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) { reject(new Error('Canvas toBlob failed')); return; }
            if (blob.size > maxSizeKB * 1024 && q > 0.30) {
              q -= 0.10;
              tryCompress();
              return;
            }
            const compressed = new File(
              [blob],
              file.name.replace(/\.[^.]+$/, '.jpg'),
              { type: 'image/jpeg', lastModified: Date.now() },
            );
            resolve(compressed);
          },
          'image/jpeg',
          q,
        );
      };
      tryCompress();
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image for compression'));
    };

    img.src = objectUrl;
  });
}
