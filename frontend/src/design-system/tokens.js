// Novala design system tokens
// Single source of truth for every visual decision.
// See 03-design-system.md for the full spec.

export const colors = {
  // Surface and background
  bgPage: "#FAFAF7",
  bgCard: "#FFFFFF",
  bgCardHover: "#FDFCF7",
  bgCardActive: "#F7F4EB",
  bgInput: "#FFFFFF",
  bgInputDisabled: "#F7F4EB",

  // Borders
  borderDefault: "#EBE7DC",
  borderSubtle: "#F2EFE5",
  borderStrong: "#D8D3C5",
  borderInput: "#E8E5DD",
  borderInputFocus: "#0F9599",

  // Text
  textPrimary: "#1A1A1A",
  textSecondary: "#6B6B6B",
  textMuted: "#999999",
  textDisabled: "#C4C0B5",
  textInverse: "#FFFFFF",

  // Brand
  brandPrimary: "#0F9599",
  brandPrimaryHover: "#0C7B7E",
  brandSoft: "#E6F4F4",
  brandSoftStrong: "#D0EBEC",

  // Semantic
  success: "#16A34A",
  successSoft: "#DCFCE7",
  successText: "#065F46",
  warning: "#D97706",
  warningSoft: "#FEF3C7",
  warningText: "#92400E",
  danger: "#DC2626",
  dangerSoft: "#FEE2E2",
  dangerText: "#991B1B",
  info: "#2563EB",
  infoSoft: "#DBEAFE",
  infoText: "#1E40AF",
};

export const fontFamily = '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

export const typography = {
  fontFamily,
  display: { fontSize: 36, fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.02em" },
  displaySm: { fontSize: 28, fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.01em" },
  h1: { fontSize: 22, fontWeight: 700, lineHeight: 1.3 },
  h2: { fontSize: 18, fontWeight: 600, lineHeight: 1.4 },
  h3: { fontSize: 16, fontWeight: 600, lineHeight: 1.5 },
  bodyLg: { fontSize: 16, fontWeight: 400, lineHeight: 1.5 },
  body: { fontSize: 15, fontWeight: 400, lineHeight: 1.5 },
  bodyMd: { fontSize: 15, fontWeight: 500, lineHeight: 1.5 },
  bodySm: { fontSize: 14, fontWeight: 400, lineHeight: 1.5 },
  bodyStrong: { fontSize: 14, fontWeight: 600, lineHeight: 1.4 },
  caption: { fontSize: 13, fontWeight: 400, lineHeight: 1.4 },
  captionStrong: { fontSize: 13, fontWeight: 600, lineHeight: 1.4 },
  labelUppercase: { fontSize: 12, fontWeight: 600, lineHeight: 1.4, textTransform: "uppercase", letterSpacing: "0.05em" },
  tiny: { fontSize: 11, fontWeight: 600, lineHeight: 1.4, letterSpacing: "0.06em" },
};

export const spacing = {
  0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 28, 8: 32, 10: 40, 12: 48, 16: 64,
};

export const radius = {
  sm: 6, md: 8, lg: 10, card: 14, cardLg: 16, pill: 9999,
};

export const shadow = {
  focus: "0 0 0 3px rgba(15, 149, 153, 0.12)",
  focusDanger: "0 0 0 3px rgba(220, 38, 38, 0.12)",
  drawer: "-4px 0 24px rgba(0, 0, 0, 0.08)",
  modal: "0 8px 32px rgba(0, 0, 0, 0.12)",
  toast: "0 4px 16px rgba(0, 0, 0, 0.10)",
};

export const motion = {
  fast: "150ms ease",
  slow: "250ms cubic-bezier(0.32, 0.72, 0, 1)",
  modal: "200ms ease-out",
};

export const tabularNums = { fontFeatureSettings: '"tnum" 1' };

export const breakpoints = { mobile: 640, tablet: 1024 };

export const isMobile = () =>
  typeof window !== "undefined" && window.innerWidth < breakpoints.mobile;
