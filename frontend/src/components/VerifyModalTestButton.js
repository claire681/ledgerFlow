import React, { useState } from "react";
import NovalaVerifyModal from "./NovalaVerifyModal";

export default function VerifyModalTestButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 2000,
          background: "#0F9599",
          color: "#fff",
          border: "none",
          borderRadius: 999,
          padding: "12px 22px",
          fontSize: 14,
          fontWeight: 700,
          cursor: "pointer",
          boxShadow: "0 8px 20px -6px rgba(15,149,153,0.5)",
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
        }}
      >
        Test verify modal
      </button>
      {open && (
        <NovalaVerifyModal
          phone="+17805561123"
          email="kemaclaire01@gmail.com"
          correctCode="123456"
          onClose={() => setOpen(false)}
          onVerified={() => { setOpen(false); alert("Verified! Code was 123456."); }}
        />
      )}
    </>
  );
}
