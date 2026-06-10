import React from "react";
import { colors, typography } from "../tokens";

export default function Checkbox({ checked, onChange, label, disabled = false, ...rest }) {
  return (
    <label
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        userSelect: "none",
      }}
    >
      <input
        type="checkbox"
        checked={!!checked}
        onChange={onChange}
        disabled={disabled}
        style={{
          width: 18,
          height: 18,
          accentColor: colors.brandPrimary,
          cursor: disabled ? "not-allowed" : "pointer",
        }}
        {...rest}
      />
      {label && (
        <span style={{ ...typography.body, color: colors.textPrimary }}>
          {label}
        </span>
      )}
    </label>
  );
}
