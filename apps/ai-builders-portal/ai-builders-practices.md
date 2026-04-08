# AI Builders Program — Assessment Rubric

## Structure

Four practices, four levels of development. Each cell describes observable behaviors at that level.

**Levels of Development:**

- **Curiosity** — Engaging with the tools and concepts; asking questions; showing willingness to explore
- **Clarity** — Demonstrating understanding of *why* things work, not just *how*; distinguishing intent from behavior
- **Capability** — Producing work that holds up under scrutiny; making sound architectural and product decisions
- **Consistency** — Reliably applying practices across contexts; teaching and elevating others; designing for sustainability

---

## Submissions

Seven submissions across the program, spanning all four practices.

**Submission 1 — Brownfield Analysis:**
Analyze a brownfield codebase using Claude skills across three angles: the data architecture of the application itself, the proxy/deployment architecture and networking of how the app is accessed from a browser, and testing coverage analyzed against the inferred product intent — which aspects of what the product is supposed to do have actually been tested.

**Submission 2 — Sample Application Build:**
Build your own sample application using the same structural patterns as the brownfield project analyzed in Submission 1, guided by a product one-pager. Discovery and building are intentionally mixed — you're applying what you learned from the analysis to a new build.

**Submission 3 — Discovery and Prototype Pitch:**
Interview colleagues in your work or life. Process findings independently. Each builder pitches a prototype idea based on what they learned.

**Submission 4 — Prototype and Updated Product Definition:**
The completed prototype build and an updated product definition that reflects what you learned during the build. The product definition evolves — it is not the same document you started with.

**Submission 5 — Security Review and Test Summary Report:**
Evidence that your application doesn't expose credentials or sensitive data, and a test summary report using LLM-as-Judge experiments, formatted so others can understand and act on it.

**Submission 6 — Continuous Improvement Plan:**
Access to production log data, sample methods for analyzing that data, and a plan for how you feed insights back to different colleagues — data science, engineering, product.

**Submission 7 — Communications Package:**
A dev log, a video under 4 minutes with the product introduction, and feedback collected from presenting your idea to peers and leaders.

---

## Practice 1: Discovering and Shaping Problems

Discovery and building are intentionally mixed throughout. You never stop discovering.

*Primary submissions: 1, 2, 3*

### Rubric

| Level | Observable Behaviors |
|---|---|
| **Curiosity** | Uses the tools to explore the codebase. Asks questions about what they find. Engages with the brownfield analysis without needing heavy direction. Shows interest in understanding what the code does, even if analysis stays surface-level. |
| **Clarity** | Distinguishes between code intent and actual behavior. Can articulate *why* the architecture is structured the way it is, not just describe it. Test coverage analysis goes beyond counting tests — identifies gaps between what the code is supposed to do and what the tests actually verify. Discovery interviews surface real problems, not just surface-level frustrations. |
| **Capability** | Produces a prototype pitch that clearly connects discovery findings to a buildable solution. The pitch reflects genuine learning from interviews, not assumptions dressed up as insights. Architecture analysis identifies meaningful trade-offs, not just descriptions. The one-pager application demonstrates intentional design choices. |
| **Consistency** | Discovery work becomes a repeatable practice. The builder can apply the same analytical approach to a new codebase or context without scaffolding. Interview findings lead to prototypes that others can understand and build on. Quality of analysis is reliable across different problem domains. |

---

## Practice 2: Building with AI

*Primary submissions: 2, 4*

### Key Elements

- Configuring agentic coding tools, and using agents within an agent harness
- Building knowledge bases as tools for AI agents
- Data schemas, data manipulation, and tracking data models as they flow through the system
- PR code review practice using Claude's code review skill
- Testing coverage assessed continuously as part of the build process, always following the evolving problem definition
- A README that can be used to completely launch the application — tested by submitting code to an "application launcher" that must be able to render it
- Building on a design system, with techniques for refining the design of your builds
- Developing a language for design — articulating your likes, dislikes, and taste in a design review

### Rubric

| Level | Observable Behaviors |
|---|---|
| **Curiosity** | Experiments with agentic coding tools and agent harnesses. Tries building features and submits PRs. Engages with code review feedback rather than ignoring or passively accepting it. Begins working with data schemas even if the models are rough. Attempts to use the design system. Has a README, even if incomplete. Begins building knowledge bases, even if the content and structure are preliminary. |
| **Clarity** | Understands how data flows through the application end to end. Can explain their agent harness configuration choices. PR submissions show evidence of thinking about test coverage *before* review, not just responding to review comments after. Testing reflects awareness of the evolving problem definition, not just a static spec. Understands the design system well enough to make intentional choices within it. Can describe what they like and dislike about a design and begin to say why. Understands *why* a knowledge base is structured the way it is and how it serves as a tool for the agent — not just a data dump. |
| **Capability** | Architecture decisions are defensible and documented. Data model tracking is deliberate — the builder can trace a piece of data from input through transformation to output. Code review practice catches real issues. Test coverage reflects the actual risk profile of the code relative to the product intent, not just line count. PRs tell a clear story of what changed and why. The README is complete enough that the application launcher can render the app without intervention. Design choices are refined through iteration, not just accepted on first pass. Can articulate their taste in a design review with specificity — not just "I like it" or "I don't like it" but what's working and what isn't. Knowledge bases are well-structured, purposeful, and demonstrably improve agent performance on target tasks. |
| **Consistency** | Build quality is reliable across iterations. The builder's code review contributions improve the work of others, not just their own code. Agent and tooling configurations are reusable and well-documented. Testing practices are embedded in the workflow and evolve as the problem definition evolves. The README is a living document that stays accurate as the application changes. Design refinement is habitual — the builder has developed a personal design language and can apply it across projects. Their design review contributions help others sharpen their own aesthetic and structural choices. Knowledge bases are maintained and evolve with the product — they're treated as living tools, not static artifacts. Evidence of learning across PRs — the same class of mistake doesn't repeat. |

---

## Practice 3: Security, Continuous Observation, and Improvement

*Primary submissions: 5, 6*

### Key Elements

- System access planning
- Staging environment setup (full production simulation before actual production)
- Designing feedback loops that connect production insights to colleagues in data science, engineering, and product
- Securing your own credentials and sensitive data — making sure you don't expose API keys, secrets, or PII
- LLM trace analysis of traces and threads from production usage
- Formatting experiments with LLM-as-Judge in a test summary report that others can understand

### Rubric

| Level | Observable Behaviors |
|---|---|
| **Curiosity** | Engages with the concept of security as something beyond compliance checklists. Shows interest in understanding what credential exposure and data leaks actually look like. Begins thinking about what happens to the product after it ships. Asks questions about staging and production readiness. Explores LLM trace data and begins to understand what threads and traces reveal about system behavior. |
| **Clarity** | Understands *why* feedback loops matter, not just that they should exist. Can articulate what information needs to flow from production back and why. Understands the staging environment as a decision-making tool, not just a deployment step. Sees security as an ongoing practice, not a one-time checklist. Can read trace data and explain what it shows about how the LLM is behaving in context. Understands the purpose of LLM-as-Judge experiments — why automated evaluation matters and what it can and can't tell you. |
| **Capability** | Designs observable systems — the feedback loops are specific, not abstract. Can demonstrate a staging environment that meaningfully simulates production. System access planning accounts for real constraints. Has implemented credential management and security practices in their own work. Trace analysis produces actionable findings, not just raw data. LLM-as-Judge experiments are formatted into test summary reports that others can read and act on — the report bridges the gap between technical evaluation and practical review. Security practices enable continuous improvement rather than blocking progress. |
| **Consistency** | Security practices are embedded in how the builder works, not treated as a separate phase. Feedback loops are functioning and producing actionable information. Credential hygiene is habitual and effective. Trace analysis and LLM-as-Judge reporting are routine parts of the improvement cycle, not one-off exercises. The test summary report format evolves based on what reviewers actually find useful. The builder can set up security and observability infrastructure in new contexts without starting from scratch. Others can follow the security design without the builder present. |

---

## Practice 4: Storytelling

*Primary submission: 7*

### Key Elements

- Videos, presentations, job aids, documentation, decks
- Explicitly assessed on highlighting the work of others
- Attribution as a practice: "This person helped me with X, and I built on it in Y direction"
- Building on others' work as community contribution
- Tailoring conversations for the room you are entering — knowing your audience
- Ability to tell the technical story of your work and the executive story, adapting for technical and non-technical audiences

### Rubric

| Level | Observable Behaviors |
|---|---|
| **Curiosity** | Shares their own work. Willing to present, document, or create artifacts that explain what they built. Engages with others' presentations and asks questions. Beginning to notice and reference what peers are doing. Attempts to present to different audiences, even if the tailoring is rough. |
| **Clarity** | Storytelling has a point — the builder can explain not just *what* they built but *why it matters* and *who it's for*. Documentation is useful to someone who wasn't in the room. Begins explicitly naming contributions from others: where ideas came from, who helped, what they built on. Shows awareness that different audiences need different versions of the story — can distinguish between what a technical peer needs to hear and what an executive needs to hear. |
| **Capability** | Creates artifacts (videos, decks, job aids) that help others access what they learned. Attribution is specific and genuine — not generic shout-outs but concrete: "This person developed technique X, and I extended it by doing Y." Storytelling makes the work legible to people outside the program. Peer work is elevated, not just acknowledged. Can deliver the technical story and the executive story of the same work, adjusting depth, language, and emphasis for the room. |
| **Consistency** | Storytelling and attribution are habitual, not performative. The builder's documentation and presentations reliably help others replicate or build on the work. They actively create opportunities for peers to be visible. Audience tailoring is second nature — they read the room and adjust without being prompted. Their storytelling strengthens the community, not just their own profile. Others cite *them* as someone who elevated their work. |

---

## Cross-Cutting Principle

Discovery and building are never fully separate. A builder at the Consistency level treats every build as a discovery opportunity and every discovery as a step toward something buildable. Security is not a gate — it is an accelerator. Storytelling is not self-promotion — it is community infrastructure.
