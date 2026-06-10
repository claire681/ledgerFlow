import React from "react";
import { colors, radius, spacing } from "../tokens";

export default function Card({
  children,
  padding = spacing[6],
  noPadding = false,
  style: styleOverride = {},
  ...rest
}) {
  return (
    <div
      style={{
        background: colors.bgCard,
        border: `1px solid ${colors.borderDefault}`,
        borderRadius: radius.card,
        padding: noPadding ? 0 : padding,
        boxSizing: "border-box",
        ...styleOverride,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, icon, style: styleOverride = {} }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 16,
        marginBottom: 16,
        ...styleOverride,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
        {icon}
        <div style={{ minWidth: 0 }}>
          <h2 style={{
            fontSize: 18, fontWeight: 600, lineHeight: 1.4,
            color: colors.textPrimary, margin: 0,
          }}>{title}</h2>
          {subtitle && (
            <p style={{
              fontSize: 14, color: colors.textSecondary,
              margin: "4px 0 0", lineHeight: 1.5,
            }}>{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
