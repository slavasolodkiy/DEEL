import { Link } from "wouter";
import { 
  useGetDashboardSummary, 
  useGetPayrollTimeline, 
  useGetWorkersByCountry,
  useGetRecentActivity,
  useGetComplianceOverview,
  getGetDashboardSummaryQueryKey,
  getGetPayrollTimelineQueryKey,
  getGetWorkersByCountryQueryKey,
  getGetRecentActivityQueryKey,
  getGetComplianceOverviewQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency, formatCompactNumber } from "@/lib/format";
import { Users, FileSignature, CreditCard, ShieldAlert, Globe, Activity, TrendingUp } from "lucide-react";
import { 
  Bar, 
  BarChart, 
  Line, 
  LineChart, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis,
  CartesianGrid,
  Area,
  AreaChart
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  isLoading 
}: { 
  title: string; 
  value: React.ReactNode; 
  subtitle?: React.ReactNode;
  icon: React.ElementType;
  isLoading: boolean;
}) {
  return (
    <Card className="rounded-none border-border/50 shadow-sm relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700" />
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-6 pt-6">
        <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{title}</CardTitle>
        <Icon className="w-4 h-4 text-primary" />
      </CardHeader>
      <CardContent className="px-6 pb-6">
        {isLoading ? (
          <Skeleton className="h-8 w-24 mb-1" />
        ) : (
          <div className="text-3xl font-bold tracking-tight">{value}</div>
        )}
        {subtitle && (
          isLoading ? (
            <Skeleton className="h-4 w-32 mt-2" />
          ) : (
            <p className="text-xs text-muted-foreground mt-1 font-medium">{subtitle}</p>
          )
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary({
    query: { queryKey: getGetDashboardSummaryQueryKey() }
  });

  const { data: timeline, isLoading: isLoadingTimeline } = useGetPayrollTimeline({
    query: { queryKey: getGetPayrollTimelineQueryKey() }
  });

  const { data: countries, isLoading: isLoadingCountries } = useGetWorkersByCountry({
    query: { queryKey: getGetWorkersByCountryQueryKey() }
  });

  const { data: activity, isLoading: isLoadingActivity } = useGetRecentActivity({
    query: { queryKey: getGetRecentActivityQueryKey() }
  });

  const { data: compliance, isLoading: isLoadingCompliance } = useGetComplianceOverview({
    query: { queryKey: getGetComplianceOverviewQueryKey() }
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Top Metrics Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard 
          title="Total Workforce" 
          value={summary?.totalWorkers || 0}
          subtitle={<span className="text-emerald-500 flex items-center gap-1"><TrendingUp className="w-3 h-3"/> {summary?.activeWorkers} active</span>}
          icon={Users}
          isLoading={isLoadingSummary}
        />
        <MetricCard 
          title="Monthly Payroll" 
          value={summary ? formatCurrency(summary.totalPayrollThisMonth) : "$0"}
          subtitle={<span className="text-amber-500">{summary?.pendingPayments || 0} pending runs</span>}
          icon={CreditCard}
          isLoading={isLoadingSummary}
        />
        <MetricCard 
          title="Active Contracts" 
          value={summary?.activeContracts || 0}
          subtitle={`Out of ${summary?.totalContracts || 0} total`}
          icon={FileSignature}
          isLoading={isLoadingSummary}
        />
        <MetricCard 
          title="Compliance Risk" 
          value={summary?.complianceAlerts || 0}
          subtitle={summary?.complianceAlerts === 0 ? <span className="text-emerald-500">All clear</span> : <span className="text-destructive">Action required</span>}
          icon={ShieldAlert}
          isLoading={isLoadingSummary}
        />
      </div>

      <div className="grid gap-8 grid-cols-1 lg:grid-cols-7">
        
        {/* Main Chart Area */}
        <Card className="lg:col-span-4 rounded-none border-border/50 shadow-sm">
          <CardHeader className="px-6 py-6 border-b border-border/50 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg uppercase tracking-wide">Payroll Trajectory</CardTitle>
              <CardDescription className="font-mono text-xs mt-1">6-month historical & projected</CardDescription>
            </div>
            <Badge variant="outline" className="rounded-none uppercase tracking-widest text-[10px] font-mono border-primary/20 bg-primary/5 text-primary">Live Data</Badge>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[350px] w-full">
              {isLoadingTimeline ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Activity className="w-8 h-8 text-primary/20 animate-pulse" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeline || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(value) => `$${formatCompactNumber(value)}`}
                      width={60}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: 0, border: '1px solid hsl(var(--border))' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                      labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '8px' }}
                      formatter={(value: number) => [formatCurrency(value), "Payroll"]}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="totalAmount" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorAmount)" 
                      activeDot={{ r: 6, fill: "hsl(var(--primary))", stroke: "hsl(var(--background))", strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Global Distribution */}
        <Card className="lg:col-span-3 rounded-none border-border/50 shadow-sm">
          <CardHeader className="px-6 py-6 border-b border-border/50">
            <CardTitle className="text-lg uppercase tracking-wide">Global Distribution</CardTitle>
            <CardDescription className="font-mono text-xs mt-1">Workforce by jurisdiction</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[350px] w-full">
              {isLoadingCountries ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Activity className="w-8 h-8 text-primary/20 animate-pulse" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={countries || []} layout="vertical" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="country" 
                      type="category" 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fontSize: 12, fill: 'hsl(var(--foreground))', fontWeight: 500 }}
                      width={100}
                    />
                    <Tooltip 
                      cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: 0, border: '1px solid hsl(var(--border))' }}
                      formatter={(value: number) => [value, "Workers"]}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="hsl(var(--primary))" 
                      radius={[0, 4, 4, 0]}
                      barSize={24}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 grid-cols-1 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card className="rounded-none border-border/50 shadow-sm">
          <CardHeader className="px-6 py-6 border-b border-border/50 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg uppercase tracking-wide">Audit Trail</CardTitle>
              <CardDescription className="font-mono text-xs mt-1">Live system activity</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingActivity ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex items-start gap-4">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activity && activity.length > 0 ? (
              <div className="divide-y divide-border/50 max-h-[400px] overflow-auto">
                {activity.map((item) => (
                  <div key={item.id} className="p-4 hover:bg-muted/30 transition-colors flex items-start gap-4">
                    <div className="w-2 h-2 mt-2 rounded-full bg-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{item.description}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground font-mono">
                        <span>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {item.workerName && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-border" />
                            <span>{item.workerName}</span>
                          </>
                        )}
                        {item.country && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-border" />
                            <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {item.country}</span>
                          </>
                        )}
                        {item.amount && item.currency && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-border" />
                            <span className="text-foreground font-semibold">{formatCurrency(item.amount, item.currency)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center text-muted-foreground font-mono text-sm">
                No recent activity logged.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Compliance Overview */}
        <Card className="rounded-none border-border/50 shadow-sm flex flex-col">
          <CardHeader className="px-6 py-6 border-b border-border/50">
            <CardTitle className="text-lg uppercase tracking-wide">Compliance Radar</CardTitle>
            <CardDescription className="font-mono text-xs mt-1">Document verification status</CardDescription>
          </CardHeader>
          <CardContent className="p-6 flex-1 flex flex-col justify-center">
            {isLoadingCompliance ? (
              <div className="flex items-center justify-center h-full">
                <Activity className="w-8 h-8 text-primary/20 animate-pulse" />
              </div>
            ) : compliance ? (
              <div className="space-y-8">
                <div className="flex items-end justify-between border-b border-border/50 pb-6">
                  <div>
                    <div className="text-5xl font-bold tracking-tight text-emerald-500">
                      {Math.round((compliance.approved / (compliance.total || 1)) * 100)}%
                    </div>
                    <div className="text-sm font-mono text-muted-foreground mt-2 uppercase tracking-widest">Verification Rate</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold tracking-tight text-destructive">
                      {compliance.expired + compliance.rejected}
                    </div>
                    <div className="text-sm font-mono text-muted-foreground mt-2 uppercase tracking-widest">Critical Issues</div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-500 rounded-sm"/> Approved</span>
                    <span className="font-mono font-medium">{compliance.approved}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2"><div className="w-3 h-3 bg-amber-500 rounded-sm"/> In Review</span>
                    <span className="font-mono font-medium">{compliance.inReview}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2"><div className="w-3 h-3 bg-muted-foreground rounded-sm"/> Pending Submission</span>
                    <span className="font-mono font-medium">{compliance.pending}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2"><div className="w-3 h-3 bg-destructive rounded-sm"/> Expired / Rejected</span>
                    <span className="font-mono font-medium">{compliance.expired + compliance.rejected}</span>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Link href="/compliance" className="w-full inline-flex justify-center items-center h-10 px-4 bg-secondary text-secondary-foreground hover:bg-secondary/80 font-medium text-sm transition-colors uppercase tracking-widest" data-testid="btn-view-compliance">
                    Resolve Issues
                  </Link>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
