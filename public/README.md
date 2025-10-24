Public folder — static assets
=============================

This folder is intended for static-only assets that should be copied as-is to the dev server / production build.

Examples:
- images (png, jpg, svg)
- robots.txt, manifest.json
- favicon files

Note: The Vite HTML entry remains `index.html` at the project root. Keep that file as the application's entrypoint. Files placed in `public/` will be served at the root during dev and included in the build output.
