import {
  useListNotifications,
  getListNotificationsQueryKey,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, CheckCheck, FileSignature, CreditCard, ShieldCheck, ClipboardList, Info } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";

const TYPE_ICONS: Record<string, React.ElementType> = {
  contract: FileSignature,
  payment: CreditCard,
  compliance: ShieldCheck,
  onboarding: ClipboardList,
  general: Info,
};

const TYPE_COLORS: Record<string, string> = {
  contract: "text-primary",
  payment: "text-emerald-600 dark:text-emerald-400",
  compliance: "text-red-600 dark:text-red-400",
  onboarding: "text-amber-600 dark:text-amber-400",
  general: "text-muted-foreground",
};

export default function Notifications() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: notifications, isLoading } = useListNotifications(
    {},
    { query: { queryKey: getListNotificationsQueryKey() } }
  );

  const markRead = useMarkNotificationRead({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
      },
    }
  });

  const markAllRead = useMarkAllNotificationsRead({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
        toast({ title: "All notifications marked as read" });
      },
    }
  });

  const unread = notifications?.filter(n => !n.isRead).length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Notifications</h2>
          {unread > 0 && <p className="text-muted-foreground text-sm mt-1">{unread} unread</p>}
        </div>
        {unread > 0 && (
          <Button
            variant="outline"
            className="rounded-none gap-2"
            onClick={() => markAllRead.mutate(undefined)}
            disabled={markAllRead.isPending}
            data-testid="button-mark-all-read"
          >
            <CheckCheck className="size-4" />
            Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-none" />)}
        </div>
      ) : notifications?.length === 0 ? (
        <Card className="rounded-none border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <Bell className="size-8 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">No notifications</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications?.map(n => {
            const Icon = TYPE_ICONS[n.type] ?? Info;
            return (
              <Card
                key={n.id}
                className={`rounded-none border-border/50 transition-colors ${!n.isRead ? "bg-primary/5 border-primary/20" : "hover:border-border"}`}
                data-testid={`card-notification-${n.id}`}
              >
                <CardContent className="p-4 flex items-start gap-4">
                  <div className={`shrink-0 mt-0.5 ${TYPE_COLORS[n.type]}`}>
                    <Icon className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className={`text-sm font-semibold ${!n.isRead ? "text-foreground" : "text-muted-foreground"}`}>{n.title}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {!n.isRead && (
                          <div className="size-1.5 rounded-full bg-primary shrink-0" />
                        )}
                        <Badge variant="outline" className="rounded-none text-xs font-mono capitalize border-border/50">
                          {n.type}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-muted-foreground font-mono">{formatDateTime(n.createdAt)}</p>
                      {!n.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs rounded-none text-muted-foreground hover:text-foreground"
                          onClick={() => markRead.mutate({ id: n.id })}
                          disabled={markRead.isPending}
                          data-testid={`button-mark-read-${n.id}`}
                        >
                          Mark read
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
