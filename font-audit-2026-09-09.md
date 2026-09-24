# Alibaba Sans font audit

## Changes

- Replaced the legacy Georgia/Times New Roman storefront heading and quotation override with the shared Alibaba Sans heading token.
- Adjusted storefront heading tracking and line height for readable sans-serif typography, keeping the existing layout and content.
- Removed `local()` font sources so devices load the same bundled font files rather than potentially different installed versions.
- Documented that the bundled Medium face serves both the 500 and 600 UI weights. It is not a separate semibold font asset.

## Verification

- Production build and TypeScript compilation passed.
- Browser checked `/`, `/shop`, `/about`, `/login`, and `/register` at 320, 390, 768, and 1440 pixels wide: 20 route/viewport combinations.
- Used Chrome's `CSS.getPlatformFontsForNode` to inspect the actual fonts rendering headings, quotations, body text, textual buttons, labels, and input placeholders, rather than relying only on computed CSS.
- All 130 sampled elements used bundled Alibaba Sans fonts; no unexpected rendered font, horizontal document overflow, captured runtime exception, or HTTP error response occurred during the final run.
- Inspected phone authentication screenshots and phone/desktop homepage screenshots to check readability and wrapping.
- Source review confirmed that every admin route is wrapped by `.admin-theme`, with Alibaba Sans inheritance covering headings, controls, chart text, and existing monospace utilities. Authenticated admin pages were not visually tested in this run.
- Reviewed all six bundled OpenType font assets and their included Apache 2.0 license; assets are valid static Alibaba Sans faces.

## Local evidence

Browser captures and detailed results are stored in `.codex-run/font-audit-2026-09-09/after/`; the pre-change evidence is under `before/`.

The task-local audit helper is `.codex-run/audit-rendered-fonts.mjs`. It expects the existing isolated QA Chrome session on port 9333 and the project preview on port 3108. It exits unsuccessfully if sampled text renders with another font, a document overflows horizontally, or a captured browser/network error occurs.
