import { useTranslation } from "react-i18next";
import { FileQuestion } from "lucide-react";
import { useNavigate } from "@/lib/router";
import { EmptyStateContent } from "@workspace/ksap-cloud-ui/components/patterns/empty-state-content";

export default function NotFound() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <div className="mx-auto flex min-h-dvh max-w-page items-center justify-center p-4 pt-safe pb-safe">
      <EmptyStateContent
        icon={<FileQuestion aria-hidden="true" />}
        title={t("notFound.title")}
        description={t("notFound.description")}
        actionLabel={t("notFound.backHome")}
        onAction={() => navigate("/")}
      />
    </div>
  );
}
