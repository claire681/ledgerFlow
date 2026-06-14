import React from "react";
import { Sparkles } from "lucide-react";

const BRAND = "#0F9599";

export default function NovaPill({ label = "Nova", withIcon = true, style = {} }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, background: BRAND, color: "white", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, letterSpacing: "0.02em", ...style }}>
      {withIcon && <Sparkles size={11} />}
      {label}
    </span>
  );
}
