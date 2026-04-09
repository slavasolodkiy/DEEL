import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/AuthContext";

export default function RegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"individual" | "business">("individual");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const domain = process.env["EXPO_PUBLIC_DOMAIN"] ?? "";

  async function handleRegister() {
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const r = await fetch(`https://${domain}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });
      if (!r.ok) {
        const d = (await r.json()) as { message?: string };
        setError(d.message ?? "Registration failed.");
        return;
      }
      const { token, user } = (await r.json()) as {
        token: string;
        user: Parameters<typeof login>[1];
      };
      await login(token, user);
      router.replace("/(tabs)");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const s = makeStyles(colors, insets);

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={s.back} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </TouchableOpacity>

        <Text style={s.title}>Create account</Text>
        <Text style={s.subtitle}>Join GlobalHR Platform</Text>

        <View style={s.roleRow}>
          {(["individual", "business"] as const).map((r) => (
            <TouchableOpacity
              key={r}
              style={[s.roleOption, role === r && s.roleOptionActive]}
              onPress={() => setRole(r)}
            >
              <Feather
                name={r === "individual" ? "user" : "briefcase"}
                size={18}
                color={role === r ? colors.primaryForeground : colors.mutedForeground}
              />
              <Text style={[s.roleText, role === r && s.roleTextActive]}>
                {r === "individual" ? "Worker / Contractor" : "Employer / Company"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.form}>
          <View style={s.field}>
            <Text style={s.label}>Email</Text>
            <View style={s.inputWrap}>
              <Feather name="mail" size={16} color={colors.mutedForeground} style={{ marginRight: 8 }} />
              <TextInput
                style={s.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@company.com"
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={s.field}>
            <Text style={s.label}>Password</Text>
            <View style={s.inputWrap}>
              <Feather name="lock" size={16} color={colors.mutedForeground} style={{ marginRight: 8 }} />
              <TextInput
                style={s.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Min. 8 characters"
                placeholderTextColor={colors.mutedForeground}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
          </View>

          {error && (
            <View style={s.errorBox}>
              <Feather name="alert-circle" size={14} color={colors.destructive} />
              <Text style={s.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity style={s.primaryButton} onPress={() => void handleRegister()} disabled={loading} activeOpacity={0.85}>
            {loading ? (
              <ActivityIndicator color={colors.primaryForeground} size="small" />
            ) : (
              <Text style={s.primaryButtonText}>Create account</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={s.footer}>
          <Text style={s.footerText}>Already have an account?  </Text>
          <TouchableOpacity onPress={() => router.push("/login")}>
            <Text style={s.footerLink}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>, insets: ReturnType<typeof useSafeAreaInsets>) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    content: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingTop: insets.top + 20,
      paddingBottom: insets.bottom + 24,
    },
    back: { marginBottom: 24, alignSelf: "flex-start" },
    title: { fontSize: 28, fontWeight: "700" as const, color: colors.foreground, marginBottom: 4 },
    subtitle: { fontSize: 14, color: colors.mutedForeground, marginBottom: 24 },
    roleRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
    roleOption: {
      flex: 1,
      flexDirection: "column",
      alignItems: "center",
      gap: 6,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 14,
      backgroundColor: colors.card,
    },
    roleOptionActive: { borderColor: colors.primary, backgroundColor: colors.primary },
    roleText: { fontSize: 12, fontWeight: "500" as const, color: colors.mutedForeground, textAlign: "center" },
    roleTextActive: { color: colors.primaryForeground },
    form: { gap: 16 },
    field: { gap: 6 },
    label: { fontSize: 13, fontWeight: "600" as const, color: colors.foreground },
    inputWrap: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      backgroundColor: colors.card,
      paddingHorizontal: 12,
      height: 48,
    },
    input: { flex: 1, fontSize: 15, color: colors.foreground },
    errorBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: "#fef2f2",
      borderRadius: 8,
      padding: 10,
    },
    errorText: { fontSize: 13, color: colors.destructive, flex: 1 },
    primaryButton: {
      backgroundColor: colors.primary,
      height: 50,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 4,
    },
    primaryButtonText: { fontSize: 16, fontWeight: "600" as const, color: colors.primaryForeground },
    footer: { flexDirection: "row", justifyContent: "center", marginTop: 32 },
    footerText: { fontSize: 14, color: colors.mutedForeground },
    footerLink: { fontSize: 14, color: colors.primary, fontWeight: "600" as const },
  });
}
