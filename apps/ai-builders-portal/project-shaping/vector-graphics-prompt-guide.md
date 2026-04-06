# AI Builders Portal — Vector Graphics Prompt Guide

## Recommended Tools

### Primary: Recraft (recraft.ai)

Recraft is the clear choice for this project. It's the only AI tool that generates **native SVG vector files** — actual editable geometry, not raster images traced to vectors. This matters because:

- Output opens directly in Figma, Illustrator, or any vector editor with clean, grouped shapes
- You can specify exact color palettes (RGB values) per generation, keeping everything on-brand
- The "Style Reference" feature lets you upload one illustration and have all subsequent generations match it — critical for visual consistency across the portal
- V4 handles flat color, minimalist, and geometric styles exceptionally well
- SVG output means tiny file sizes and infinite scalability — no CDN image optimization needed

**Setup for brand consistency:** Before generating any assets, create a Recraft style reference by generating one hero illustration you love, then uploading it as the style reference for all subsequent generations. This ensures every illustration feels like it was drawn by the same hand.

**Color palette to specify with every prompt:**
```
Deep Space: #0F1B2D
Orbital Blue: #1E3A5F  
Instrument Blue: #3B82C4
Signal Orange: #D4763A
Atmosphere Teal: #2A9D8F
Regolith: #F4F1EC
Sediment: #E8E3DA
```

### Secondary: SVGMaker (svgmaker.io)

Good for quick icon generation and has an MCP server that integrates with Claude Code and Cursor. Useful for generating UI icons programmatically when you need a batch of consistent small assets. Not as strong as Recraft for full illustrations.

### Utility: Vectorizer.AI (vectorizer.ai)

If you generate a raster image elsewhere (Midjourney, DALL-E) that captures the right mood but needs to be vectorized, Vectorizer.AI produces the cleanest traced paths. Use as a fallback, not a primary workflow.

---

## Style Direction for All Prompts

Every prompt below includes style modifiers. Use these consistently:

**Always include:** `flat vector illustration, minimal geometric style, clean shapes, limited color palette using [specify 2-3 colors from the palette], no gradients, no drop shadows, solid color fills, simple outlines, professional and warm tone`

**Never include:** photorealistic, 3D rendering, complex textures, neon, glow effects, dark/moody atmosphere (unless specifically for the deep space exploration context)

**Recraft preset:** Use "Vector Art" or "Icon" mode depending on complexity. For hero illustrations, use "Vector Art." For UI elements and small graphics, use "Icon."

---

## The Graphics and Where They Fit

### 1. Hero Illustration — Landing / Home Page

**Where it appears:** Top of the landing page, above the fold. First thing someone sees. Sets the emotional tone for the entire portal.

**What it needs to communicate:** "This is a place where you invest in yourself, with a community by your side. You're not alone in this."

**Recraft prompt:**
```
Flat vector illustration of a small group of diverse people standing on the surface of an unfamiliar planet, looking out at a vast but inviting landscape. The terrain has gentle rolling hills with warm earth tones. One person is kneeling, examining the ground with an instrument that looks like a handheld scanner. Another is pointing toward the horizon where a small basecamp structure glows warmly in the distance. The sky transitions from deep navy at the top to warm teal near the horizon, suggesting an atmosphere forming. Minimal geometric style, clean shapes, solid color fills. Color palette: deep navy #0F1B2D, teal #2A9D8F, warm orange #D4763A, off-white #F4F1EC, warm gray #E8E3DA. No gradients, no drop shadows. Professional and approachable tone, not cartoonish.
```

**Aspect ratio:** 16:9 (wide banner)

---

### 2. Phase Illustrations — Journey Map / Onboarding

Three illustrations that appear in the journey map component and during onboarding, representing each phase of development. They should feel like a visual progression — same world, increasing settlement.

#### Phase 1: Developing Intuition

**Where it appears:** Journey map Phase 1 marker, onboarding flow when someone is in early stages, challenge cards with "Guided" scaffolding level.

**What it needs to communicate:** Exploration, first contact, observing and absorbing. Following signposts.

**Recraft prompt:**
```
Flat vector illustration of a single person in a spacesuit walking across an open, unfamiliar landscape. They are following a trail of small illuminated markers embedded in the ground, each one glowing with a soft blue light. The terrain is sparse — gentle curves of pale regolith-colored ground. In the far background, a faint outline of structures suggests a basecamp they're heading toward. The person carries a small handheld instrument, like a scanner or compass. The overall feeling is curiosity and safe exploration. Minimal geometric style, clean shapes, solid color fills. Color palette: deep navy #0F1B2D sky, blue #3B82C4 marker lights, warm off-white #F4F1EC ground, teal #2A9D8F distant structures. No gradients, no drop shadows.
```

**Aspect ratio:** 4:3

#### Phase 2: Exercising Judgment with Support

**Where it appears:** Journey map Phase 2 marker, onboarding context, Phase 2 challenge cards.

**What it needs to communicate:** Building, making decisions, constructing something with visible progress. Working alongside others.

**Recraft prompt:**
```
Flat vector illustration of two people working together to build a small modular structure on a planetary surface. One person is examining a transparent blueprint or holographic display showing the structure's design. The other is assembling a section, fitting panels together. Around them, a few completed small structures are visible — evidence of previous builders. Simple tools and instruments are organized nearby. The atmosphere is slightly warmer than Phase 1 — more ambient light, a hint of teal in the sky suggesting atmosphere development. Minimal geometric style, clean shapes. Color palette: teal #2A9D8F structures, blue #3B82C4 holographic display, orange #D4763A accent on tools and active work areas, warm gray #E8E3DA ground, deep navy #0F1B2D background elements.
```

**Aspect ratio:** 4:3

#### Phase 3: Navigating Independently

**Where it appears:** Journey map Phase 3 marker, onboarding context, Phase 3 challenge cards.

**What it needs to communicate:** A habitable environment, community, presenting and sharing. Warmth and sustainability.

**Recraft prompt:**
```
Flat vector illustration of a small thriving settlement on a planetary surface. Several connected modular structures form a basecamp with warm light glowing from windows. In the foreground, a person stands at a podium or presentation area, addressing a small seated group — a community session. A large transparent dome overhead shows that the atmosphere is being cultivated. The color palette is the warmest of the three phases. Plants or simple organic forms are beginning to appear around the structures. Minimal geometric style, clean shapes. Color palette: warm orange-gold #D4A03A warm light from structures, teal #2A9D8F dome and growing elements, off-white #F4F1EC structures, deep navy #0F1B2D sky, blue #3B82C4 technology accents.
```

**Aspect ratio:** 4:3

---

### 3. Empty State Illustrations — Throughout Portal

Small illustrations that appear when a section has no content yet. These should be simple, lightweight, and encouraging — not sad or barren.

#### Empty Challenge List

**Where it appears:** Challenge library when no challenges are active or available.

**Recraft prompt:**
```
Flat vector icon of a rolled-up map or scroll with a small compass sitting on top of it, partially unrolled to show a hint of terrain markings. A small glowing dot on the map suggests a destination. Minimal, geometric, warm tone. Colors: blue #3B82C4 compass, warm off-white #F4F1EC scroll, orange #D4763A destination dot, warm gray #E8E3DA map lines. Simple and clean, icon style, no background.
```

**Aspect ratio:** 1:1, small (used at ~120px)

#### Empty Devlog

**Where it appears:** Devlog section of a profile before any entries are written.

**Recraft prompt:**
```
Flat vector icon of an open notebook or journal with a pen resting across it. The pages show faint ruled lines. A small star or asterisk appears on the top page, suggesting the first entry is ready to be written. Minimal geometric style. Colors: warm off-white #F4F1EC pages, deep navy #0F1B2D pen, teal #2A9D8F star accent. Clean, simple, icon style, no background.
```

**Aspect ratio:** 1:1, small

#### Empty Showcase Gallery

**Where it appears:** Showcase gallery before any peer work has been submitted.

**Recraft prompt:**
```
Flat vector icon of a small empty display frame or viewport, with a dashed outline suggesting where content will appear. A small wrench or tool icon sits in the corner, suggesting something is being built. Minimal geometric style. Colors: warm gray #E8E3DA frame, blue #3B82C4 dashed outline, orange #D4763A tool accent. Clean, simple, icon style, no background.
```

**Aspect ratio:** 1:1, small

---

### 4. Section Headers — Content Domain Illustrations

These appear at the top of content domain sections (Architecture, Building, Data Modeling, etc.) in the reference panel or when browsing by topic. Each should be a small, recognizable visual that maps to the "instruments" metaphor.

#### Architecture

**Recraft prompt:**
```
Flat vector icon of layered horizontal platforms connected by vertical conduits, resembling a simplified infrastructure diagram or cross-section of connected systems. Each layer is a different shade. Minimal geometric style. Colors: deep navy #0F1B2D top layer, blue #3B82C4 middle layers, teal #2A9D8F conduits connecting them. Clean lines, no text, icon style, no background.
```

#### Building

**Recraft prompt:**
```
Flat vector icon of a wrench crossed with a magnifying glass, forming an X shape. The magnifying glass has a small log readout or terminal screen visible in its lens. Represents building and debugging as paired activities. Colors: orange #D4763A wrench, blue #3B82C4 magnifying glass, teal #2A9D8F screen glow. Minimal, clean, icon style, no background.
```

#### Data Modeling

**Recraft prompt:**
```
Flat vector icon of three interlocking geometric shapes — a circle, square, and triangle — connected by thin lines suggesting relationships. Small lock icon on one connection suggesting access control. Colors: teal #2A9D8F shapes, blue #3B82C4 connecting lines, orange #D4763A lock accent. Minimal, clean, icon style, no background.
```

#### Discovery & Design

**Recraft prompt:**
```
Flat vector icon of a simple telescope or periscope pointing upward, with a small lightbulb or spark at the viewing end suggesting insight. A faint circular target or crosshair at the base suggesting focus and precision. Colors: blue #3B82C4 telescope body, orange #D4763A spark, warm gray #E8E3DA base elements. Minimal, clean, icon style, no background.
```

#### Navigating Your Organization

**Recraft prompt:**
```
Flat vector icon of a simple compass rose with one cardinal direction highlighted, and a small handshake or two overlapping circles nearby suggesting partnership. Colors: deep navy #0F1B2D compass body, orange #D4763A highlighted direction, teal #2A9D8F partnership symbol. Minimal, clean, icon style, no background.
```

#### Go-to-Market

**Recraft prompt:**
```
Flat vector icon of a small presentation screen or display board with a play button triangle on it, and a paper document with a checkmark beside it. Represents video presentations and one-pagers. Colors: blue #3B82C4 screen, orange #D4763A play button, teal #2A9D8F checkmark. Minimal, clean, icon style, no background.
```

---

### 5. Onboarding Flow Background

**Where it appears:** Subtle background texture or illustration behind the onboarding flow component. Should be atmospheric, not attention-competing.

**Recraft prompt:**
```
Flat vector illustration of a wide, minimal planetary horizon. The ground is a single curved line of warm off-white, and above it the sky fades from deep navy at top to lighter blue at the horizon. Three or four tiny stars are visible. The entire image should feel vast, open, and inviting — like standing at the beginning of a journey with everything ahead of you. Extremely minimal, no figures, no structures. Colors: deep navy #0F1B2D sky, blue #3B82C4 mid-sky, warm off-white #F4F1EC ground. Very simple, wide format.
```

**Aspect ratio:** 16:9 (extra wide), used at low opacity behind the onboarding component

---

### 6. Basecamp Community Illustration

**Where it appears:** Live Room section header, community session listings, the "basecamp" area of the portal.

**What it needs to communicate:** Warmth, shelter, return, sharing. The place you come back to.

**Recraft prompt:**
```
Flat vector illustration of a small, warm gathering space inside a dome-like structure. Four or five simplified figures are arranged in a loose circle — some seated, one standing and gesturing as if presenting. Warm light radiates from the center of the group. Through the transparent dome walls, the outside terrain is visible but darker and cooler, creating contrast between the sheltered interior and the exploration exterior. Minimal geometric style, clean shapes. Colors: warm orange #D4763A interior light, off-white #F4F1EC dome structure, teal #2A9D8F seated figures, deep navy #0F1B2D exterior, blue #3B82C4 technology accents.
```

**Aspect ratio:** 4:3

---

### 7. Achievement / Milestone Markers

**Where it appears:** Journey map completion markers, profile milestone badges, challenge completion celebrations.

Small, consistent badges that mark progress. Each should be a circular emblem with a distinct icon inside.

#### First Deployment

**Recraft prompt:**
```
Flat vector circular badge icon. A small rocket or upward arrow inside a circle, suggesting launch or first deployment. Clean geometric style. Colors: circle border teal #2A9D8F, rocket/arrow shape white #FAFAF8, background inside circle deep navy #0F1B2D. Simple, minimal, badge style, no background outside the circle.
```

#### First Devlog

**Recraft prompt:**
```
Flat vector circular badge icon. A small pen nib or writing instrument inside a circle, with a single short line suggesting written text. Colors: circle border blue #3B82C4, pen shape white #FAFAF8, background deep navy #0F1B2D. Simple, minimal, badge style.
```

#### First Presentation

**Recraft prompt:**
```
Flat vector circular badge icon. A small podium or microphone shape inside a circle, with simple sound wave lines radiating outward. Colors: circle border orange #D4763A, podium shape white #FAFAF8, background deep navy #0F1B2D. Simple, minimal, badge style.
```

#### Discovery Completed

**Recraft prompt:**
```
Flat vector circular badge icon. A small telescope or binocular shape inside a circle, with a tiny star at the focal point suggesting something found. Colors: circle border warm gold #D4A03A, telescope white #FAFAF8, star orange #D4763A, background deep navy #0F1B2D. Simple, minimal, badge style.
```

---

### 8. Shareable Portfolio Header

**Where it appears:** Top of the shareable portfolio view — the outward-facing page that managers and colleagues see.

**What it needs to communicate:** Professional credibility, substance, the person's journey condensed into a visual banner.

**Recraft prompt:**
```
Flat vector wide banner illustration showing a panoramic view of a settled planetary landscape. In the foreground, organized structures and pathways suggest a well-planned community. In the middle ground, a figure walks confidently between buildings carrying instruments and documents. The background shows the wider unexplored terrain, suggesting there's always more to discover. The overall tone is accomplished but forward-looking. Minimal geometric style, clean shapes. Colors: warm off-white #F4F1EC structures, teal #2A9D8F pathways and growing elements, blue #3B82C4 technology, deep navy #0F1B2D sky, orange #D4763A warm accents. Professional and polished, not whimsical.
```

**Aspect ratio:** 3:1 (very wide banner)

---

### 9. Error State / "Lost in Space" Illustration

**Where it appears:** 404 pages, connection errors, when something breaks in the artifact renderer.

**What it needs to communicate:** Something went wrong, but you can find your way back. Not scary — gently humorous.

**Recraft prompt:**
```
Flat vector illustration of a person in a spacesuit standing on a small floating rock or asteroid, looking at a handheld device that shows a question mark on its screen. A dotted line trail behind them suggests the path they took. A small arrow or beacon in the distance points back toward basecamp. The person's body language is calm and curious, not distressed. Minimal geometric style. Colors: blue #3B82C4 spacesuit, deep navy #0F1B2D space, orange #D4763A question mark and beacon, warm gray #E8E3DA rock, teal #2A9D8F dotted trail. Lighthearted but professional.
```

**Aspect ratio:** 1:1

---

## Workflow for Consistency

1. **Generate the hero illustration first** (prompt #1). Get it exactly right — iterate until the style feels warm, professional, and distinctly "AI Builders."

2. **Upload the hero illustration as a Recraft style reference.** Every subsequent generation will inherit its visual language.

3. **Generate the three phase illustrations** (prompt #2) as a batch. They should feel like a progression of the same world.

4. **Generate all six content domain icons** (prompt #4) in a single session so they share weight, line thickness, and scale.

5. **Generate achievement badges** (prompt #7) together for the same reason.

6. **Generate remaining illustrations** individually, always with the style reference active.

7. **Review all assets in Figma** at their actual sizes and contexts. AI-generated vectors often need minor cleanup — simplify paths, adjust proportions, remove stray shapes.

## File Organization

```
/assets/illustrations/
  hero-landing.svg
  phase-1-intuition.svg
  phase-2-judgment.svg
  phase-3-navigation.svg
  basecamp-community.svg
  portfolio-header.svg
  onboarding-horizon.svg
  error-lost.svg

/assets/icons/
  domain-architecture.svg
  domain-building.svg
  domain-data.svg
  domain-discovery.svg
  domain-organization.svg
  domain-gtm.svg

/assets/icons/empty-states/
  empty-challenges.svg
  empty-devlog.svg
  empty-showcase.svg

/assets/icons/badges/
  badge-first-deploy.svg
  badge-first-devlog.svg
  badge-first-presentation.svg
  badge-discovery-complete.svg
```
