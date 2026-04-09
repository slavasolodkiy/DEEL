import { useParams, Link } from "wouter";
import {
  useGetWorker,
  getGetWorkerQueryKey,
  useListContracts,
  getListContractsQueryKey,
  useListPayments,
  getListPaymentsQueryKey,
  useListOnboardingTasks,
  getListOnboardingTasksQueryKey,
  useListComplianceItems,
  getListComplianceItemsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Globe, Mail, Briefcase, Calendar } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  inactive: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20",
  onboarding: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  terminated: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  pending: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  pending_signature: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  completed: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  in_progress: "bg-primary/10 text-primary border-primary/20",
  approved: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  rejected: "bg-red-500/10 text-red-700 border-red-500/20",
  in_review: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  expired: "bg-red-500/10 text-red-700 border-red-500/20",
  failed: "bg-red-500/10 text-red-700 border-red-500/20",
  processing: "bg-blue-500/10 text-blue-700 border-blue-500/20",
};

export default function WorkerDetail() {
  const { id } = useParams();
  const workerId = Number(id);

  const { data: worker, isLoading } = useGetWorker(workerId, {
    query: { enabled: !!workerId, queryKey: getGetWorkerQueryKey(workerId) }
  });
  const { data: contracts } = useListContracts(
    { workerId },
    { query: { queryKey: getListContractsQueryKey({ workerId }) } }
  );
  const { data: payments } = useListPayments(
    { workerId },
    { query: { queryKey: getListPaymentsQueryKey({ workerId }) } }
  );
  const { data: tasks } = useListOnboardingTasks(
    { workerId },
    { query: { queryKey: getListOnboardingTasksQueryKey({ workerId }) } }
  );
  const { data: compliance } = useListComplianceItems(
    { workerId },
    { query: { queryKey: getListComplianceItemsQueryKey({ workerId }) } }
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 rounded-none" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-60 rounded-none" />
          <Skeleton className="h-60 rounded-none" />
        </div>
      </div>
    );
  }

  if (!worker) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <p className="text-muted-foreground">Worker not found</p>
      <Button asChild variant="outline" className="rounded-none"><Link href="/workers">Back to Workers</Link></Button>
    </div>
  );

  const completedTasks = tasks?.filter(t => t.status === "completed").length ?? 0;
  const totalTasks = tasks?.length ?? 0;
  const onboardingPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" className="rounded-none -ml-2 text-muted-foreground" data-testid="button-back">
        <Link href="/workers"><ArrowLeft className="size-4 mr-2" />Back to Workers</Link>
      </Button>

      <Card className="rounded-none border-border/50">
        <CardContent className="p-6 flex items-start gap-6">
          <Avatar className="size-16 rounded-none shrink-0">
            <AvatarFallback className="rounded-none bg-primary/10 text-primary text-xl font-bold">
              {worker.firstName[0]}{worker.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold" data-testid="text-worker-name">{worker.firstName} {worker.lastName}</h2>
                <p className="text-muted-foreground">{worker.jobTitle} · {worker.department}</p>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className={`rounded-none border font-mono text-xs ${STATUS_COLORS[worker.status]}`}>{worker.status}</Badge>
                <Badge variant="outline" className="rounded-none border font-mono text-xs uppercase">{worker.workerType}</Badge>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="size-4" />
                <span className="truncate">{worker.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Globe className="size-4" />
                <span>{worker.country} · {worker.currency}</span>
              </div>
              {worker.salary && (
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Briefcase className="size-4 text-muted-foreground" />
                  <span>{formatCurrency(worker.salary, worker.currency)}/yr</span>
                </div>
              )}
              {worker.startDate && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="size-4" />
                  <span>Started {formatDate(worker.startDate)}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card className="rounded-none border-border/50">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground">Contracts</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {contracts?.length === 0 ? <p className="text-sm text-muted-foreground">No contracts</p> : null}
            {contracts?.map(c => (
              <div key={c.id} className="flex items-center justify-between p-3 border border-border/50 bg-muted/20" data-testid={`card-contract-${c.id}`}>
                <div>
                  <p className="text-sm font-medium">{c.title}</p>
                  <p className="text-xs text-muted-foreground font-mono">{c.contractType} · {c.compensationPeriod}</p>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className={`rounded-none border text-xs font-mono ${STATUS_COLORS[c.status]}`}>{c.status}</Badge>
                  <p className="text-xs text-muted-foreground mt-1">{formatCurrency(c.compensation, c.currency)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-none border-border/50">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground">Recent Payments</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {payments?.length === 0 ? <p className="text-sm text-muted-foreground">No payments</p> : null}
            {payments?.slice(0, 4).map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 border border-border/50 bg-muted/20" data-testid={`card-payment-${p.id}`}>
                <div>
                  <p className="text-sm font-medium capitalize">{p.paymentType}</p>
                  <p className="text-xs text-muted-foreground">{p.periodStart ? formatDate(p.periodStart) : "—"}</p>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className={`rounded-none border text-xs font-mono ${STATUS_COLORS[p.status]}`}>{p.status}</Badge>
                  <p className="text-xs font-mono mt-1">{formatCurrency(p.amount, p.currency)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {totalTasks > 0 && (
          <Card className="rounded-none border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground">Onboarding</CardTitle>
                <span className="text-xs font-mono text-muted-foreground">{onboardingPct}% complete</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Progress value={onboardingPct} className="h-1.5 rounded-none" />
              {tasks?.slice(0, 4).map(t => (
                <div key={t.id} className="flex items-center gap-3 p-2" data-testid={`card-task-${t.id}`}>
                  <div className={`size-2 rounded-none shrink-0 ${t.status === "completed" ? "bg-emerald-500" : t.status === "in_progress" ? "bg-amber-500" : "bg-border"}`} />
                  <span className="text-sm">{t.title}</span>
                  <Badge variant="outline" className={`rounded-none border text-xs font-mono ml-auto ${STATUS_COLORS[t.status]}`}>{t.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {(compliance?.length ?? 0) > 0 && (
          <Card className="rounded-none border-border/50">
            <CardHeader className="pb-3"><CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground">Compliance Documents</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {compliance?.map(c => (
                <div key={c.id} className="flex items-center justify-between p-3 border border-border/50 bg-muted/20" data-testid={`card-compliance-${c.id}`}>
                  <div>
                    <p className="text-sm font-medium capitalize">{c.documentType.replace(/_/g, " ")}</p>
                    <p className="text-xs text-muted-foreground">{c.country}{c.expiresAt ? ` · Expires ${formatDate(c.expiresAt)}` : ""}</p>
                  </div>
                  <Badge variant="outline" className={`rounded-none border text-xs font-mono ${STATUS_COLORS[c.status]}`}>{c.status.replace(/_/g, " ")}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
