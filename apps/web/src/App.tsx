import { NavLink, Route, Routes } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { ScrumPage } from "./pages/ScrumPage";
import { FocusPage } from "./pages/FocusPage";
import { ManagerPage } from "./pages/ManagerPage";
import { ApolloProvider } from "./providers/ApolloProvider";
import { apolloClient } from "./lib/apollo-client";

export default function App() {
  return (
    <ApolloProvider client={apolloClient}>
      <div className="min-h-screen bg-slate-950 text-slate-50">
        <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <h1 className="text-xl font-semibold tracking-tight">Jira++</h1>
            <nav className="flex gap-3 text-sm">
              <NavLink className={linkClass} to="/">
                Home
              </NavLink>
              <NavLink className={linkClass} to="/scrum">
                Daily Scrum
              </NavLink>
              <NavLink className={linkClass} to="/focus">
                Developer Focus
              </NavLink>
              <NavLink className={linkClass} to="/manager">
                Manager Summary
              </NavLink>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-10">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/scrum" element={<ScrumPage />} />
            <Route path="/focus" element={<FocusPage />} />
            <Route path="/manager" element={<ManagerPage />} />
          </Routes>
        </main>
      </div>
    </ApolloProvider>
  );
}

function linkClass({ isActive }: { isActive: boolean }) {
  return [
    "rounded-md px-3 py-2 transition",
    isActive
      ? "bg-slate-50 text-slate-900"
      : "text-slate-300 hover:bg-slate-900 hover:text-slate-50",
  ].join(" ");
}
