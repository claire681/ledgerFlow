import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Plus, Upload, Edit2, Trash2, X, CreditCard, Building2, Check, AlertCircle
} from "lucide-react";
import { apiFetch } from "../utils/apiFetch";

// ---------------------------------------------------------------------------
// Theme constants (matches app design language, all dark readable colors)
// ---------------------------------------------------------------------------

const T = {
  ink:      "#0E1A1A",
  slate:    "#12262B",
  muted:    "#556",
  line:     "#E7EAF0",
  lineStr:  "#C9CED6",
  bg:       "#F7F8FA",
  card:     "#FFFFFF",
  cardAlt:  "#FAFBFC",
  primary:  "#0E1A1A",
  primaryHover: "#1a2a2a",
  teal:     "#15A08C",
  tealDark: "#0F6E56",
  tealTint: "#E1F5EE",
  red:      "#C5483B",
  redDark:  "#A83A2E",
  amber:    "#92400E",
  amberBg:  "#FEF3C7",
  blue:     "#1E40AF",
  blueBg:   "#DBEAFE",
  scrim:    "rgba(14,26,26,.4)",
};

const FONT = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const MONO = "'SF Mono', Menlo, Consolas, monospace";

const TYPES = [
  { value: "chequing", label: "Chequing" },
  { value: "savings",  label: "Savings" },
  { value: "credit",   label: "Credit" },
  { value: "other",    label: "Other" },
];

const INSTITUTIONS = [
  "RBC Royal Bank",
  "TD Canada Trust",
  "Scotiabank",
  "BMO Bank of Montreal",
  "CIBC",
  "National Bank",
  "Desjardins",
  "HSBC Canada",
  "Tangerine",
  "Simplii Financial",
  "Other",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtMoney(n) {
  const num = parseFloat(n) || 0;
  const abs = Math.abs(num).toLocaleString("en-US", {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  });
  return (num < 0 ? "-$" : "$") + abs;
}

function typeBadge(type) {
  const styles = {
    chequing: { bg: T.tealTint, color: T.tealDark },
    savings:  { bg: T.amberBg,  color: T.amber },
    credit:   { bg: T.blueBg,   color: T.blue },
    other:    { bg: "#E5E7EB",  color: "#374151" },
  };
  const style = styles[type] || styles.other;
  const label = TYPES.find(t => t.value === type)?.label || type;
  return (
    <span style={{
      display: "inline-block",
      padding: "3px 8px",
      borderRadius: 4,
      fontSize: 11.5,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: 0.4,
      background: style.bg,
      color: style.color,
    }}>
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const S = {
  page: {
    fontFamily: FONT,
    color: T.ink,
    background: T.bg,
    minHeight: "100vh",
    width: "100%",
    maxWidth: "100%",
    margin: 0,
    padding: "28px 32px 90px",
    boxSizing: "border-box",
  },
  pageHdr: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    gap: 20,
  },
  h1: { fontSize: 28, margin: "0 0 6px", fontWeight: 700, color: T.ink },
  subtitle: { fontSize: 14.5, color: T.slate, fontWeight: 500 },
  actions: { display: "flex", gap: 10, flexShrink: 0 },
  btn: {
    font: "inherit",
    fontWeight: 600,
    fontSize: 14,
    border: "none",
    borderRadius: 10,
    padding: "10px 16px",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    boxShadow: "0 1px 2px rgba(0,0,0,.04)",
    transition: "background .15s, border-color .15s",
  },
  btnPrimary: { background: T.primary, color: "#fff" },
  btnGhost: { background: T.card, color: T.ink, border: "1px solid " + T.lineStr },
  btnDanger: { background: T.red, color: "#fff" },
  card: {
    background: T.card,
    border: "1px solid " + T.line,
    borderRadius: 12,
    overflow: "hidden",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left",
    padding: "14px 20px",
    fontSize: 12,
    fontWeight: 700,
    color: T.ink,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    background: T.cardAlt,
    borderBottom: "1px solid " + T.line,
  },
  td: {
    padding: "16px 20px",
    fontSize: 14,
    color: T.ink,
    borderBottom: "1px solid #F0F2F5",
  },
  iconBtn: {
    background: "transparent",
    border: 0,
    cursor: "pointer",
    padding: 6,
    borderRadius: 6,
    color: T.slate,
    display: "inline-flex",
    alignItems: "center",
  },
  drawerScrim: {
    position: "fixed",
    inset: 0,
    background: T.scrim,
    zIndex: 100,
  },
  drawer: {
    position: "fixed",
    top: 0,
    right: 0,
    bottom: 0,
    width: 480,
    maxWidth: "100vw",
    background: T.card,
    zIndex: 101,
    boxShadow: "-4px 0 20px rgba(0,0,0,.1)",
    display: "flex",
    flexDirection: "column",
  },
  drawerHdr: {
    padding: "22px 24px",
    borderBottom: "1px solid #F0F2F5",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  drawerBody: { flex: 1, padding: 24, overflowY: "auto" },
  drawerFooter: {
    padding: "16px 24px",
    borderTop: "1px solid #F0F2F5",
    display: "flex",
    gap: 10,
    justifyContent: "flex-end",
    background: T.cardAlt,
  },
  field: { marginBottom: 16 },
  label: {
    fontSize: 12.5,
    fontWeight: 600,
    color: T.slate,
    marginBottom: 6,
    display: "block",
  },
  input: {
    width: "100%",
    height: 44,
    border: "1px solid " + T.line,
    borderRadius: 10,
    padding: "0 14px",
    fontFamily: FONT,
    fontSize: 14,
    color: T.ink,
    background: T.card,
    fontWeight: 500,
    outline: "none",
    boxSizing: "border-box",
  },
  inputMono: { fontFamily: MONO },
  select: {
    width: "100%",
    height: 44,
    border: "1px solid " + T.line,
    borderRadius: 10,
    padding: "0 40px 0 14px",
    fontFamily: FONT,
    fontSize: 14,
    color: T.ink,
    background: T.card + " url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2312262B' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><path d='M6 9l6 6 6-6'/></svg>\") no-repeat right 14px center",
    fontWeight: 500,
    outline: "none",
    appearance: "none",
    cursor: "pointer",
    boxSizing: "border-box",
  },
  help: { fontSize: 12.5, color: T.slate, marginTop: 6, fontWeight: 500 },
  row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  checkboxRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
    fontSize: 14,
    cursor: "pointer",
    padding: "4px 0",
    color: T.ink,
    fontWeight: 500,
  },
  checkbox: (on) => ({
    width: 18,
    height: 18,
    border: "1.5px solid " + (on ? T.teal : T.lineStr),
    background: on ? T.teal : "transparent",
    color: "#fff",
    borderRadius: 5,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  }),
  errorText: {
    color: T.red,
    fontSize: 12.5,
    marginTop: 4,
    fontWeight: 500,
  },
  modalScrim: {
    position: "fixed",
    inset: 0,
    background: "rgba(14,26,26,.5)",
    zIndex: 200,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modal: {
    background: T.card,
    borderRadius: 12,
    padding: 24,
    width: 400,
    maxWidth: "90vw",
    boxShadow: "0 20px 50px rgba(0,0,0,.2)",
  },
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function BankAccounts() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deletingAccount, setDeletingAccount] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [formErrors, setFormErrors] = useState({});
  const [saveError, setSaveError] = useState(null);

  // -------- Fetch bank accounts --------
  const { data: accounts = [], isLoading, isError, error } = useQuery({
    queryKey: ["bank-accounts"],
    queryFn: async () => {
      const res = await apiFetch("/api/v1/bank-accounts");
      if (!res.ok) throw new Error("Failed to load bank accounts");
      return res.json();
    },
    refetchOnWindowFocus: false,
  });

  // -------- Mutations --------
  const createMut = useMutation({
    mutationFn: async (payload) => {
      const res = await apiFetch("/api/v1/bank-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to create account");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bank-accounts"] });
      closeDrawer();
    },
    onError: (e) => setSaveError(e.message),
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, payload }) => {
      const res = await apiFetch(`/api/v1/bank-accounts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to update account");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bank-accounts"] });
      closeDrawer();
    },
    onError: (e) => setSaveError(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id) => {
      const res = await apiFetch(`/api/v1/bank-accounts/${id}`, {
        method: "DELETE",
      });
      if (!res.ok && res.status !== 204) {
        throw new Error("Failed to delete account");
      }
      return true;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bank-accounts"] });
      setDeletingAccount(null);
    },
  });

  // -------- Drawer handlers --------
  function openAdd() {
    setEditingId(null);
    setForm(emptyForm());
    setFormErrors({});
    setSaveError(null);
    setDrawerOpen(true);
  }

  function openEdit(account) {
    setEditingId(account.id);
    setForm({
      name: account.name || "",
      type: account.type || "chequing",
      institution: account.institution || "RBC Royal Bank",
      last_4: account.last_4 || "",
      opening_balance: String(account.opening_balance ?? "0"),
      is_default: !!account.is_default,
    });
    setFormErrors({});
    setSaveError(null);
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setEditingId(null);
    setFormErrors({});
    setSaveError(null);
  }

  function validateForm() {
    const errs = {};
    if (!form.name.trim()) errs.name = "Account name is required";
    if (!form.institution.trim()) errs.institution = "Institution is required";
    if (form.last_4 && !/^\d{4}$/.test(form.last_4)) {
      errs.last_4 = "Must be exactly 4 digits";
    }
    const bal = parseFloat(form.opening_balance);
    if (isNaN(bal)) errs.opening_balance = "Enter a valid amount";
    return errs;
  }

  function handleSave() {
    const errs = validateForm();
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const payload = {
      name: form.name.trim(),
      type: form.type,
      institution: form.institution.trim(),
      last_4: form.last_4 || null,
      opening_balance: parseFloat(form.opening_balance) || 0,
      is_default: form.is_default,
    };

    if (editingId) {
      updateMut.mutate({ id: editingId, payload });
    } else {
      createMut.mutate(payload);
    }
  }

  const saving = createMut.isPending || updateMut.isPending;

  // ---- Sort so default account appears first ----
  const sortedAccounts = useMemo(() => {
    return [...accounts].sort((a, b) => {
      if (a.is_default !== b.is_default) return a.is_default ? -1 : 1;
      return (a.created_at || "").localeCompare(b.created_at || "");
    });
  }, [accounts]);

  // ---- Render ----
  return (
    <div style={S.page}>
      <div style={S.pageHdr}>
        <div>
          <h1 style={S.h1}>Bank accounts</h1>
          <div style={S.subtitle}>Manage the bank accounts used for payroll and tax payments.</div>
        </div>
        <div style={S.actions}>
          <button
            style={{ ...S.btn, ...S.btnGhost }}
            onClick={() => alert("CSV import coming in Phase 3")}
          >
            <Upload size={16} />
            Import statement
          </button>
          <button style={{ ...S.btn, ...S.btnPrimary }} onClick={openAdd}>
            <Plus size={16} strokeWidth={2.5} />
            Add account
          </button>
        </div>
      </div>

      {isLoading && (
        <div style={{ ...S.card, padding: 60, textAlign: "center", color: T.slate, fontSize: 14, fontWeight: 500 }}>
          Loading bank accounts...
        </div>
      )}

      {isError && (
        <div style={{ ...S.card, padding: 24, background: "#FEF5F5", borderColor: "#F5C6CB", color: "#7C1621" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 600 }}>
            <AlertCircle size={18} />
            Could not load bank accounts.
          </div>
          <div style={{ marginTop: 8, fontSize: 13.5 }}>{error?.message || "Please try refreshing."}</div>
        </div>
      )}

      {!isLoading && !isError && sortedAccounts.length === 0 && (
        <div style={S.card}>
          <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <div style={{
              width: 64, height: 64, background: "#F0F2F5", borderRadius: "50%",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              marginBottom: 20, color: T.ink,
            }}>
              <Building2 size={30} />
            </div>
            <h3 style={{ fontSize: 18, margin: "0 0 8px", color: T.ink, fontWeight: 700 }}>
              No bank accounts yet
            </h3>
            <p style={{ fontSize: 14, color: T.slate, margin: "0 0 20px" }}>
              Add your first account to start recording payments and importing bank statements.
            </p>
            <button style={{ ...S.btn, ...S.btnPrimary }} onClick={openAdd}>
              <Plus size={16} strokeWidth={2.5} />
              Add your first account
            </button>
          </div>
        </div>
      )}

      {!isLoading && !isError && sortedAccounts.length > 0 && (
        <div style={S.card}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Name</th>
                <th style={S.th}>Type</th>
                <th style={S.th}>Institution</th>
                <th style={S.th}>Last 4</th>
                <th style={{ ...S.th, textAlign: "right" }}>Current balance</th>
                <th style={{ ...S.th, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedAccounts.map(a => {
                const bal = parseFloat(a.current_balance) || 0;
                return (
                  <tr
                    key={a.id}
                    style={{ cursor: "pointer" }}
                    onMouseEnter={e => e.currentTarget.style.background = T.cardAlt}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    onClick={() => openEdit(a)}
                  >
                    <td style={{ ...S.td, fontWeight: 600 }}>
                      {a.name}
                      {a.is_default && (
                        <span style={{
                          display: "inline-block", padding: "3px 8px", borderRadius: 4,
                          fontSize: 11.5, fontWeight: 700, textTransform: "uppercase",
                          letterSpacing: 0.4, background: T.ink, color: "#fff",
                          marginLeft: 8, verticalAlign: "middle",
                        }}>Default</span>
                      )}
                    </td>
                    <td style={S.td}>{typeBadge(a.type)}</td>
                    <td style={S.td}>{a.institution}</td>
                    <td style={{ ...S.td, fontFamily: MONO }}>
                      {a.last_4 ? "••••" + a.last_4 : "—"}
                    </td>
                    <td style={{
                      ...S.td, textAlign: "right", fontFamily: MONO, fontWeight: 600,
                      color: bal < 0 ? T.red : T.ink,
                    }}>
                      {fmtMoney(bal)}
                    </td>
                    <td
                      style={{ ...S.td, textAlign: "right" }}
                      onClick={e => e.stopPropagation()}
                    >
                      <button
                        style={S.iconBtn}
                        onClick={() => openEdit(a)}
                        title="Edit"
                        onMouseEnter={e => e.currentTarget.style.background = "#F0F2F5"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        style={S.iconBtn}
                        onClick={() => setDeletingAccount(a)}
                        title="Delete"
                        onMouseEnter={e => e.currentTarget.style.background = "#F0F2F5"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Drawer for add/edit */}
      {drawerOpen && (
        <>
          <div style={S.drawerScrim} onClick={closeDrawer} />
          <div style={S.drawer}>
            <div style={S.drawerHdr}>
              <h2 style={{ fontSize: 18, margin: 0, fontWeight: 700, color: T.ink }}>
                {editingId ? "Edit bank account" : "Add bank account"}
              </h2>
              <button style={S.iconBtn} onClick={closeDrawer} aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <div style={S.drawerBody}>
              {saveError && (
                <div style={{
                  background: "#FEF5F5", border: "1px solid #F5C6CB", color: "#7C1621",
                  padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16,
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <AlertCircle size={16} />
                  {saveError}
                </div>
              )}

              <div style={S.field}>
                <label style={S.label}>
                  Account name <span style={{ color: T.red }}>*</span>
                </label>
                <input
                  style={S.input}
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. BrightCare Operating"
                />
                {formErrors.name && <div style={S.errorText}>{formErrors.name}</div>}
                <div style={S.help}>A friendly name to identify this account in Novala.</div>
              </div>

              <div style={S.row2}>
                <div style={S.field}>
                  <label style={S.label}>
                    Type <span style={{ color: T.red }}>*</span>
                  </label>
                  <select
                    style={S.select}
                    value={form.type}
                    onChange={e => setForm({ ...form, type: e.target.value })}
                  >
                    {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div style={S.field}>
                  <label style={S.label}>
                    Institution <span style={{ color: T.red }}>*</span>
                  </label>
                  <select
                    style={S.select}
                    value={form.institution}
                    onChange={e => setForm({ ...form, institution: e.target.value })}
                  >
                    {INSTITUTIONS.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                  {formErrors.institution && <div style={S.errorText}>{formErrors.institution}</div>}
                </div>
              </div>

              <div style={S.row2}>
                <div style={S.field}>
                  <label style={S.label}>
                    Last 4 digits <span style={{ color: T.muted, fontWeight: 500 }}>(recommended)</span>
                  </label>
                  <input
                    style={{ ...S.input, ...S.inputMono }}
                    value={form.last_4}
                    onChange={e => setForm({ ...form, last_4: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                    placeholder="0000"
                    maxLength={4}
                  />
                  {formErrors.last_4 && <div style={S.errorText}>{formErrors.last_4}</div>}
                  <div style={S.help}>Never store the full account number.</div>
                </div>
                <div style={S.field}>
                  <label style={S.label}>
                    Opening balance <span style={{ color: T.red }}>*</span>
                  </label>
                  <input
                    style={{ ...S.input, ...S.inputMono }}
                    value={form.opening_balance}
                    onChange={e => setForm({ ...form, opening_balance: e.target.value })}
                    placeholder="0.00"
                  />
                  {formErrors.opening_balance && <div style={S.errorText}>{formErrors.opening_balance}</div>}
                  <div style={S.help}>Balance today, before Novala transactions.</div>
                </div>
              </div>

              <div style={S.field}>
                <div
                  style={S.checkboxRow}
                  onClick={() => setForm({ ...form, is_default: !form.is_default })}
                >
                  <span style={S.checkbox(form.is_default)}>
                    {form.is_default && <Check size={12} strokeWidth={3} color="#fff" />}
                  </span>
                  Set as default account for payroll and tax payments
                </div>
              </div>
            </div>
            <div style={S.drawerFooter}>
              <button
                style={{ ...S.btn, ...S.btnGhost }}
                onClick={closeDrawer}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                style={{ ...S.btn, ...S.btnPrimary, opacity: saving ? 0.6 : 1, cursor: saving ? "wait" : "pointer" }}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving..." : (editingId ? "Save changes" : "Save account")}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Delete confirmation modal */}
      {deletingAccount && (
        <div style={S.modalScrim} onClick={() => setDeletingAccount(null)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 17, margin: "0 0 8px", fontWeight: 700, color: T.ink }}>
              Delete this account?
            </h3>
            <p style={{ fontSize: 14, margin: "0 0 20px", color: T.ink, lineHeight: 1.5 }}>
              Deleting <b>{deletingAccount.name}</b> will remove it from Novala. Existing
              payments recorded against it will keep the historical reference but you will
              not be able to record new payments to it.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                style={{ ...S.btn, ...S.btnGhost }}
                onClick={() => setDeletingAccount(null)}
                disabled={deleteMut.isPending}
              >
                Cancel
              </button>
              <button
                style={{ ...S.btn, ...S.btnDanger, opacity: deleteMut.isPending ? 0.6 : 1 }}
                onClick={() => deleteMut.mutate(deletingAccount.id)}
                disabled={deleteMut.isPending}
              >
                {deleteMut.isPending ? "Deleting..." : "Delete account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function emptyForm() {
  return {
    name: "",
    type: "chequing",
    institution: "RBC Royal Bank",
    last_4: "",
    opening_balance: "0",
    is_default: false,
  };
}