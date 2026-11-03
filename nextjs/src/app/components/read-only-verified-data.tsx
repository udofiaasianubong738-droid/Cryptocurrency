type ControlRow = { financial_operations_enabled: boolean; updated_at: string } | null;
type PlanRow = { id: string; name: string; asset_code: string; risk_level: string; is_active: boolean; created_at: string };
type RequestRow = { id: string; amount: number | string; currency_code: string; asset_code: string | null; status: string; created_at: string };

function date(value: string) { const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? "Date unavailable" : parsed.toLocaleString(); }
function ReadOnlyTable({ title, rows, columns }: { title: string; rows: Record<string, unknown>[] | null; columns: [string, string][] }) {
  return <section className="surface-card" aria-label={title} style={{ margin: "18px 0", padding: 20 }}>
    <div className="section-title-row"><div><p className="section-kicker">LIVE SUPABASE RECORDS · READ ONLY</p><h2>{title}</h2></div><span className="status-pill status-locked">No write actions</span></div>
    {rows === null ? <p role="status">Records could not be verified for this session. Data is hidden rather than replaced with sample values.</p> : rows.length === 0 ? <p>No records returned by the authorized read-only query.</p> : <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}><thead><tr>{columns.map(([key,label])=><th key={key} style={{ padding: "10px 8px" }}>{label}</th>)}</tr></thead><tbody>{rows.map((row,i)=><tr key={String(row.id ?? i)}>{columns.map(([key])=><td key={key} style={{ padding: "10px 8px", borderTop: "1px solid var(--line)" }}>{String(row[key] ?? "—")}</td>)}</tr>)}</tbody></table></div>}
  </section>;
}

export default function ReadOnlyVerifiedData({ control, plans, deposits, withdrawals }: { control: ControlRow; plans: PlanRow[] | null; deposits: RequestRow[] | null; withdrawals: RequestRow[] | null }) {
  return <section aria-label="Verified backend data" style={{ marginBottom: 24 }}>
    <section className="safety-notice" aria-label="Financial operations status"><span className="safety-icon" aria-hidden="true">✓</span><div className="safety-copy"><strong>Server-authorized session · read-only data</strong><p>Financial operations are {control?.financial_operations_enabled === false ? "disabled" : control?.financial_operations_enabled === true ? "reported enabled by backend; actions remain disabled in this UI" : "not verified"}. This screen cannot approve or execute financial actions.</p>{control?.updated_at && <p>Control record updated: {date(control.updated_at)}</p>}</div><span className="status-pill status-locked">Read only</span></section>
    <ReadOnlyTable title="Investment plans" rows={plans?.map(p=>({...p, created_at:date(p.created_at), is_active:p.is_active ? "Active" : "Inactive"})) ?? null} columns={[["name","Plan"],["asset_code","Asset"],["risk_level","Risk"],["is_active","Status"],["created_at","Created"]]} />
    <ReadOnlyTable title="Deposit requests" rows={deposits?.map(r=>({...r, amount:String(r.amount), created_at:date(r.created_at)})) ?? null} columns={[["amount","Amount"],["currency_code","Currency"],["asset_code","Asset"],["status","Status"],["created_at","Created"]]} />
    <ReadOnlyTable title="Withdrawal requests" rows={withdrawals?.map(r=>({...r, amount:String(r.amount), created_at:date(r.created_at)})) ?? null} columns={[["amount","Amount"],["currency_code","Currency"],["asset_code","Asset"],["status","Status"],["created_at","Created"]]} />
  </section>;
}
