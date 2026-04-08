import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
  CategoryBadge, Badge, Button, SyllabusItem, type SyllabusItemType,
} from "@proto-portal/ui-components";
import { ChevronRight, Clock } from "lucide-react";
import { modulesApi } from "@/api/client";

export default function ModuleDetailPage() {
  const { moduleId } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["module", moduleId],
    queryFn: () => modulesApi.get(Number(moduleId)),
    enabled: !!moduleId,
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading...</p>;
  if (!data) return <p className="text-sm text-muted-foreground">Module not found.</p>;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="h-3 w-3" />
        {data.module.area && (
          <>
            <Link to={`/catalog/${data.module.area.slug}`} className="hover:text-foreground">
              {data.module.area.title}
            </Link>
            <ChevronRight className="h-3 w-3" />
          </>
        )}
        <span className="text-foreground font-medium">{data.module.title}</span>
      </nav>

      {/* Module header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CategoryBadge>Module</CategoryBadge>
            {data.module.area && (
              <CategoryBadge variant="subtle">{data.module.area.title}</CategoryBadge>
            )}
          </div>
          <CardTitle className="text-2xl mt-2">{data.module.title}</CardTitle>
          <CardDescription>{data.module.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6 text-sm text-muted-foreground border-y border-border py-3">
            <div className="text-center">
              <p className="text-xs uppercase tracking-wide">Goals</p>
              <p className="font-semibold text-foreground">{data.goals.length}</p>
            </div>
            {data.module.difficulty_level && (
              <div className="text-center">
                <p className="text-xs uppercase tracking-wide">Difficulty</p>
                <p className="font-semibold text-foreground">
                  {["", "Beginner", "Intermediate", "Advanced", "Expert", "Master"][data.module.difficulty_level] ?? ""}
                </p>
              </div>
            )}
            {data.module.estimated_hours && (
              <div className="text-center">
                <p className="text-xs uppercase tracking-wide">Time</p>
                <p className="font-semibold text-foreground flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {data.module.estimated_hours}h
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Syllabus */}
      <section>
        <h2 className="text-lg font-bold mb-3">Syllabus</h2>
        <Card>
          <CardContent className="py-2">
            {data.goals.map((goal) => (
              <Link key={goal.id} to={`/modules/${moduleId}/goals/${goal.id}`}>
                <SyllabusItem
                  type={"challenge" as SyllabusItemType}
                  title={goal.title}
                  className="cursor-pointer"
                />
              </Link>
            ))}
          </CardContent>
        </Card>
      </section>

      {/* Start CTA */}
      {data.goals.length > 0 && (
        <div className="flex justify-center">
          <Link to={`/modules/${moduleId}/goals/${data.goals[0].id}`}>
            <Button variant="progress" size="lg">Start Learning</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
