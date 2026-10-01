# Consuming KSAP Cloud UI Design System in web apps

Read `artifacts/ksap-cloud-ui/docs/AGENTS.md` first. This guide covers
React/Vite and other shadcn/Tailwind web consumers. If the app already contains
a local theme or component library, also read
`artifacts/ksap-cloud-ui/docs/migrating-web.md` before writing UI.

## Theme

Import this package's theme once from the app's main CSS:

```css
@import "@workspace/ksap-cloud-ui/styles.css";
```

`styles.css` already imports Tailwind, its plugins, and this package's token
theme. It also registers this package's component sources. Do not add a separate
Tailwind import or a `node_modules` source path in a Tailwind v4 consumer.
Tailwind v3 consumers keep their existing `@tailwind` directives and add
`node_modules/@workspace/ksap-cloud-ui/src/components` to `content`.

## Components and helpers

Import every provided primitive, `cn`, and toast API directly from this package:

```tsx
import { Button } from "@workspace/ksap-cloud-ui/components/ui/button";
import { cn } from "@workspace/ksap-cloud-ui/lib/utils";
import {
  toast,
  useToast,
} from "@workspace/ksap-cloud-ui/hooks/use-toast";
```

Use the package component whenever it provides the required family. Keep
product-specific compositions in the app, but compose them from package
primitives rather than recreating those primitives locally.

The packaged `Toaster` and toast hook share the real Sonner store. Do not call a
local toast hook while rendering the packaged `Toaster`.

Behavior-free patterns are exported from `components/patterns/*`. Import
`Card` compatibility names from `components/patterns/panel`, not a local Card.
Connect `UIStringsProvider` from `lib/ui-strings` to the app's shared i18next
namespace, using the exported `DEFAULT_UI_STRINGS` dictionary. Preferences
stay in the app; `setDisplay` from `hooks/use-display` applies them to HTML.

## Verify

After wiring the workspace dependency, import and render
`@workspace/ksap-cloud-ui/components/ui/button`. Run the app's typecheck
and dev server. The import must resolve and the Button must use this package's
theme before broader UI work begins.

## Ongoing rules

- Keep one source of theme variables.
- Import package-provided primitives and helpers from the package path.
- Add reusable product-agnostic components to this package first.
- For a non-shadcn app, use the tokens as the source of truth and adapt existing
  components to the token CSS variables without copying token values.
