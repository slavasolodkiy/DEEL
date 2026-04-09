import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

interface Props {
  answers: Record<string, unknown>;
  onConfirm: () => void;
  submitting: boolean;
}

const DISPLAY_KEYS: Array<{ key: string; labelKey: string }> = [
  { key: "firstName", labelKey: "fields.firstName.label" },
  { key: "lastName", labelKey: "fields.lastName.label" },
  { key: "country", labelKey: "fields.country.label" },
  { key: "entityType", labelKey: "fields.entityType.label" },
  { key: "companyName", labelKey: "fields.companyName.label" },
  { key: "contractType", labelKey: "fields.contractType.label" },
  { key: "withdrawalMethod", labelKey: "fields.withdrawalMethod.label" },
  { key: "currency", labelKey: "fields.currency.label" },
  { key: "taxFormType", labelKey: "fields.taxFormType.label" },
  { key: "companySize", labelKey: "fields.companySize.label" },
  { key: "hiringIntent", labelKey: "fields.hiringIntent.label" },
  { key: "workerCountry", labelKey: "fields.workerCountry.label" },
  { key: "billingMethod", labelKey: "fields.billingMethod.label" },
  { key: "kycStatus", labelKey: "fields.kycStatus.label" },
];

export function ReviewStep({ answers, onConfirm, submitting }: Props) {
  const { t } = useTranslation();
  const populated = DISPLAY_KEYS.filter((k) => answers[k.key] && String(answers[k.key]).trim() !== "");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("steps.review.title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("steps.review.description")}</p>
      </div>

      <div className="border rounded-lg divide-y">
        {populated.map(({ key, labelKey }) => (
          <div key={key} className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-muted-foreground">{t(labelKey)}</span>
            <span className="text-sm font-medium capitalize">{String(answers[key]).replace(/_/g, " ")}</span>
          </div>
        ))}
        {populated.length === 0 && (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">No information to review.</div>
        )}
      </div>

      <Button onClick={onConfirm} className="w-full" disabled={submitting}>
        {submitting ? "..." : t("review.confirmSubmit")}
      </Button>
    </div>
  );
}
