import React from "react";
import { colors, typography, radius, shadow, motion, tabularNums } from "../tokens";

export default function Input({
  type = "text",
  value,
  onChange,
  placeholder,
  label,
  helper,
  error,
  disabled = false,
  inputMode,
  autoComplete,
  numeric = false,
  inline = false,
  width,
  style: styleOverride = {},
  ...rest
}) {
  const [focused, setFocused] = React.useState(false);
  const borderColor = error
    ? colors.danger
    : focused
    ? colors.borderInputFocus
    : colors.borderDefault;

  const baseStyle = {
    background: disabled ? colors.bgInputDisabled : colors.bgInput,
    color: disabled ? colors.textDisabled : colors.textPrimary,
    border: `1px solid ${borderColor}`,
    borderRadius: radius.md,
    padding: inline ? "6px 8px" : "10px 12px",
    fontFamily: typography.fontFamily,
    fontSize: inline ? 14 : 15,
    outline: "none",
    transition: `border-color ${motion.fast}, box-shadow ${motion.fast}, background ${motion.fast}`,
    boxShadow: focused ? (error ? shadow.focusDanger : shadow.focus) : "none",
    width: width || (inline ? 56 : "100%"),
    boxSizing: "border-box",
    textAlign: inline ? "right" : "left",
    ...(numeric ? tabularNums : {}),
    ...styleOverride,
  };

  const inputEl = (
    <input
      type={type}
      value={value === null || value === undefined ? "" : value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      inputMode={inputMode || (numeric ? "decimal" : undefined)}
      autoComplete={autoComplete}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={baseStyle}
      {...rest}
    />
  );

  if (inline) return inputEl;

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
      {inputEl}
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
