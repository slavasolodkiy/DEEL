import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/auth";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { StepRenderer } from "./step-renderer";
import { ReviewStep } from "./review-step";
import { CompleteStep } from "./complete-step";

interface Step {
  id: string;
  type: string;
  titleKey: string;
  descriptionKey?: string;
  fields: Array<{
    id: string;
    type: string;
    labelKey: string;
    placeholderKey?: string;
    required: boolean;
    options?: Array<{ value: string; labelKey: string }>;
  }>;
}

interface StepResult {
  stepId: string;
  step: Step;
  isFirst: boolean;
  isLast: boolean;
  previousStepId: string | null;
  nextStepId: string | null;
  progress: number;
}

interface SessionState {
  id: number;
  flowId: string;
  flowVersion: string;
  currentStepId: string;
  answers: Record<string, unknown>;
  status: string;
}

type SessionWithStep = { session: SessionState; currentStep: StepResult };

export default function OnboardPage() {
  const { t, i18n } = useTranslation();
  const { user, token } = useAuth();
  const [location] = useLocation();
  const [, navigate] = useLocation();
  const [sessionData, setSessionData] = useState<SessionWithStep | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const params = new URLSearchParams(location.includes("?") ? location.split("?")[1] : "");
  const flowId = params.get("flow") ?? (user?.role === "business" ? "business" : "individual");

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const storedSessionKey = `globalhr-onboard-session-${flowId}`;

  const startSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${base}/api/onboarding-engine/sessions`, {
        method: "POST",
        headers,
        body: JSON.stringify({ flowId, userId: user?.id ?? null }),
      });
      const data = (await r.json()) as SessionWithStep;
      sessionStorage.setItem(storedSessionKey, String(data.session.id));
      setSessionData(data);
    } catch {
      setError(t("errors.networkError"));
    } finally {
      setLoading(false);
    }
  }, [flowId, user?.id]);

  const loadSession = useCallback(async (sessionId: number) => {
    setLoading(true);
    try {
      const r = await fetch(`${base}/api/onboarding-engine/sessions/${sessionId}`, { headers });
      if (!r.ok) {
        await startSession();
        return;
      }
      const data = (await r.json()) as SessionWithStep;
      setSessionData(data);
    } catch {
      await startSession();
    } finally {
      setLoading(false);
    }
  }, [startSession]);

  useEffect(() => {
    if (user?.locale) {
      void i18n.changeLanguage(user.locale);
    }
    const stored = sessionStorage.getItem(storedSessionKey);
    if (stored) void loadSession(Number(stored));
    else void startSession();
  }, [flowId]);

  async function handleAnswer(answers: Record<string, unknown>) {
    if (!sessionData) return;
    setSubmitting(true);
    setError(null);
    try {
      const r = await fetch(`${base}/api/onboarding-engine/sessions/${sessionData.session.id}/answer`, {
        method: "POST",
        headers,
        body: JSON.stringify({ answers }),
      });
      if (!r.ok) {
        const err = (await r.json()) as { message?: string };
        setError(err.message ?? t("common.error"));
        return;
      }
      const result = (await r.json()) as { nextStep: StepResult | null; isComplete: boolean; session: SessionState };
      setSessionData({ session: result.session, currentStep: result.nextStep ?? sessionData.currentStep });
      if (result.isComplete) sessionStorage.removeItem(storedSessionKey);
    } catch {
      setError(t("errors.networkError"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleBack() {
    if (!sessionData) return;
    setSubmitting(true);
    try {
      const r = await fetch(`${base}/api/onboarding-engine/sessions/${sessionData.session.id}/back`, {
        method: "POST",
        headers,
      });
      if (r.ok) {
        const data = (await r.json()) as SessionWithStep;
        setSessionData(data);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground animate-pulse">{t("common.loading")}</div>
      </div>
    );
  }

  if (!sessionData) return null;

  const { session, currentStep } = sessionData;
  const step = currentStep.step;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground font-mono">
              {t("common.step", { current: Math.round((currentStep.progress / 100) * 10), total: 10 })}
            </span>
            <span className="text-sm text-muted-foreground font-mono">
              {t("common.progress", { percent: currentStep.progress })}
            </span>
          </div>
          <Progress value={currentStep.progress} className="h-1.5" />
        </div>

        {error && (
          <div className="mb-4 p-3 rounded bg-destructive/10 text-destructive text-sm">{error}</div>
        )}

        {step.type === "review" ? (
          <ReviewStep answers={session.answers} onConfirm={() => void handleAnswer({})} submitting={submitting} />
        ) : step.type === "complete" ? (
          <CompleteStep flowId={session.flowId} onGoToDashboard={() => navigate("/dashboard")} />
        ) : (
          <StepRenderer
            step={step}
            existingAnswers={session.answers}
            onSubmit={(answers) => void handleAnswer(answers)}
            onBack={currentStep.isFirst ? undefined : () => void handleBack()}
            submitting={submitting}
          />
        )}
      </div>
    </div>
  );
}
