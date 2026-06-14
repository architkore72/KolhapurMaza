/**
 * Convert a string to a URL-friendly slug.
 * For non-ASCII titles (e.g. Marathi, Hindi), falls back to a timestamp slug.
 */
export function slugify(str) {
  if (!str) return `article-${Date.now()}`;
  const ascii = str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  // If the entire title was non-ASCII (e.g. Marathi), generate a timestamp slug
  return ascii || `article-${Date.now()}`;
}

/**
 * Generate a unique slug by appending a timestamp
 */
export function uniqueSlug(str) {
  const base = slugify(str);
  // Don't double-append timestamp if slugify already used one
  return base.startsWith('article-') ? base : `${base}-${Date.now()}`;
}
