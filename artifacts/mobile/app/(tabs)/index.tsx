import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/AuthContext";
import { Platform } from "react-native";

interface DashboardSummary {
  totalWorkers: number;
  activeWorkers: number;
  onboardingWorkers: number;
  pendingPayments: number;
  totalPayrollThisMonth: number;
  complianceAlerts: number;
  unreadNotifications: number;
  countriesCount: number;
}

interface ActivityItem {
  id: number;
  type: string;
  description: string;
  workerName: string | null;
  country: string | null;
  amount: number | null;
  currency: string | null;
  createdAt: string;
}

function useDomain() {
  return process.env["EXPO_PUBLIC_DOMAIN"] ?? "";
}

function useApiUrl(path: string) {
  const domain = useDomain();
  return `https://${domain}${path}`;
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, token } = useAuth();
  const domain = useDomain();

  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const { data: summary, isLoading: summaryLoading } = useQuery<DashboardSummary>({
    queryKey: ["dashboard-summary"],
    queryFn: async () => {
      const r = await fetch(`https://${domain}/api/dashboard/summary`, { headers });
      return r.json() as Promise<DashboardSummary>;
    },
  });

  const { data: activity, isLoading: activityLoading } = useQuery<ActivityItem[]>({
    queryKey: ["recent-activity"],
    queryFn: async () => {
      const r = await fetch(`https://${domain}/api/dashboard/recent-activity`, { headers });
      return r.json() as Promise<ActivityItem[]>;
    },
  });

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const s = makeStyles(colors, topPad);

  const metrics = [
    { label: "Workers", value: summary?.totalWorkers ?? "–", icon: "users", color: colors.primary },
    { label: "Active", value: summary?.activeWorkers ?? "–", icon: "user-check", color: colors.success },
    { label: "Payroll MTD", value: summary ? `$${Math.round(Number(summary.totalPayrollThisMonth ?? 0)).toLocaleString()}` : "–", icon: "dollar-sign", color: colors.info },
    { label: "Compliance", value: summary?.complianceAlerts ?? "–", icon: "shield", color: colors.warning },
  ];

  function getActivityIcon(type: string) {
    const icons: Record<string, string> = {
      contract: "file-text",
      payment: "credit-card",
      onboarding: "user-plus",
      compliance: "shield",
      worker: "users",
    };
    return (icons[type] ?? "activity") as React.ComponentProps<typeof Feather>["name"];
  }

  function timeAgo(ts: string) {
    const t = new Date(ts).getTime();
    if (isNaN(t)) return "recently";
    const diff = Date.now() - t;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <View style={s.titleRow}>
        <View>
          <Text style={s.greeting}>Good morning</Text>
          <Text style={s.name}>{user?.email?.split("@")[0] ?? "Admin"}</Text>
        </View>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{(user?.email?.[0] ?? "A").toUpperCase()}</Text>
        </View>
      </View>

      {summaryLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: 24 }} />
      ) : (
        <View style={s.metricsGrid}>
          {metrics.map((m) => (
            <View key={m.label} style={s.metricCard}>
              <View style={[s.metricIcon, { backgroundColor: `${m.color}18` }]}>
                <Feather name={m.icon as React.ComponentProps<typeof Feather>["name"]} size={18} color={m.color} />
              </View>
              <Text style={s.metricValue}>{m.value}</Text>
              <Text style={s.metricLabel}>{m.label}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={s.section}>
        <Text style={s.sectionTitle}>Recent Activity</Text>
        {activityLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : activity && activity.length > 0 ? (
          activity.slice(0, 8).map((item) => (
            <View key={item.id} style={s.activityItem}>
              <View style={s.activityIcon}>
                <Feather name={getActivityIcon(item.type)} size={16} color={colors.primary} />
              </View>
              <View style={s.activityBody}>
                <Text style={s.activityDesc} numberOfLines={2}>
                  {item.description}{item.workerName ? ` — ${item.workerName}` : ""}
                </Text>
                <Text style={s.activityTime}>{timeAgo(item.createdAt)}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={s.empty}>No recent activity</Text>
        )}
      </View>
    </ScrollView>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>, topPad: number) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: 20, paddingTop: topPad + 16, paddingBottom: 100 },
    titleRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 24,
    },
    greeting: { fontSize: 13, color: colors.mutedForeground },
    name: { fontSize: 22, fontWeight: "700" as const, color: colors.foreground },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: { fontSize: 16, fontWeight: "600" as const, color: colors.primaryForeground },
    metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 28 },
    metricCard: {
      flex: 1,
      minWidth: "45%",
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    metricIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 10 },
    metricValue: { fontSize: 22, fontWeight: "700" as const, color: colors.foreground },
    metricLabel: { fontSize: 12, color: colors.mutedForeground, marginTop: 2 },
    section: { gap: 12 },
    sectionTitle: { fontSize: 17, fontWeight: "600" as const, color: colors.foreground, marginBottom: 4 },
    activityItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    activityIcon: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: `${colors.primary}15`,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    activityBody: { flex: 1 },
    activityDesc: { fontSize: 13, color: colors.foreground, lineHeight: 18 },
    activityTime: { fontSize: 11, color: colors.mutedForeground, marginTop: 3 },
    statusDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
    empty: { fontSize: 14, color: colors.mutedForeground, textAlign: "center", paddingVertical: 24 },
  });
}
