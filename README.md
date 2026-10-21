# Wedora Gifts – Luxury Hampers

Next.js App Router storefront built with TypeScript, Tailwind CSS 4, and Zustand. The interface follows the supplied Stitch home, catalog, and hamper studio exports: warm ivory surfaces, champagne gold accents, Playfair Display headings, Plus Jakarta Sans body text, and the exported photography.

## Getting started

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and set the values below.
3. Run `npm run dev`.

`APPS_SCRIPT_URL` is the Apps Script `/exec` URL and `APPS_SCRIPT_SECRET` stays server-side. Without the URL, the public catalog uses sample products. `ADMIN_PASSWORD` enables the protected `/admin` sign-in. `NEXT_PUBLIC_WHATSAPP_NUMBER` should contain the country code and number without `+` or punctuation.

The admin supports product and purchase CRUD through the Apps Script actions. Public routes only receive active products with public catalog fields. GET requests are cached for 60 seconds; writes invalidate product and purchase cache tags.

## Routes

- `/` storefront home
- `/collection/[category]` catalog and category filter
- `/product/[id]` product detail
- `/cart` persistent browser cart and WhatsApp order handoff
- `/admin` password-protected product and purchase management

## Production

Run `npm run build`, then `npm start`.

For production, set ADMIN_PASSWORD in your hosting provider's server-side environment variables and redeploy. .env.local is only for local development; .env.example contains placeholders.
