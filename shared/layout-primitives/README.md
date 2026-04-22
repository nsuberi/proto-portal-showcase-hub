# @proto-portal/layout-primitives

Structural layout components shared across prototypes. Visually unopinionated — each prototype supplies its own design tokens and visual styling.

## Philosophy

**Structure is shared. Style is per-prototype.**

LLM-assisted coding reliably gets the "fixed sidebar + independently-scrolling viewport" pattern wrong. These primitives encode the structural logic once so every prototype inherits known-good behavior. They do not impose colors, typography, or spacing beyond what's needed for the layout itself.

## What's inside

| Primitive | Purpose |
|---|---|
| `AppShell` | Root shell: fixed-width sidebar + flex-1 main area that scrolls independently |
| `ScrollViewport` | A scrolling region inside `AppShell` main — use when you need the main content to scroll while the sidebar stays put |
| `ContextPanel` | Right-side / secondary panel: fixed header + scrolling body |
| `SidebarRail` | Icon column with an optional expandable content panel (render-prop) |
| `BottomSheet` | Mobile-style overlay sheet with backdrop + escape-to-close |

## Theming contract

Primitives are headless for visuals. They:
- Use **structural** Tailwind classes only (`flex`, `overflow-y-auto`, `h-full`, `min-w-0`, etc.)
- Inherit color, font, and background from the surrounding context (`currentColor`, `inherit`)
- Accept a `className` prop for consumer-supplied visual styling
- Render a default close button (X icon from `lucide-react`) where applicable — restyle via `className` or swap via props

No shared tokens, no shared CSS. Each prototype defines its own visual language.

## Quick start

```tsx
import { AppShell, ScrollViewport, ContextPanel } from "@proto-portal/layout-primitives";

export default function Workspace() {
  return (
    <AppShell
      sidebar={<MySidebar className="w-64 bg-surface border-r border-border" />}
    >
      <TopBar />
      <div className="flex flex-1 min-h-0">
        <ScrollViewport className="flex-1">
          <MainContent />
        </ScrollViewport>
        <ContextPanel
          title="Details"
          onClose={closePanel}
          className="w-80 bg-surface border-l border-border"
        >
          <DetailContent />
        </ContextPanel>
      </div>
    </AppShell>
  );
}
```

## Why a separate package

`@proto-portal/design-tokens` and `@proto-portal/ui-components` are opt-in baselines for prototypes that want to share visuals. `@proto-portal/layout-primitives` is different — it sits below the visual layer and is the answer to "which components should always be shared." Structure is where bugs hide; sharing the structure means sharing the correctness.
