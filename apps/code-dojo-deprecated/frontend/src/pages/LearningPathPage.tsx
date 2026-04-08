import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
  ProgressRing, WeeklyTarget, StudyPlanBanner, Badge, Button,
  LoadingState,
} from "@proto-portal/ui-components";
import {
  Server, Hammer, Database, Lightbulb, Users, Compass,
  Brain, Bot, Rocket, BookOpen, ChevronRight, Clock,
} from "lucide-react";
import { areasApi, pathApi, type CurriculumArea, type AreaProgress } from "@/api/client";
import { useAuth } from "@/hooks/use-auth";

const AREA_ICONS: Record<string, React.ReactNode> = {
  server: <Server className="h-5 w-5" />,
  hammer: <Hammer className="h-5 w-5" />,
  database: <Database className="h-5 w-5" />,
  lightbulb: <Lightbulb className="h-5 w-5" />,
  users: <Users className="h-5 w-5" />,
  compass: <Compass className="h-5 w-5" />,
  brain: <Brain className="h-5 w-5" />,
  bot: <Bot className="h-5 w-5" />,
  rocket: <Rocket className="h-5 w-5" />,
};

const COLOR_CLASSES: Record<string, string> = {
  violet: "border-violet-200 bg-violet-50",
  blue: "border-blue-200 bg-blue-50",
  amber: "border-amber-200 bg-amber-50",
  emerald: "border-emerald-200 bg-emerald-50",
  pink: "border-pink-200 bg-pink-50",
  cyan: "border-cyan-200 bg-cyan-50",
  orange: "border-orange-200 bg-orange-50",
  purple: "border-purple-200 bg-purple-50",
  red: "border-red-200 bg-red-50",
};

function PathAreaCard({
  area,
  progress,
}: {
  area: CurriculumArea;
  progress?: AreaProgress;
}) {
  const icon = AREA_ICONS[area.icon_name] ?? <BookOpen className="h-5 w-5" />;
  const colorClass = COLOR_CLASSES[area.color] ?? COLOR_CLASSES.blue;
  const pct = progress?.progress_percent ?? 0;
  const started = progress?.modules_started ?? 0;
  const total = progress?.modules_total ?? area.module_count;

  return (
    <Link to={`/catalog/${area.slug}`}>
      <Card className={`h-full border ${colorClass} hover:shadow-medium transition-shadow cursor-pointer group`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {icon}
              <CardTitle className="text-sm group-hover:text-primary transition-colors">
                {area.title}
              </CardTitle>
            </div>
            <ProgressRing value={pct} size={40} strokeWidth={3} />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {area.description}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {started > 0 ? `${started} of ${total} started` : `${total} modules`}
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function LearningPathPage() {
  const { isAuthenticated } = useAuth();

  const { data: areasData, isLoading: areasLoading } = useQuery({
    queryKey: ["areas"],
    queryFn: areasApi.list,
  });

  const { data: progressData } = useQuery({
    queryKey: ["path-progress"],
    queryFn: pathApi.progress,
    enabled: isAuthenticated,
  });

  if (areasLoading) return <LoadingState message="Loading path..." />;

  const areas = areasData?.areas ?? [];
  const areaProgressMap = new Map(
    (progressData?.areas ?? []).map((p) => [p.slug, p])
  );
  const overall = progressData?.overall_progress ?? 0;
  const recommended = progressData?.recommended_next ?? [];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="text-center py-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
          The AI Builder Path
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto text-sm">
          Becoming an AI Builder means developing skills across 9 interconnected areas.
          There's no fixed order — start with what excites you and build from there.
        </p>
        {isAuthenticated && (
          <div className="mt-4 inline-flex items-center gap-3">
            <ProgressRing value={overall} size={48} strokeWidth={4} />
            <span className="text-sm font-medium">
              {overall}% complete
            </span>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_16rem] gap-8">
        {/* Main: area roadmap */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {areas.map((area) => (
              <PathAreaCard
                key={area.slug}
                area={area}
                progress={areaProgressMap.get(area.slug)}
              />
            ))}
          </div>

          {/* Recommended next (authenticated) */}
          {recommended.length > 0 && (
            <section>
              <h2 className="text-lg font-bold mb-3">Recommended Next</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommended.map((rec) => (
                  <Link key={rec.module_id} to={`/modules/${rec.module_id}`}>
                    <Card className="hover:shadow-medium transition-shadow cursor-pointer h-full">
                      <CardHeader className="pb-2">
                        <Badge variant="outline" className="text-[10px] w-fit">
                          {rec.area_title}
                        </Badge>
                        <CardTitle className="text-sm mt-1">{rec.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 text-xs text-muted-foreground flex items-center gap-3">
                        {rec.estimated_hours && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {rec.estimated_hours}h
                          </span>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="hidden lg:block space-y-4">
          {isAuthenticated && (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Your Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <ProgressRing value={overall} size={56} strokeWidth={4} />
                    <div>
                      <p className="text-lg font-bold">{overall}%</p>
                      <p className="text-xs text-muted-foreground">of path complete</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <WeeklyTarget target={3} completed={0} />
            </>
          )}
          <StudyPlanBanner onAction={() => {}} />
        </aside>
      </div>
    </div>
  );
}
