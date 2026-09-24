const HEIC_TYPES = new Set(['image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence']);

const looksLikeHeic = (file) => HEIC_TYPES.has(file.type) || /\.hei[cf]$/i.test(file.name || '');

/**
 * Chrome, Firefox and Edge ship no HEIC/HEIF decoder — the format iPhones and
 * Macs save photos in by default — so <img>, <canvas> and createImageBitmap
 * all silently produce a 0x0 image with no error instead of failing loudly.
 * Convert to JPEG up front so every later step treats every upload the same way.
 */
export async function toDisplayableImage(file) {
  if (!looksLikeHeic(file)) return file;

  const heic2any = (await import('heic2any')).default;
  const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 });
  const blob = Array.isArray(converted) ? converted[0] : converted;
  return new File([blob], file.name.replace(/\.hei[cf]$/i, '.jpg'), { type: 'image/jpeg' });
}
