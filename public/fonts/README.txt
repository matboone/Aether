Editorial New (Pangram Pangram Foundry) - web use
==================================================

This repository does not ship Editorial New font binaries. You must buy a license
from the foundry and add the file yourself.

Steps (verify current prices on the storefront):
  1. Open https://pangrampangram.com/products/editorial-new
  2. Click "Buy Now", pick styles (for the welcome wordmark you need at least Italic).
  3. Add a "Web License" tier that matches your site traffic (options are listed on the
     product page, e.g. pageview tiers with add-on pricing).
  4. After purchase, download WOFF2 from your Pangram account.

Place the italic webfont here with this exact filename:

  public/fonts/Editorial-New-Italic.woff2

The app loads it via @font-face in app/dashboard.css (font-family: "Editorial New").

Until that file exists, the UI falls back to Bodoni Moda Italic (500, Google Fonts)
from app/layout.tsx.

The storefront "Try for Free" offer is trial/personal use under Pangram's terms; it is
not a replacement for a commercial web license for production.
