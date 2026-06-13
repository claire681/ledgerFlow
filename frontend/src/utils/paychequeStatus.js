// Status enum, label and color mapping, plus shared formatters for the
// Paycheque list and Paycheque detail views.

export const STATUS = {
  PAID: "paid",
  PRINTED: "printed",
  DD_SENT: "dd_sent",
  PENDING: "pending",
  VOIDED: "voided",
};

export const STATUS_LABELS = {
  paid: "Paid",
  printed: "Printed",
  dd_sent: "DD sent",
  pending: "Pending",
  voided: "Voided",
};

export const STATUS_COLORS = {
  paid:    { bg: "#DCFCE7", fg: "#166534" },
  printed: { bg: "#DBEAFE", fg: "#1E40AF" },
  dd_sent: { bg: "#DCFCE7", fg: "#166534" },
  pending: { bg: "#FEF3C7", fg: "#92400E" },
  voided:  { bg: "#F3F4F6", fg: "#6B7280" },
};

export const PAY_METHOD_LABELS = {
  cheque: "Cheque",
  direct_deposit: "Dir. dep.",
  check: "Cheque",
};

export const PAY_METHOD_LABELS_LONG = {
  cheque: "Cheque",
  direct_deposit: "Direct deposit",
  check: "Cheque",
};

export const formatCurrency = (value, currency) => {
  if (value === null || value === undefined) return "";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "";
  try {
    return new Intl.NumberFormat("en-CA", { style: "currency", currency: currency || "CAD" }).format(num);
  } catch (e) {
    return "$" + num.toFixed(2);
  }
};

export const formatDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" });
};

export const formatDateLong = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-CA", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
};

export const formatPeriodShort = (start, end) => {
  if (!start || !end) return "";
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return "";
  const sLabel = s.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return sLabel + " - " + e.getDate();
  }
  const eLabel = e.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
  return sLabel + " - " + eLabel;
};

export const formatPeriodLong = (start, end) => {
  if (!start || !end) return "";
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return "";
  return s.toLocaleDateString("en-CA", { month: "long", day: "numeric" }) +
    " to " +
    e.toLocaleDateString("en-CA", { month: "long", day: "numeric", year: "numeric" });
};

export const employeeNameFromPaycheque = (pc) => {
  if (!pc) return "";
  if (pc.employee_name) return pc.employee_name;
  const last = (pc.last_name || "").trim();
  const first = (pc.first_name || "").trim();
  if (last && first) return last + ", " + first;
  return first || last || pc.email || "Unnamed";
};

export const isPending = (pc) => (pc && pc.status === STATUS.PENDING);
export const isVoided = (pc) => (pc && pc.status === STATUS.VOIDED);
export const isCheque = (pc) => (pc && (pc.pay_method === "cheque" || pc.pay_method === "check"));
export const isDirectDeposit = (pc) => (pc && pc.pay_method === "direct_deposit");
