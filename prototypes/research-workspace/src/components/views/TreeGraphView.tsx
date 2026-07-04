import { useRef, useEffect, useState, useCallback } from "react";
import * as d3 from "d3";
import { useTree } from "../../hooks/useTree";
import type { BanyanTree, Root, Branch, Leaf, Flower, Connection } from "../../types/tree";
import { Network, TreeDeciduous } from "lucide-react";

// ---------------------------------------------------------------------------
// Graph node / link types for D3
// ---------------------------------------------------------------------------

type NodeType = "root" | "branch" | "leaf" | "flower";

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type: NodeType;
  status?: string;
  radius: number;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  type: Connection["type"] | "parent";
}

// ---------------------------------------------------------------------------
// Color + sizing constants from the Chikorita palette
// ---------------------------------------------------------------------------

// design-token-lint-ignore
const NODE_COLORS: Record<NodeType, string> = {
  root: "#6b5b4a",
  branch: "#8b7355",
  leaf: "#7bb661",
  flower: "#8b2252",
};

// design-token-lint-ignore
const NODE_COLORS_LIGHT: Record<NodeType, string> = {
  root: "#c4b8a4",
  branch: "#d4c8b4",
  leaf: "#d4edcc",
  flower: "#f5d0e0",
};

const NODE_RADII: Record<NodeType, number> = {
  root: 14,
  branch: 12,
  leaf: 7,
  flower: 9,
};

// Ground line Y position — roots below, branches/leaves/flowers above
const GROUND_Y = 0;

// ---------------------------------------------------------------------------
// Transform tree data into graph nodes + links
// ---------------------------------------------------------------------------

function treeToGraph(tree: BanyanTree): {
  nodes: GraphNode[];
  links: GraphLink[];
} {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  const nodeIds = new Set<string>();

  // Roots
  tree.roots.forEach((r: Root) => {
    nodes.push({
      id: r.id,
      label: r.label,
      type: "root",
      radius: NODE_RADII.root,
      // Start roots below the ground line
      y: GROUND_Y + 80 + Math.random() * 60,
    });
    nodeIds.add(r.id);
  });

  // Branches
  tree.branches.forEach((b: Branch) => {
    nodes.push({
      id: b.id,
      label: b.title,
      type: "branch",
      status: b.status,
      radius: NODE_RADII.branch,
      // Start branches above ground
      y: GROUND_Y - 60 - Math.random() * 80,
    });
    nodeIds.add(b.id);

    // Connect branches to their roots
    b.rootConnections.forEach((rootId) => {
      if (nodeIds.has(rootId)) {
        links.push({ source: rootId, target: b.id, type: "parent" });
      }
    });

    // Parent branch link
    if (b.parentBranchId && nodeIds.has(b.parentBranchId)) {
      links.push({
        source: b.parentBranchId,
        target: b.id,
        type: "parent",
      });
    }
  });

  // Leaves
  tree.leaves.forEach((l: Leaf) => {
    nodes.push({
      id: l.id,
      label: l.summary || l.filePath.split("/").pop() || "leaf",
      type: "leaf",
      radius: NODE_RADII.leaf,
      y: GROUND_Y - 120 - Math.random() * 40,
    });
    nodeIds.add(l.id);

    if (nodeIds.has(l.branchId)) {
      links.push({ source: l.branchId, target: l.id, type: "parent" });
    }
  });

  // Flowers
  tree.flowers.forEach((f: Flower) => {
    nodes.push({
      id: f.id,
      label: f.insight,
      type: "flower",
      radius: NODE_RADII.flower,
      y: GROUND_Y - 160 - Math.random() * 40,
    });
    nodeIds.add(f.id);

    if (nodeIds.has(f.branchId)) {
      links.push({ source: f.branchId, target: f.id, type: "parent" });
    }
  });

  // Explicit connections
  tree.connections.forEach((c: Connection) => {
    if (nodeIds.has(c.from) && nodeIds.has(c.to)) {
      links.push({ source: c.from, target: c.to, type: c.type });
    }
  });

  return { nodes, links };
}

// ---------------------------------------------------------------------------
// Tooltip component
// ---------------------------------------------------------------------------

interface TooltipState {
  x: number;
  y: number;
  node: GraphNode;
}

function Tooltip({ x, y, node }: TooltipState) {
  const typeLabels: Record<NodeType, string> = {
    root: "Root",
    branch: "Branch",
    leaf: "Leaf",
    flower: "Flower",
  };

  return (
    <div
      className="absolute pointer-events-none z-10 bark-card px-3 py-2 max-w-[200px]"
      style={{
        left: x + 12,
        top: y - 8,
        transform: "translateY(-100%)",
      }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: NODE_COLORS[node.type] }}
        />
        <span
          className="font-label text-[9px] uppercase tracking-wider"
          style={{ color: NODE_COLORS[node.type] }}
        >
          {typeLabels[node.type]}
        </span>
      </div>
      <p className="font-body text-xs text-on-surface line-clamp-3">
        {node.label}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// D3 Force Graph component
// ---------------------------------------------------------------------------

function ForceGraph({ tree }: { tree: BanyanTree }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 500 });

  // Observe container size
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) {
        setDimensions({ width, height });
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const svg = d3.select(svgEl);
    svg.selectAll("*").remove();

    const { width, height } = dimensions;
    const { nodes, links } = treeToGraph(tree);

    if (nodes.length === 0) return;

    // Center of the canvas — ground line is at vertical center
    const centerX = width / 2;
    const groundY = height * 0.55;

    // Set initial positions relative to ground
    nodes.forEach((n) => {
      n.x = centerX + (Math.random() - 0.5) * width * 0.4;
      n.y = groundY + (n.y ?? 0);
    });

    // Create the simulation
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink<GraphNode, GraphLink>(links)
          .id((d) => d.id)
          .distance(50)
          .strength(0.6),
      )
      .force("charge", d3.forceManyBody().strength(-120))
      .force("collide", d3.forceCollide<GraphNode>().radius((d) => d.radius + 4))
      // Gravity: roots pull down, everything else pulls up
      .force(
        "y",
        d3
          .forceY<GraphNode>()
          .y((d) => {
            if (d.type === "root") return groundY + 80;
            if (d.type === "branch") return groundY - 80;
            if (d.type === "leaf") return groundY - 130;
            if (d.type === "flower") return groundY - 170;
            return groundY;
          })
          .strength(0.12),
      )
      .force("x", d3.forceX(centerX).strength(0.03));

    // Create zoom behavior
    const g = svg.append("g");

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on("zoom", (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        g.attr("transform", event.transform.toString());
      });

    svg.call(zoom);

    // Ground line
    g.append("line")
      .attr("x1", -2000)
      .attr("y1", groundY)
      .attr("x2", 4000)
      .attr("y2", groundY)
      .attr("stroke", NODE_COLORS.root)
      .attr("stroke-opacity", 0.15)
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "8,6");

    // Ground labels
    g.append("text")
      .attr("x", 20)
      .attr("y", groundY - 10)
      .attr("fill", NODE_COLORS.branch)
      .attr("font-size", "10px")
      .attr("font-family", "Inter, sans-serif")
      .attr("opacity", 0.4)
      .text("what you're exploring");

    g.append("text")
      .attr("x", 20)
      .attr("y", groundY + 20)
      .attr("fill", NODE_COLORS.root)
      .attr("font-size", "10px")
      .attr("font-family", "Inter, sans-serif")
      .attr("opacity", 0.4)
      .text("who you are");

    // Links
    const link = g
      .append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", (d: GraphLink) => {
        const sourceNode = d.source as GraphNode;
        const targetNode = d.target as GraphNode;
        if (sourceNode.type === "root" || targetNode.type === "root")
          return NODE_COLORS.root;
        return NODE_COLORS.branch;
      })
      .attr("stroke-opacity", 0.2)
      .attr("stroke-width", 1.5);

    // Node groups
    const node = g
      .append("g")
      .selectAll<SVGGElement, GraphNode>("g")
      .data(nodes)
      .join("g")
      .style("cursor", "pointer")
      .call(
        d3
          .drag<SVGGElement, GraphNode>()
          .on("start", (event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
          })
          .on("drag", (event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>) => {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
          })
          .on("end", (event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>) => {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
          }),
      );

    // Node circles — outer glow for flowers
    node
      .filter((d: GraphNode) => d.type === "flower")
      .append("circle")
      .attr("r", (d: GraphNode) => d.radius + 4)
      .attr("fill", NODE_COLORS_LIGHT.flower)
      .attr("opacity", 0.4);

    // Main circle
    node
      .append("circle")
      .attr("r", (d: GraphNode) => d.radius)
      .attr("fill", (d: GraphNode) => NODE_COLORS_LIGHT[d.type])
      .attr("stroke", (d: GraphNode) => NODE_COLORS[d.type])
      .attr("stroke-width", 2);

    // Type icon — small text label inside node
    node
      .filter((d: GraphNode) => d.type === "root" || d.type === "branch")
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("font-size", (d: GraphNode) => (d.type === "root" ? "11px" : "10px"))
      .attr("fill", (d: GraphNode) => NODE_COLORS[d.type])
      .text((d: GraphNode) => {
        if (d.type === "root") return "\u2663"; // club/tree symbol
        if (d.type === "branch") return "\u2740"; // flower-like
        return "";
      });

    // Node label (below node)
    node
      .append("text")
      .attr("y", (d: GraphNode) => d.radius + 12)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("font-family", "Inter, sans-serif")
      .attr("fill", (d: GraphNode) => NODE_COLORS[d.type])
      .attr("opacity", 0.7)
      .text((d: GraphNode) => {
        const maxLen = d.type === "leaf" || d.type === "flower" ? 16 : 22;
        return d.label.length > maxLen
          ? d.label.slice(0, maxLen - 1) + "\u2026"
          : d.label;
      });

    // Hover interactions
    node
      .on("mouseenter", (event: MouseEvent, d: GraphNode) => {
        const svgRect = svgRef.current?.getBoundingClientRect();
        if (!svgRect) return;
        setTooltip({
          x: event.clientX - svgRect.left,
          y: event.clientY - svgRect.top,
          node: d,
        });
      })
      .on("mouseleave", () => setTooltip(null));

    // Tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: GraphLink) => (d.source as GraphNode).x!)
        .attr("y1", (d: GraphLink) => (d.source as GraphNode).y!)
        .attr("x2", (d: GraphLink) => (d.target as GraphNode).x!)
        .attr("y2", (d: GraphLink) => (d.target as GraphNode).y!);

      node.attr("transform", (d: GraphNode) => `translate(${d.x},${d.y})`);
    });

    // Slow down after initial layout
    simulation.alpha(0.8).alphaDecay(0.02);

    return () => {
      simulation.stop();
    };
  }, [tree, dimensions]);

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full"
      />
      {tooltip && <Tooltip {...tooltip} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Legend component
// ---------------------------------------------------------------------------

function Legend() {
  const items: { type: NodeType; label: string }[] = [
    { type: "root", label: "Roots (who you are)" },
    { type: "branch", label: "Branches (exploring)" },
    { type: "leaf", label: "Leaves (artifacts)" },
    { type: "flower", label: "Flowers (insights)" },
  ];

  return (
    <div className="absolute bottom-4 left-4 flex gap-3 font-label text-[10px] bg-surface-bright/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-outline-variant/20">
      {items.map(({ type, label }) => (
        <span key={type} className="flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded-full border-2"
            style={{
              backgroundColor: NODE_COLORS_LIGHT[type],
              borderColor: NODE_COLORS[type],
            }}
          />
          <span className="text-on-surface-variant/80">{label}</span>
        </span>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main TreeGraphView
// ---------------------------------------------------------------------------

export default function TreeGraphView() {
  const { tree, loading } = useTree();

  const totalNodes =
    tree.roots.length +
    tree.branches.length +
    tree.leaves.length +
    tree.flowers.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="font-label text-sm text-on-surface-variant/80">
          Loading knowledge map...
        </span>
      </div>
    );
  }

  if (totalNodes === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <TreeDeciduous className="w-16 h-16 text-on-surface-variant/15 mb-4" />
        <h2 className="font-headline text-xl text-on-surface-variant/72 mb-2">
          Your knowledge garden is empty
        </h2>
        <p className="font-body text-sm text-on-surface-variant/65 max-w-md mb-6">
          Start a conversation to plant your first intention. As you explore
          topics, your tree will grow with branches, leaves, and flowers.
        </p>
        <div className="flex gap-3 text-xs font-label text-on-surface-variant/65">
          <span className="flex items-center gap-1">
            <span
              className="w-2.5 h-2.5 rounded-full border-2"
              style={{
                backgroundColor: NODE_COLORS_LIGHT.root,
                borderColor: NODE_COLORS.root,
              }}
            />{" "}
            Roots
          </span>
          <span className="flex items-center gap-1">
            <span
              className="w-2.5 h-2.5 rounded-full border-2"
              style={{
                backgroundColor: NODE_COLORS_LIGHT.branch,
                borderColor: NODE_COLORS.branch,
              }}
            />{" "}
            Branches
          </span>
          <span className="flex items-center gap-1">
            <span
              className="w-2.5 h-2.5 rounded-full border-2"
              style={{
                backgroundColor: NODE_COLORS_LIGHT.leaf,
                borderColor: NODE_COLORS.leaf,
              }}
            />{" "}
            Leaves
          </span>
          <span className="flex items-center gap-1">
            <span
              className="w-2.5 h-2.5 rounded-full border-2"
              style={{
                backgroundColor: NODE_COLORS_LIGHT.flower,
                borderColor: NODE_COLORS.flower,
              }}
            />{" "}
            Flowers
          </span>
        </div>

        {/* Demo data button */}
        <DemoDataButton />
      </div>
    );
  }

  return (
    <div className="relative h-full">
      {/* Stats bar */}
      <div className="absolute top-3 left-4 z-10 flex gap-3">
        {tree.roots.length > 0 && (
          <Stat type="root" count={tree.roots.length} label="Roots" />
        )}
        {tree.branches.length > 0 && (
          <Stat type="branch" count={tree.branches.length} label="Branches" />
        )}
        {tree.leaves.length > 0 && (
          <Stat type="leaf" count={tree.leaves.length} label="Leaves" />
        )}
        {tree.flowers.length > 0 && (
          <Stat type="flower" count={tree.flowers.length} label="Flowers" />
        )}
      </div>

      <ForceGraph tree={tree} />
      <Legend />
    </div>
  );
}

function Stat({
  type,
  count,
  label,
}: {
  type: NodeType;
  count: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5 bg-surface-bright/80 backdrop-blur-sm px-2.5 py-1.5 rounded-lg border border-outline-variant/20">
      <span
        className="font-headline text-base font-bold"
        style={{ color: NODE_COLORS[type] }}
      >
        {count}
      </span>
      <span className="font-label text-[10px] text-on-surface-variant/72">
        {label}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Demo data button — loads sample tree for portfolio showcase
// ---------------------------------------------------------------------------

function DemoDataButton() {
  const { saveTree } = useTree();
  const [loaded, setLoaded] = useState(false);

  const loadDemo = useCallback(() => {
    const now = new Date().toISOString();
    const demoTree: BanyanTree = {
      version: 1,
      roots: [
        {
          id: "r1",
          label: "Geospatial Data Science",
          confidence: 0.9,
          source: "stated",
          createdAt: now,
        },
        {
          id: "r2",
          label: "Python & ML Engineering",
          confidence: 0.85,
          source: "stated",
          createdAt: now,
        },
        {
          id: "r3",
          label: "Remote Sensing",
          confidence: 0.7,
          source: "inferred",
          createdAt: now,
        },
      ],
      branches: [
        {
          id: "b1",
          title: "Transformer Attention Mechanisms",
          description:
            "Understanding self-attention, multi-head attention, and their connection to spatial autocorrelation",
          status: "growing",
          rootConnections: ["r1", "r2"],
          createdAt: now,
          lastActiveAt: now,
        },
        {
          id: "b2",
          title: "KV Cache Optimization",
          description:
            "Inference optimization through key-value caching strategies",
          status: "growing",
          parentBranchId: "b1",
          rootConnections: ["r2"],
          createdAt: now,
          lastActiveAt: now,
        },
        {
          id: "b3",
          title: "Foundation Models for Earth Observation",
          description:
            "How vision transformers are being applied to satellite imagery",
          status: "flowering",
          rootConnections: ["r1", "r3"],
          createdAt: now,
          lastActiveAt: now,
        },
      ],
      leaves: [
        {
          id: "l1",
          branchId: "b1",
          type: "markdown",
          filePath: "reviews/attention-is-all-you-need.md",
          summary: "Attention Is All You Need paper review",
          createdAt: now,
        },
        {
          id: "l2",
          branchId: "b1",
          type: "markdown",
          filePath: "reviews/flash-attention.md",
          summary: "FlashAttention: Fast and Memory-Efficient",
          createdAt: now,
        },
        {
          id: "l3",
          branchId: "b2",
          type: "markdown",
          filePath: "reviews/multi-query-attention.md",
          summary: "Multi-Query Attention analysis",
          createdAt: now,
        },
        {
          id: "l4",
          branchId: "b3",
          type: "markdown",
          filePath: "reviews/satlas-foundation-model.md",
          summary: "SatlasPretrain foundation model",
          createdAt: now,
        },
        {
          id: "l5",
          branchId: "b3",
          type: "code",
          filePath: "assets/satellite-vit-pipeline.py",
          summary: "ViT inference pipeline for satellite tiles",
          createdAt: now,
        },
      ],
      flowers: [
        {
          id: "f1",
          branchId: "b1",
          leafId: "l1",
          rootConnections: ["r1"],
          insight:
            "Attention IS spatial autocorrelation \u2014 nearby tokens influence each other with learned weights, just like pixels in remote sensing",
          published: true,
          publishedAt: now,
          createdAt: now,
        },
        {
          id: "f2",
          branchId: "b3",
          rootConnections: ["r1", "r3"],
          insight:
            "Foundation models for EO are the bridge between my GIS past and ML engineering future",
          published: false,
          createdAt: now,
        },
      ],
      connections: [
        { from: "b1", to: "b2", type: "led_to" },
        { from: "r1", to: "b3", type: "feeds" },
        { from: "l1", to: "f1", type: "led_to" },
      ],
      lastModified: now,
    };

    saveTree(demoTree);
    setLoaded(true);
  }, [saveTree]);

  if (loaded) {
    return (
      <p className="font-label text-xs text-accent-success mt-4">
        Demo data loaded! The graph should appear above.
      </p>
    );
  }

  return (
    <button
      onClick={loadDemo}
      className="mt-6 inline-flex items-center gap-2 font-label text-xs px-4 py-2 rounded-lg border border-primary/30 text-primary hover:bg-primary/8 transition-colors"
    >
      <Network className="w-3.5 h-3.5" />
      Load demo knowledge tree
    </button>
  );
}
