import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COUNTRIES } from "@/lib/countries";
import { CURRENCIES } from "@/lib/currencies";

interface FieldDef {
  id: string;
  type: string;
  labelKey: string;
  placeholderKey?: string;
  required: boolean;
  options?: Array<{ value: string; labelKey: string }>;
}

interface Step {
  id: string;
  type: string;
  titleKey: string;
  descriptionKey?: string;
  fields: FieldDef[];
}

interface Props {
  step: Step;
  existingAnswers: Record<string, unknown>;
  onSubmit: (answers: Record<string, unknown>) => void;
  onBack?: () => void;
  submitting: boolean;
}

export function StepRenderer({ step, existingAnswers, onSubmit, onBack, submitting }: Props) {
  const { t } = useTranslation();
  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const init: Record<string, unknown> = {};
    for (const field of step.fields) {
      init[field.id] = existingAnswers[field.id] ?? (field.type === "checkbox" ? false : "");
    }
    return init;
  });

  function setValue(id: string, value: unknown) {
    setValues((prev) => ({ ...prev, [id]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(values);
  }

  const isInfoStep = step.type === "info" || step.fields.length === 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t(step.titleKey)}</h1>
        {step.descriptionKey && (
          <p className="mt-2 text-muted-foreground">{t(step.descriptionKey)}</p>
        )}
      </div>

      {step.type === "verification" && (
        <div className="border rounded-lg p-6 space-y-4 bg-card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold">{t("kyc.startButton")}</p>
              <p className="text-sm text-muted-foreground">{t("kyc.provider")}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{t("kyc.manualFallback")}</p>
          <div className="flex gap-2">
            <Button
              onClick={() => setValue("kycStatus", "approved")}
              variant={values["kycStatus"] === "approved" ? "default" : "outline"}
              size="sm"
            >
              ✓ {t("kyc.status.approved")}
            </Button>
            <Button
              onClick={() => setValue("kycStatus", "manual")}
              variant="ghost"
              size="sm"
            >
              {t("kyc.manual_label")}
            </Button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {step.fields.map((field) => {
          if (field.type === "radio" && field.options) {
            return (
              <div key={field.id} className="space-y-3">
                <Label>{t(field.labelKey)}</Label>
                <RadioGroup
                  value={String(values[field.id] ?? "")}
                  onValueChange={(v) => setValue(field.id, v)}
                  className="space-y-2"
                >
                  {field.options.map((opt) => (
                    <div key={opt.value} className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value={opt.value} id={`${field.id}-${opt.value}`} className="mt-0.5" />
                      <Label htmlFor={`${field.id}-${opt.value}`} className="cursor-pointer font-normal leading-snug">
                        {t(opt.labelKey)}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            );
          }

          if (field.type === "select" && field.options) {
            return (
              <div key={field.id} className="space-y-2">
                <Label>{t(field.labelKey)}</Label>
                <Select value={String(values[field.id] ?? "")} onValueChange={(v) => setValue(field.id, v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{t(opt.labelKey)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          }

          if (field.type === "country") {
            return (
              <div key={field.id} className="space-y-2">
                <Label>{t(field.labelKey)}</Label>
                <Select value={String(values[field.id] ?? "")} onValueChange={(v) => setValue(field.id, v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select country..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>{c.flag} {c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          }

          if (field.type === "currency") {
            return (
              <div key={field.id} className="space-y-2">
                <Label>{t(field.labelKey)}</Label>
                <Select value={String(values[field.id] ?? "")} onValueChange={(v) => setValue(field.id, v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>{c.code} — {c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          }

          if (field.type === "checkbox") {
            return (
              <div key={field.id} className="flex items-start gap-3">
                <Checkbox
                  id={field.id}
                  checked={Boolean(values[field.id])}
                  onCheckedChange={(checked) => setValue(field.id, Boolean(checked))}
                />
                <Label htmlFor={field.id} className="font-normal text-sm leading-relaxed cursor-pointer">
                  {t(field.labelKey)}
                </Label>
              </div>
            );
          }

          if (field.type === "file") {
            return (
              <div key={field.id} className="space-y-2">
                <Label>{t(field.labelKey)}</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center space-y-2">
                  <svg className="mx-auto h-8 w-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm text-muted-foreground">Click to upload or drag & drop</p>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    id={`file-${field.id}`}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      setValue(field.id, file ? file.name : "");
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById(`file-${field.id}`)?.click()}
                  >
                    Choose file
                  </Button>
                  {!!values[field.id] && (
                    <p className="text-xs text-primary font-medium">{String(values[field.id])}</p>
                  )}
                </div>
              </div>
            );
          }

          return (
            <div key={field.id} className="space-y-2">
              <Label htmlFor={field.id}>
                {t(field.labelKey)}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              <Input
                id={field.id}
                type={field.type === "tel" ? "tel" : field.type === "email" ? "email" : field.type === "date" ? "date" : field.type === "password" ? "password" : "text"}
                placeholder={field.placeholderKey ? t(field.placeholderKey) : undefined}
                value={String(values[field.id] ?? "")}
                onChange={(e) => setValue(field.id, e.target.value)}
                required={field.required}
              />
            </div>
          );
        })}

        <div className="flex gap-3 pt-2">
          {onBack && (
            <Button type="button" variant="ghost" onClick={onBack} disabled={submitting}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              {isInfoStep ? undefined : ""}
            </Button>
          )}
          <Button type="submit" className="flex-1" disabled={submitting}>
            {submitting ? "..." : isInfoStep ? "Get started →" : "Continue →"}
          </Button>
        </div>
      </form>
    </div>
  );
}
