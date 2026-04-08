import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  Button, ResumeLearningCard, StudyPlanBanner, ProgressRing,
  WeeklyTarget, Badge, LoadingState,
} from "@proto-portal/ui-components";
import {
  Server, Hammer, Database, Lightbulb, Users, Compass,
  Brain, Bot, Rocket, BookOpen, ChevronRight, Clock, ArrowRight,
} from "lucide-react";
import { areasApi, pathApi, type CurriculumArea } from "@/api/client";
import { useAuth } from "@/hooks/use-auth";

const AREA_ICONS: Record<string, React.ReactNode> = {
  server: <Server className="h-4 w-4" />,
  hammer: <Hammer className="h-4 w-4" />,
  database: <Database className="h-4 w-4" />,
  lightbulb: <Lightbulb className="h-4 w-4" />,
  users: <Users className="h-4 w-4" />,
  compass: <Compass className="h-4 w-4" />,
  brain: <Brain className="h-4 w-4" />,
  bot: <Bot className="h-4 w-4" />,
  rocket: <Rocket className="h-4 w-4" />,
};

const COLOR_CLASSES: Record<string, string> = {
  violet: "bg-violet-100 text-violet-700",
  blue: "bg-blue-100 text-blue-700",
  amber: "bg-amber-100 text-amber-700",
  emerald: "bg-emerald-100 text-emerald-700",
  pink: "bg-pink-100 text-pink-700",
  cyan: "bg-cyan-100 text-cyan-700",
  orange: "bg-orange-100 text-orange-700",
  purple: "bg-purple-100 text-purple-700",
  red: "bg-red-100 text-red-700",
};

function AreaMiniCard({ area }: { area: CurriculumArea }) {
  const icon = AREA_ICONS[area.icon_name] ?? <BookOpen className="h-4 w-4" />;
  const colorClass = COLOR_CLASSES[area.color] ?? COLOR_CLASSES.blue;
  const progress = area.user_progress;
  const pct = progress
    ? Math.round((progress.modules_started / progress.total) * 100)
    : 0;

  return (
    <Link to={`/catalog/${area.slug}`}>
      <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-muted/30 transition-colors cursor-pointer group">
        <div className={`flex items-center justify-center h-8 w-8 rounded-md ${colorClass}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
            {area.title}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {area.published_count} module{area.published_count !== 1 ? "s" : ""}
          </p>
        </div>
        {progress && progress.modules_started > 0 ? (
          <ProgressRing value={pct} size={28} strokeWidth={2.5} />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>
    </Link>
  );
}

export default function HomePage() {
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

  const areas = areasData?.areas ?? [];
  const recommended = progressData?.recommended_next ?? [];
  const overall = progressData?.overall_progress ?? 0;

  if (areasLoading) return <LoadingState message="Loading..." />;

  // ── Authenticated dashboard ──
  if (isAuthenticated) {
    return (
      <div className="space-y-8">
        {/* Resume learning */}
        <ResumeLearningCard
          categoryLabel="AI Builder Path"
          title="Continue your learning journey"
          subtitle={`${overall}% complete across 9 skill areas`}
          progress={overall}
          actions={{
            resume: () => {
              window.location.href =
                recommended.length > 0
                  ? `/code-dojo/modules/${recommended[0].module_id}`
                  : "/code-dojo/path";
            },
          }}
        />

        {/* Your path — 9 area mini-cards */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">Your Path</h2>
            <Link
              to="/path"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              View full path <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {areas.map((area) => (
              <AreaMiniCard key={area.slug} area={area} />
            ))}
          </div>
        </section>

        {/* Recommended next */}
        {recommended.length > 0 && (
          <section>
            <h2 className="text-lg font-bold mb-3">Recommended Next</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommended.map((rec) => (
                <Link key={rec.module_id} to={`/modules/${rec.module_id}`}>
                  <Card className="h-full hover:shadow-medium transition-shadow cursor-pointer">
                    <CardHeader className="pb-2">
                      <Badge variant="outline" className="text-[10px] w-fit">
                        {rec.area_title}
                      </Badge>
                      <CardTitle className="text-sm mt-1">{rec.title}</CardTitle>
                    </CardHeader>
                    <CardFooter className="pt-0 text-xs text-muted-foreground">
                      {rec.estimated_hours && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {rec.estimated_hours}h
                        </span>
                      )}
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Study plan CTA */}
        <StudyPlanBanner onAction={() => {}} />
      </div>
    );
  }

  // ── Unauthenticated landing ──
  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="text-center py-12">
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">
          Develop your skills as an{" "}
          <span className="text-primary">AI Builder</span>
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto mb-6 text-sm sm:text-base">
          Master 9 skill areas through hands-on challenges, AI-powered feedback,
          and community practice. Start for free.
        </p>
        <div className="flex gap-3 justify-center">
          <Link to="/onboarding">
            <Button variant="default" size="lg">
              Find what's right for you
            </Button>
          </Link>
          <Link to="/catalog">
            <Button variant="outline" size="lg">
              Browse catalog
            </Button>
          </Link>
        </div>
      </section>

      {/* 9 skill areas preview */}
      <section>
        <h2 className="text-xl font-bold mb-1 text-center">
          9 areas. One path.
        </h2>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Each area builds capabilities you'll use across the others.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {areas.map((area) => {
            const icon = AREA_ICONS[area.icon_name] ?? (
              <BookOpen className="h-4 w-4" />
            );
            const colorClass =
              COLOR_CLASSES[area.color] ?? COLOR_CLASSES.blue;

            return (
              <Link key={area.slug} to={`/catalog/${area.slug}`}>
                <Card className="hover:shadow-medium transition-shadow cursor-pointer group h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`flex items-center justify-center h-8 w-8 rounded-md ${colorClass}`}
                      >
                        {icon}
                      </div>
                      <CardTitle className="text-sm group-hover:text-primary transition-colors">
                        {area.title}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-xs line-clamp-2">
                      {area.description}
                    </CardDescription>
                  </CardContent>
                  <CardFooter className="pt-0 text-[10px] text-muted-foreground">
                    {area.published_count} module{area.published_count !== 1 ? "s" : ""} available
                  </CardFooter>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Sign up CTA */}
      <section className="text-center py-6">
        <p className="text-sm text-muted-foreground mb-4">
          Ready to start building?
        </p>
        <div className="flex gap-3 justify-center">
          <Link to="/signup">
            <Button variant="default" size="lg">
              Get Started
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="outline" size="lg">
              Log In
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
