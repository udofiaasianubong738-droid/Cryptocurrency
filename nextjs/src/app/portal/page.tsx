import styles from "./customer-portal.module.css";

export const metadata = {
  title: "Customer Portal Preview",
  description: "CryptoInvest customer portal foundation. Account data and financial actions are not enabled.",
  robots: { index: false, follow: false },
};

const areas = [
  {
    number: "01",
    title: "Account overview",
    description: "A private view of your verified profile and account status.",
    status: "Coming after secure sign-in",
  },
  {
    number: "02",
    title: "Investment plans",
    description: "Review plan information published by CryptoInvest administrators.",
    status: "Read-only phase",
  },
  {
    number: "03",
    title: "Account activity",
    description: "A clear history of account events, backed by verified records.",
    status: "Not connected",
  },
];

export default function CustomerPortalPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <a className={styles.brand} href="/portal" aria-label="CryptoInvest customer portal home">
          <span className={styles.brandMark} aria-hidden="true">C</span>
          <span>Crypto<span className={styles.brandAccent}>Invest</span></span>
        </a>
        <span className={styles.previewBadge}>Customer portal preview</span>
      </header>

      <section className={styles.hero} aria-labelledby="portal-title">
        <p className={styles.eyebrow}>YOUR ACCOUNT, CLEARLY PRESENTED</p>
        <h1 id="portal-title">A clearer view of your CryptoInvest account.</h1>
        <p className={styles.intro}>
          The customer portal is being prepared with privacy and account security first.
          This preview contains no personal account records and does not connect to live financial services.
        </p>
        <div className={styles.notice} role="status">
          <span className={styles.noticeDot} aria-hidden="true" />
          <div>
            <strong>Customer sign-in is not enabled yet</strong>
            <p>Please do not use the CEO administration sign-in for a customer account.</p>
          </div>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="areas-title">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>PORTAL AREAS</p>
            <h2 id="areas-title">Designed around your account</h2>
          </div>
          <span className={styles.readOnly}>Read-only foundation</span>
        </div>
        <div className={styles.grid}>
          {areas.map((area) => (
            <article className={styles.card} key={area.number}>
              <span className={styles.cardNumber}>{area.number}</span>
              <h3>{area.title}</h3>
              <p>{area.description}</p>
              <span className={styles.cardStatus}>{area.status}</span>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.safety} aria-label="Financial safety status">
        <div>
          <p className={styles.eyebrow}>SAFETY STATUS</p>
          <h2>Financial operations are disabled.</h2>
          <p>This preview cannot submit deposits, withdrawals, transfers, trades, or payouts.</p>
        </div>
        <span className={styles.lock} aria-hidden="true">LOCKED</span>
      </section>

      <footer className={styles.footer}>
        <span>© {new Date().getFullYear()} CryptoInvest</span>
        <span>Customer experience foundation · No live account data</span>
      </footer>
    </main>
  );
}
