import sanitizeHtml from 'sanitize-html';

/**
 * Sanitize Shopify product description HTML for set:html (server / build only).
 * Do not import this from client scripts — `sanitize-html` is Node-only and
 * will freeze the cart page on "Loading cart…".
 */
export function sanitizeProductHtml(html: string): string {
  if (!html.trim()) return '';

  return sanitizeHtml(html, {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, 'img', 'h1', 'h2'],
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ['src', 'alt', 'width', 'height', 'loading'],
      a: ['href', 'name', 'target', 'rel'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }),
    },
  });
}
