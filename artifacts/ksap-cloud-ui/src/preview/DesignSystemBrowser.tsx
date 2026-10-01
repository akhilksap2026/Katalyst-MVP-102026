import { Suspense, useEffect, useState } from "react";
import { Input } from "../components/ui/input";
import { ALL_ENTRIES, DESIGN_SYSTEM, NAV_GROUPS } from "./registry";
import { setDisplay, useDisplay, type DisplayPreferences } from "../hooks/use-display";

function pageFromHash() {
  const id = window.location.hash.slice(1);
  return ALL_ENTRIES.some(entry => entry.id === id) ? id : "overview";
}
export function DesignSystemBrowser() {
  const [pageId, setPageId] = useState(pageFromHash);
  const [search, setSearch] = useState("");
  const display = useDisplay();
  const page = ALL_ENTRIES.find(entry => entry.id === pageId)!;
  const Page = page.component;
  useEffect(() => {
    const update = () => setPageId(pageFromHash());
    addEventListener("hashchange", update);
    const osTheme = matchMedia("(prefers-color-scheme: dark)");
    const osUpdate = () => { if (display.theme === "system") setDisplay({}); };
    osTheme.addEventListener("change", osUpdate);
    setDisplay(display);
    return () => { removeEventListener("hashchange", update); osTheme.removeEventListener("change", osUpdate); };
  }, [display.theme]);
  useEffect(() => {
    document.title = `${page.title} | KSAP Cloud UI design system`;
    document.getElementById("ksap-content")?.focus({ preventScroll: true });
  }, [pageId, page.title]);
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const theme = params.get("theme"), palette = params.get("palette"), density = params.get("density");
    const patch: Partial<DisplayPreferences> = {};
    if (theme && ["system", "light", "dark"].includes(theme)) patch.theme = theme as DisplayPreferences["theme"];
    if (palette && ["blue", "red", "green", "yellow"].includes(palette)) patch.palette = palette as DisplayPreferences["palette"];
    if (density && ["compact", "standard", "relaxed"].includes(density)) patch.density = density as DisplayPreferences["density"];
    if (Object.keys(patch).length > 0) setDisplay(patch);
  }, []);
  function updateDisplay(patch: Partial<DisplayPreferences>) {
    setDisplay(patch);
    const params = new URLSearchParams(location.search);
    for (const [key, value] of Object.entries(patch)) params.set(key, value);
    history.replaceState(history.state, "", `${location.pathname}?${params}${location.hash}`);
  }
  return <div className="ksap-browser">
    <a className="ksap-skip" href="#ksap-content">Skip to content</a>
    <nav className="ksap-nav" aria-label="Design-system pages">
      <p className="ksap-nav-title">{DESIGN_SYSTEM.title}</p>
      <p className="ksap-nav-note">Cloud UI design system</p>
      <Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Find a page" aria-label="Find a design-system page" />
      {NAV_GROUPS.map(group => {
        const entries = group.entries.filter(entry => `${entry.title} ${entry.description}`.toLowerCase().includes(search.toLowerCase()));
        return entries.length > 0 && <section key={group.title}><h2 className="ksap-nav-group">{group.title}</h2>{entries.map(entry => <a key={entry.id} href={`#${entry.id}`} aria-current={pageId === entry.id ? "page" : undefined}>{entry.title}</a>)}</section>;
      })}
      {!ALL_ENTRIES.some(entry => `${entry.title} ${entry.description}`.toLowerCase().includes(search.toLowerCase())) && <p className="mt-6 text-caption">No matching pages. Try a component name.</p>}
      <p className="ksap-nav-note mt-8">Based on DESIGN.md 6.1</p>
    </nav>
    <div>
      <header className="ksap-toolbar">
        <div><p className="text-caption text-muted-foreground">KSAP Cloud UI</p><p className="text-subheading font-semibold">Shared component library</p></div>
        <div className="ksap-controls">
          <label className="ksap-control-label">Theme<select className="ksap-select" value={display.theme} onChange={e => updateDisplay({ theme: e.target.value as DisplayPreferences["theme"] })}><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></label>
          <label className="ksap-control-label">Palette<select className="ksap-select" value={display.palette} onChange={e => updateDisplay({ palette: e.target.value as DisplayPreferences["palette"] })}><option value="blue">Blue</option><option value="red">Red</option><option value="green">Green</option><option value="yellow">Yellow</option></select></label>
          <label className="ksap-control-label">Density<select className="ksap-select" value={display.density} onChange={e => updateDisplay({ density: e.target.value as DisplayPreferences["density"] })}><option value="compact">Compact</option><option value="standard">Standard</option><option value="relaxed">Relaxed</option></select></label>
        </div>
        <label className="ksap-control-label ksap-mobile-nav">Page<select className="ksap-select" value={pageId} onChange={e => { location.hash = e.target.value; }}>{ALL_ENTRIES.map(entry => <option key={entry.id} value={entry.id}>{entry.title}</option>)}</select></label>
      </header>
      <main id="ksap-content" tabIndex={-1} className="ksap-main">
        <div className="mb-8"><h1 className="text-title font-semibold mb-2">{page.title}</h1><p className="text-muted-foreground ksap-prose">{page.description}</p></div>
        <Suspense fallback={<p role="status">Loading examples…</p>}><Page /></Suspense>
      </main>
    </div>
  </div>;
}