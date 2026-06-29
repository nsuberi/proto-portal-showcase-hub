import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";

export type Theme =
  | "coding-data-structures"
  | "organizing-community-transformation"
  | "enterprise-ai"
  | "enabling-ai-agents"
  | "domain-expertise-onboarding"
  | "ai-augmented-knowledge-work"
  | "interactive-learning-patterns";

export interface Prototype {
  title: string;
  description: string;
  link: string;
  tags: string[];
  status: "Live Demo Available" | "Concept";
  theme: Theme;
  /** Optional still-frame preview image (imported asset URL). */
  preview?: string;
}

interface PortfolioPrototypeCardProps {
  prototype: Prototype;
}

export function PortfolioPrototypeCard({ prototype }: PortfolioPrototypeCardProps) {
  const isLive = prototype.status === "Live Demo Available";

  return (
    <Card
      className={`group hover:shadow-elegant transition-smooth border-border/50 hover:border-primary/30 relative overflow-hidden flex flex-col ${
        isLive ? "" : "opacity-80"
      }`}
    >
      <div
        className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${
          isLive ? "from-primary/10" : "from-muted/30"
        } to-transparent`}
      />
      <CardContent className="p-6 relative flex flex-col flex-1">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="text-xl font-semibold group-hover:text-primary transition-smooth">
            {prototype.title}
          </h3>
          {!isLive && (
            <span className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded-full font-medium whitespace-nowrap shrink-0">
              {prototype.status}
            </span>
          )}
        </div>
        <p className="text-muted-foreground mb-4 leading-relaxed">
          {prototype.description}
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {prototype.tags.map((tag, tagIndex) => (
            <span
              key={tagIndex}
              className={`px-2 py-1 text-xs rounded-full ${
                isLive
                  ? "bg-primary/10 text-primary"
                  : "bg-muted/50 text-muted-foreground"
              }`}
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="mt-auto">
          {isLive ? (
            <a
              href={prototype.link}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-gradient-primary text-primary-foreground hover:shadow-glow h-9 px-3 w-full transition-smooth"
            >
              Try Live Demo
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full transition-smooth"
              disabled
            >
              Coming Soon
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
