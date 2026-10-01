import { lazy, Suspense } from "react";
import { Route, Switch } from "wouter";
import { AppShell } from "@/components/shell/app-shell";
import { AppProvider } from "@/state/app";
import { ListToolProvider } from "@/state/list-tool";
import { DictionaryProvider } from "@/state/dictionary";
import { TooltipProvider } from "@workspace/ksap-cloud-ui/components/ui/tooltip";
import HomePage from "@/pages/home";

// Route-level code splitting; the shell shows a skeleton and reveals the page with a transition.
const ListPage = lazy(() => import("@/pages/list"));
const DictionaryPage = lazy(() => import("@/pages/dictionary"));
const DictionaryTablePage = lazy(() => import("@/pages/dictionary-table"));
const DictionaryJoinsPage = lazy(() => import("@/pages/dictionary-joins"));
const AgentsPage = lazy(() => import("@/pages/agents"));
const PlannedPage = lazy(() => import("@/pages/planned"));

export default function App() {
  return (
    <TooltipProvider delayDuration={150}>
    <AppProvider>
      <ListToolProvider>
        <DictionaryProvider>
          <Switch>
            <Route path="/dictionary/joins"><AppShell><Suspense fallback={null}><DictionaryJoinsPage /></Suspense></AppShell></Route>
            <Route path="/dictionary/:release/:table"><AppShell><Suspense fallback={null}><DictionaryTablePage /></Suspense></AppShell></Route>
            <Route path="/dictionary"><AppShell><Suspense fallback={null}><DictionaryPage /></Suspense></AppShell></Route>
            <Route path="/list"><AppShell><Suspense fallback={null}><ListPage /></Suspense></AppShell></Route>
            <Route path="/agents"><AppShell><Suspense fallback={null}><AgentsPage /></Suspense></AppShell></Route>
            <Route path="/planned/:feature"><AppShell><Suspense fallback={null}><PlannedPage /></Suspense></AppShell></Route>
            <Route path="/"><AppShell><HomePage /></AppShell></Route>
            <Route><AppShell><HomePage /></AppShell></Route>
          </Switch>
        </DictionaryProvider>
      </ListToolProvider>
    </AppProvider>
    </TooltipProvider>
  );
}
