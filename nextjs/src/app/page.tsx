import AdminSessionGate from "./components/admin-session-gate";
import DashboardApp from "./dashboard-app";

export default function AdminHomePage() {
  return <AdminSessionGate><DashboardApp activeSection="overview" /></AdminSessionGate>;
}
