Assets required for the frontend (place files under `src/assets/`):

Current status:
- Material Symbols icons: already provided via Google Fonts in `index.html`, so no local icon asset is needed.
- Fonts Plus Jakarta Sans and Quicksand: already provided via Google Fonts, so no local font asset is needed.
- If you keep the current login/register visuals, the app can run without additional local image assets.

- logo.svg (app logo)
  - Purpose: header/branding
  - Preferred: SVG, viewBox set, ~1:1 aspect, multiple sizes not required

- favicon.svg (favicon)
  - Purpose: browser tab icon
  - Preferred: SVG or 32x32 PNG

- hero.png (hero image shown on login left panel)
  - Purpose: decorative hero image
  - Preferred: PNG/JPEG, wide aspect (e.g., 1600x900) or high-res with 2x

- auth-cat.png (optional)
  - Purpose: optional small illustration for auth pages
  - Preferred: PNG or SVG

When you provide assets, please:
1. Put files in `Frontend/src/assets/`.
2. Name exactly as above or update references in code.
3. If providing multiple sizes, include a README note which file to use.

If you want, attach the files here or tell me the local path and I can move them into the project and update references.
