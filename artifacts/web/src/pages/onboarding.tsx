import { useState } from "react";
import {
  useListOnboardingTasks,
  getListOnboardingTasksQueryKey,
  useUpdateOnboardingTask,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList, CheckCircle2, Circle, Clock } from "lucide-react";
import { formatDate } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20",
  in_progress: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  completed: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  skipped: "bg-zinc-400/10 text-zinc-500 border-zinc-400/20",
};

const CATEGORY_COLORS: Record<string, string> = {
  documents: "text-blue-600 dark:text-blue-400",
  equipment: "text-purple-600 dark:text-purple-400",
  access: "text-primary",
  training: "text-amber-600 dark:text-amber-400",
  compliance: "text-red-600 dark:text-red-400",
  introduction: "text-emerald-600 dark:text-emerald-400",
  other: "text-muted-foreground",
};

export default function Onboarding() {
  const [statusFilter, setStatusFilter] = useState("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: tasks, isLoading } = useListOnboardingTasks(
    statusFilter !== "all" ? { status: statusFilter as "pending" | "in_progress" | "completed" | "skipped" } : {},
    { query: { queryKey: getListOnboardingTasksQueryKey(statusFilter !== "all" ? { status: statusFilter } : {}) } }
  );

  const updateTask = useUpdateOnboardingTask({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListOnboardingTasksQueryKey() });
        toast({ title: "Task updated" });
      },
    }
  });

  const completed = tasks?.filter(t => t.status === "completed").length ?? 0;
  const total = tasks?.length ?? 0;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Group by worker
  const byWorker = tasks?.reduce<Record<number, typeof tasks>>((acc, t) => {
    if (!acc[t.workerId]) acc[t.workerId] = [];
    acc[t.workerId].push(t);
    return acc;
  }, {}) ?? {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Onboarding Flow</h2>
          <p className="text-muted-foreground text-sm mt-1">{completed}/{total} tasks completed</p>
        </div>
        <div className="text-right">
          <div className="w-40">
            <Progress value={pct} className="h-2 rounded-none" />
            <p className="text-xs text-muted-foreground mt-1 font-mono">{pct}% overall</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 rounded-none" data-testid="select-status-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-none">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="skipped">Skipped</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-none" />)}
        </div>
      ) : Object.keys(byWorker).length === 0 ? (
        <Card className="rounded-none border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <ClipboardList className="size-8 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">No onboarding tasks found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(byWorker).map(([workerId, workerTasks]) => {
            const workerCompleted = workerTasks.filter(t => t.status === "completed").length;
            const workerPct = Math.round((workerCompleted / workerTasks.length) * 100);
            return (
              <Card key={workerId} className="rounded-none border-border/50" data-testid={`card-worker-onboarding-${workerId}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">
                      <span className="text-muted-foreground font-mono text-xs">Worker #{workerId}</span>
                    </CardTitle>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground font-mono">{workerCompleted}/{workerTasks.length}</span>
                      <div className="w-24">
                        <Progress value={workerPct} className="h-1.5 rounded-none" />
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {workerTasks.map(t => (
                    <div key={t.id} className="flex items-center gap-3 p-3 border border-border/40 bg-muted/20 group" data-testid={`card-task-${t.id}`}>
                      {t.status === "completed" ? (
                        <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                      ) : t.status === "in_progress" ? (
                        <Clock className="size-4 shrink-0 text-amber-500" />
                      ) : (
                        <Circle className="size-4 shrink-0 text-border" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{t.title}</p>
                        {t.description && <p className="text-xs text-muted-foreground">{t.description}</p>}
                        {t.dueDate && <p className="text-xs text-muted-foreground mt-0.5">Due {formatDate(t.dueDate)}</p>}
                      </div>
                      <Badge variant="outline" className={`rounded-none border text-xs font-mono capitalize shrink-0 ${STATUS_COLORS[t.status]}`}>
                        <span className={`mr-1.5 text-[10px] ${CATEGORY_COLORS[t.category]}`}>{t.category}</span>
                        {t.status.replace(/_/g, " ")}
                      </Badge>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1.5">
                        {t.status === "pending" && (
                          <Button size="sm" variant="outline" className="rounded-none h-7 text-xs"
                            onClick={() => updateTask.mutate({ id: t.id, data: { status: "in_progress" } })}
                            data-testid={`button-start-task-${t.id}`}>
                            Start
                          </Button>
                        )}
                        {t.status === "in_progress" && (
                          <Button size="sm" className="rounded-none h-7 text-xs"
                            onClick={() => updateTask.mutate({ id: t.id, data: { status: "completed" } })}
                            data-testid={`button-complete-task-${t.id}`}>
                            Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
