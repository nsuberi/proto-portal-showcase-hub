import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  Badge, Button, ProgressRing, LoadingState,
} from "@proto-portal/ui-components";
import {
  Server, Hammer, Database, Lightbulb, Users, Compass,
  Brain, Bot, Rocket, Clock, BookOpen, ChevronRight,
} from "lucide-react";
import { areasApi, catalogApi, type CurriculumArea, type ModuleSummary } from "@/api/client";
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
  violet: "bg-violet-100 text-violet-700 border-violet-200",
  blue: "bg-blue-100 text-blue-700 border-blue-200",
  amber: "bg-amber-100 text-amber-700 border-amber-200",
  emerald: "bg-emerald-100 text-emerald-700 border-emerald-200",
  pink: "bg-pink-100 text-pink-700 border-pink-200",
  cyan: "bg-cyan-100 text-cyan-700 border-cyan-200",
  orange: "bg-orange-100 text-orange-700 border-orange-200",
  purple: "bg-purple-100 text-purple-700 border-purple-200",
  red: "bg-red-100 text-red-700 border-red-200",
};

const DIFFICULTY_LABELS: Record<number, string> = {
  1: "Beginner",
  2: "Intermediate",
  3: "Advanced",
  4: "Expert",
  5: "Master",
};

function AreaCard({ area }: { area: CurriculumArea }) {
  const icon = AREA_ICONS[area.icon_name] ?? <BookOpen className="h-5 w-5" />;
  const colorClass = COLOR_CLASSES[area.color] ?? COLOR_CLASSES.blue;

  return (
    <Link to={`/catalog/${area.slug}`}>
      <Card className="h-full hover:shadow-medium transition-shadow cursor-pointer group">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className={`inline-flex items-center justify-center h-10 w-10 rounded-lg border ${colorClass}`}>
              {icon}
            </div>
            {area.user_progress && area.user_progress.modules_started > 0 && (
              <ProgressRing
                value={Math.round(
                  (area.user_progress.modules_started / area.user_progress.total) * 100
                )}
                size={36}
                strokeWidth={3}
              />
            )}
          </div>
          <CardTitle className="text-base mt-3 group-hover:text-primary transition-colors">
            {area.title}
          </CardTitle>
          <CardDescription className="text-xs line-clamp-2">
            {area.description}
          </CardDescription>
        </CardHeader>
        <CardFooter className="pt-0 text-xs text-muted-foreground flex items-center gap-3">
          <span>{area.published_count} module{area.published_count !== 1 ? "s" : ""}</span>
          {area.module_count > area.published_count && (
            <span className="text-muted-foreground/60">
              +{area.module_count - area.published_count} coming
            </span>
          )}
          <ChevronRight className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
        </CardFooter>
      </Card>
    </Link>
  );
}

function ModuleCard({ module }: { module: ModuleSummary }) {
  const isComingSoon = module.status === "coming_soon";
  const colorClass = module.area ? COLOR_CLASSES[module.area.color] ?? "" : "";

  return (
    <Card className={`h-full transition-shadow ${isComingSoon ? "opacity-60" : "hover:shadow-medium"}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 mb-1">
          {module.area && (
            <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full border ${colorClass}`}>
              {module.area.title}
            </span>
          )}
          {isComingSoon && (
            <Badge variant="secondary" className="text-[10px]">Coming Soon</Badge>
          )}
        </div>
        <CardTitle className="text-sm">{module.title}</CardTitle>
        <CardDescription className="text-xs line-clamp-2">
          {module.description}
        </CardDescription>
      </CardHeader>
      <CardFooter className="pt-0 text-xs text-muted-foreground flex items-center gap-3">
        {module.difficulty_level && (
          <Badge variant="outline" className="text-[10px]">
            {DIFFICULTY_LABELS[module.difficulty_level] ?? `Level ${module.difficulty_level}`}
          </Badge>
        )}
        {module.estimated_hours && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {module.estimated_hours}h
          </span>
        )}
        {module.goal_count > 0 && (
          <span>{module.goal_count} goal{module.goal_count !== 1 ? "s" : ""}</span>
        )}
      </CardFooter>
      {!isComingSoon && (
        <CardContent className="pt-0 pb-4">
          <Link to={`/modules/${module.id}`}>
            <Button variant="outline" size="sm" className="w-full text-xs">
              View Module
            </Button>
          </Link>
        </CardContent>
      )}
    </Card>
  );
}

export default function CatalogPage() {
  const { isAuthenticated } = useAuth();
  const [areaFilter, setAreaFilter] = useState<string>("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("");

  const { data: areasData, isLoading: areasLoading } = useQuery({
    queryKey: ["areas"],
    queryFn: areasApi.list,
  });

  const { data: catalogData, isLoading: catalogLoading } = useQuery({
    queryKey: ["catalog", areaFilter, difficultyFilter],
    queryFn: () =>
      catalogApi.list({
        area: areaFilter || undefined,
        difficulty: difficultyFilter || undefined,
      }),
  });

  if (areasLoading) return <LoadingState message="Loading catalog..." />;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="text-center py-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
          Explore the AI Builder Curriculum
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto text-sm">
          Master 9 skill areas to become a well-rounded AI Builder.
          Start anywhere — each area builds capabilities you'll use across the others.
        </p>
      </section>

      {/* Area cards grid */}
      <section>
        <h2 className="text-lg font-bold mb-3">Skill Areas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {areasData?.areas.map((area) => (
            <AreaCard key={area.slug} area={area} />
          ))}
        </div>
      </section>

      {/* Module catalog */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">All Modules</h2>
          <span className="text-xs text-muted-foreground">
            {catalogData?.modules.length ?? 0} modules
          </span>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            variant={areaFilter === "" ? "default" : "outline"}
            size="sm"
            className="text-xs"
            onClick={() => setAreaFilter("")}
          >
            All Areas
          </Button>
          {areasData?.areas.map((area) => (
            <Button
              key={area.slug}
              variant={areaFilter === area.slug ? "default" : "outline"}
              size="sm"
              className="text-xs"
              onClick={() => setAreaFilter(area.slug === areaFilter ? "" : area.slug)}
            >
              {area.title}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            variant={difficultyFilter === "" ? "default" : "outline"}
            size="sm"
            className="text-xs"
            onClick={() => setDifficultyFilter("")}
          >
            All Levels
          </Button>
          {[1, 2, 3, 4].map((level) => (
            <Button
              key={level}
              variant={difficultyFilter === String(level) ? "default" : "outline"}
              size="sm"
              className="text-xs"
              onClick={() =>
                setDifficultyFilter(String(level) === difficultyFilter ? "" : String(level))
              }
            >
              {DIFFICULTY_LABELS[level]}
            </Button>
          ))}
        </div>

        {/* Module grid */}
        {catalogLoading ? (
          <LoadingState message="Loading modules..." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {catalogData?.modules.map((module) => (
              <ModuleCard key={module.id} module={module} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
