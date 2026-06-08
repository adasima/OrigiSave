## Overview
This PR consolidates all open feature and fix branches (the "PR hell") into a single, cohesive pull request. The changes have been manually reviewed, conflicts have been resolved carefully to maintain functionality context, and tests have been updated/added where appropriate.

## Included Fixes & Improvements
* **MediaMetadata Deduplication:** Removed the duplicate interface in `src/background/index.ts` and unified it.
* **XSS innerHTML Fix:** Replaced `innerHTML` usage with secure DOM creation methods (`createElement`, `createElementNS`) across `src/content/x-main.ts`.
* **Insecure Message Passing:** Added proper origin validation in `src/content/index.ts`.
* **Mutation Observer Optimization:** Optimized the `MutationObserver` loop in `src/content/x-main.ts` for better performance when querying tweets.
* **Dead Code Removal & Refactoring:**
  * Removed unused X/Twitter video fetching logic from the background worker.
  * Removed unused naming templates and associated dead code from `src/common/naming.ts` (file deleted).
  * Fixed empty unused imports.
  * Added validation for HTTP/HTTPS protocols on downloads to prevent unsafe scheme abuse.
* **Testing Improvements:** Added `vitest` as a dependency, created test configurations, and wrote unit tests for `generateFilename` and `optimizeMediaUrl` utilities.

## Verification
* ✔️ `npm run lint` passes with no errors.
* ✔️ `npm run build` successfully compiles the extension.
* ✔️ `npm run test` (vitest) passes for all included tests.
