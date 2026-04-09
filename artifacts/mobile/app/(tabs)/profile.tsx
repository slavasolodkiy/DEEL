import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/AuthContext";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";

interface MenuItem {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  onPress: () => void;
  danger?: boolean;
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const s = makeStyles(colors, topPad, insets.bottom);

  async function handleLogout() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/login");
        },
      },
    ]);
  }

  const menuItems: MenuItem[] = [
    { icon: "user", label: "Account details", onPress: () => {} },
    { icon: "bell", label: "Notifications", onPress: () => {} },
    { icon: "shield", label: "Security & privacy", onPress: () => {} },
    { icon: "globe", label: "Language & region", onPress: () => {} },
    { icon: "help-circle", label: "Help & support", onPress: () => {} },
    { icon: "log-out", label: "Sign out", onPress: () => void handleLogout(), danger: true },
  ];

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <Text style={s.title}>Profile</Text>

      <View style={s.profileCard}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{(user?.email?.[0] ?? "U").toUpperCase()}</Text>
        </View>
        <View style={s.profileInfo}>
          <Text style={s.email}>{user?.email ?? "—"}</Text>
          <View style={s.roleBadge}>
            <Text style={s.roleText}>{user?.role ?? "user"}</Text>
          </View>
        </View>
        <View style={[s.verifyBadge, { backgroundColor: user?.isVerified ? "#dcfce7" : "#fef9c3" }]}>
          <Feather
            name={user?.isVerified ? "check-circle" : "clock"}
            size={12}
            color={user?.isVerified ? "#16a34a" : "#d97706"}
          />
          <Text style={[s.verifyText, { color: user?.isVerified ? "#16a34a" : "#d97706" }]}>
            {user?.isVerified ? "Verified" : "Pending"}
          </Text>
        </View>
      </View>

      <View style={s.menu}>
        {menuItems.map((item, i) => (
          <TouchableOpacity
            key={item.label}
            style={[
              s.menuItem,
              i === 0 && s.menuItemFirst,
              i === menuItems.length - 1 && s.menuItemLast,
            ]}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <View style={[s.menuIcon, { backgroundColor: item.danger ? "#fee2e2" : `${colors.primary}15` }]}>
              <Feather
                name={item.icon}
                size={17}
                color={item.danger ? colors.destructive : colors.primary}
              />
            </View>
            <Text style={[s.menuLabel, item.danger && { color: colors.destructive }]}>{item.label}</Text>
            {!item.danger && <Feather name="chevron-right" size={16} color={colors.mutedForeground} />}
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.version}>GlobalHR Platform v1.0</Text>
    </ScrollView>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>, topPad: number, bottomPad: number) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: 20, paddingTop: topPad + 16, paddingBottom: bottomPad + 100 },
    title: { fontSize: 26, fontWeight: "700" as const, color: colors.foreground, marginBottom: 20 },
    profileCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      marginBottom: 24,
    },
    avatar: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: { fontSize: 20, fontWeight: "700" as const, color: colors.primaryForeground },
    profileInfo: { flex: 1 },
    email: { fontSize: 14, fontWeight: "600" as const, color: colors.foreground },
    roleBadge: {
      alignSelf: "flex-start",
      marginTop: 4,
      backgroundColor: `${colors.primary}15`,
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    roleText: { fontSize: 11, fontWeight: "600" as const, color: colors.primary },
    verifyBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    verifyText: { fontSize: 11, fontWeight: "600" as const },
    menu: {
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    menuItemFirst: {},
    menuItemLast: { borderBottomWidth: 0 },
    menuIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    menuLabel: { flex: 1, fontSize: 15, color: colors.foreground },
    version: { textAlign: "center", fontSize: 12, color: colors.mutedForeground, marginTop: 32 },
  });
}
