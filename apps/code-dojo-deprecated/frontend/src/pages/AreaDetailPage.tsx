import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
  Badge, Button, SyllabusItem, ProgressRing, LoadingState,
  type SyllabusItemType,
} from "@proto-portal/ui-components";
import {
  ChevronRight, Clock, BookOpen, Lock,
  Server, Hammer, Database, Lightbulb, Users, Compass,
  Brain, Bot, Rocket,
} from "lucide-react";
import { areasApi } from "@/api/client";

const AREA_ICONS: Record<string, React.ReactNode> = {
  server: <Server className="h-6 w-6" />,
  hammer: <Hammer className="h-6 w-6" />,
  database: <Database className="h-6 w-6" />,
  lightbulb: <Lightbulb className="h-6 w-6" />,
  users: <Users className="h-6 w-6" />,
  compass: <Compass className="h-6 w-6" />,
  brain: <Brain className="h-6 w-6" />,
  bot: <Bot className="h-6 w-6" />,
  rocket: <Rocket className="h-6 w-6" />,
};

const COLOR_BG: Record<string, string> = {
  violet: "bg-violet-50 border-violet-200",
  blue: "bg-blue-50 border-blue-200",
  amber: "bg-amber-50 border-amber-200",
  emerald: "bg-emerald-50 border-emerald-200",
  pink: "bg-pink-50 border-pink-200",
  cyan: "bg-cyan-50 border-cyan-200",
  orange: "bg-orange-50 border-orange-200",
  purple: "bg-purple-50 border-purple-200",
  red: "bg-red-50 border-red-200",
};

const DIFFICULTY_LABELS: Record<number, string> = {
  1: "Beginner",
  2: "Intermediate",
  3: "Advanced",
  4: "Expert",
  5: "Master",
};

export default function AreaDetailPage() {
  const { areaSlug } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["area", areaSlug],
    queryFn: () => areasApi.get(areaSlug!),
    enabled: !!areaSlug,
  });

  if (isLoading) return <LoadingState message="Loading area..." />;
  if (!data) return <p className="text-sm text-muted-foreground p-8 text-center">Area not found.</p>;

  const { area, modules } = data;
  const icon = AREA_ICONS[area.icon_name] ?? <BookOpen className="h-6 w-6" />;
  const bgClass = COLOR_BG[area.color] ?? COLOR_BG.blue;
  const publishedModules = modules.filter((m) => m.status === "published");
  const comingSoonModules = modules.filter((m) => m.status === "coming_soon");
  const totalHours = modules.reduce((sum, m) => sum + (m.estimated_hours ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link to="/catalog" className="hover:text-foreground">Catalog</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium">{area.title}</span>
      </nav>

      {/* Area header */}
      <Card className={`border ${bgClass}`}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-background border shadow-sm">
              {icon}
            </div>
            <div>
              <CardTitle className="text-xl">{area.title}</CardTitle>
              <CardDescription className="mt-1">{area.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="text-center">
              <p className="text-xs uppercase tracking-wide">Modules</p>
              <p className="font-semibold text-foreground">{area.module_count}</p>
            </div>
            <div className="text-center">
              <p className="text-xs uppercase tracking-wide">Published</p>
              <p className="font-semibold text-foreground">{area.published_count}</p>
            </div>
            <div className="text-center">
              <p className="text-xs uppercase tracking-wide">Total Hours</p>
              <p className="font-semibold text-foreground">{totalHours}h</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Published modules with syllabus */}
      {publishedModules.length > 0 && (
        <section>
          <h2 className="text-lg font-bold mb-3">Available Modules</h2>
          <div className="space-y-4">
            {publishedModules.map((module) => (
              <Card key={module.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{module.title}</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {module.description}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="text-[10px]">
                        {DIFFICULTY_LABELS[module.difficulty_level] ?? ""}
                      </Badge>
                      {module.estimated_hours && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {module.estimated_hours}h
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>

                {/* Syllabus */}
                {module.goals && module.goals.length > 0 && (
                  <CardContent className="py-2">
                    {module.goals.map((goal) => (
                      <Link
                        key={goal.id}
                        to={`/modules/${module.id}/goals/${goal.id}`}
                      >
                        <SyllabusItem
                          type={"challenge" as SyllabusItemType}
                          title={goal.title}
                          className="cursor-pointer"
                        />
                      </Link>
                    ))}
                  </CardContent>
                )}

                <CardContent className="pt-2 pb-4">
                  <Link to={`/modules/${module.id}`}>
                    <Button variant="progress" size="sm">
                      Start Module
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Coming soon modules */}
      {comingSoonModules.length > 0 && (
        <section>
          <h2 className="text-lg font-bold mb-3">Coming Soon</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {comingSoonModules.map((module) => (
              <Card key={module.id} className="opacity-60">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Lock className="h-3 w-3 text-muted-foreground" />
                    <Badge variant="secondary" className="text-[10px]">Coming Soon</Badge>
                  </div>
                  <CardTitle className="text-sm">{module.title}</CardTitle>
                  <CardDescription className="text-xs">
                    {module.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 text-xs text-muted-foreground flex items-center gap-3">
                  <Badge variant="outline" className="text-[10px]">
                    {DIFFICULTY_LABELS[module.difficulty_level] ?? ""}
                  </Badge>
                  {module.estimated_hours && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {module.estimated_hours}h
                    </span>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
