import type { TFunction } from "i18next";

export interface PlannedFeature {
  slug: string;
  title: string;
  /** one-sentence purpose */
  description: string;
  /** three bullet points of intended capability */
  capabilities: [string, string, string];
}

/** Planned module slugs; their copy lives in the English resources under planned.<slug>. */
const PLANNED_SLUGS = ["live-otm-connection","agent-editor","saved-query-runner","rest-explorer","dbxml-export-helper","migration-counts"] as const;

const camel = (slug: string) => slug.replace(/-(\w)/g, (_, c: string) => c.toUpperCase());

export function plannedFeatures(t: TFunction): PlannedFeature[] {
  return PLANNED_SLUGS.map((slug) => {
    const key = `planned.${camel(slug)}`;
    return {
      slug,
      title: t(`${key}.title`),
      description: t(`${key}.description`),
      capabilities: [0, 1, 2].map((i) => t(`${key}.capabilities.${i}`)) as [string, string, string],
    };
  });
}

export function getPlannedFeature(t: TFunction, slug: string): PlannedFeature | undefined {
  return plannedFeatures(t).find((f) => f.slug === slug);
}
