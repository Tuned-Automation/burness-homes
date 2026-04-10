# Burness Homes — Project Detail Page Template

A guide for replicating the project detail page used on `project-22-kahurangi-road.html`. This document describes every section, explains what to change per project, and covers the integration points with the site's shared navigation, footer, Barba.js transitions, and GSAP animations.

---

## Quick Start

1. Duplicate `project-22-kahurangi-road.html`
2. Rename it to `project-{slug}.html` (e.g. `project-the-canopy.html`)
3. Replace the content using the section-by-section guide below
4. Add a link card on `projects.html`
5. Hard-refresh to test — Barba.js caches pages

> **CSS Architecture:** All shared styles live in external stylesheets (`css/global.css` for site-wide styles, `css/project.css` for project-page styles). Each page keeps a minimal inline `<style>` tag for page-specific overrides — this tag is required by Barba.js even if it's empty.

---

## File Naming Convention

```
project-{slug}.html
```

The slug should be lowercase, hyphenated, and based on the project name or address:

- `project-22-kahurangi-road.html`
- `project-the-canopy.html`
- `project-101-trices-road.html`

All project pages live at the **root level** alongside `index.html`, `projects.html`, etc.

---

## Image Preparation

Each project needs a folder under `images/` with three subfolders:

```
images/{Project Name}/
├── Large-files/       ← Full-resolution originals
├── Medium-files/      ← Used on the website (recommended)
└── Small-files/       ← Thumbnails (not currently used)
```

The **Medium-files** folder is what the page references. Image filenames follow this pattern:

```
{Project Name}-{NNN} Large.jpeg
```

Where `{NNN}` is a zero-padded number (001, 002, etc.). Spaces in folder/file names are URL-encoded as `%20` in the HTML `src` attributes.

You'll also want **one hero image** — ideally a dramatic exterior shot (sunset/twilight works best). This can live in `images/Burness Homes - Stills/` or in the project's own folder.

---

## Page Structure (7 Sections)

### 1. Hero

A rounded-corner container at 82% viewport height with the hero image, breadcrumb, project type eyebrow, and title.

```html
<section class="hero">
  <div class="hero-container">
    <div class="hero-bg">
      <img src="YOUR_HERO_IMAGE_PATH" alt="DESCRIPTIVE ALT TEXT" loading="eager">
      <div class="hero-overlay"></div>
    </div>
    <div class="hero-content">
      <nav class="hero-breadcrumb">
        <a href="index.html">Home</a> › <a href="projects.html">Our Builds</a> › PROJECT NAME
      </nav>
      <div class="hero-eyebrow">PROJECT TYPE</div>
      <h1 class="hero-title">
        <span class="hero-title-line"><span>LINE 1</span></span>
        <span class="hero-title-line"><span>LINE 2</span></span>
      </h1>
    </div>
  </div>
</section>
```

**What to change:**
| Field | Example |
|---|---|
| Hero image `src` | Path to the best exterior/hero photo |
| Hero image `alt` | Descriptive text about the specific home |
| Breadcrumb final `<span>` | The project name (e.g. "The Canopy") |
| `.hero-eyebrow` | "New Build", "Renovation", or "Design & Build" |
| `.hero-title` lines | Split the project name across 1–2 lines |

**Styling notes:**
- `min-height: 82vh` — gives a peek at content below the fold
- `object-position: center 40%` — adjust per image to control focal point
- The overlay gradient darkens the bottom for text legibility
- The `<img>` must have `loading="eager"` (it's above the fold)
- Also update the `<link rel="preload">` in `<head>` to match the hero image path

---

### 2. Project Info Bar

Five key stats displayed in a horizontal strip.

```html
<section class="project-info-bar">
  <div class="project-info-inner">
    <div class="project-info-item">
      <div class="project-info-label">Location</div>
      <div class="project-info-value">SUBURB, Canterbury</div>
    </div>
    <div class="project-info-item">
      <div class="project-info-label">Project Type</div>
      <div class="project-info-value">TYPE</div>
    </div>
    <div class="project-info-item">
      <div class="project-info-label">Floor Area</div>
      <div class="project-info-value">XXX m²</div>
    </div>
    <div class="project-info-item">
      <div class="project-info-label">Bedrooms</div>
      <div class="project-info-value">X Bedrooms</div>
    </div>
    <div class="project-info-item">
      <div class="project-info-label">Completed</div>
      <div class="project-info-value">YEAR</div>
    </div>
  </div>
</section>
```

**What to change:** All five values. Use `&sup2;` for the ² symbol in HTML.

---

### 3. Overview

Two-column layout: narrative text on the left, a featured interior image on the right.

**What to change:**
| Field | Notes |
|---|---|
| `<h2>` | A one-line summary of the project's character |
| Two `<p>` tags | First paragraph: site context and brief. Second paragraph: key features |
| `.overview-image img` | Best interior shot (kitchen or living room recommended) |

The image container has `aspect-ratio: 4/3` and a clip-path reveal animation on scroll.

---

### 4. Design Highlights (Bento Grid)

A 12-column, 2-row grid mixing **4 image tiles** and **2 text feature cards**. This is where you call out the standout design elements.

**Grid positions (desktop):**

```
┌─────────────┬───────────┬────────────┐
│  bento-1    │  bento-2  │  bento-3   │
│  (5 cols)   │  (3 cols) │  (4 cols)  │
│  IMAGE      │  CARD     │  IMAGE     │
├────────┬────┴───────────┼────────────┤
│bento-4 │    bento-5     │  bento-6   │
│(3 cols)│    (4 cols)    │  (5 cols)  │
│ IMAGE  │    CARD        │  IMAGE     │
└────────┴────────────────┴────────────┘
```

**Image tiles** use class `bento-item bento-img-overlay bento-N`:
```html
<div class="bento-item bento-img-overlay bento-1">
  <img src="IMAGE_PATH" alt="ALT" loading="lazy">
  <div class="bento-img-label">
    <span class="bento-img-tag">CATEGORY</span><br>
    FEATURE NAME
  </div>
</div>
```

**Text cards** use class `bento-item bento-card bento-N`:
```html
<div class="bento-item bento-card bento-2">
  <svg class="bento-card-icon">...</svg>
  <h3>Feature Title</h3>
  <p>Feature description.</p>
</div>
```

**What to change per project:**
- 4 feature images + their labels/tags
- 2 card titles, descriptions, and icons
- Choose features unique to each project (e.g. "Outdoor Kitchen", "Wine Cellar", "Solar Array")

---

### 5. Gallery

An editorial 12-column grid with explicit sizing per image. Each image gets a column-span class (`gi-w3` through `gi-w12`) and optional row-span (`gi-h2`, `gi-h3`).

**Available size classes:**

| Class | Span |
|---|---|
| `gi-w3` | 3 of 12 columns (quarter) |
| `gi-w4` | 4 of 12 columns (third) |
| `gi-w5` | 5 of 12 columns |
| `gi-w6` | 6 of 12 columns (half) |
| `gi-w7` | 7 of 12 columns |
| `gi-w8` | 8 of 12 columns (two-thirds) |
| `gi-w12` | Full width |
| `gi-h2` | 2 rows tall |
| `gi-h3` | 3 rows tall |

**Rules for a good layout:**
- Each row's column spans must add up to **exactly 12**
- Start with the hero exterior shot as `gi-w8 gi-h2`
- Use `gi-h2` or `gi-h3` for portrait-oriented images (staircases, doorways)
- Group images by room type: exteriors, kitchen, staircase, bathrooms, details
- Alternate between wide + narrow in each row for visual rhythm
- End with exteriors to bookend the gallery

**Each gallery item:**
```html
<div class="gallery-item gi-w8 gi-h2" data-lb="0">
  <img src="IMAGE_PATH" alt="ALT" loading="lazy">
</div>
```

The `data-lb` attribute is a sequential index (0, 1, 2, ...) used by the lightbox. Number them in the order they appear in the HTML.

**Lightbox:** Clicking any gallery image opens a full-screen overlay with:
- Previous / Next buttons (also keyboard arrow keys)
- Close button (also Escape key)
- Image counter ("3 / 25")

The lightbox HTML block at the bottom of the page is **identical for every project** — no changes needed.

---

### 6. Specifications

Dark accent-coloured section with a 2-column layout: narrative text on the left, spec grid on the right.

```html
<div class="spec-item">
  <div class="spec-item-label">LABEL</div>
  <div class="spec-item-value">VALUE</div>
</div>
```

**What to change:**
- The heading and paragraph (keep it brief)
- All spec items — typical fields:

| Label | Example Values |
|---|---|
| Structure | Timber Frame & Steel, SIP Panel, Concrete Block |
| Cladding | Brick & Colorsteel, Weatherboard, Plaster |
| Roofing | Colorsteel Endura, Concrete Tile, Metal Tray |
| Insulation | R4.0 Walls / R6.0 Ceiling |
| Flooring | Polished Concrete & Tile, Engineered Timber |
| Kitchen | Custom Dark Veneer & Timber |
| Heating | Ducted Heat Pump, Underfloor, Fire + HRV |
| Bathrooms | Count + types (ensuite, powder, family) |
| Garage | Single / Double / Triple, Internal Access |
| Special | Solar, EV Charging, Smart Home, Pool |

Add or remove spec items as needed — the 2-column grid handles any even or odd number.

---

### 7. CTA Band + Footer

These are **identical across all project pages**. Copy them exactly from the template. The only thing that changes is nothing — they're shared site chrome.

---

## Head Section Checklist

For each new project page, update these items in `<head>`:

```html
<title>PROJECT NAME | Burness Homes</title>
<meta name="description" content="UNIQUE DESCRIPTION FOR SEO">
<link rel="stylesheet" href="css/global.css">
<link rel="stylesheet" href="css/project.css">
<link rel="preload" as="image" href="HERO_IMAGE_PATH">
<style>
  /* Page-specific styles (all shared styles now in css/global.css + css/project.css) */
</style>
```

The `<style>` tag must be present (Barba.js swaps inline styles during transitions), but for most project pages it will be empty or contain only minor overrides.

---

## Integration with transitions.js

The project page uses `data-barba-namespace="project"`. The shared `js/transitions.js` already handles this namespace with:

- **Hero entrance**: Breadcrumb fade → eyebrow fade → title line-by-line reveal → scroll hint
- **Info bar**: Staggered fade-up of stat items
- **Overview**: Label → heading → paragraphs fade-up, image clip-path wipe reveal
- **Bento**: Staggered scale + fade per tile, parallax on image tiles
- **Gallery**: Individual fade-up per item on scroll
- **Specs**: Label/heading fade, spec items staggered slide-in from right
- **CTA**: Title scrub-scale, description and buttons fade-up
- **Lightbox**: Click-to-open, arrow/escape navigation, backdrop click to close

No changes to `transitions.js` are needed when adding new project pages — all animations are driven by CSS class names that are consistent across pages.

---

## Adding the Project to projects.html

Add an `<a>` card to the `.projects-grid` in `projects.html`:

```html
<a href="project-{slug}.html" class="project-card" data-category="CATEGORY">
  <div class="project-card-img">
    <img src="THUMBNAIL_IMAGE" alt="PROJECT NAME" loading="lazy">
  </div>
  <div class="project-card-body">
    <div class="project-card-name">PROJECT NAME</div>
    <div class="project-card-meta">SUBURB, Canterbury · XXX m² · X Bedrooms</div>
    <span class="project-card-tag">TAG</span>
  </div>
</a>
```

**`data-category` values** (used by the filter buttons):
- `new-builds`
- `renovations`
- `design-build`

**Tag text** should match: "New Build", "Renovation", or "Design & Build".

---

## Full Duplication Checklist

When creating a new project page:

- [ ] Duplicate `project-22-kahurangi-road.html` → `project-{slug}.html`
- [ ] Update `<title>` and `<meta name="description">`
- [ ] Verify `<link rel="stylesheet" href="css/global.css">` and `<link rel="stylesheet" href="css/project.css">` are present
- [ ] Update `<link rel="preload">` hero image path
- [ ] Replace hero image `src` and `alt`
- [ ] Update hero breadcrumb, eyebrow, and title
- [ ] Update all 5 info bar values
- [ ] Rewrite overview heading + paragraphs
- [ ] Replace overview featured image
- [ ] Replace 4 bento images + labels, rewrite 2 bento cards
- [ ] Build gallery grid with project images (ensure column spans = 12 per row)
- [ ] Number `data-lb` attributes sequentially
- [ ] Update gallery photo count
- [ ] Rewrite specs heading/paragraph + all spec items
- [ ] Add card to `projects.html` grid
- [ ] Update the hero image on `projects.html` card to use a good exterior thumbnail
- [ ] Test: direct load, Barba transition from projects page, lightbox, mobile
