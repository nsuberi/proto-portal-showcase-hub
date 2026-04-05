import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  CategoryBadge, Button, ResumeLearningCard, StudyPlanBanner,
  FeatureDiscoveryCard,
} from "@proto-portal/ui-components";
import { BookOpen, Users, Trophy, Zap } from "lucide-react";
import { modulesApi } from "@/api/client";
import { useAuth } from "@/hooks/use-auth";

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["modules"],
    queryFn: modulesApi.list,
  });

  return (
    <div className="space-y-8">
      {/* Resume learning (if authenticated) */}
      {isAuthenticated && (
        <ResumeLearningCard
          categoryLabel="Module"
          title="Continue your learning journey"
          subtitle="Pick up where you left off"
          progress={25}
          actions={{
            resume: () => {},
          }}
        />
      )}

      {/* Module grid */}
      <section>
        <h2 className="text-xl font-bold mb-4">Start Learning</h2>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading modules...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.modules.map((module) => (
              <Link key={module.id} to={`/modules/${module.id}`}>
                <Card className="h-full hover:shadow-medium transition-shadow cursor-pointer">
                  <CardHeader>
                    <CategoryBadge variant="highlight">Module</CategoryBadge>
                    <CardTitle className="text-lg mt-2">{module.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {module.description}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="text-xs text-muted-foreground">
                    {module.goal_count} goal{module.goal_count !== 1 ? "s" : ""}
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Feature discovery */}
      {isAuthenticated && (
        <section>
          <h2 className="text-xl font-bold mb-4">Discover</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FeatureDiscoveryCard
              icon={<Zap className="h-5 w-5" />}
              title="AI-Powered Planning"
              description="Plan your approach with a Digi-Trainer before writing code."
            />
            <FeatureDiscoveryCard
              icon={<Users className="h-5 w-5" />}
              title="Community Sessions"
              description="Join live coding sessions and present your work to peers."
            />
            <FeatureDiscoveryCard
              icon={<BookOpen className="h-5 w-5" />}
              title="Socratic Dialogue"
              description="Deepen understanding through guided conversation about your code."
            />
            <FeatureDiscoveryCard
              icon={<Trophy className="h-5 w-5" />}
              title="Earn Gems"
              description="Track mastery across topics and earn certification gems."
            />
          </div>
        </section>
      )}

      {/* Study plan CTA */}
      {isAuthenticated && (
        <StudyPlanBanner onAction={() => {}} />
      )}

      {/* Non-authenticated hero */}
      {!isAuthenticated && (
        <section className="text-center py-12">
          <h1 className="text-3xl font-bold mb-3">Develop your skills</h1>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Build real projects, get AI-powered feedback, and earn mastery through guided practice.
          </p>
          <div className="flex gap-3 justify-center">
            <Link to="/signup">
              <Button variant="default" size="lg">Get Started</Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg">Log In</Button>
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
