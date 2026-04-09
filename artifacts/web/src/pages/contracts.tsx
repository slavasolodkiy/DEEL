import { useState } from "react";
import { Link } from "wouter";
import {
  useListContracts,
  getListContractsQueryKey,
  useSignContract,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, FileSignature } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20",
  pending_signature: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  active: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  expired: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  terminated: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
};

export default function Contracts() {
  const [statusFilter, setStatusFilter] = useState("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: contracts, isLoading } = useListContracts(
    statusFilter !== "all" ? { status: statusFilter as "draft" | "pending_signature" | "active" | "expired" | "terminated" } : undefined,
    { query: { queryKey: getListContractsQueryKey(statusFilter !== "all" ? { status: statusFilter as "draft" | "pending_signature" | "active" | "expired" | "terminated" } : undefined) } }
  );

  const signContract = useSignContract({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListContractsQueryKey() });
        toast({ title: "Contract signed", description: "Contract is now active" });
      },
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Contracts</h2>
          <p className="text-muted-foreground text-sm mt-1">{contracts?.length ?? 0} total contracts</p>
        </div>
        <Button asChild className="rounded-none gap-2" data-testid="button-new-contract">
          <Link href="/contracts/new"><Plus className="size-4" />New Contract</Link>
        </Button>
      </div>

      <div className="flex gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44 rounded-none" data-testid="select-status-filter">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="rounded-none">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="pending_signature">Pending Signature</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="terminated">Terminated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-none" />)}
        </div>
      ) : contracts?.length === 0 ? (
        <Card className="rounded-none border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <FileSignature className="size-8 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">No contracts found</p>
            <Button asChild variant="outline" className="rounded-none" data-testid="button-new-first-contract">
              <Link href="/contracts/new">Create first contract</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {contracts?.map(c => (
            <Card key={c.id} className="rounded-none border-border/50 hover:border-primary/30 transition-colors group" data-testid={`card-contract-${c.id}`}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0 grid grid-cols-4 gap-4 items-center">
                  <div className="min-w-0 col-span-2">
                    <p className="font-semibold truncate">{c.title}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs text-muted-foreground font-mono capitalize">{c.contractType.replace(/_/g, " ")}</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">Worker #{c.workerId}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-mono font-medium">{formatCurrency(c.compensation, c.currency)}<span className="text-muted-foreground text-xs">/{c.compensationPeriod}</span></p>
                    <p className="text-xs text-muted-foreground">Started {formatDate(c.startDate)}</p>
                  </div>
                  <div className="flex items-center gap-3 justify-end">
                    <Badge variant="outline" className={`rounded-none border text-xs font-mono ${STATUS_COLORS[c.status]}`}>
                      {c.status.replace(/_/g, " ")}
                    </Badge>
                    {c.status === "pending_signature" && (
                      <Button
                        size="sm"
                        className="rounded-none"
                        onClick={() => signContract.mutate({ id: c.id })}
                        disabled={signContract.isPending}
                        data-testid={`button-sign-contract-${c.id}`}
                      >
                        Sign
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
