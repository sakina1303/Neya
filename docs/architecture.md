# NEYA architecture

NEYA is a Vite, React, and TypeScript web app. Live Makeup and Explore share the camera and makeup preview. MediaPipe Face Landmarker runs in the browser. `src/vision/makeup.ts` draws translucent makeup layers on a canvas using face landmarks. This visual preview is intentionally approximate. `src/data/catalog.ts` holds a small static India product catalogue and ranks colour-family suggestions; its swatches are editorial estimates.

`src/data/beauty.ts` defines products, looks, and profile data. The app saves a versioned copy in localStorage. `src/cloud.ts` connects to Supabase only when public configuration is present. After email link authentication, `src/App.tsx` reads the user's `beauty_data` row, merges local products and looks, and debounces updates back to Supabase. The table has row level security policies for each user's own row. Product images are stripped from cloud payloads unless the profile explicitly permits photo sync. Face photos and camera frames are never included in saved data.

The Supabase schema is in `supabase/migrations/20261106_create_beauty_data.sql`. The frontend uses only the public publishable key, never a service role key. OpenAI is not configured or called; adding it later requires a server side endpoint so a private API key is not exposed to the browser.

MediaPipe model and WASM runtime load from versioned public URLs. The camera starts only after a user action and stops when leaving the relevant page. Browser speech recognition is optional and its availability varies by browser.
