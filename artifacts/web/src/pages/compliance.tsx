import { useState } from "react";
import {
  useListComplianceItems,
  getListComplianceItemsQueryKey,
  useUpdateComplianceItem,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck, Globe, AlertTriangle } from "lucide-react";
import { formatDate } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  in_review: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  approved: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  rejected: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  expired: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
};

export default function Compliance() {
  const [statusFilter, setStatusFilter] = useState("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: items, isLoading } = useListComplianceItems(
    statusFilter !== "all" ? { status: statusFilter as "pending" | "in_review" | "approved" | "rejected" | "expired" } : {},
    { query: { queryKey: getListComplianceItemsQueryKey(statusFilter !== "all" ? { status: statusFilter } : {}) } }
  );

  const update = useUpdateComplianceItem({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListComplianceItemsQueryKey() });
        toast({ title: "Status updated" });
      },
    }
  });

  const alerts = items?.filter(i => ["pending", "expired", "rejected"].includes(i.status)).length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Compliance Tracker</h2>
          {alerts > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <AlertTriangle className="size-3.5 text-amber-500" />
              <p className="text-sm text-amber-600 dark:text-amber-400">{alerts} items require attention</p>
            </div>
          )}
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
            <SelectItem value="in_review">In Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-none" />)}
        </div>
      ) : items?.length === 0 ? (
        <Card className="rounded-none border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <ShieldCheck className="size-8 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">No compliance items found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {items?.map(item => (
            <Card key={item.id} className="rounded-none border-border/50 hover:border-primary/30 transition-colors" data-testid={`card-compliance-${item.id}`}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0 grid grid-cols-4 gap-4 items-center">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm capitalize">{item.documentType.replace(/_/g, " ")}</p>
                    <p className="text-xs text-muted-foreground">Worker #{item.workerId}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="size-3.5 text-muted-foreground" />
                    <span className="text-sm">{item.country}</span>
                  </div>
                  <div>
                    {item.expiresAt && (
                      <p className="text-sm text-muted-foreground">Expires {formatDate(item.expiresAt)}</p>
                    )}
                    {item.notes && <p className="text-xs text-muted-foreground truncate">{item.notes}</p>}
                  </div>
                  <div className="flex items-center gap-3 justify-end">
                    <Badge variant="outline" className={`rounded-none border text-xs font-mono ${STATUS_COLORS[item.status]}`}>
                      {item.status.replace(/_/g, " ")}
                    </Badge>
                    {item.status === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-none"
                        onClick={() => update.mutate({ id: item.id, data: { status: "in_review" } })}
                        disabled={update.isPending}
                        data-testid={`button-review-compliance-${item.id}`}
                      >
                        Start Review
                      </Button>
                    )}
                    {item.status === "in_review" && (
                      <Button
                        size="sm"
                        className="rounded-none"
                        onClick={() => update.mutate({ id: item.id, data: { status: "approved" } })}
                        disabled={update.isPending}
                        data-testid={`button-approve-compliance-${item.id}`}
                      >
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
