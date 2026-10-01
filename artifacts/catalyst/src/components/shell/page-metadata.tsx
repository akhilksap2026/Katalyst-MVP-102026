import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "@/lib/router";

export function PageMetadata() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  useEffect(() => {
    const segments = pathname.split("/").filter(Boolean);
    const label = pathname === "/list" ? t("nav.listUtility")
      : pathname === "/agents" ? t("nav.agentCompare")
      : pathname === "/dictionary/joins" ? t("dictionaryJoins.findJoins")
      : segments[0] === "dictionary" && segments.length === 3 ? t("planned.metaTable", { table: decodeURIComponent(segments[2]), release: segments[1] })
      : segments[0] === "dictionary" ? t("nav.dataDictionary")
      : segments[0] === "planned" ? t("planned.metaTitle", { slug: segments[1]?.replaceAll("-", " ") ?? "" })
      : t("nav.home");
    const title = t("meta.title", { label });
    const description = t("meta.description", { label });
    document.title = title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", description);
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", title);
    document.querySelector('meta[property="og:description"]')?.setAttribute("content", description);
  }, [pathname, t]);
  return null;
}