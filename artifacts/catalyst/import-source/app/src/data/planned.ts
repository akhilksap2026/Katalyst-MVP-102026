export interface PlannedFeature {
  slug: string;
  title: string;
  /** one-sentence purpose */
  description: string;
  /** three bullet points of intended capability */
  capabilities: [string, string, string];
}

export const PLANNED_FEATURES: PlannedFeature[] = [
  {
    slug: "live-otm-connection",
    title: "Live OTM connection",
    description:
      "Connect to an OTM instance over REST so every Catalyst tool can run against live data instead of pasted extracts.",
    capabilities: [
      "Connect with your OTM credentials for the current session only — nothing is saved or logged.",
      "Switch between customers and environments (DEV / TEST / PROD) from the header.",
      "Surface permission problems clearly, e.g. a missing REST view permission for Agent.",
    ],
  },
  {
    slug: "agent-editor",
    title: "Agent editor",
    description:
      "Create and edit automation agents — events, actions and parameters — with validation against the data dictionary.",
    capabilities: [
      "Edit agent headers, events and action flows in a form validated against OTM rules.",
      "Check parameter GIDs against the data dictionary before saving.",
      "Push changes to a live instance through the connection, with a dry-run preview.",
    ],
  },
  {
    slug: "saved-query-runner",
    title: "Saved query runner",
    description:
      "Run saved queries from OTM with parameter prompting and export the results to CSV.",
    capabilities: [
      "Pick a saved query and get prompted for its parameters.",
      "Run it over the live connection and page through large result sets.",
      "Export results to CSV or copy them straight into the List Utility.",
    ],
  },
  {
    slug: "rest-explorer",
    title: "REST explorer",
    description:
      "Browse and test OTM REST endpoints against a live connection, with saved request history.",
    capabilities: [
      "Browse the OTM REST resource catalog and build requests from it.",
      "Send requests with a live connection and inspect formatted responses.",
      "Keep a session history of requests you can replay and compare.",
    ],
  },
  {
    slug: "dbxml-export-helper",
    title: "DB.XML export helper",
    description:
      "Build DB.XML transmission files from selected records, ready for OTM's integration upload.",
    capabilities: [
      "Assemble TRANSACTION_SET content from queried or pasted records.",
      "Validate the XML structure against OTM expectations before export.",
      "Download a ready-to-upload transmission file.",
    ],
  },
  {
    slug: "migration-counts",
    title: "Migration counts",
    description:
      "Row counts per table for cutover validation, compared between source and target instances.",
    capabilities: [
      "Pull table row counts from both the source and target instances.",
      "Compare counts side by side and flag tables that moved unexpectedly.",
      "Export the reconciliation report for cutover sign-off.",
    ],
  },
];

export function getPlannedFeature(slug: string): PlannedFeature | undefined {
  return PLANNED_FEATURES.find((f) => f.slug === slug);
}
