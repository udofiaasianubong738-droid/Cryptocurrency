import { LiveDashboardPage } from './components/LiveDashboardPage';

export default function App() {
  const hostname = window.location.hostname.toLowerCase();

  // The customer-facing Worker is deliberately read-only. The admin hostname
  // belongs to a separate, independently secured Worker and must never fall
  // through to the old prototype login screen.
  if (hostname === 'admin.cryptoinvest.com') {
    return (
      <main className="auth-shell">
        <section className="auth-card" role="status">
          <h1>Admin portal is separate</h1>
          <p className="auth-subtitle">
            This Worker serves public market information only. The admin portal
            must be served by its own secured Worker.
          </p>
        </section>
      </main>
    );
  }

  return <LiveDashboardPage />;
}
