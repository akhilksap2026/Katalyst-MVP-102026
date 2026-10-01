import { lazy } from "react";
import { Route, Routes } from "react-router";
import { AppShell } from "@/components/shell/app-shell";
import { AppProvider } from "@/state/app";
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
    <AppProvider>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/list" element={<ListPage />} />
          <Route path="/dictionary" element={<DictionaryPage />} />
          <Route path="/dictionary/joins" element={<DictionaryJoinsPage />} />
          <Route path="/dictionary/:release/:table" element={<DictionaryTablePage />} />
          <Route path="/agents" element={<AgentsPage />} />
          <Route path="/planned/:feature" element={<PlannedPage />} />
          <Route path="*" element={<HomePage />} />
        </Route>
      </Routes>
    </AppProvider>
  );
}
