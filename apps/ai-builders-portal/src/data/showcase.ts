import type { Phase, DevlogSections } from "@/design-system/tokens";

export interface ShowcaseEntry {
  id: string;
  title: string;
  author: string;
  authorId: string;
  phase: Phase;
  tags: string[];
  reactions: string;
  artifactCode?: string;
  artifactTitle?: string;
  /** URL to a self-contained HTML artifact for live preview */
  artifactUrl?: string;
  /** Route ID for the full React artifact app */
  artifactRouteId?: string;
  /** Associated challenge/submission ID */
  challengeId?: string;
  videoUrl?: string;
  devlogSummary?: DevlogSections;
}

export const showcaseEntries: ShowcaseEntry[] = [
  {
    id: "loan-classifier",
    title: "Loan document classifier",
    author: "Jordan R.",
    authorId: "jordan-rivera",
    phase: 2,
    tags: ["data", "AI"],
    reactions: "12 reactions",
    artifactTitle: "classifier/app.tsx",
    artifactUrl: "/artifacts/loan-classifier.html",
    artifactRouteId: "loan-classifier",
    challengeId: "brownfield-analysis",
    artifactCode:
      "import { classifyDocument } from './classifier';\n\nexport default function App({ documents }) {\n  return documents.map(doc => (\n    <DocumentCard key={doc.id}\n      classification={classifyDocument(doc)}\n    />\n  ));\n}",
    devlogSummary: {
      architecture:
        "Pipeline pattern with separate extraction, classification, and redaction stages.",
      learned:
        "The compliance classification matrix was the key document I should have found earlier.",
    },
  },
  {
    id: "rate-dashboard",
    title: "Rate lock dashboard",
    author: "Priya K.",
    authorId: "priya-kumar",
    phase: 2,
    tags: ["design", "API"],
    reactions: "8 reactions",
    artifactTitle: "dashboard/RateLock.tsx",
    artifactUrl: "/artifacts/rate-dashboard.html",
    artifactRouteId: "rate-dashboard",
    challengeId: "sample-application",
    artifactCode:
      "import { useQuery } from '@tanstack/react-query';\nimport { RateCard, TrendChart } from './components';\n\nexport default function RateLockDashboard() {\n  const { data: rates } = useQuery({ queryKey: ['rates'] });\n  return (\n    <div className=\"grid grid-cols-3 gap-4\">\n      {rates?.map(r => <RateCard key={r.id} {...r} />)}\n    </div>\n  );\n}",
    devlogSummary: {
      design:
        "Chose a card grid over a table because loan officers scan for outliers, not sequential data.",
    },
  },
  {
    id: "compliance-checker",
    title: "Compliance checker",
    author: "Marcus T.",
    authorId: "marcus-thompson",
    phase: 3,
    tags: ["eval", "risk"],
    reactions: "15 reactions",
    videoUrl: "https://www.loom.com/share/b6eb7fadcd124848ac8dfe4118788697",
    devlogSummary: {
      architecture:
        "Built as a series of rule evaluators that each return pass/fail with evidence.",
      organization:
        "Partnered with a risk colleague who needed this exact capability — mutual benefit.",
    },
  },
  {
    id: "onboarding-flow",
    title: "Onboarding wizard",
    author: "Sarah L.",
    authorId: "sarah-lee",
    phase: 1,
    tags: ["UX", "building"],
    reactions: "6 reactions",
    artifactTitle: "onboarding/Wizard.tsx",
    artifactUrl: "/artifacts/onboarding-wizard.html",
    artifactRouteId: "onboarding-wizard",
    challengeId: "prototype-build",
    artifactCode:
      "export default function OnboardingWizard({ steps }) {\n  const [current, setCurrent] = useState(0);\n  return (\n    <StepContainer>\n      <StepIndicator total={steps.length} current={current} />\n      <StepContent step={steps[current]} />\n    </StepContainer>\n  );\n}",
  },
  {
    id: "ticket-triage",
    title: "Support ticket triage",
    author: "Alex M.",
    authorId: "alex-martinez",
    phase: 2,
    tags: ["AI", "ops"],
    reactions: "10 reactions",
    devlogSummary: {
      architecture:
        "Classification model routes tickets to the right person with confidence scores.",
      learned:
        "False positives are more expensive than false negatives in this domain — better to escalate than miss.",
    },
  },
  {
    id: "doc-search",
    title: "Internal doc search",
    author: "Kim W.",
    authorId: "kim-wilson",
    phase: 1,
    tags: ["search", "data"],
    reactions: "4 reactions",
  },
  {
    id: "budget-tracker",
    title: "Project budget tracker",
    author: "David C.",
    authorId: "david-chen",
    phase: 3,
    tags: ["finance", "design"],
    reactions: "11 reactions",
    videoUrl: "https://www.loom.com/share/abc123def456",
    devlogSummary: {
      organization:
        "A finance colleague co-owned the requirements — they had been waiting for someone to build this.",
      change:
        "Would have started with their existing spreadsheet as the data model instead of designing from scratch.",
    },
  },
  {
    id: "meeting-notes",
    title: "AI meeting summarizer",
    author: "Rachel F.",
    authorId: "rachel-foster",
    phase: 2,
    tags: ["AI", "productivity"],
    reactions: "9 reactions",
    artifactTitle: "summarizer/app.py",
    artifactUrl: "/artifacts/meeting-summarizer.html",
    artifactRouteId: "meeting-summarizer",
    challengeId: "communications-package",
    artifactCode:
      "from flask import Flask, request\nfrom anthropic import Anthropic\n\napp = Flask(__name__)\nclient = Anthropic()\n\n@app.route('/summarize', methods=['POST'])\ndef summarize():\n    transcript = request.json['transcript']\n    response = client.messages.create(\n        model='claude-sonnet-4-20250514',\n        messages=[{'role': 'user', 'content': f'Summarize: {transcript}'}]\n    )\n    return {'summary': response.content[0].text}",
  },
];
