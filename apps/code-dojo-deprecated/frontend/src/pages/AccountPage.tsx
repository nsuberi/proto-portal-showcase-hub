import { useQuery } from "@tanstack/react-query";
import {
  Card, CardHeader, CardTitle, CardContent,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Badge, ResumeLearningCard, WeeklyTarget,
} from "@proto-portal/ui-components";
import { authApi } from "@/api/client";

export default function AccountPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["auth", "account"],
    queryFn: authApi.account,
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading...</p>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Account</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ResumeLearningCard
          categoryLabel="Module"
          title="Continue learning"
          subtitle="Pick up where you left off"
          progress={0}
          actions={{ resume: () => {} }}
        />
        <WeeklyTarget target={5} completed={0} editable />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          {data.submissions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No submissions yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Goal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.submissions.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.goal_title ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{s.status.replace(/_/g, " ")}</Badge>
                    </TableCell>
                    <TableCell>
                      {s.passed === true && <Badge variant="success">Passed</Badge>}
                      {s.passed === false && <Badge variant="destructive">Needs Work</Badge>}
                      {s.passed == null && <span className="text-muted-foreground text-xs">—</span>}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(s.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
