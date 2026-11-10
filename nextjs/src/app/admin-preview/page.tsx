import DashboardApp from "../dashboard-app";

export const metadata = {
  title: "CryptoInvest Admin Frontend Preview",
  description: "Visual-only preview of the CryptoInvest administration interface. Backend services are not connected.",
  robots: { index: false, follow: false },
};

export default function AdminFrontendPreviewPage() {
  return (
    <>
      <div style={{padding:"10px 16px",background:"#fff7df",color:"#6b5519",fontSize:12,fontWeight:700,textAlign:"center"}}>
        FRONTEND PREVIEW ONLY · BACKEND NOT CONNECTED · FINANCIAL OPERATIONS DISABLED
      </div>
      <DashboardApp activeSection="overview" previewMode />
    </>
  );
}
