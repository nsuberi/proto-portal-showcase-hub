import * as React from "react";
import {
  Activity,
  Building2,
  Gauge,
  MessageSquare,
  ScrollText,
} from "lucide-react";
import { AppShell } from "./components/app-shell";
import type { NavItem } from "./components/sidebar";
import { ChatView } from "./views/chat-view";
import { LogsView } from "./views/logs-view";
import { PropertiesView } from "./views/properties-view";
import { TranscriptsView } from "./views/transcripts-view";
import { BehavioralView } from "./views/behavioral-view";
import { api, type Property } from "./lib/api";

type ViewId = "chat" | "logs" | "properties" | "transcripts" | "behavioral";

const NAV: NavItem[] = [
  {
    id: "chat",
    label: "Chat",
    description: "Drive the borrower-agent and watch requested vs retrieved",
    icon: MessageSquare,
  },
  {
    id: "logs",
    label: "Logs",
    description: "Live JSONL stream from the running app",
    icon: Activity,
  },
  {
    id: "properties",
    label: "Properties",
    description: "Knowledge base the retrieval layer indexes",
    icon: Building2,
  },
  {
    id: "transcripts",
    label: "Transcripts",
    description: "Pre-recorded borrower sessions from fixtures/",
    icon: ScrollText,
  },
  {
    id: "behavioral",
    label: "Behavioral",
    description: "Per-session signals to prioritize investigation",
    icon: Gauge,
  },
];

function defaultSessionId() {
  const stamp = Date.now().toString(36).slice(-4);
  return `pm-${stamp}`;
}

export default function App() {
  const [view, setView] = React.useState<ViewId>("chat");
  const [sessionId, setSessionId] = React.useState<string>(() => {
    const stored = window.localStorage.getItem("borrower-agent.session");
    return stored || defaultSessionId();
  });
  const [properties, setProperties] = React.useState<Property[]>([]);
  const [propertyId, setPropertyId] = React.useState<string>("");
  const [codeHash, setCodeHash] = React.useState<string | null>(null);

  React.useEffect(() => {
    window.localStorage.setItem("borrower-agent.session", sessionId);
  }, [sessionId]);

  React.useEffect(() => {
    api
      .properties()
      .then((res) => {
        setProperties(res.properties);
        if (res.properties[0]) setPropertyId(res.properties[0].property_id);
      })
      .catch(() => {
        setProperties([]);
      });
    api
      .health()
      .then((res) => setCodeHash(res.code_hash))
      .catch(() => setCodeHash(null));
  }, []);

  const active = React.useMemo(
    () => NAV.find((item) => item.id === view) ?? NAV[0],
    [view]
  );

  return (
    <AppShell
      items={NAV}
      activeId={view}
      onSelect={(id) => setView(id as ViewId)}
      sessionId={sessionId}
      onSessionChange={setSessionId}
      codeHash={codeHash}
      headerSubtitle={active.description}
    >
      {view === "chat" && (
        <ChatView
          sessionId={sessionId}
          properties={properties}
          propertyId={propertyId}
          onPropertyChange={setPropertyId}
        />
      )}
      {view === "logs" && <LogsView sessionId={sessionId} />}
      {view === "properties" && <PropertiesView properties={properties} />}
      {view === "transcripts" && <TranscriptsView />}
      {view === "behavioral" && <BehavioralView />}
    </AppShell>
  );
}
