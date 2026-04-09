import { useState } from "react";
import { Link } from "wouter";
import {
  useListWorkers,
  getListWorkersQueryKey,
  useDeleteWorker,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Search, Globe, Briefcase } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  inactive: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20",
  onboarding: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  terminated: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
};

const TYPE_COLORS: Record<string, string> = {
  employee: "bg-primary/10 text-primary border-primary/20",
  contractor: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
  eor: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
};

export default function Workers() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: workers, isLoading } = useListWorkers(
    {
      ...(statusFilter !== "all" ? { status: statusFilter as "active" | "inactive" | "onboarding" | "terminated" } : {}),
      ...(typeFilter !== "all" ? { type: typeFilter as "employee" | "contractor" | "eor" } : {}),
    },
    {
      query: { queryKey: getListWorkersQueryKey({ status: statusFilter !== "all" ? statusFilter as "active" | "inactive" | "onboarding" | "terminated" : undefined, type: typeFilter !== "all" ? typeFilter as "employee" | "contractor" | "eor" : undefined }) }
    }
  );

  const deleteWorker = useDeleteWorker({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListWorkersQueryKey() });
        toast({ title: "Worker terminated" });
      },
    }
  });

  const filtered = workers?.filter(w =>
    search === "" ||
    `${w.firstName} ${w.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    w.email.toLowerCase().includes(search.toLowerCase()) ||
    w.jobTitle.toLowerCase().includes(search.toLowerCase()) ||
    w.country.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Worker Directory</h2>
          <p className="text-muted-foreground text-sm mt-1">{workers?.length ?? 0} workers across {new Set(workers?.map(w => w.country)).size} countries</p>
        </div>
        <Button asChild className="rounded-none gap-2" data-testid="button-add-worker">
          <Link href="/workers/new">
            <Plus className="size-4" />
            Add Worker
          </Link>
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search workers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-none"
            data-testid="input-search"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 rounded-none" data-testid="select-status-filter">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="rounded-none">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="onboarding">Onboarding</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="terminated">Terminated</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-36 rounded-none" data-testid="select-type-filter">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent className="rounded-none">
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="employee">Employee</SelectItem>
            <SelectItem value="contractor">Contractor</SelectItem>
            <SelectItem value="eor">EOR</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-none" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="rounded-none border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="size-12 rounded-none bg-muted flex items-center justify-center">
              <Briefcase className="size-5 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">No workers found</p>
            <Button asChild variant="outline" className="rounded-none" data-testid="button-add-first-worker">
              <Link href="/workers/new">Add your first worker</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((worker) => (
            <Card key={worker.id} className="rounded-none border-border/50 hover:border-primary/30 transition-colors group" data-testid={`card-worker-${worker.id}`}>
              <CardContent className="p-4 flex items-center gap-4">
                <Avatar className="size-10 rounded-none shrink-0">
                  <AvatarFallback className="rounded-none bg-primary/10 text-primary text-sm font-bold">
                    {worker.firstName[0]}{worker.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 grid grid-cols-4 gap-4 items-center">
                  <div className="min-w-0">
                    <Link href={`/workers/${worker.id}`} className="font-semibold hover:text-primary transition-colors truncate block" data-testid={`link-worker-${worker.id}`}>
                      {worker.firstName} {worker.lastName}
                    </Link>
                    <p className="text-xs text-muted-foreground truncate">{worker.email}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{worker.jobTitle}</p>
                    <p className="text-xs text-muted-foreground">{worker.department}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={`rounded-none text-xs px-2 py-0.5 border font-mono ${STATUS_COLORS[worker.status]}`}>
                      {worker.status}
                    </Badge>
                    <Badge variant="outline" className={`rounded-none text-xs px-2 py-0.5 border font-mono uppercase ${TYPE_COLORS[worker.workerType]}`}>
                      {worker.workerType}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                      <Globe className="size-3" />
                      <span>{worker.country}</span>
                    </div>
                    {worker.salary && (
                      <p className="text-sm font-mono font-medium">{formatCurrency(worker.salary, worker.currency)}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button asChild variant="outline" size="sm" className="rounded-none" data-testid={`button-view-worker-${worker.id}`}>
                    <Link href={`/workers/${worker.id}`}>View</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
