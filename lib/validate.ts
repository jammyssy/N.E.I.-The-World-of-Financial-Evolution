import sanitize from 'sanitize-html';

export const isPhone = (v: string) => /^1[3-9]\d{9}$/.test(v);
export const isNickname = (v: string) => v.length >= 2 && v.length <= 20 && !/[<>&"']/.test(v);
export const isPassword = (v: string) =>
  v.length >= 8 && v.length <= 20 && /[A-Za-z]/.test(v) && /\d/.test(v);
export const isCode = (v: string) => /^\d{6}$/.test(v);

const SENSITIVE = ['admin', '管理员', '官方', '客服', 'root'];
export const hasSensitive = (v: string) => SENSITIVE.some((w) => v.toLowerCase().includes(w));

export function sanitizeHtml(html: string): string {
  return sanitize(html, {
    allowedTags: [
      'p',
      'br',
      'strong',
      'em',
      'u',
      'ul',
      'ol',
      'li',
      'blockquote',
      'h1',
      'h2',
      'h3',
      'a',
      'code',
      'pre',
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: sanitize.simpleTransform('a', { rel: 'noopener noreferrer', target: '_blank' }),
    },
  });
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}
