import React from "react";
import { colors, typography, spacing, radius, shadow, motion } from "../tokens";

const variants = {
  primary: {
    background: colors.brandPrimary,
    color: colors.textInverse,
    border: "none",
    fontWeight: 600,
  },
  secondary: {
    background: colors.bgCard,
    color: colors.textPrimary,
    border: `1px solid ${colors.borderDefault}`,
    fontWeight: 500,
  },
  ghost: {
    background: "transparent",
    color: colors.textSecondary,
    border: "none",
    fontWeight: 500,
  },
  danger: {
    background: colors.danger,
    color: colors.textInverse,
    border: "none",
    fontWeight: 600,
  },
};

const sizes = {
  sm: { padding: "8px 12px", fontSize: 14, gap: 6 },
  md: { padding: "12px 20px", fontSize: 15, gap: 8 },
  lg: { padding: "16px 24px", fontSize: 16, gap: 8 },
};

export default function Button({
  variant = "primary",
  size = "md",
  iconLeft,
  iconRight,
  disabled = false,
  loading = false,
  onClick,
  children,
  type = "button",
  fullWidth = false,
  style: styleOverride = {},
  ...rest
}) {
  const [hovered, setHovered] = React.useState(false);
  const [focused, setFocused] = React.useState(false);

  const variantStyle = variants[variant];
  const sizeStyle = sizes[size];

  const hoverBackground = {
    primary: colors.brandPrimaryHover,
    secondary: colors.bgCardActive,
    ghost: "transparent",
    danger: "#B91C1C",
  };
  const hoverColor = {
    primary: colors.textInverse,
    secondary: colors.textPrimary,
    ghost: colors.textPrimary,
    danger: colors.textInverse,
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        ...variantStyle,
        ...sizeStyle,
        background: hovered && !disabled ? hoverBackground[variant] : variantStyle.background,
        color: hovered && !disabled ? hoverColor[variant] : variantStyle.color,
        borderRadius: radius.lg,
        fontFamily: typography.fontFamily,
        cursor: disabled || loading ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: sizeStyle.gap,
        transition: `background ${motion.fast}, color ${motion.fast}, box-shadow ${motion.fast}`,
        boxShadow: focused ? shadow.focus : "none",
        outline: "none",
        width: fullWidth ? "100%" : "auto",
        boxSizing: "border-box",
        ...styleOverride,
      }}
      {...rest}
    >
      {iconLeft}
      {loading ? "..." : children}
      {iconRight}
    </button>
  );
}
