# OpenClaw — Research Phase

You are in the **RESEARCH** phase of an OpenClaw deep-dive loop.

**Topic:** {{TOPIC}}
**Description:** {{DESCRIPTION}}
**Output directory:** {{OUTPUT_DIR}}/research/

## Objective

Conduct thorough research on "{{TOPIC}}" to build a comprehensive understanding before implementation. Use WebSearch and WebFetch to gather information from multiple authoritative sources.

## Research Strategy

1. **Official documentation** — Find the canonical docs, specifications, or RFCs for this technology
2. **Tutorials and guides** — Look for practical implementation guides and getting-started resources
3. **GitHub repositories** — Find reference implementations, popular libraries, and example projects
4. **Technical blog posts** — Search for deep dives, comparisons, and experience reports
5. **Academic papers** — Check arXiv or Google Scholar if the concept has research backing

## Required Outputs

Write these files to `{{OUTPUT_DIR}}/research/`:

### findings.md
Structured research findings with sections:
- **Overview** — What is this technology/concept? One-paragraph summary.
- **Core Concepts** — The 3-5 fundamental ideas you need to understand
- **How It Works** — Technical explanation of the mechanism/architecture
- **Key APIs / Interfaces** — The primary programmatic surface area
- **Ecosystem** — Libraries, frameworks, and tools in this space
- **Comparisons** — How does this compare to alternatives? What does it replace?
- **Gotchas & Limitations** — Known pitfalls, browser support, performance considerations
- **Best Practices** — What the community recommends

### sources.json
An array of source objects:
```json
[
  {
    "url": "https://...",
    "title": "Source title",
    "type": "docs|tutorial|repo|blog|paper|spec",
    "relevance": "One sentence on why this source matters",
    "key_takeaway": "The single most important thing from this source"
  }
]
```

Aim for 8-15 high-quality sources.

## Quality Criteria

- Prioritize primary sources (official docs, specs) over secondary (blog summaries)
- Cross-reference claims across multiple sources
- Note version numbers and dates — technology moves fast
- If you find conflicting information, document both perspectives
- Focus on practical, implementable knowledge — skip marketing fluff
