# Plan: Rename Governance Tab to "TSR Evidence" and Remove Dashboard Link

## Context

The user wants to simplify the Governance phase by:
1. Renaming the tab from "Governance" to "TSR Evidence"
2. Removing the "Open Full TSR Dashboard" link from the narrative page

This aligns the terminology with what the page actually displays (Test Summary Reports as evidence) and removes an unnecessary link to a separate dashboard that's not needed in the narrative flow.

## Changes Required

### 1. Update Phase Configuration (`viewer/narrative.py`)

**File:** `ai-testing-resource/viewer/narrative.py`
**Lines:** 354, 356

Change the PHASES dict entry:
```python
"governance": {
    "id": "governance",
    "number": 6,
    "title": "TSR Evidence",           # Changed from "Governance"
    "subtitle": "Compliance & Audit Trail",
    "short_title": "TSR Evidence",     # Changed from "Governance"
    "url": "/governance",
    "next": None,
    "prev": "phase_5",
},
```

**Impact:**
- Tab navigation will display "TSR Evidence" instead of "Governance"
- Page header will show "TSR Evidence"
- All references to `phase['title']` and `phase['short_title']` will use the new name

### 2. Remove Dashboard Link (`templates/narrative/governance_overview.html`)

**File:** `ai-testing-resource/templates/narrative/governance_overview.html`
**Lines:** 93-98

Remove the entire link section:
```html
    <div style="margin-top: var(--space-xl); text-align: center;">
      <a href="{{ url_for('governance.dashboard') }}" class="landing-cta" style="display: inline-flex;">
        Open Full TSR Dashboard
        <span>&rarr;</span>
      </a>
    </div>
```

**Impact:**
- Users will no longer see a link to the full TSR dashboard from the narrative page
- The TSR cards and example TSR remain visible on the page

### 3. Define SDLC Acronym on Landing Page (`templates/narrative/landing.html`)

**File:** `ai-testing-resource/templates/narrative/landing.html`
**Line:** 11

Change:
```html
Welcome to the SDLC. This structure is not new&mdash;it is how the best engineering teams have always
```

To:
```html
Welcome to the SDLC (Software Development Lifecycle). This structure is not new&mdash;it is how the best engineering teams have always
```

**Impact:**
- First mention of SDLC now includes the full term definition
- Improves clarity for readers unfamiliar with the acronym

### 4. Add Whitespace Before "The SDLC: What It Is and What It Isn't" (`templates/narrative/landing.html`)

**File:** `ai-testing-resource/templates/narrative/landing.html`
**Line:** 168

Change:
```html
<section class="narrative-content" style="padding-top: 0;">
```

To:
```html
<section class="narrative-content" style="padding-top: var(--space-2xl); margin-top: var(--space-xl);">
```

**Impact:**
- Adds significant whitespace between "What the SDLC Protects" and "The SDLC: What It Is and What It Isn't"
- Improves visual separation and readability
- Prevents the sections from blending together

### 5. Add Document Library to Landing Page

**Objective:** Display narrative .docx documents from `narrative-resources/` folder at bottom of landing page with preview thumbnails, modal viewing, and download capability.

**Documents to include:**
- `ai_evaluation_sdlc.docx`
- `appendix_b_unified_monitoring.docx`
- `appendix_trace_capture.docx`
- `sdlc_what_it_is.docx`

**Implementation approach:**

#### A. Create static documents directory and copy files

**Directory:** `ai-testing-resource/static/documents/`

Copy .docx files from `narrative-resources/` to `static/documents/`:
```bash
mkdir -p ai-testing-resource/static/documents
cp narrative-resources/*.docx ai-testing-resource/static/documents/
```

#### B. Create document modal component

**New file:** `ai-testing-resource/templates/components/document_modal.html`

Follow TSR modal pattern:
- Modal overlay with dark background
- Modal body with document metadata
- Download button linking to static file
- Optional: Use Mammoth.js to render .docx preview in browser
- Close button and escape key support

#### C. Add document grid section to landing page

**File:** `ai-testing-resource/templates/narrative/landing.html`
**Location:** After the phase carousel section (end of page)

Add new section:
```html
<section class="narrative-content">
  <h2 style="text-align: center; color: var(--color-chrome-text-bright); margin-bottom: var(--space-xl);">
    Example Narrative Documents for Adding AI into the SDLC
  </h2>
  <div class="document-grid">
    <!-- Document cards with thumbnails -->
  </div>
</section>
```

Each document card should have:
- Thumbnail preview (styled placeholder or generated preview)
- Document title
- Brief description
- Click handler to open modal

#### D. Add document styles

**File:** `ai-testing-resource/static/css/design-system.css` or create new `documents.css`

CSS classes following BEM pattern:
- `.document-grid` - Grid layout (2-4 columns responsive)
- `.document-card` - Card with hover effect
- `.document-card__thumbnail` - Preview image
- `.document-card__title` - Document name
- `.document-card__meta` - File size, type, etc.
- `.document-modal` - Modal styles (reuse TSR modal pattern)

#### E. Add JavaScript for modal interaction

**File:** `ai-testing-resource/static/js/documents.js` or inline in landing page

Functions:
```javascript
function openDocumentModal(docName, docPath)
function closeDocumentModal(event)
```

**Implementation options for preview:**

**Option 1 (Simple):** No preview rendering, just metadata + download
- Show document title, description, file size
- "Download" button with direct link to `/static/documents/filename.docx`
- Fast to implement, no dependencies

**Option 2 (Medium):** Client-side .docx rendering with Mammoth.js
- Add Mammoth.js library (via CDN or npm)
- Convert .docx to HTML in browser
- Display rendered content in modal
- Requires JavaScript library but no server-side processing

**Option 3 (Complex):** Server-side conversion to PDF/HTML
- Add python-docx and pdf conversion libraries
- Create Flask route to serve converted previews
- More robust but requires additional dependencies and routes

**Recommended:** Start with Option 1 (simple metadata + download), can upgrade to Option 2 later if preview is important.

#### F. Document metadata configuration

**File:** `ai-testing-resource/viewer/narrative.py` or new `documents_config.py`

Define document metadata:
```python
NARRATIVE_DOCUMENTS = [
    {
        "filename": "ai_evaluation_sdlc.docx",
        "title": "AI Evaluation SDLC Overview",
        "description": "Complete guide to integrating AI evaluations into the software development lifecycle",
        "path": "/static/documents/ai_evaluation_sdlc.docx"
    },
    {
        "filename": "sdlc_what_it_is.docx",
        "title": "SDLC: What It Is and What It Isn't",
        "description": "Clarifying the purpose and misconceptions about the SDLC for AI systems",
        "path": "/static/documents/sdlc_what_it_is.docx"
    },
    {
        "filename": "appendix_trace_capture.docx",
        "title": "Appendix: Trace Capture Implementation",
        "description": "Technical appendix on implementing trace capture for AI system monitoring",
        "path": "/static/documents/appendix_trace_capture.docx"
    },
    {
        "filename": "appendix_b_unified_monitoring.docx",
        "title": "Appendix B: Unified Monitoring",
        "description": "Comprehensive monitoring strategy for AI applications in production",
        "path": "/static/documents/appendix_b_unified_monitoring.docx"
    }
]
```

Pass to template:
```python
@narrative_bp.route("/")
def landing():
    # ... existing code ...
    return render_template(
        "narrative/landing.html",
        phases=PHASE_ORDER,
        documents=NARRATIVE_DOCUMENTS  # Add this
    )
```

## Files Modified

1. `ai-testing-resource/viewer/narrative.py` - Phase configuration + documents config
2. `ai-testing-resource/templates/narrative/governance_overview.html` - Template content
3. `ai-testing-resource/templates/narrative/landing.html` - SDLC definition, spacing, documents section
4. **NEW** `ai-testing-resource/templates/components/document_modal.html` - Document modal component
5. **NEW** `ai-testing-resource/static/documents/` - Directory with .docx files
6. **NEW** `ai-testing-resource/static/css/documents.css` - Document card/modal styles (or add to design-system.css)
7. **NEW** `ai-testing-resource/static/js/documents.js` - Modal interaction logic (or inline in template)

## Testing Plan

After making changes:

1. **Visual verification:**
   - Start dev server: `cd ai-testing-resource && python3 run.py`

   **Governance tab:**
   - Navigate through phases to the last tab
   - Verify tab shows "TSR Evidence" instead of "Governance"
   - Verify page header shows "TSR Evidence"
   - Verify "Open Full TSR Dashboard" link is no longer present
   - Confirm TSR cards still display correctly

   **Landing page:**
   - Visit `/` (landing page)
   - Verify first paragraph defines "SDLC (Software Development Lifecycle)"
   - Scroll to "What the SDLC Protects" section
   - Verify adequate whitespace before "The SDLC: What It Is and What It Isn't" section
   - Scroll to bottom of page
   - Verify document grid displays with 4 document cards
   - Click each document card
   - Verify modal opens with document metadata
   - Verify download button works
   - Verify close button and escape key close modal
   - Test on mobile viewport (responsive grid)

2. **Linting:**
   ```bash
   cd ai-testing-resource
   source .venv/bin/activate
   black viewer/narrative.py
   flake8 viewer/narrative.py --max-line-length 120
   ```

3. **Run tests:**
   ```bash
   export $(grep -v '^#' .env | xargs)
   python3 -m pytest tests/unit/ tests/e2e/ -v
   ```

   Note: No new tests required for these UI changes unless document route is added

## Deployment

After testing locally:

1. Commit changes with clear message
2. Run `./scripts/deploy.sh` from `ai-testing-resource/` directory
3. Verify deployment succeeded using `./scripts/verify-deployment.sh`
4. Visit production site and confirm changes are live
