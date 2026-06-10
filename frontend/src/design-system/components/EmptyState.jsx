import React from "react";
import { colors, typography, spacing, radius } from "../tokens";
import Button from "./Button";

export default function EmptyState({ icon, title, description, action }) {
  return (
    <div style={{
      padding: `${spacing[12]}px ${spacing[8]}px`,
      textAlign: "center",
    }}>
      {icon && (
        <div style={{
          width: 64, height: 64,
          background: colors.brandSoft,
          borderRadius: radius.pill,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: spacing[5],
        }}>
          {React.cloneElement(icon, { size: 28, color: colors.brandPrimary })}
        </div>
      )}
      <h2 style={{ ...typography.h2, color: colors.textPrimary, margin: "0 0 8px 0" }}>
        {title}
      </h2>
      {description && (
        <p style={{
          ...typography.bodySm,
          color: colors.textSecondary,
          maxWidth: 440,
          margin: "0 auto 24px",
        }}>
          {description}
        </p>
      )}
      {action && (
        <Button variant="primary" onClick={action.onClick} iconLeft={action.icon}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
