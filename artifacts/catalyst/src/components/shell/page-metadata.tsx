import { useEffect } from "react";
import { useLocation } from "@/lib/router";

export function PageMetadata() {
  const { pathname } = useLocation();
  useEffect(() => {
    const segments = pathname.split("/").filter(Boolean);
    const label = pathname === "/list" ? "List Utility"
      : pathname === "/agents" ? "Agent Compare"
      : pathname === "/dictionary/joins" ? "Dictionary Joins"
      : segments[0] === "dictionary" && segments.length === 3 ? `${decodeURIComponent(segments[2])} · ${segments[1]}`
      : segments[0] === "dictionary" ? "Data Dictionary"
      : segments[0] === "planned" ? `${segments[1]?.replaceAll("-", " ")} · Planned`
      : "Home";
    const title = `${label} | Catalyst`;
    const description = `${label}: browser-based tools for Oracle Transportation Management. Compare agent extracts, inspect the data dictionary, and clean lists without uploading your data.`;
    document.title = title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", description);
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", title);
    document.querySelector('meta[property="og:description"]')?.setAttribute("content", description);
  }, [pathname]);
  return null;
}