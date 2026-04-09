import { useState } from "react";
import {
  useListPayments,
  getListPaymentsQueryKey,
  useApprovePayment,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard, CheckCircle } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  processing: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  completed: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  failed: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
};

const TYPE_COLORS: Record<string, string> = {
  salary: "bg-primary/10 text-primary border-primary/20",
  bonus: "bg-purple-500/10 text-purple-700 border-purple-500/20",
  expense: "bg-zinc-500/10 text-zinc-600 border-zinc-500/20",
  invoice: "bg-blue-500/10 text-blue-700 border-blue-500/20",
};

export default function Payments() {
  const [statusFilter, setStatusFilter] = useState("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: payments, isLoading } = useListPayments(
    statusFilter !== "all" ? { status: statusFilter as "pending" | "processing" | "completed" | "failed" } : undefined,
    { query: { queryKey: getListPaymentsQueryKey(statusFilter !== "all" ? { status: statusFilter as "pending" | "processing" | "completed" | "failed" } : undefined) } }
  );

  const approve = useApprovePayment({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPaymentsQueryKey() });
        toast({ title: "Payment approved", description: "Payment is now processing" });
      },
    }
  });

  const pendingCount = payments?.filter(p => p.status === "pending").length ?? 0;
  const totalPending = payments?.filter(p => p.status === "pending").reduce((acc, p) => acc + p.amount, 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Payroll Runs</h2>
          {pendingCount > 0 && (
            <p className="text-muted-foreground text-sm mt-1">{pendingCount} payments pending approval</p>
          )}
        </div>
        {pendingCount > 0 && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground font-mono">Pending total</p>
            <p className="text-lg font-bold font-mono text-amber-600">~{formatCurrency(totalPending, "USD")}</p>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 rounded-none" data-testid="select-status-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-none">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-none" />)}
        </div>
      ) : payments?.length === 0 ? (
        <Card className="rounded-none border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <CreditCard className="size-8 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">No payments found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {payments?.map(p => (
            <Card key={p.id} className="rounded-none border-border/50 hover:border-primary/30 transition-colors" data-testid={`card-payment-${p.id}`}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0 grid grid-cols-4 gap-4 items-center">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm">Worker #{p.workerId}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.periodStart && p.periodEnd ? `${formatDate(p.periodStart)} – ${formatDate(p.periodEnd)}` : "One-time"}
                    </p>
                  </div>
                  <div>
                    <Badge variant="outline" className={`rounded-none border text-xs font-mono capitalize ${TYPE_COLORS[p.paymentType]}`}>{p.paymentType}</Badge>
                  </div>
                  <div>
                    <p className="text-base font-mono font-bold">{formatCurrency(p.amount, p.currency)}</p>
                    <p className="text-xs text-muted-foreground">{p.currency}</p>
                  </div>
                  <div className="flex items-center gap-3 justify-end">
                    <Badge variant="outline" className={`rounded-none border text-xs font-mono ${STATUS_COLORS[p.status]}`}>{p.status}</Badge>
                    {p.status === "pending" && (
                      <Button
                        size="sm"
                        className="rounded-none gap-1"
                        onClick={() => approve.mutate({ id: p.id })}
                        disabled={approve.isPending}
                        data-testid={`button-approve-payment-${p.id}`}
                      >
                        <CheckCircle className="size-3.5" />
                        Approve
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
