/**
 * Utility to process and optimize any uploaded image file.
 * Handles images of any size (even 10MB-50MB+ high-resolution camera photos)
 * by smoothly scaling down dimensions and compressing using HTML5 canvas.
 * Produces crisp, web-optimized JPEG data URLs to prevent "Request Entity Too Large" errors.
 */

export const compressImage = (file, options = {}) => {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.85,
    mimeType = 'image/jpeg',
  } = options;

  return new Promise((resolve) => {
    // If not a standard image or if File/Blob is missing, fallback to FileReader
    if (!file || !(file instanceof Blob) || !file.type.startsWith('image/')) {
      if (file instanceof Blob) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
      } else {
        resolve('');
      }
      return;
    }

    // Do not recompress SVG or GIF (to preserve vector / animation)
    if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (!width || !height) {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = () => resolve('');
          reader.readAsDataURL(file);
          return;
        }

        // Calculate proportional scale
        let targetWidth = width;
        let targetHeight = height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          targetWidth = Math.round(width * ratio);
          targetHeight = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = () => resolve('');
          reader.readAsDataURL(file);
          return;
        }

        // High quality smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // Export to data URL
        const dataUrl = canvas.toDataURL(mimeType, quality);
        resolve(dataUrl);
      } catch (err) {
        console.warn('Canvas image compression failed, falling back to standard data URL:', err);
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    };

    img.src = objectUrl;
  });
};
