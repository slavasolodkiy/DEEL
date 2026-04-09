import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function Login() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const base = import.meta.env.BASE_URL.replace(/\/$/, "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const r = await fetch(`${base}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!r.ok) {
        const data = (await r.json()) as { message?: string };
        setError(data.message ?? t("errors.invalidCredentials"));
        return;
      }
      const { token, user } = (await r.json()) as { token: string; user: Parameters<typeof login>[1] };
      login(token, user);
      navigate("/dashboard");
    } catch {
      setError(t("errors.networkError"));
    } finally {
      setLoading(false);
    }
  }

  async function handleOAuth(provider: string) {
    setLoading(true);
    try {
      const r = await fetch(`${base}/api/auth/oauth/${provider}`);
      const { token, user } = (await r.json()) as { token: string; user: Parameters<typeof login>[1] };
      login(token, user);
      navigate("/dashboard");
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
          <CardTitle className="text-2xl font-bold">{t("auth.login.title")}</CardTitle>
          <CardDescription>GlobalHR Platform</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.login.emailLabel")}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t("auth.login.emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.login.passwordLabel")}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t("auth.login.passwordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("common.loading") : t("auth.login.submitButton")}
            </Button>
          </form>

          <div className="flex items-center gap-2">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">{t("auth.login.orContinueWith")}</span>
            <Separator className="flex-1" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => void handleOAuth("google")} disabled={loading}>
              {t("auth.login.continueWithGoogle")}
            </Button>
            <Button variant="outline" onClick={() => void handleOAuth("sso")} disabled={loading}>
              {t("auth.login.continueWithSSO")}
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            {t("auth.login.noAccount")}{" "}
            <a href="/register" className="text-primary hover:underline font-medium">
              {t("auth.login.signUp")}
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
