import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Calendar, Users, Receipt, AlertCircle, CheckCircle,
  Trash2, Lock, Ban, FileText,
} from "lucide-react";
import {
  Button, Card, CardHeader, StatusPill, Spinner, Modal,
  colors, typography, spacing, radius,
} from "../design-system";

const API_URL = process.env.REACT_APP_API_URL || "https://api.getnovala.com";

const getToken = () =>
  localStorage.getItem("access_token") || localStorage.getItem("token") || "";

const authHeaders = () => ({
  "Authorization": `Bearer ${getToken()}`,
  "Content-Type": "application/json",
});

const formatCurrency = (value, currency) => {
  if (value === null || value === undefined) return "$0.00";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "$0.00";
  try {
    return new Intl.NumberFormat("en-CA", { style: "currency", currency: currency || "CAD" }).format(num);
  } catch (e) { return num.toFixed(2); }
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" });
  } catch (e) { return dateStr; }
};

const getStubName = (stub) =>
  stub.employee_name || stub.employee?.name ||
  [stub.employee?.first_name, stub.employee?.last_name].filter(Boolean).join(" ") ||
  (stub.first_name && stub.last_name && (stub.first_name + " " + stub.last_name)) || "Unnamed";

const iconWrapStyle = {
  width: 38, height: 38, background: colors.brandSoft, borderRadius: radius.lg,
  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
};

function ErrorBlock({ title, message }) {
  return (
    <Card style={{
      background: colors.dangerSoft, border: `1px solid ${colors.danger}40`,
      display: "flex", alignItems: "flex-start", gap: spacing[3], marginBottom: spacing[5],
    }}>
      <AlertCircle size={20} color={colors.danger} style={{ flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: 1 }}>
        <div style={{ ...typography.bodyStrong, color: colors.dangerText, marginBottom: 4 }}>
          {title || "Something went wrong"}
        </div>
        <div style={{ ...typography.caption, color: colors.dangerText }}>{message}</div>
      </div>
    </Card>
  );
}

function SummaryStat({ label, value, emphasis }) {
  return (
    <div>
      <div style={{
        ...typography.tiny, color: colors.textMuted, textTransform: "uppercase",
        letterSpacing: "0.08em", marginBottom: 6,
      }}>{label}</div>
      <div style={{
        fontSize: emphasis ? 28 : 20, fontWeight: 700,
        color: emphasis ? colors.brandPrimary : colors.textPrimary,
        fontFeatureSettings: '"tnum" 1', letterSpacing: "-0.02em", lineHeight: 1.2,
      }}>{value}</div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", padding: `${spacing[3]}px 0`,
      borderBottom: `1px solid ${colors.borderSubtle}`,
    }}>
      <div style={{ ...typography.bodySm, color: colors.textSecondary }}>{label}</div>
      <div style={{ ...typography.body, color: colors.textPrimary, fontFeatureSettings: '"tnum" 1' }}>{value}</div>
    </div>
  );
}

const thStyle = {
  textAlign: "left", padding: "12px 20px",
  ...typography.labelUppercase, color: colors.textMuted, whiteSpace: "nowrap",
};
const tdStyle = { padding: "16px 20px", ...typography.body };

export default function PayRunDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [run, setRun] = useState(null);
  const [stubs, setStubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("overview");

  const [confirm, setConfirm] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [actionError, setActionError] = useState(null);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      let runData = null;
      let runRes = await fetch(`${API_URL}/api/v1/payroll/runs/${id}`, { headers: authHeaders() });
      if (runRes.status === 404 || runRes.status === 405) {
        const listRes = await fetch(`${API_URL}/api/v1/payroll/runs`, { headers: authHeaders() });
        if (!listRes.ok) throw new Error(`Could not load runs (HTTP ${listRes.status})`);
        const list = await listRes.json();
        runData = (Array.isArray(list) ? list : []).find((r) => String(r.id) === String(id));
        if (!runData) throw new Error("Pay run not found");
      } else if (!runRes.ok) {
        const errBody = await runRes.json().catch(() => ({}));
        throw new Error(errBody.detail || `Could not load run (HTTP ${runRes.status})`);
      } else {
        runData = await runRes.json();
      }
      setRun(runData);

      const stubsRes = await fetch(`${API_URL}/api/v1/payroll/runs/${id}/stubs`, { headers: authHeaders() });
      if (stubsRes.ok) {
        const stubsData = await stubsRes.json();
        setStubs(Array.isArray(stubsData) ? stubsData : (stubsData.stubs || stubsData.data || []));
      } else { setStubs([]); }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, [id]);

  const runAction = async (path, method, navigateAfter) => {
    setProcessing(true);
    setActionError(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/payroll/runs/${id}${path}`, {
        method, headers: authHeaders(),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.detail || `Action failed (HTTP ${res.status})`);
      }
      setConfirm(null);
      if (navigateAfter) navigate("/payroll/runs");
      else await loadAll();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleFinalize = () => runAction("/finalize", "POST", false);
  const handleVoid = () => runAction("/void", "POST", false);
  const handleDelete = () => runAction("", "DELETE", true);

  if (loading) {
    return (
      <div style={{ background: colors.bgPage, minHeight: "100vh", padding: `${spacing[10]}px` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center", paddingTop: spacing[12] }}>
          <Spinner size={20} label="Loading pay run..." inline />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        background: colors.bgPage, minHeight: "100vh", fontFamily: typography.fontFamily,
        padding: `${spacing[8]}px ${spacing[10]}px`, boxSizing: "border-box",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <button onClick={() => navigate("/payroll/runs")} style={{
            background: "none", border: "none", cursor: "pointer",
            display: "inline-flex", alignItems: "center", gap: 6,
            ...typography.bodySm, color: colors.textSecondary, padding: 0,
            marginBottom: spacing[6], fontFamily: typography.fontFamily,
          }}>
            <ArrowLeft size={16} /> Pay runs
          </button>
          <ErrorBlock title="Could not load pay run" message={error} />
          <Button variant="secondary" onClick={loadAll}>Try again</Button>
        </div>
      </div>
    );
  }

  const status = (run.status || "draft").toLowerCase();
  const canFinalize = status === "calculated" || status === "draft";
  const canDelete = status === "calculated" || status === "draft";
  const canVoid = status === "finalized";
  const isVoided = status === "voided";

  return (
    <div style={{
      background: colors.bgPage, minHeight: "100vh", fontFamily: typography.fontFamily,
      padding: `${spacing[8]}px ${spacing[10]}px`, boxSizing: "border-box",
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        <button onClick={() => navigate("/payroll/runs")} style={{
          background: "none", border: "none", cursor: "pointer",
          display: "inline-flex", alignItems: "center", gap: 6,
          ...typography.bodySm, color: colors.textSecondary, padding: 0,
          marginBottom: spacing[3], fontFamily: typography.fontFamily,
        }}>
          <ArrowLeft size={16} /> Pay runs
        </button>

        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          gap: spacing[4], flexWrap: "wrap", marginBottom: spacing[8],
        }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <div style={{ display: "flex", alignItems: "center", gap: spacing[3], marginBottom: spacing[1] }}>
              <h1 style={{ ...typography.displaySm, color: colors.textPrimary, margin: 0 }}>
                {formatDate(run.pay_period_start)} to {formatDate(run.pay_period_end)}
              </h1>
              <StatusPill status={status} />
            </div>
            <p style={{ ...typography.body, color: colors.textSecondary, margin: 0 }}>
              Pay date {formatDate(run.pay_date)}
              {run.employee_count !== undefined && (<>{" · "}{run.employee_count} employees</>)}
              {run.country && (<>{" · "}{run.country}{run.subnational ? ` (${run.subnational})` : ""}</>)}
            </p>
          </div>
          <div style={{ display: "flex", gap: spacing[2], flexWrap: "wrap" }}>
            {canDelete && (
              <Button variant="ghost" onClick={() => setConfirm("delete")} iconLeft={<Trash2 size={14} />}>
                Delete
              </Button>
            )}
            {canFinalize && (
              <Button variant="primary" onClick={() => setConfirm("finalize")} iconLeft={<Lock size={14} />}>
                Finalize
              </Button>
            )}
            {canVoid && (
              <Button variant="secondary" onClick={() => setConfirm("void")} iconLeft={<Ban size={14} />}>
                Void
              </Button>
            )}
          </div>
        </div>

        {actionError && <ErrorBlock title="Action failed" message={actionError} />}

        {isVoided && (
          <Card style={{
            background: colors.bgCardActive, border: `1px dashed ${colors.borderDefault}`,
            marginBottom: spacing[5], display: "flex", alignItems: "center", gap: spacing[3],
          }}>
            <Ban size={18} color={colors.textMuted} />
            <div style={{ ...typography.bodySm, color: colors.textSecondary }}>
              This pay run was voided. It cannot be edited or finalized.
            </div>
          </Card>
        )}

        <Card style={{ marginBottom: spacing[5] }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: spacing[6],
          }}>
            <SummaryStat label="Total gross" value={formatCurrency(run.total_gross, run.currency)} />
            <SummaryStat label="Deductions" value={formatCurrency(run.total_employee_deductions, run.currency)} />
            <SummaryStat label="Employer cost" value={formatCurrency(run.total_employer_contributions, run.currency)} />
            <SummaryStat label="Total net" value={formatCurrency(run.total_net, run.currency)} emphasis />
          </div>
        </Card>

        <div style={{
          display: "flex", gap: spacing[6],
          borderBottom: `1px solid ${colors.borderDefault}`, marginBottom: spacing[5],
        }}>
          {[
            { key: "overview", label: "Overview", icon: <FileText size={15} /> },
            { key: "stubs", label: `Pay stubs (${stubs.length})`, icon: <Receipt size={15} /> },
          ].map((t) => {
            const active = tab === t.key;
            return (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                background: "none", border: "none", padding: `${spacing[3]}px 0`,
                cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8,
                ...typography.bodyMd, fontWeight: active ? 600 : 500,
                color: active ? colors.textPrimary : colors.textSecondary,
                borderBottom: active ? `2px solid ${colors.brandPrimary}` : "2px solid transparent",
                marginBottom: -1, fontFamily: typography.fontFamily,
                transition: "color 150ms ease, border-color 150ms ease",
              }}>
                {t.icon}{t.label}
              </button>
            );
          })}
        </div>

        {tab === "overview" && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: spacing[5],
          }}>
            <Card>
              <CardHeader
                title="Run details"
                icon={<div style={iconWrapStyle}><Calendar size={18} color={colors.brandPrimary} /></div>}
              />
              <div>
                <DetailRow label="Pay period start" value={formatDate(run.pay_period_start)} />
                <DetailRow label="Pay period end" value={formatDate(run.pay_period_end)} />
                <DetailRow label="Pay date" value={formatDate(run.pay_date)} />
                <DetailRow label="Country" value={`${run.country || "CA"}${run.subnational ? ` (${run.subnational})` : ""}`} />
                {run.created_at && <DetailRow label="Created" value={formatDate(run.created_at)} />}
                <div style={{ display: "flex", justifyContent: "space-between", padding: `${spacing[3]}px 0` }}>
                  <div style={{ ...typography.bodySm, color: colors.textSecondary }}>Status</div>
                  <StatusPill status={status} />
                </div>
              </div>
            </Card>
            <Card>
              <CardHeader
                title="Totals breakdown"
                icon={<div style={iconWrapStyle}><CheckCircle size={18} color={colors.brandPrimary} /></div>}
              />
              <div>
                <DetailRow label="Gross pay" value={formatCurrency(run.total_gross, run.currency)} />
                <DetailRow label="Employee deductions" value={formatCurrency(run.total_employee_deductions, run.currency)} />
                <DetailRow label="Net pay" value={formatCurrency(run.total_net, run.currency)} />
                <DetailRow label="Employer contributions" value={formatCurrency(run.total_employer_contributions, run.currency)} />
                <DetailRow label="Remittance owed" value={formatCurrency(run.total_remittance_owed, run.currency)} />
              </div>
            </Card>
          </div>
        )}

        {tab === "stubs" && (
          <Card noPadding>
            {stubs.length === 0 ? (
              <div style={{ padding: `${spacing[10]}px ${spacing[8]}px`, textAlign: "center" }}>
                <div style={{
                  width: 56, height: 56, background: colors.bgCardActive, borderRadius: radius.pill,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  marginBottom: spacing[3],
                }}>
                  <Receipt size={24} color={colors.textMuted} />
                </div>
                <div style={{ ...typography.bodyStrong, color: colors.textPrimary, marginBottom: spacing[1] }}>
                  No pay stubs yet
                </div>
                <p style={{ ...typography.bodySm, color: colors.textSecondary, margin: 0 }}>
                  Stubs will appear here once this run is calculated.
                </p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{
                  width: "100%", borderCollapse: "collapse",
                  fontFamily: typography.fontFamily, minWidth: 700,
                }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${colors.borderSubtle}` }}>
                      <th style={thStyle}>Employee</th>
                      <th style={{ ...thStyle, textAlign: "right" }}>Gross</th>
                      <th style={{ ...thStyle, textAlign: "right" }}>Deductions</th>
                      <th style={{ ...thStyle, textAlign: "right" }}>Employer cost</th>
                      <th style={{ ...thStyle, textAlign: "right" }}>Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stubs.map((stub, idx) => (
                      <tr
                        key={stub.id || idx}
                        onClick={() => stub.id && navigate(`/payroll/runs/${id}/stubs/${stub.id}`)}
                        onMouseEnter={(e) => { if (stub.id) e.currentTarget.style.background = colors.bgCardHover; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = colors.bgCard; }}
                        style={{
                          borderBottom: idx < stubs.length - 1 ? `1px solid ${colors.borderSubtle}` : "none",
                          cursor: stub.id ? "pointer" : "default",
                          transition: "background 150ms ease",
                        }}
                      >
                        <td style={tdStyle}>
                          <div style={{ ...typography.bodyMd, color: colors.textPrimary }}>
                            {getStubName(stub)}
                          </div>
                          {stub.employee_id && (
                            <div style={{ ...typography.caption, color: colors.textMuted }}>
                              ID {String(stub.employee_id).slice(0, 8)}
                            </div>
                          )}
                        </td>
                        <td style={{ ...tdStyle, textAlign: "right", fontFeatureSettings: '"tnum" 1' }}>
                          {formatCurrency(stub.gross_pay || stub.total_gross || stub.gross, run.currency)}
                        </td>
                        <td style={{ ...tdStyle, textAlign: "right", color: colors.textSecondary, fontFeatureSettings: '"tnum" 1' }}>
                          {formatCurrency(stub.total_deductions || stub.deductions, run.currency)}
                        </td>
                        <td style={{ ...tdStyle, textAlign: "right", color: colors.textSecondary, fontFeatureSettings: '"tnum" 1' }}>
                          {formatCurrency(stub.employer_contributions, run.currency)}
                        </td>
                        <td style={{
                          ...tdStyle, textAlign: "right",
                          ...typography.bodyStrong, color: colors.textPrimary,
                          fontFeatureSettings: '"tnum" 1',
                        }}>
                          {formatCurrency(stub.net_pay || stub.total_net || stub.net, run.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}
      </div>

      <Modal open={confirm === "finalize"} onClose={() => !processing && setConfirm(null)} title="Finalize this pay run?">
        <p style={{ ...typography.body, color: colors.textSecondary, margin: `0 0 ${spacing[5]}px` }}>
          Once finalized, this run is locked and the pay stubs become a source of truth for T4s, ROEs, and remittance reports. You cannot edit hours or amounts afterwards.
        </p>
        <div style={{ display: "flex", gap: spacing[2], justifyContent: "flex-end" }}>
          <Button variant="ghost" onClick={() => setConfirm(null)} disabled={processing}>Cancel</Button>
          <Button variant="primary" onClick={handleFinalize} disabled={processing}>
            {processing ? "Finalizing..." : "Yes, finalize"}
          </Button>
        </div>
      </Modal>

      <Modal open={confirm === "void"} onClose={() => !processing && setConfirm(null)} title="Void this pay run?">
        <p style={{ ...typography.body, color: colors.textSecondary, margin: `0 0 ${spacing[5]}px` }}>
          Voiding marks this run inactive. The pay stubs remain in the audit trail but are excluded from current totals. This cannot be reverted.
        </p>
        <div style={{ display: "flex", gap: spacing[2], justifyContent: "flex-end" }}>
          <Button variant="ghost" onClick={() => setConfirm(null)} disabled={processing}>Cancel</Button>
          <Button variant="primary" onClick={handleVoid} disabled={processing}>
            {processing ? "Voiding..." : "Yes, void"}
          </Button>
        </div>
      </Modal>

      <Modal open={confirm === "delete"} onClose={() => !processing && setConfirm(null)} title="Delete this pay run?">
        <p style={{ ...typography.body, color: colors.textSecondary, margin: `0 0 ${spacing[5]}px` }}>
          This pay run and its pay stubs will be permanently removed. This cannot be undone. Only drafts and unfinalized runs can be deleted.
        </p>
        <div style={{ display: "flex", gap: spacing[2], justifyContent: "flex-end" }}>
          <Button variant="ghost" onClick={() => setConfirm(null)} disabled={processing}>Cancel</Button>
          <Button variant="primary" onClick={handleDelete} disabled={processing}>
            {processing ? "Deleting..." : "Yes, delete"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
