import React from "react";
import { colors } from "../tokens";

export default function ProgressDots({ current, total }) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 32,
            height: 4,
            borderRadius: 2,
            background: i < current ? colors.brandPrimary : colors.borderDefault,
            transition: "background 250ms ease",
          }}
        />
      ))}
    </div>
  );
}
