export interface DataField {
  name: string;
  type: string;
  source?: string;
  isNew?: boolean;
}

export interface PatternNarrative {
  action: string;
  integrationWork?: string;
  apiEmits?: DataField[];
  apiReceives?: DataField[];
}

export interface NodeDataModel {
  nodeId: number;
  label: string;
  stage: "intake" | "transform" | "decide" | "act";
  conversionOrder: number;

  before: {
    summary: string;
    inputFields: DataField[];
    outputFields: DataField[];
    logic: string;
    pain: string;
  };

  after: {
    summary: string;
    inputFields: DataField[];
    outputFields: DataField[];
    logic: string;
    gain: string;
  };

  patterns: {
    embedded: { action: string };
    connected: PatternNarrative;
    independent: { action: string };
  };
}

export interface StageDefinition {
  id: "intake" | "transform" | "decide" | "act";
  label: string;
  description: string;
  color: string;
  readinessLevel: number;
  readinessTitle: string;
  readinessNarrative: string;
  nodeIds: number[];
}

export type IntegrationPattern = "embedded" | "connected" | "independent";
export type TeamMode = "pillared" | "squads";

export interface ProjectedNode {
  px: number;
  py: number;
  depth: number;
  i: number;
  size: number;
  opacity: number;
}

export interface Edge {
  a: number;
  b: number;
}
