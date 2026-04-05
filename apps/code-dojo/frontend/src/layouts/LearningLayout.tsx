import { Outlet, Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { ProgressSegments, Button, type ProgressSegment } from "@proto-portal/ui-components";
import { modulesApi } from "@/api/client";

/**
 * Dark navy learning layout — Codecademy focused-learning mode.
 * Shows course name + progress segments in nav, full-width content.
 */
export default function LearningLayout() {
  const { moduleId, goalId } = useParams();

  const { data } = useQuery({
    queryKey: ["goal", moduleId, goalId],
    queryFn: () => modulesApi.getGoal(Number(moduleId), Number(goalId)),
    enabled: !!moduleId && !!goalId,
  });

  // Build progress segments from goal's workflow steps
  const segments: ProgressSegment[] = [
    { id: "learn", state: "complete", label: "Learn" },
    { id: "challenge", state: "complete", label: "Challenge" },
    { id: "plan", state: "active", label: "Plan" },
    { id: "submit", state: "pending", label: "Submit" },
    { id: "review", state: "pending", label: "Review" },
  ];

  return (
    <div className="learning-mode min-h-screen flex flex-col">
      {/* Dark navbar with progress */}
      <nav className="sticky top-0 z-40 border-b border-border bg-[hsl(var(--learning-card))]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center h-14 gap-4">
            <Link to={moduleId ? `/modules/${moduleId}` : "/"}>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">
                {data?.goal?.title ?? "Loading..."}
              </p>
              <ProgressSegments segments={segments} className="mt-1 max-w-xs" />
            </div>

            <Button variant="outline" size="sm" className="hidden sm:flex">
              Get Unstuck
            </Button>
          </div>
        </div>
      </nav>

      {/* Full-width learning content */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
