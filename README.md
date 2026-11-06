# NEYA

NEYA is a browser based makeup studio. It currently provides live face tracking, photo and camera try-on, a personal product collection, saved looks, beauty preferences, and optional cloud sync. The current release uses free browser features and a Supabase Free project. It makes no OpenAI API calls.

## Run locally

Use Node.js 20+ and a current browser. Camera access requires localhost or HTTPS.

```bash
npm install
cp .env.example .env.local
npm run dev
```

The two `VITE_SUPABASE_*` values in `.env.local` are the public Supabase project URL and publishable key. They enable email link sign-in and cloud sync. Without them, local collection, looks, and profile storage still work. The SQL schema is in `supabase/migrations/20261106_create_beauty_data.sql`; apply it to the Supabase project before using cloud sync.

## What works

- **Face studio:** live camera tracking and a subtle face mesh or region anchors.
- **Explore looks:** upload a face photo or use the camera, try independent makeup layers, adjust shades, intensity, finish, and supported techniques, compare before and after or another saved look, and save a look.
- **My Collection:** add, edit, search, filter, and remove owned or wishlisted products. Product colours can be used in Explore.
- **Beauty Profile:** save style and assistance preferences, export data, delete data, choose whether product photos sync, and sign in for cloud sync.
- **Saved Looks:** reopen, compare, rename, duplicate, and delete looks.
- **Voice commands:** when enabled in Beauty Profile and supported by the browser, Explore accepts a category, starter shade, occasion, or “suggest”, “compare”, and “save”. Speech recognition support and network behavior depend on the browser.

Data is saved in this browser immediately. After email sign-in, products, saved looks, and preferences sync to the user's row in Supabase. Row level security restricts access to the signed-in user. Uploaded face photos and camera frames are never saved by NEYA. Product photos remain local unless the user enables cloud photo sync.

## Limits of this release

Digital colour and placement are approximations, not exact physical product matches. Makeup progress detection, product recognition, conversational AI, a verified brand catalogue, and continuous voice guidance are not implemented. Starter shade suggestions are local rules, clearly labelled in the app. OpenAI integration requires an API key and an explicit decision to use any paid API quota; it is disabled to honor the free-only requirement.

MediaPipe model and WASM assets download on first use. Camera quality should be checked on each target device and browser.

## Checks

```bash
npm run build
npm test
```

See `docs/architecture.md`, `docs/development-plan.md`, and `docs/testing.md` for implementation and verification details.
