import type { Phase, DevlogSections } from "@/design-system/tokens";

export interface UserProfile {
  id: string;
  name: string;
  role: string;
  phase: Phase;
  stats: Array<{ value: string; label: string }>;
}

export interface Goal {
  date: string;
  text: string;
}

export interface JourneyPhase {
  title: string;
  insight: string;
  complete: boolean;
}

export interface DevlogData {
  id: string;
  title: string;
  date: string;
  author: string;
  sections: DevlogSections;
}

export const mockUser: UserProfile = {
  id: "jordan-rivera",
  name: "Jordan Rivera",
  role: "Senior Business Analyst \u00b7 Mortgage Operations",
  phase: 2,
  stats: [
    { value: "7", label: "Challenges" },
    { value: "12", label: "Devlogs" },
    { value: "3", label: "Presentations" },
    { value: "42", label: "Reactions" },
  ],
};

export const mockGoals: Goal[] = [
  { date: "Jan 2026", text: "Learn to build AI apps" },
  { date: "Feb 2026", text: "Build a chatbot for my work" },
  {
    date: "Mar 2026",
    text: "Prototype a document triage tool that reduces initial review time for loan applications",
  },
  {
    date: "Apr 2026",
    text: "Pitch the document triage prototype to ops leadership with evidence from a 2-week pilot",
  },
];

export const mockJourneyPhases: JourneyPhase[] = [
  {
    title: "Environment setup",
    insight:
      "Completed first deployment. Logs accessed independently.",
    complete: true,
  },
  {
    title: "Early building",
    insight:
      "Your devlog used \u2018trade-off\u2019 for the first time here \u2014 a shift from describing what to articulating why.",
    complete: true,
  },
  {
    title: "Structured project",
    insight:
      "Pipeline architecture decision shows systems thinking. You chose testability over simplicity \u2014 and explained the reasoning.",
    complete: true,
  },
  {
    title: "Real-world navigation",
    insight:
      "Compliance review was a turning point \u2014 your later devlogs reference governance sources directly.",
    complete: true,
  },
  {
    title: "Independent discovery",
    insight:
      "In progress. Your 1-pager draft focuses on the problem more than the solution \u2014 that\u2019s the right instinct.",
    complete: false,
  },
  {
    title: "Community presentation",
    insight:
      "Upcoming. You\u2019ve submitted a topic for the leadership pitch room.",
    complete: false,
  },
];

export const mockDevlogs: DevlogData[] = [
  {
    id: "devlog-1",
    title: "Document triage prototype \u2014 iteration 2",
    date: "2026-04-02",
    author: "Jordan Rivera",
    sections: {
      architecture:
        "Switched from a monolithic classifier to a pipeline pattern with separate stages for extraction, classification, and redaction. This lets us swap the classification model without touching the other stages. The trade-off is more complexity in the data flow \u2014 each stage needs to agree on the document schema.",
      design:
        "Replaced the results table with individual document cards that show the PII classification as a color-coded badge. The badge uses our design tokens \u2014 CONFIDENTIAL gets signal orange, INTERNAL gets instrument blue. Users said the table felt like a spreadsheet; the cards feel like they\u2019re reviewing actual documents.",
      organization:
        "Reviewed our PII classification mapping against the governance policy. Flagged that RESTRICTED was added in v2.3 but wasn\u2019t in our config.",
      learned:
        "The pipeline pattern made testing dramatically easier \u2014 I could write unit tests for each stage independently. Also learned that there\u2019s a compliance classification matrix that I should have found earlier.",
      change:
        "I would start with the compliance review first, not after building the initial prototype.",
    },
  },
  {
    id: "devlog-2",
    title: "First deployment \u2014 Flask behind proxy",
    date: "2026-02-15",
    author: "Jordan Rivera",
    sections: {
      architecture:
        "Learned that the Vite dev server proxies API requests to the Flask backend on a different port. The proxy configuration maps /api/* to localhost:5002.",
      learned:
        "The proxy was the key to understanding why my requests were failing. Once I could read the proxy logs, I could see exactly where the request was going wrong.",
    },
  },
  {
    id: "devlog-3",
    title: "Data privacy pipeline \u2014 initial design",
    date: "2026-03-20",
    author: "Jordan Rivera",
    sections: {
      architecture:
        "Chose a pipeline pattern over a monolithic function because each PII classification level needs different handling. PUBLIC data passes through, INTERNAL gets access-logged, CONFIDENTIAL gets encrypted.",
      design:
        "Decided to surface the classification level visually on each data field so users always know what they\u2019re looking at. Color-coded badges using the design system.",
      learned:
        "Reading the data governance policy document was the single most useful thing I did. Everything I needed was already defined \u2014 I just needed to find it and implement it faithfully.",
    },
  },
];
