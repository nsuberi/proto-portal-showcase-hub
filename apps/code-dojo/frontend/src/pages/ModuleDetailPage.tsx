import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
  CategoryBadge, Button, SyllabusItem, type SyllabusItemType,
} from "@proto-portal/ui-components";
import { ChevronRight } from "lucide-react";
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
        <span className="text-foreground font-medium">{data.module.title}</span>
      </nav>

      {/* Module header */}
      <Card>
        <CardHeader>
          <CategoryBadge>Module</CategoryBadge>
          <CardTitle className="text-2xl mt-2">{data.module.title}</CardTitle>
          <CardDescription>{data.module.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6 text-sm text-muted-foreground border-y border-border py-3">
            <div className="text-center">
              <p className="text-xs uppercase tracking-wide">Goals</p>
              <p className="font-semibold text-foreground">{data.goals.length}</p>
            </div>
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
