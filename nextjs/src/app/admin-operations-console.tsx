"use client";

import { useCallback, useEffect, useState } from "react";
import type { CSSProperties, FormEvent, ReactNode } from "react";
import { createSupabaseBrowserClient } from "../lib/supabase/browser";

type Finding = { id: string; finding_type: string; severity: string; status: string; title: string; summary: string; recommendation: string | null; detected_at: string; resolution_note: string | null };
type EmailTemplate = { id: string; template_key: string; name: string; subject_template: string; body_text_template: string; category: string; enabled: boolean };
type OutboxItem = { id: string; recipient_email: string; category: string; subject: string; status: string; created_at: string; provider_error: string | null };
type InboundMessage = { id: string; sender_email: string; recipient_email: string; subject: string; received_at: string; status: string; body_text: string };
type ComplianceDoc = { id: string; document_key: string; version: number; jurisdiction: string; document_type: string; title: string; status: string; effective_at: string | null; created_at: string };

const panelStyle: CSSProperties = { border: "1px solid var(--ci-border, #dbe2ea)", borderRadius: 14, padding: 18, background: "var(--ci-card, #fff)", minWidth: 0 };
const inputStyle: React.CSSProperties = { display: "block", width: "100%", border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 12px", marginTop: 6, marginBottom: 12, background: "white", color: "#0f172a" };
const buttonStyle: React.CSSProperties = { border: "1px solid #cbd5e1", borderRadius: 8, padding: "9px 12px", cursor: "pointer", background: "#f8fafc", color: "#0f172a", fontWeight: 600 };
const labelStyle: React.CSSProperties = { display: "block", fontWeight: 600, fontSize: 13, color: "var(--ci-text, #334155)" };

function Notice({ children, kind = "info" }: { children: ReactNode; kind?: "info" | "error" | "success" }) {
  const color = kind === "error" ? "#b91c1c" : kind === "success" ? "#166534" : "#475569";
  return <p role={kind === "error" ? "alert" : "status"} style={{ color, background: kind === "error" ? "#fef2f2" : kind === "success" ? "#f0fdf4" : "#f8fafc", borderRadius: 8, padding: "10px 12px", fontSize: 13 }}>{children}</p>;
}

function useCeoSession() {
  const [state, setState] = useState<{ loading: boolean; allowed: boolean; userId: string | null; aal: string | null; error: string | null }>({ loading: true, allowed: false, userId: null, aal: null, error: null });
  const [client] = useState(() => createSupabaseBrowserClient());
  const refresh = useCallback(async () => {
    setState({ loading: true, allowed: false, userId: null, aal: null, error: null });
    try {
      const { data: userData, error: userError } = await client.auth.getUser();
      if (userError || !userData.user) throw new Error("Sign in with the authorized CEO account to continue.");
      const { data: assurance, error: assuranceError } = await client.auth.mfa.getAuthenticatorAssuranceLevel();
      if (assuranceError) throw assuranceError;
      if (assurance.currentLevel !== "aal2") {
        setState({ loading: false, allowed: false, userId: userData.user.id, aal: assurance.currentLevel, error: "A verified AAL2 authenticator session is required. Complete MFA before accessing this workspace." });
        return;
      }
      const { data: ceo, error: ceoError } = await client.from("ceo_admins").select("user_id,enabled").eq("user_id", userData.user.id).eq("enabled", true).maybeSingle();
      if (ceoError) throw ceoError;
      if (!ceo) {
        setState({ loading: false, allowed: false, userId: userData.user.id, aal: assurance.currentLevel, error: "This account is not an enabled CEO administrator." });
        return;
      }
      setState({ loading: false, allowed: true, userId: userData.user.id, aal: assurance.currentLevel, error: null });
    } catch (error) {
      setState({ loading: false, allowed: false, userId: null, aal: null, error: error instanceof Error ? error.message : "Unable to verify the CEO session." });
    }
  }, [client]);
  useEffect(() => { void refresh(); }, [refresh]);
  return { ...state, client, refresh };
}

function AdminAiPanel() {
  const auth = useCeoSession();
  const [rows, setRows] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState("medium");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [recommendation, setRecommendation] = useState("");

  const load = useCallback(async () => {
    if (!auth.allowed) return;
    setLoading(true);
    const { data, error } = await auth.client.from("admin_ai_findings").select("id,finding_type,severity,status,title,summary,recommendation,detected_at,resolution_note").order("detected_at", { ascending: false }).limit(100);
    setLoading(false);
    if (error) setMessage("Could not load findings: " + error.message);
    else { setRows((data || []) as Finding[]); setMessage(""); }
  }, [auth.allowed, auth.client]);
  useEffect(() => { void load(); }, [load]);

  async function runMonitor() {
    if (!auth.allowed) return;
    setMessage("Running security and data-quality checks…");
    const { data, error } = await auth.client.functions.invoke("admin-ai-monitor", { body: {} });
    if (error) setMessage("Monitoring run failed: " + error.message);
    else if (data?.error) setMessage("Monitoring run failed: " + data.error);
    else { setMessage(`Monitoring completed: ${data.findings_detected} finding(s) detected, ${data.findings_saved} new finding(s) recorded. Audit record: ${data.audit_recorded ? "written" : "not written"}.`); await load(); }
  }
  async function createFinding(event: FormEvent) {
    event.preventDefault();
    if (!auth.allowed || !auth.userId) return;
    const { error } = await auth.client.from("admin_ai_findings").insert({ finding_type: "workflow", severity, status: "open", title: title.trim(), summary: summary.trim(), recommendation: recommendation.trim() || null, evidence: { origin: "admin_console_manual_review" } });
    if (error) setMessage("Finding was not saved: " + error.message);
    else { setTitle(""); setSummary(""); setRecommendation(""); setMessage("Finding recorded for human review."); await load(); }
  }
  async function updateFinding(id: string, status: string) {
    const note = status === "resolved" ? window.prompt("Resolution note (required for your audit record):") : null;
    if (status === "resolved" && !note?.trim()) return;
    const { error } = await auth.client.from("admin_ai_findings").update({ status, reviewed_by: auth.userId, reviewed_at: new Date().toISOString(), resolution_note: note?.trim() || null }).eq("id", id);
    setMessage(error ? "Could not update finding: " + error.message : "Finding review updated.");
    if (!error) await load();
  }

  if (auth.loading) return <section style={panelStyle}><h2>AI Operations Centre</h2><p>Verifying CEO session and MFA…</p></section>;
  if (!auth.allowed) return <section style={panelStyle}><h2>AI Operations Centre</h2><Notice kind="error">{auth.error || "CEO AAL2 authorization required."}</Notice><button style={buttonStyle} onClick={() => void auth.refresh()}>Recheck session</button></section>;
  return <div style={{ display: "grid", gap: 16 }}>
    <section style={panelStyle}>
      <span className="ci-kicker">SECURITY AND DATA QUALITY</span><h2>AI Operations Centre</h2>
      <p className="ci-section-copy">Findings below come from the protected database. This console currently supports recording and triaging findings; automated AI detection and scheduled log ingestion are not yet connected, so no monitoring coverage is implied.</p>
      {message && <Notice kind={message.startsWith("Could not") || message.startsWith("Finding was not") ? "error" : "success"}>{message}</Notice>}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button style={buttonStyle} onClick={() => void load()} disabled={loading}>{loading ? "Refreshing…" : "Refresh findings"}</button><button style={buttonStyle} onClick={() => void runMonitor()}>Run security/data-quality scan</button></div>
      <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
        {rows.length === 0 && <Notice>No findings have been recorded yet, or the database returned no rows.</Notice>}
        {rows.map(row => <article key={row.id} style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}><strong>{row.title}</strong><span>{row.severity.toUpperCase()} · {row.status.replaceAll("_", " ")}</span></div>
          <p>{row.summary}</p>{row.recommendation && <p><strong>Recommendation:</strong> {row.recommendation}</p>}
          <small>Detected {new Date(row.detected_at).toLocaleString()} · {row.finding_type}</small>
          {row.status !== "resolved" && row.status !== "dismissed" && <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}><button style={buttonStyle} onClick={() => void updateFinding(row.id, "triaged")}>Mark triaged</button><button style={buttonStyle} onClick={() => void updateFinding(row.id, "resolved")}>Resolve with note</button><button style={buttonStyle} onClick={() => void updateFinding(row.id, "dismissed")}>Dismiss</button></div>}
          {row.resolution_note && <p><strong>Review note:</strong> {row.resolution_note}</p>}
        </article>)}
      </div>
    </section>
    <section style={panelStyle}><h2>Record a finding</h2><p>Use this for a human-observed issue until automated detectors are connected.</p>
      <form onSubmit={createFinding}>
        <label style={labelStyle}>Title<input style={inputStyle} required minLength={3} maxLength={200} value={title} onChange={e => setTitle(e.target.value)} /></label>
        <label style={labelStyle}>Severity<select style={inputStyle} value={severity} onChange={e => setSeverity(e.target.value)}><option value="info">Info</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></label>
        <label style={labelStyle}>Evidence summary<textarea style={{ ...inputStyle, minHeight: 100 }} required minLength={3} maxLength={5000} value={summary} onChange={e => setSummary(e.target.value)} /></label>
        <label style={labelStyle}>Recommended next step<textarea style={{ ...inputStyle, minHeight: 80 }} maxLength={5000} value={recommendation} onChange={e => setRecommendation(e.target.value)} /></label>
        <button style={buttonStyle} type="submit">Save finding</button>
      </form>
    </section>
  </div>;
}

function EmailPanel() {
  const auth = useCeoSession();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [outbox, setOutbox] = useState<OutboxItem[]>([]);
  const [inbox, setInbox] = useState<InboundMessage[]>([]);
  const [message, setMessage] = useState("");
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("service");
  const [templateName, setTemplateName] = useState("");
  const [templateSubject, setTemplateSubject] = useState("");
  const [templateBody, setTemplateBody] = useState("");
  const load = useCallback(async () => {
    if (!auth.allowed) return;
    const [t, o, i] = await Promise.all([
      auth.client.from("admin_email_templates").select("id,template_key,name,subject_template,body_text_template,category,enabled").order("name").limit(100),
      auth.client.from("admin_email_outbox").select("id,recipient_email,category,subject,status,created_at,provider_error").order("created_at", { ascending: false }).limit(100),
      auth.client.from("admin_inbound_messages").select("id,sender_email,recipient_email,subject,received_at,status,body_text").order("received_at", { ascending: false }).limit(50)
    ]);
    const error = t.error || o.error || i.error;
    if (error) setMessage("Email workspace query failed: " + error.message);
    else { setTemplates((t.data || []) as EmailTemplate[]); setOutbox((o.data || []) as OutboxItem[]); setInbox((i.data || []) as InboundMessage[]); setMessage(""); }
  }, [auth.allowed, auth.client]);
  useEffect(() => { void load(); }, [load]);
  async function saveTemplate(event: FormEvent) {
    event.preventDefault();
    if (!auth.allowed || !auth.userId) return;
    const key = templateName.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
    const { error } = await auth.client.from("admin_email_templates").insert({ template_key: key, name: templateName.trim(), subject_template: templateSubject.trim(), body_text_template: templateBody.trim(), category, created_by: auth.userId, updated_by: auth.userId });
    if (error) setMessage("Template not saved: " + error.message);
    else { setTemplateName(""); setTemplateSubject(""); setTemplateBody(""); setMessage("Template saved. It has not sent an email."); await load(); }
  }
  async function saveDraft(event: FormEvent) {
    event.preventDefault();
    if (!auth.allowed || !auth.userId) return;
    const { error } = await auth.client.from("admin_email_outbox").insert({ recipient_email: recipient.trim(), category, subject: subject.trim(), body_text: body.trim(), status: "draft", created_by: auth.userId });
    if (error) setMessage("Email draft not saved: " + error.message);
    else { setRecipient(""); setSubject(""); setBody(""); setMessage("Email saved as a draft. Delivery is not connected."); await load(); }
  }
  if (auth.loading) return <section style={panelStyle}><h2>Email and Notifications</h2><p>Verifying CEO session…</p></section>;
  if (!auth.allowed) return <section style={panelStyle}><h2>Email and Notifications</h2><Notice kind="error">{auth.error || "CEO AAL2 authorization required."}</Notice><button style={buttonStyle} onClick={() => void auth.refresh()}>Recheck session</button></section>;
  return <div style={{ display: "grid", gap: 16 }}>
    <section style={panelStyle}><span className="ci-kicker">MAIL OPERATIONS</span><h2>Email and Notifications</h2><p className="ci-section-copy">Templates and drafts are stored in Supabase. Microsoft 365 Graph is not connected yet; inbound messages only appear after a verified ingestion service is configured. No message is sent by this screen.</p>{message && <Notice kind={message.includes("failed") || message.includes("not saved") ? "error" : "success"}>{message}</Notice>}<button style={buttonStyle} onClick={() => void load()}>Refresh mailbox and outbox</button></section>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }}>
      <section style={panelStyle}><h3>Create email template</h3><form onSubmit={saveTemplate}>
        <label style={labelStyle}>Template name<input style={inputStyle} required minLength={3} maxLength={160} value={templateName} onChange={e => setTemplateName(e.target.value)} /></label>
        <label style={labelStyle}>Category<select style={inputStyle} value={category} onChange={e => setCategory(e.target.value)}>{["security","account","investment","support","service","marketing"].map(x=><option key={x} value={x}>{x}</option>)}</select></label>
        <label style={labelStyle}>Subject<input style={inputStyle} required maxLength={250} value={templateSubject} onChange={e => setTemplateSubject(e.target.value)} /></label>
        <label style={labelStyle}>Plain-text body<textarea style={{ ...inputStyle, minHeight: 120 }} required maxLength={20000} value={templateBody} onChange={e => setTemplateBody(e.target.value)} /></label>
        <button style={buttonStyle}>Save template</button>
      </form></section>
      <section style={panelStyle}><h3>Compose email draft</h3><form onSubmit={saveDraft}>
        <label style={labelStyle}>Recipient email<input style={inputStyle} type="email" required maxLength={320} value={recipient} onChange={e => setRecipient(e.target.value)} /></label>
        <label style={labelStyle}>Category<select style={inputStyle} value={category} onChange={e => setCategory(e.target.value)}>{["security","account","investment","support","service","marketing"].map(x=><option key={x} value={x}>{x}</option>)}</select></label>
        <label style={labelStyle}>Subject<input style={inputStyle} required maxLength={250} value={subject} onChange={e => setSubject(e.target.value)} /></label>
        <label style={labelStyle}>Message<textarea style={{ ...inputStyle, minHeight: 120 }} required maxLength={20000} value={body} onChange={e => setBody(e.target.value)} /></label>
        <button style={buttonStyle}>Save draft only</button>
      </form></section>
    </div>
    <section style={panelStyle}><h3>Templates ({templates.length})</h3>{templates.length === 0 ? <p>No templates yet.</p> : templates.map(t=><article key={t.id} style={{ padding: 10, borderBottom: "1px solid #e2e8f0" }}><strong>{t.name}</strong><p>{t.subject_template}</p><small>{t.category} · {t.enabled ? "enabled" : "disabled"}</small></article>)}</section>
    <section style={panelStyle}><h3>Outbox ({outbox.length})</h3>{outbox.length === 0 ? <p>No drafts or delivery records yet.</p> : outbox.map(o=><article key={o.id} style={{ padding: 10, borderBottom: "1px solid #e2e8f0" }}><strong>{o.subject}</strong><p>{o.recipient_email} · {o.category}</p><small>{o.status} · created {new Date(o.created_at).toLocaleString()}</small>{o.provider_error && <p role="alert">{o.provider_error}</p>}</article>)}</section>
    <section style={panelStyle}><h3>Inbound messages ({inbox.length})</h3>{inbox.length === 0 ? <p>No ingested inbound messages. This does not mean the mailbox is empty; Graph sync is not connected.</p> : inbox.map(i=><details key={i.id} style={{ padding: 10, borderBottom: "1px solid #e2e8f0" }}><summary>{i.subject} — {i.sender_email}</summary><small>To {i.recipient_email} · {new Date(i.received_at).toLocaleString()} · {i.status}</small><p style={{ whiteSpace: "pre-wrap" }}>{i.body_text}</p></details>)}</section>
  </div>;
}

function CompliancePanel() {
  const auth = useCeoSession();
  const [docs, setDocs] = useState<ComplianceDoc[]>([]);
  const [message, setMessage] = useState("");
  const [key, setKey] = useState("");
  const [version, setVersion] = useState("1");
  const [jurisdiction, setJurisdiction] = useState("");
  const [type, setType] = useState("risk_disclosure");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const load = useCallback(async () => {
    if (!auth.allowed) return;
    const { data, error } = await auth.client.from("admin_compliance_documents").select("id,document_key,version,jurisdiction,document_type,title,status,effective_at,created_at").order("created_at", { ascending: false }).limit(100);
    if (error) setMessage("Compliance records could not be loaded: " + error.message);
    else { setDocs((data || []) as ComplianceDoc[]); setMessage(""); }
  }, [auth.allowed, auth.client]);
  useEffect(() => { void load(); }, [load]);
  async function saveDraft(event: FormEvent) {
    event.preventDefault();
    if (!auth.allowed || !auth.userId) return;
    const { error } = await auth.client.from("admin_compliance_documents").insert({ document_key: key.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-"), version: Number(version), jurisdiction: jurisdiction.trim(), document_type: type, title: title.trim(), content_markdown: content.trim(), status: "draft", created_by: auth.userId });
    if (error) setMessage("Document not saved: " + error.message);
    else { setKey(""); setVersion("1"); setJurisdiction(""); setTitle(""); setContent(""); setMessage("Draft saved. Publishing and legal review are not performed by this action."); await load(); }
  }
  if (auth.loading) return <section style={panelStyle}><h2>Compliance and Audit</h2><p>Verifying CEO session…</p></section>;
  if (!auth.allowed) return <section style={panelStyle}><h2>Compliance and Audit</h2><Notice kind="error">{auth.error || "CEO AAL2 authorization required."}</Notice><button style={buttonStyle} onClick={() => void auth.refresh()}>Recheck session</button></section>;
  return <div style={{ display: "grid", gap: 16 }}>
    <section style={panelStyle}><span className="ci-kicker">GOVERNANCE</span><h2>Compliance and Audit</h2><p className="ci-section-copy">Documents are versioned drafts until reviewed and published through a separately authorized process. Select jurisdiction with qualified legal guidance. Retention schedules must be configured and tested before they can be enforced.</p>{message && <Notice kind={message.includes("could not") || message.includes("not saved") ? "error" : "success"}>{message}</Notice>}<button style={buttonStyle} onClick={() => void load()}>Refresh documents</button></section>
    <section style={panelStyle}><h3>Create compliance document draft</h3><form onSubmit={saveDraft}>
      <label style={labelStyle}>Document key<input style={inputStyle} required minLength={3} maxLength={120} value={key} onChange={e => setKey(e.target.value)} placeholder="risk-disclosure" /></label>
      <label style={labelStyle}>Version<input style={inputStyle} type="number" required min={1} step={1} value={version} onChange={e => setVersion(e.target.value)} /></label>
      <label style={labelStyle}>Jurisdiction<input style={inputStyle} required minLength={2} maxLength={120} value={jurisdiction} onChange={e => setJurisdiction(e.target.value)} placeholder="Enter legally reviewed jurisdiction" /></label>
      <label style={labelStyle}>Document type<select style={inputStyle} value={type} onChange={e => setType(e.target.value)}>{["terms","privacy","risk_disclosure","aml_policy","complaints_policy","retention_policy","other"].map(x=><option key={x} value={x}>{x.replaceAll("_", " ")}</option>)}</select></label>
      <label style={labelStyle}>Title<input style={inputStyle} required minLength={3} maxLength={200} value={title} onChange={e => setTitle(e.target.value)} /></label>
      <label style={labelStyle}>Content (Markdown/plain text)<textarea style={{ ...inputStyle, minHeight: 180 }} required minLength={10} maxLength={50000} value={content} onChange={e => setContent(e.target.value)} /></label>
      <button style={buttonStyle}>Save draft</button>
    </form></section>
    <section style={panelStyle}><h3>Document register ({docs.length})</h3>{docs.length === 0 ? <p>No compliance documents registered.</p> : docs.map(d=><article key={d.id} style={{ padding: 10, borderBottom: "1px solid #e2e8f0" }}><strong>{d.title}</strong><p>{d.document_type.replaceAll("_", " ")} · {d.jurisdiction} · version {d.version}</p><small>{d.status} · created {new Date(d.created_at).toLocaleString()}</small></article>)}</section>
  </div>;
}

function SystemTestingPanel() {
  const auth = useCeoSession();
  const [results, setResults] = useState<{ name: string; status: string; detail: string }[]>([]);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState("");
  const run = useCallback(async () => {
    setRunning(true); setMessage("");
    if (!auth.allowed) { setResults([{ name: "CEO authorization and MFA", status: "FAIL", detail: auth.error || "AAL2 CEO session not verified." }]); setRunning(false); return; }
    const checks: { name: string; status: string; detail: string }[] = [];
    const [{ data: control, error: controlError }, { error: findingsError }, { error: templateError }, { error: docError }, { error: inboxError }] = await Promise.all([
      auth.client.from("platform_control").select("financial_operations_enabled").limit(1).maybeSingle(),
      auth.client.from("admin_ai_findings").select("id").limit(1),
      auth.client.from("admin_email_templates").select("id").limit(1),
      auth.client.from("admin_compliance_documents").select("id").limit(1),
      auth.client.from("admin_inbound_messages").select("id").limit(1)
    ]);
    checks.push({ name: "CEO authorization + AAL2", status: "PASS", detail: "Current browser session passed CEO row and authenticator assurance checks." });
    checks.push({ name: "Supabase platform-control read", status: controlError ? "FAIL" : "PASS", detail: controlError ? controlError.message : "Platform control row is readable." });
    checks.push({ name: "Financial safety gate", status: !controlError && control?.financial_operations_enabled === false ? "PASS" : "FAIL", detail: !controlError && control?.financial_operations_enabled === false ? "financial_operations_enabled is false." : "Could not verify the financial safety gate is false." });
    checks.push({ name: "AI findings table permission", status: findingsError ? "FAIL" : "PASS", detail: findingsError?.message || "Authorized query succeeded." });
    checks.push({ name: "Email workspace table permission", status: templateError || inboxError ? "FAIL" : "PASS", detail: templateError?.message || inboxError?.message || "Templates and inbound-message reads succeeded; Graph delivery is not tested." });
    checks.push({ name: "Compliance document permission", status: docError ? "FAIL" : "PASS", detail: docError?.message || "Authorized query succeeded." });
    checks.push({ name: "Microsoft Graph mail delivery", status: "NOT CONFIGURED", detail: "No provider send/receive test has been run." });
    checks.push({ name: "Automated AI monitoring", status: "NOT CONFIGURED", detail: "No scheduled detector/alert ingestion has been run." });
    checks.push({ name: "Production build and E2E", status: "NOT RUN", detail: "This panel does not replace CI build, browser E2E, or production smoke tests." });
    setResults(checks); setRunning(false);
  }, [auth.allowed, auth.client, auth.error]);
  useEffect(() => { if (!auth.loading && auth.allowed) void run(); }, [auth.loading, auth.allowed, run]);
  if (auth.loading) return <section style={panelStyle}><h2>System Settings and Testing</h2><p>Verifying CEO session…</p></section>;
  if (!auth.allowed) return <section style={panelStyle}><h2>System Settings and Testing</h2><Notice kind="error">{auth.error || "CEO AAL2 authorization required."}</Notice><button style={buttonStyle} onClick={() => void auth.refresh()}>Recheck session</button></section>;
  return <div style={{ display: "grid", gap: 16 }}>
    <section style={panelStyle}><span className="ci-kicker">CONFIGURATION AND TESTS</span><h2>System Settings and Testing</h2><p className="ci-section-copy">These checks run from your authenticated browser session against Supabase RLS-protected reads. They are not a substitute for backend integration tests or a production deployment check.</p><button style={buttonStyle} onClick={() => void run()} disabled={running}>{running ? "Running checks…" : "Run checks again"}</button>
      {message && <Notice>{message}</Notice>}
      <div style={{ display: "grid", gap: 8, marginTop: 14 }}>{results.map((r, index)=><article key={r.name} style={{ display: "grid", gridTemplateColumns: "minmax(170px,1fr) auto", gap: 10, padding: 12, border: "1px solid #e2e8f0", borderRadius: 8 }}><div><strong>{r.name}</strong><p style={{ margin: "4px 0 0", fontSize: 13 }}>{r.detail}</p></div><strong aria-label={"Status " + r.status}>{r.status}</strong></article>)}</div>
    </section>
    <section style={panelStyle}><h3>Non-negotiable controls</h3><ul><li>One CEO administrator; no customer self-promotion.</li><li>Require a verified AAL2 session for administrative operations.</li><li>Keep money movement disabled until independently cleared.</li><li>Never put service-role keys or Microsoft Graph secrets in browser code.</li><li>All sensitive actions require a server-side authorization check and audit record.</li></ul></section>
  </div>;
}

export default function AdminOperationsConsole({ section }: { section: "ai-operations" | "communications" | "compliance-audit" | "system-testing" }) {
  if (section === "ai-operations") return <AdminAiPanel />;
  if (section === "communications") return <EmailPanel />;
  if (section === "compliance-audit") return <CompliancePanel />;
  return <SystemTestingPanel />;
}
