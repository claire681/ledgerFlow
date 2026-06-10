import React from "react";
import { Clock, FileText, CheckCircle, XCircle } from "lucide-react";
import { colors, typography, radius } from "../tokens";

const STATUSES = {
  draft: { label: "Draft", bg: colors.warningSoft, fg: colors.warningText, Icon: Clock },
  calculated: { label: "Calculated", bg: colors.infoSoft, fg: colors.infoText, Icon: FileText },
  finalized: { label: "Finalized", bg: colors.successSoft, fg: colors.successText, Icon: CheckCircle },
  voided: { label: "Voided", bg: colors.dangerSoft, fg: colors.dangerText, Icon: XCircle },
};

export default function StatusPill({ status, label: customLabel, style: styleOverride = {} }) {
  const config = STATUSES[status] || STATUSES.draft;
  const Icon = config.Icon;
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      background: config.bg,
      color: config.fg,
      padding: "4px 10px",
      borderRadius: radius.pill,
      ...typography.tiny,
      ...styleOverride,
    }}>
      <Icon size={12} />
      {customLabel || config.label}
    </span>
  );
}
