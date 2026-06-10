import React from "react";
import { ChevronDown } from "lucide-react";
import { colors, typography, radius, shadow, motion } from "../tokens";

export default function Select({
  value,
  onChange,
  options = [],
  label,
  helper,
  error,
  disabled = false,
  placeholder,
  width,
  style: styleOverride = {},
  ...rest
}) {
  const [focused, setFocused] = React.useState(false);
  const borderColor = error ? colors.danger : focused ? colors.borderInputFocus : colors.borderDefault;

  return (
    <div style={{ width: width || "100%" }}>
      {label && (
        <label
          style={{
            display: "block",
            ...typography.captionStrong,
            color: colors.textSecondary,
            marginBottom: 6,
          }}
        >
          {label}
        </label>
      )}
      <div style={{ position: "relative" }}>
        <select
          value={value === null || value === undefined ? "" : value}
          onChange={onChange}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            background: disabled ? colors.bgInputDisabled : colors.bgInput,
            color: disabled ? colors.textDisabled : colors.textPrimary,
            border: `1px solid ${borderColor}`,
            borderRadius: radius.md,
            padding: "10px 36px 10px 12px",
            fontFamily: typography.fontFamily,
            fontSize: 15,
            outline: "none",
            transition: `border-color ${motion.fast}, box-shadow ${motion.fast}`,
            boxShadow: focused ? shadow.focus : "none",
            width: "100%",
            boxSizing: "border-box",
            appearance: "none",
            WebkitAppearance: "none",
            cursor: disabled ? "not-allowed" : "pointer",
            ...styleOverride,
          }}
          {...rest}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) =>
            typeof opt === "string" ? (
              <option key={opt} value={opt}>{opt}</option>
            ) : (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            )
          )}
        </select>
        <ChevronDown
          size={16}
          color={colors.textMuted}
          style={{
            position: "absolute",
            right: 12,
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
          }}
        />
      </div>
      {(helper || error) && (
        <div
          style={{
            marginTop: 6,
            ...typography.caption,
            color: error ? colors.danger : colors.textMuted,
          }}
        >
          {error || helper}
        </div>
      )}
    </div>
  );
}
