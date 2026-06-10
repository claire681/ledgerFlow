import React from "react";
import { RotateCw } from "lucide-react";
import { colors, typography } from "../tokens";

export default function Spinner({ size = 16, label, color = colors.textMuted, inline = false }) {
  const spinner = (
    <RotateCw
      size={size}
      color={color}
      style={{ animation: "novalaSpin 1s linear infinite" }}
    />
  );

  if (!label) {
    return (
      <>
        {spinner}
        <style>{`@keyframes novalaSpin { to { transform: rotate(360deg); } }`}</style>
      </>
    );
  }

  return (
    <div style={{
      display: inline ? "inline-flex" : "flex",
      alignItems: "center",
      gap: 8,
      color,
      ...typography.bodySm,
    }}>
      {spinner}
      <span>{label}</span>
      <style>{`@keyframes novalaSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
