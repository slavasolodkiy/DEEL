import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function Register() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"individual" | "business">("individual");
  const [locale, setLocale] = useState("en");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const base = import.meta.env.BASE_URL.replace(/\/$/, "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const r = await fetch(`${base}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role, locale }),
      });
      if (!r.ok) {
        const data = (await r.json()) as { message?: string };
        if (r.status === 409) setError(t("errors.emailInUse"));
        else setError(data.message ?? t("common.error"));
        return;
      }
      const { token, user } = (await r.json()) as { token: string; user: Parameters<typeof login>[1] };
      login(token, user);
      navigate(`/onboard?flow=${role}`);
    } catch {
      setError(t("errors.networkError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">{t("auth.register.title")}</CardTitle>
          <CardDescription>GlobalHR Platform</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div className="space-y-2">
              <Label>{t("auth.register.accountTypeLabel")}</Label>
              <RadioGroup value={role} onValueChange={(v) => setRole(v as "individual" | "business")} className="flex gap-4">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="individual" id="role-individual" />
                  <Label htmlFor="role-individual">{t("auth.register.accountTypeIndividual")}</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="business" id="role-business" />
                  <Label htmlFor="role-business">{t("auth.register.accountTypeBusiness")}</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.register.emailLabel")}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t("auth.register.emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.register.passwordLabel")}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t("auth.register.passwordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="locale">Preferred language</Label>
              <select
                id="locale"
                value={locale}
                onChange={(e) => setLocale(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm bg-background"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
              </select>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("common.loading") : t("auth.register.submitButton")}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground text-center">{t("auth.register.termsNotice")}</p>
          <p className="text-center text-sm text-muted-foreground">
            {t("auth.register.alreadyHaveAccount")}{" "}
            <a href="/login" className="text-primary hover:underline font-medium">
              {t("auth.register.signIn")}
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
