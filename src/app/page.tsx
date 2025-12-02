import Dashboard from "../components/Dashboard";
import { ErrorBoundary } from "../components/ErrorBoundary";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 font-sans">
      <ErrorBoundary>
        <Dashboard />
      </ErrorBoundary>
    </main>
  );
}
