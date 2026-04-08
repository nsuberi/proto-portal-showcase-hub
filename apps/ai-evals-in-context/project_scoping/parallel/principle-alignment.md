# Plan: Review and Refactor "Design with the End in Mind" Principles

## Context

The landing page currently presents three principles under "Design with the End in Mind":

1. **Governance Process & Requirements** - Establish rituals (acceptance criteria, test reviews, TSR checkpoints) to build shared confidence
2. **Approval Stakeholders & Rituals** - Know who approves and when to make go/no-go predictable
3. **Business Value of Your Work** - TSR ties results to requirements for stakeholder visibility

The user observes that principles 1 and 2 feel redundant. Both discuss governance rituals and approvals, with overlapping messaging about stakeholder alignment.

## Current State Analysis

**Principle 1 Focus:**
- The mechanics: what are the three rituals?
- How builders and approvers develop shared confidence
- Lists: acceptance criteria agreement, test review sessions, TSR checkpoints

**Principle 2 Focus:**
- Who approves and when
- Predictability of the path to go/no-go
- Framing: approvals accelerate delivery vs block it

**Principle 3 Focus:**
- The why: business value justification
- TSR as the artifact connecting tests to requirements
- "Is the juice worth the squeeze?"

**The Overlap:**
Both P1 and P2 reference rituals, both mention approvers/stakeholders, and both are about governance. The distinction between "governance process" (P1) and "approval stakeholders & rituals" (P2) is unclear.

## Recommendation: Collapse P1 and P2 into One Stronger Principle

After reviewing the full site narrative, I recommend **collapsing principles 1 and 2 into a single principle** and reframing the entire section around two core concepts:

### Proposed New Framework (2 Principles):

**Principle 1: Start with Alignment**
- **Title**: "Start with Stakeholder Alignment"
- **Message**: "Before you write code, align on three things: (1) what success looks like (acceptance criteria), (2) who needs to approve, and (3) when approvals happen. This creates a predictable path from commit to production."
- **Rituals listed**:
  - Define acceptance criteria upfront
  - Identify approval stakeholders and checkpoints
  - Establish test review cadence
- **Outcome framing**: "When everyone knows what 'done' looks like from Day 1, approvals accelerate delivery—they don't block it."

**Principle 2: Document the Journey**
- **Title**: "Document for Confidence & Decision-Making"
- **Message**: "The Test Summary Report (TSR) is your artifact that shows the work was done right. It captures what changed, what was tested, and whether results meet acceptance criteria. Approvers use it to answer: is the juice worth the squeeze?"
- **Rituals listed**:
  - Discovery ritual: Agree on requirements
  - Test review ritual: Review coverage as test suite grows
  - TSR checkpoint: Capture results before release
- **Outcome framing**: "The TSR ties test results back to business requirements so stakeholders always know where things stand."

### Why This Works Better

**Clearer Mental Model:**
- **Principle 1** = BEFORE you start (alignment on success criteria, stakeholders, timing)
- **Principle 2** = AS you build and BEFORE you deploy (documentation through rituals and TSR)

**No Overlap:**
- P1 focuses on *upfront alignment* (what, who, when)
- P2 focuses on *ongoing documentation* (rituals, TSR, evidence)

**Maps to User Journey:**
1. Start with alignment → Phase 1 (Discovery) shows stakeholder interviews
2. Document the journey → Phases 2-5 show rituals in action, culminating in TSR

**Addresses Original Confusion:**
- Current P1 and P2 both talk about rituals and approvers
- New P1 is purely about *alignment before you start*
- New P2 is about *documentation as you go*

## Alternative: Keep 3 Principles but Sharpen Distinctions

If you prefer to keep three principles, here's how to differentiate them:

**Option 2A: Sharpen Current Principles**

1. **Know What "Done" Looks Like** (rename from "Governance Process & Requirements")
   - Focus: Agreement on acceptance criteria and success metrics BEFORE coding starts
   - Message: "Define acceptance criteria, identify approval stakeholders, and establish success metrics upfront. This creates a shared definition of 'done' that guides all downstream work."

2. **Build Confidence Through Rituals** (rename from "Approval Stakeholders & Rituals")
   - Focus: The three SDLC rituals as confidence-building mechanisms
   - Message: "Discovery ritual, test review sessions, and TSR checkpoints are how builders and approvers stay aligned. These rituals make the path to go/no-go predictable—approvals accelerate, not block."

3. **Connect Testing to Business Value** (keep current P3)
   - Focus: TSR as the artifact that shows ROI
   - Message: "The TSR ties test results back to requirements so stakeholders can answer: is the juice worth the squeeze?"

## Critical Files to Modify

1. **`templates/narrative/landing.html`** (lines 31-63)
   - Update the three `.cycle-card` sections with new titles and descriptions
   - Update ritual lists within each card

2. **`data/narrative/landing.md`**
   - Update "The Rituals That Build Confidence" section to align with new principles
   - Ensure supporting content reinforces the new framework

3. **`static/css/design-system.css`** (if needed)
   - No changes expected unless layout shifts are needed
   - Current `.cycle-card` styling should work for 2 or 3 principles

4. **Visual Design Consideration**
   - If moving from 3 principles to 2, consider whether the card layout needs adjustment
   - Current rainbow arc visual above the section works for 2 or 3 cards

## Finalized Approach

Based on user feedback:
- **Framework**: 2 Principles (Start with Alignment + Document the Journey)
- **Core Message**: Governance rituals enable speed (not bureaucracy)

## Implementation Plan

### New "Design with the End in Mind" Framework

**Principle 1: Start with Stakeholder Alignment**

*Title*: "Start with Stakeholder Alignment"

*Description*: "Before you write code, align on what success looks like, who needs to approve, and when approvals happen. When everyone knows what 'done' looks like from Day 1, the path from commit to production is predictable—and approvals accelerate delivery instead of blocking it."

*Key Rituals*:
- Define acceptance criteria upfront
- Identify approval stakeholders and checkpoints
- Establish the governance rhythm

*Outcome*: Predictable path to go/no-go, fast deployment with confidence

---

**Principle 2: Document the Journey for Confidence**

*Title*: "Document the Journey for Confidence"

*Description*: "The SDLC rituals—discovery sessions, test reviews, and TSR checkpoints—are how builders and approvers stay aligned as the work progresses. The Test Summary Report (TSR) captures what changed, what was tested, and whether results meet criteria. This documentation is what makes fast, confident deployment possible."

*Key Rituals*:
- Discovery ritual: Agree on requirements with stakeholders
- Test review ritual: Review coverage as test suite grows
- TSR checkpoint: Capture results before release

*Outcome*: Structured confidence-building, traceable decisions, clear go/no-go evidence

---

### Supporting Changes to Landing Content

Update the supporting content in `landing.md` to reinforce the "rituals enable speed" message:

**"The Rituals That Build Confidence" section should emphasize:**
- These rituals are NOT bureaucracy—they're the structure that enables fast deployment
- Each ritual builds confidence for both builders and approvers
- The TSR is the artifact that makes all this work traceable and repeatable

**Guiding principle quote (keep but possibly strengthen):**
Current quote already hits the right note about SDLC enabling speed. Consider minor enhancement to explicitly tie to the two principles:
> "The SDLC is not bureaucracy. It is the structure that lets organizations move fast without breaking things. **Starting with alignment and documenting the journey through rituals**—that's how we unlock fast experimentation and risk control, simultaneously."

### Visual Considerations

**From 3 cards to 2 cards:**
- Current CSS `.cycle-cards` should handle 2-card layout (likely will center them or make them wider)
- May need to adjust card width or layout to ensure 2 cards don't look sparse
- Consider making cards slightly wider (e.g., `max-width: 450px` instead of current width)

**Rainbow arc:**
- Current visual should work fine with 2 principles
- No changes needed unless user wants to adjust aesthetic

## Implementation Steps

### Step 1: Update Landing Page HTML Template

**File**: `templates/narrative/landing.html` (lines 31-63)

1. Replace cycle-card #1 content with new Principle 1:
   - `.cycle-card__number`: "1"
   - `.cycle-card__title`: "Start with Stakeholder Alignment"
   - `.cycle-card__description`: [see "Principle 1" description above]
   - `.cycle-card__rituals` list: [see "Key Rituals" above]

2. Replace cycle-card #2 content with new Principle 2:
   - `.cycle-card__number`: "2"
   - `.cycle-card__title`: "Document the Journey for Confidence"
   - `.cycle-card__description`: [see "Principle 2" description above]
   - `.cycle-card__rituals` list: [see "Key Rituals" above]

3. Delete cycle-card #3 entirely (no longer needed)

4. Update guiding principle quote to strengthen connection to two principles (optional enhancement)

### Step 2: Update Landing Markdown Content

**File**: `data/narrative/landing.md`

1. Review "The Rituals That Build Confidence" section
2. Ensure language emphasizes "rituals enable speed, not bureaucracy"
3. Update any references to three principles to now reference two
4. Strengthen connection between rituals and the confidence they build

### Step 3: Review CSS for 2-Card Layout

**File**: `static/css/design-system.css`

1. Test how `.cycle-cards` renders with only 2 children
2. If cards look sparse or misaligned, adjust:
   - Card width (consider `max-width: 500px` for 2-card layout)
   - Gap between cards
   - Overall section padding

3. Ensure `.cycle-card__number` styling works for single-digit numbers

### Step 4: Verify Across All Phases

**Files to check**:
- `templates/narrative/phase_1.html` through `phase_5.html`
- `templates/narrative/governance.html`
- `data/narrative/*.md` files

**What to verify**:
- No hardcoded references to "three principles"
- Phase content still aligns with new 2-principle framework
- Narrative flow still makes sense (landing → problem → phases → governance)

### Step 5: Update Any Documentation

**Files to check**:
- `.claude/CLAUDE.md` - update project memory if it references the three principles
- `.claude/affordances.md` - update if landing page affordances are documented there
- Any README or project notes

## Testing & Verification

### Manual Testing

1. **Visit landing page**:
   - Verify 2 principle cards display correctly
   - Check that layout looks balanced (not sparse)
   - Confirm rituals lists are readable and clear
   - Ensure guiding principle quote flows well after 2 cards

2. **Navigate through phases**:
   - Start at landing → problem → phase 1
   - Verify narrative flow still makes sense with 2-principle framework
   - Check that phase content references align with new principles

3. **Review governance page**:
   - Confirm TSR examples still connect to new Principle 2 ("Document the Journey")
   - Verify no outdated references to old principle structure

### Automated Testing

Run unit and e2e tests to catch any broken templates:

```bash
source .venv/bin/activate
export $(grep -v '^#' .env | xargs)
python3 -m pytest tests/unit/ tests/e2e/ -v
```

### Content Review Checklist

- [ ] Principle 1 emphasizes upfront alignment (what, who, when)
- [ ] Principle 2 emphasizes documentation through rituals and TSR
- [ ] No overlap between the two principles
- [ ] "Rituals enable speed" message is clear throughout
- [ ] No references to "three principles" remain
- [ ] Visual layout looks balanced with 2 cards
- [ ] Guiding principle quote connects to both principles
- [ ] Phase navigation and flow still work correctly

## Risk Assessment

**Low Risk:**
- HTML template changes are straightforward (remove one card, update two)
- Markdown content updates are minor tweaks
- CSS likely handles 2-card layout without changes

**Medium Risk:**
- Layout may need adjustment if 2 cards look sparse
- Supporting content throughout phases may need minor rewording

**Mitigation:**
- Test layout with 2 cards immediately after HTML change
- Run full test suite to catch template errors
- Review phase content to ensure alignment with new principles

## Additional Cleanup: Remove Dashboard Template and Route

As part of this refactor, remove the unused dashboard that was previously unlinked from the TSR Evidence page.

### Step 6: Remove Dashboard Files

**File**: `templates/narrative/governance_dashboard.html` (or similar)
- Delete the entire template file

**File**: `viewer/governance.py`
- Remove the dashboard route (likely `/governance/dashboard` or similar)
- Remove any imports specific to the dashboard
- Remove any helper functions used only by the dashboard

**Files to check for references**:
- `templates/narrative/governance.html` - verify no remaining links to dashboard
- Any navigation menus or sitemaps
- Test files that may reference the dashboard route

### Verification

```bash
# Search for any remaining references to the dashboard
cd ai-testing-resource/
grep -r "dashboard" templates/narrative/
grep -r "dashboard" viewer/governance.py
grep -r "dashboard" tests/
```

Run tests to ensure no broken imports or route references:

```bash
python3 -m pytest tests/unit/ tests/e2e/ -v
```

## Success Criteria

✅ Landing page shows exactly 2 principle cards
✅ Principle 1 focuses on upfront stakeholder alignment
✅ Principle 2 focuses on documentation through rituals/TSR
✅ No content overlap between the two principles
✅ "Rituals enable speed" message comes through clearly
✅ Layout looks balanced and professional with 2 cards
✅ Dashboard template file deleted
✅ Dashboard route removed from governance.py
✅ No remaining references to dashboard anywhere
✅ All tests pass
✅ No broken references to "three principles" anywhere
✅ Narrative flow from landing → phases → governance still works

