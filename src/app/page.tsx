import Dashboard from "../components/Dashboard";
import { ErrorBoundary } from "../components/ErrorBoundary";

export default function Home() {
  return (
    <main className="min-h-screen font-sans transition-colors duration-300">
      <ErrorBoundary>
        <Dashboard />
      </ErrorBoundary>
    </main>
  );
}
