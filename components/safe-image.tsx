'use client';
import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';

// Temporary diagnostics: every failure path logs a category so image issues can be traced:
//   [SafeImage] missing URL        -> sheet has no ImageURL value for this product
//   [SafeImage] invalid URL        -> value is not a usable http(s) address
//   [SafeImage] viewer-page URL    -> ImgBB page link (https://ibb.co/...), not a direct image (https://i.ibb.co/...)
//   [SafeImage] load failed        -> URL is direct but the host refused/blocked it or the file is gone
// Remove the console.log/warn calls once every product has a direct image URL in the sheet.

type Check = { ok: boolean; reason?: string };

function validateImageUrl(src: string): Check {
  if (!src) return { ok: false, reason: 'missing URL (sheet has no ImageURL value)' };
  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return { ok: false, reason: `invalid URL (not a parseable address): "${src}"` };
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return { ok: false, reason: `invalid URL (unsupported protocol ${url.protocol}): "${src}"` };
  }
  const host = url.hostname.toLowerCase();
  // ibb.co / www.ibb.co are viewer PAGES (they serve text/html, never render in <img>).
  // i.ibb.co is ImgBB's direct-image host and is allowed. We never guess direct URLs from page links.
  if (host === 'ibb.co' || host === 'www.ibb.co') {
    return { ok: false, reason: `viewer-page URL (ImgBB page link, not a direct image — use the "Direct link" from ImgBB, e.g. https://i.ibb.co/...): "${src}"` };
  }
  return { ok: true };
}

function Placeholder({ name, className, style }: { name: string; className?: string; style?: CSSProperties }) {
  return (
    <div
      className={className}
      role="img"
      aria-label={name ? `Image unavailable for ${name}` : 'Image unavailable'}
      style={{
        width: '100%',
        height: '100%',
        ...style,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        background: '#f7f3ed',
        border: '1px dashed #d1c5b4',
        color: '#775a19',
        textAlign: 'center',
        padding: 12,
        boxSizing: 'border-box',
      }}
    >
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.8" />
        <path d="M21 15l-5-5L5 21" />
      </svg>
      <span style={{ fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 600, lineHeight: 1.4, overflowWrap: 'anywhere' }}>
        {name || 'Product image'}
      </span>
    </div>
  );
}

// Product image that never breaks the layout:
// renders a plain <img> for valid direct image URLs (object-fit: cover via existing CSS),
// and swaps to a clean icon + product-name placeholder for missing/invalid URLs or load failures.
// The initial state is validated synchronously so server-rendered HTML already contains
// the placeholder for invalid URLs (useEffect never runs during SSR).
export function SafeImage({ src, alt, label, className, style }: { src?: string; alt: string; label?: string; className?: string; style?: CSSProperties }) {
  const trimmed = (src || '').trim();
  const [failed, setFailed] = useState(() => !validateImageUrl(trimmed).ok);

  useEffect(() => {
    const check = validateImageUrl(trimmed);
    setFailed(!check.ok);
    if (!check.ok) console.warn(`[SafeImage] "${alt}": ${check.reason}`);
    else console.log(`[SafeImage] "${alt}": loading direct image URL ${trimmed}`);
  }, [trimmed, alt]);

  if (failed) return <Placeholder name={label || alt} className={className} style={style} />;

  return (
    <img
      src={trimmed}
      alt={alt || 'Product'}
      className={className}
      style={{ ...style, objectFit: 'cover' }}
      loading="lazy"
      onLoad={() => {
        console.log(`[SafeImage] "${alt}": image loaded OK from ${trimmed}`);
      }}
      onError={() => {
        console.warn(`[SafeImage] "${alt}": image failed to load from ${trimmed} — the host may block hotlinking, serve an HTML page, or the file was deleted. Showing placeholder.`);
        setFailed(true);
      }}
    />
  );
}
