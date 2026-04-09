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
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const domain = process.env["EXPO_PUBLIC_DOMAIN"] ?? "";

  async function handleLogin() {
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const r = await fetch(`https://${domain}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!r.ok) {
        const d = (await r.json()) as { message?: string };
        setError(d.message ?? "Invalid email or password.");
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

  async function handleMockOAuth() {
    setLoading(true);
    try {
      const r = await fetch(`https://${domain}/api/auth/oauth/google`);
      const { token, user } = (await r.json()) as {
        token: string;
        user: Parameters<typeof login>[1];
      };
      await login(token, user);
      router.replace("/(tabs)");
    } catch {
      setError("OAuth failed. Please try again.");
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
        <View style={s.header}>
          <View style={s.logo}>
            <Feather name="globe" size={32} color={colors.primaryForeground} />
          </View>
          <Text style={s.brand}>GlobalHR</Text>
          <Text style={s.subtitle}>Sign in to your account</Text>
        </View>

        <View style={s.form}>
          <View style={s.field}>
            <Text style={s.label}>Email</Text>
            <View style={s.inputWrap}>
              <Feather name="mail" size={16} color={colors.mutedForeground} style={s.inputIcon} />
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
              <Feather name="lock" size={16} color={colors.mutedForeground} style={s.inputIcon} />
              <TextInput
                style={[s.input, { flex: 1 }]}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.mutedForeground}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={s.eye}>
                <Feather name={showPassword ? "eye-off" : "eye"} size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </View>

          {error && (
            <View style={s.errorBox}>
              <Feather name="alert-circle" size={14} color={colors.destructive} />
              <Text style={s.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity style={s.primaryButton} onPress={() => void handleLogin()} disabled={loading} activeOpacity={0.85}>
            {loading ? (
              <ActivityIndicator color={colors.primaryForeground} size="small" />
            ) : (
              <Text style={s.primaryButtonText}>Sign in</Text>
            )}
          </TouchableOpacity>

          <View style={s.divider}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>or</Text>
            <View style={s.dividerLine} />
          </View>

          <TouchableOpacity style={s.outlineButton} onPress={() => void handleMockOAuth()} disabled={loading} activeOpacity={0.85}>
            <Feather name="chrome" size={16} color={colors.foreground} />
            <Text style={s.outlineButtonText}>Continue with Google (mock)</Text>
          </TouchableOpacity>
        </View>

        <View style={s.footer}>
          <Text style={s.footerText}>New to GlobalHR?  </Text>
          <TouchableOpacity onPress={() => router.push("/register")}>
            <Text style={s.footerLink}>Create an account</Text>
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
      paddingTop: insets.top + 40,
      paddingBottom: insets.bottom + 24,
    },
    header: { alignItems: "center", marginBottom: 40 },
    logo: {
      width: 64,
      height: 64,
      borderRadius: 16,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },
    brand: { fontSize: 26, fontWeight: "700" as const, color: colors.foreground, letterSpacing: -0.5 },
    subtitle: { fontSize: 14, color: colors.mutedForeground, marginTop: 4 },
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
    inputIcon: { marginRight: 8 },
    input: {
      flex: 1,
      fontSize: 15,
      color: colors.foreground,
    },
    eye: { padding: 4 },
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
    divider: { flexDirection: "row", alignItems: "center", gap: 12 },
    dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
    dividerText: { fontSize: 12, color: colors.mutedForeground },
    outlineButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      height: 50,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    outlineButtonText: { fontSize: 15, fontWeight: "500" as const, color: colors.foreground },
    footer: { flexDirection: "row", justifyContent: "center", marginTop: 32 },
    footerText: { fontSize: 14, color: colors.mutedForeground },
    footerLink: { fontSize: 14, color: colors.primary, fontWeight: "600" as const },
  });
}
