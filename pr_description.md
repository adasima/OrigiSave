🎯 **What:** Removed duplicate `MediaMetadata` interface definition from `src/background/index.ts` and replaced it with a type import from `src/common/naming.ts`.
💡 **Why:** Having multiple definitions of the same interface leads to inconsistency and duplication. Consolidating the interface into a single location improves code maintainability.
✅ **Verification:** Verified that the code compiles successfully without any TypeScript errors using `npm run build`. Ensured no new linting errors were introduced with `npm run lint`.
✨ **Result:** Improved code consistency and reduced duplication without changing any functionality.
