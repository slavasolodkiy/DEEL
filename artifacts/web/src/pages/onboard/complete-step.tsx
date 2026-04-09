import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

interface Props {
  flowId: string;
  onGoToDashboard: () => void;
}

export function CompleteStep({ flowId, onGoToDashboard }: Props) {
  const { t } = useTranslation();
  const isBusiness = flowId === "business";

  return (
    <div className="flex flex-col items-center text-center space-y-6 py-8">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
        <CheckCircle2 className="w-10 h-10 text-primary" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">
          {t(isBusiness ? "steps.biz_complete.title" : "steps.complete.title")}
        </h1>
        <p className="text-muted-foreground max-w-sm">
          {t(isBusiness ? "steps.biz_complete.description" : "steps.complete.description")}
        </p>
      </div>
      <div className="w-full max-w-xs space-y-3">
        <Button onClick={onGoToDashboard} className="w-full">
          Go to Dashboard →
        </Button>
      </div>
    </div>
  );
}
