import React from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/AuthContext";

interface Payment {
  id: number;
  description: string | null;
  amount: string | number;
  currency: string;
  status: string;
  paymentDate: string | null;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { bg: string; color: string; icon: string }> = {
  completed: { bg: "#dcfce7", color: "#16a34a", icon: "check-circle" },
  pending: { bg: "#fef9c3", color: "#d97706", icon: "clock" },
  processing: { bg: "#dbeafe", color: "#2563eb", icon: "loader" },
  failed: { bg: "#fee2e2", color: "#dc2626", icon: "x-circle" },
};

export default function PaymentsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const domain = process.env["EXPO_PUBLIC_DOMAIN"] ?? "";
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const { data: payments, isLoading } = useQuery<Payment[]>({
    queryKey: ["payments"],
    queryFn: async () => {
      const r = await fetch(`https://${domain}/api/payments`, { headers });
      return r.json() as Promise<Payment[]>;
    },
  });

  const totalCompleted = payments
    ?.filter((p) => p.status === "completed")
    .reduce((s, p) => s + Number(p.amount), 0) ?? 0;

  const s = makeStyles(colors, topPad, insets.bottom);

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Text style={s.title}>Payments</Text>
      </View>

      <View style={s.summaryCard}>
        <Text style={s.summaryLabel}>Total Disbursed</Text>
        <Text style={s.summaryAmount}>${totalCompleted.toLocaleString()}</Text>
        <Text style={s.summaryMeta}>{payments?.filter((p) => p.status === "completed").length ?? 0} completed runs</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList<Payment>
          data={payments ?? []}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!!(payments && payments.length > 0)}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={
            <View style={s.emptyState}>
              <Feather name="credit-card" size={36} color={colors.mutedForeground} />
              <Text style={s.emptyText}>No payment runs yet</Text>
            </View>
          }
          renderItem={({ item }) => {
            const cfg = STATUS_CONFIG[item.status] ?? { bg: "#f3f4f6", color: "#6b7280", icon: "activity" };
            return (
              <View style={s.card}>
                <View style={[s.statusIcon, { backgroundColor: cfg.bg }]}>
                  <Feather name={cfg.icon as React.ComponentProps<typeof Feather>["name"]} size={18} color={cfg.color} />
                </View>
                <View style={s.info}>
                  <Text style={s.desc} numberOfLines={1}>
                    {item.description ?? `Payment #${item.id}`}
                  </Text>
                  <Text style={s.date}>
                    {item.paymentDate
                      ? new Date(item.paymentDate).toLocaleDateString()
                      : new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={s.right}>
                  <Text style={s.amount}>
                    {item.currency} {Number(item.amount).toLocaleString()}
                  </Text>
                  <View style={[s.badge, { backgroundColor: cfg.bg }]}>
                    <Text style={[s.badgeText, { color: cfg.color }]}>{item.status}</Text>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>, topPad: number, bottomPad: number) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingHorizontal: 20,
      paddingTop: topPad + 16,
      paddingBottom: 12,
    },
    title: { fontSize: 26, fontWeight: "700" as const, color: colors.foreground },
    summaryCard: {
      marginHorizontal: 20,
      marginBottom: 16,
      backgroundColor: colors.primary,
      borderRadius: 16,
      padding: 20,
    },
    summaryLabel: { fontSize: 12, color: `${colors.primaryForeground}99`, marginBottom: 4 },
    summaryAmount: { fontSize: 32, fontWeight: "700" as const, color: colors.primaryForeground, letterSpacing: -0.5 },
    summaryMeta: { fontSize: 12, color: `${colors.primaryForeground}99`, marginTop: 4 },
    list: { paddingHorizontal: 20, paddingBottom: bottomPad + 100 },
    card: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 12,
    },
    statusIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    info: { flex: 1 },
    desc: { fontSize: 14, fontWeight: "500" as const, color: colors.foreground },
    date: { fontSize: 12, color: colors.mutedForeground, marginTop: 2 },
    right: { alignItems: "flex-end", gap: 4 },
    amount: { fontSize: 14, fontWeight: "600" as const, color: colors.foreground },
    badge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
    badgeText: { fontSize: 10, fontWeight: "600" as const },
    emptyState: { alignItems: "center", gap: 12, paddingTop: 60 },
    emptyText: { fontSize: 14, color: colors.mutedForeground },
  });
}
