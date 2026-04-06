import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Card, CardHeader, CardTitle, CardContent,
  StepChecklist, CollapsibleHint, Button, Input, Label,
  LoadingState, type StepChecklistItem,
} from "@proto-portal/ui-components";
import { modulesApi } from "@/api/client";

type Tab = "learn" | "challenge" | "plan" | "submit" | "review";

const TABS: { id: Tab; label: string }[] = [
  { id: "learn", label: "Learn" },
  { id: "challenge", label: "Challenge" },
  { id: "plan", label: "Plan" },
  { id: "submit", label: "Submit" },
  { id: "review", label: "Review" },
];

export default function GoalPage() {
  const { moduleId, goalId } = useParams();
  const [activeTab, setActiveTab] = useState<Tab>("learn");

  const { data, isLoading } = useQuery({
    queryKey: ["goal", moduleId, goalId],
    queryFn: () => modulesApi.getGoal(Number(moduleId), Number(goalId)),
    enabled: !!moduleId && !!goalId,
  });

  if (isLoading) return <LoadingState message="Loading goal..." />;
  if (!data) return <p className="p-8 text-center text-muted-foreground">Goal not found.</p>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Tab navigation */}
      <div className="flex gap-1 border-b border-border mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? "border-[hsl(var(--learning-ring))] text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Learn tab */}
      {activeTab === "learn" && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold">{data.goal.title}</h2>
          {data.goal.video_url && (
            <div className="aspect-video rounded-lg overflow-hidden bg-black">
              <iframe
                src={data.goal.video_url.replace("watch?v=", "embed/")}
                className="w-full h-full"
                allowFullScreen
              />
            </div>
          )}
          <CollapsibleHint label="Related concepts">
            <p className="text-muted-foreground">
              Review the challenge rubric to understand what's expected.
            </p>
          </CollapsibleHint>
          <Button variant="progress" onClick={() => setActiveTab("challenge")}>
            Continue to Challenge →
          </Button>
        </div>
      )}

      {/* Challenge tab */}
      {activeTab === "challenge" && (
        <div className="space-y-6">
          {data.goal.challenge_md && (
            <Card>
              <CardContent className="prose prose-sm prose-invert max-w-none py-4">
                <div dangerouslySetInnerHTML={{ __html: data.goal.challenge_md }} />
              </CardContent>
            </Card>
          )}
          {data.goal.starter_repo && (
            <Card>
              <CardContent className="py-4">
                <p className="text-sm text-muted-foreground mb-2">Starter repository:</p>
                <a
                  href={data.goal.starter_repo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-info hover:underline"
                >
                  {data.goal.starter_repo}
                </a>
              </CardContent>
            </Card>
          )}
          <CollapsibleHint>
            <p className="text-muted-foreground">
              Focus on understanding the problem before jumping into code.
            </p>
          </CollapsibleHint>
          <Button variant="progress" onClick={() => setActiveTab("plan")}>
            Start Planning →
          </Button>
        </div>
      )}

      {/* Plan tab */}
      {activeTab === "plan" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Plan Your Approach</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Chat with the Digi-Trainer to develop your plan before coding.
              </p>
              <p className="text-xs text-muted-foreground italic">
                AI planning chat will be connected here.
              </p>
            </CardContent>
          </Card>
          <Button variant="progress" onClick={() => setActiveTab("submit")}>
            Ready to Submit →
          </Button>
        </div>
      )}

      {/* Submit tab */}
      {activeTab === "submit" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Submit Your Solution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>GitHub Pull Request URL</Label>
                <Input placeholder="https://github.com/..." className="mt-1.5" />
              </div>
              <Button variant="progress">Submit for Review</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Review tab */}
      {activeTab === "review" && (
        <div className="space-y-6">
          {data.latest_submission ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Review</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Status: <span className="font-medium text-foreground">{data.latest_submission.status}</span>
                </p>
              </CardContent>
            </Card>
          ) : (
            <p className="text-center text-muted-foreground py-12">
              Submit a solution to see your review here.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
