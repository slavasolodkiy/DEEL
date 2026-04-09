import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/AuthContext";

interface Worker {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  country: string;
  workerType: string;
  status: string;
  currency: string;
  salary: number | null;
}

const STATUS_COLORS: Record<string, string> = {
  active: "#16a34a",
  inactive: "#6b7280",
  onboarding: "#d97706",
  terminated: "#dc2626",
};

const TYPE_LABELS: Record<string, string> = {
  employee: "EMP",
  contractor: "CON",
  eor: "EOR",
};

export default function WorkersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const domain = process.env["EXPO_PUBLIC_DOMAIN"] ?? "";
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
  const [search, setSearch] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const { data: workers, isLoading } = useQuery<Worker[]>({
    queryKey: ["workers"],
    queryFn: async () => {
      const r = await fetch(`https://${domain}/api/workers`, { headers });
      return r.json() as Promise<Worker[]>;
    },
  });

  const filtered = workers?.filter((w) => {
    const q = search.toLowerCase();
    return (
      w.firstName.toLowerCase().includes(q) ||
      w.lastName.toLowerCase().includes(q) ||
      w.email.toLowerCase().includes(q) ||
      w.jobTitle.toLowerCase().includes(q)
    );
  });

  const s = makeStyles(colors, topPad, insets.bottom);

  function initials(w: Worker) {
    return `${w.firstName[0] ?? ""}${w.lastName[0] ?? ""}`.toUpperCase();
  }

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Text style={s.title}>Workers</Text>
        <Text style={s.count}>{workers?.length ?? 0} total</Text>
      </View>

      <View style={s.searchWrap}>
        <Feather name="search" size={16} color={colors.mutedForeground} />
        <TextInput
          style={s.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search workers..."
          placeholderTextColor={colors.mutedForeground}
          autoCorrect={false}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Feather name="x" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList<Worker>
          data={filtered ?? []}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!!(filtered && filtered.length > 0)}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={
            <View style={s.emptyState}>
              <Feather name="users" size={36} color={colors.mutedForeground} />
              <Text style={s.emptyText}>No workers found</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={s.card}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>{initials(item)}</Text>
              </View>
              <View style={s.info}>
                <View style={s.nameRow}>
                  <Text style={s.name}>{item.firstName} {item.lastName}</Text>
                  <View style={[s.typeBadge, { backgroundColor: `${colors.primary}18` }]}>
                    <Text style={[s.typeText, { color: colors.primary }]}>{TYPE_LABELS[item.workerType] ?? item.workerType}</Text>
                  </View>
                </View>
                <Text style={s.jobTitle}>{item.jobTitle}</Text>
                <View style={s.metaRow}>
                  <Feather name="map-pin" size={11} color={colors.mutedForeground} />
                  <Text style={s.meta}>{item.country}</Text>
                  <View style={[s.statusDot, { backgroundColor: STATUS_COLORS[item.status] ?? colors.mutedForeground }]} />
                  <Text style={[s.meta, { color: STATUS_COLORS[item.status] ?? colors.mutedForeground }]}>
                    {item.status}
                  </Text>
                </View>
              </View>
              {item.salary && (
                <View style={s.salaryWrap}>
                  <Text style={s.salary}>${Math.round(Number(item.salary) / 12).toLocaleString()}</Text>
                  <Text style={s.salaryPer}>/mo</Text>
                </View>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>, topPad: number, bottomPad: number) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
      paddingHorizontal: 20,
      paddingTop: topPad + 16,
      paddingBottom: 12,
    },
    title: { fontSize: 26, fontWeight: "700" as const, color: colors.foreground },
    count: { fontSize: 13, color: colors.mutedForeground },
    searchWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginHorizontal: 20,
      marginBottom: 14,
      paddingHorizontal: 14,
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      height: 44,
    },
    searchInput: { flex: 1, fontSize: 15, color: colors.foreground },
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
    avatar: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: { fontSize: 14, fontWeight: "700" as const, color: colors.primaryForeground },
    info: { flex: 1 },
    nameRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
    name: { fontSize: 14, fontWeight: "600" as const, color: colors.foreground, flex: 1 },
    typeBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
    typeText: { fontSize: 10, fontWeight: "700" as const },
    jobTitle: { fontSize: 12, color: colors.mutedForeground, marginBottom: 4 },
    metaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
    statusDot: { width: 6, height: 6, borderRadius: 3, marginLeft: 4 },
    meta: { fontSize: 11, color: colors.mutedForeground },
    salaryWrap: { alignItems: "flex-end" },
    salary: { fontSize: 14, fontWeight: "600" as const, color: colors.foreground },
    salaryPer: { fontSize: 11, color: colors.mutedForeground },
    emptyState: { alignItems: "center", gap: 12, paddingTop: 60 },
    emptyText: { fontSize: 14, color: colors.mutedForeground },
  });
}
