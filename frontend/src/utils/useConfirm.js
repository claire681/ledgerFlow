/**
 * useConfirm — hook + provider for imperative confirm dialogs.
 * 
 * Setup (once, in App.js or index.js):
 *   import { ConfirmProvider } from "./utils/useConfirm";
 *   <ConfirmProvider><App /></ConfirmProvider>
 * 
 * Usage anywhere:
 *   const confirm = useConfirm();
 *   const ok = await confirm({ title, subtitle, danger });
 *   if (ok) { ... }
 */
import React, { useState, useContext, useCallback, useRef } from "react";
import NovalaConfirmDialog from "../components/NovalaConfirmDialog";

const ConfirmContext = React.createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState({ isOpen: false });
  const resolverRef = useRef(null);

  const confirm = useCallback(function (opts) {
    return new Promise(function (resolve) {
      resolverRef.current = resolve;
      setState({
        isOpen: true,
        title: opts.title,
        subtitle: opts.subtitle,
        message: opts.message,
        confirmLabel: opts.confirmLabel,
        cancelLabel: opts.cancelLabel,
      hideCancel: opts.hideCancel,
        danger: opts.danger,
      });
    });
  }, []);

  function handleConfirm() {
    if (resolverRef.current) resolverRef.current(true);
    resolverRef.current = null;
    setState({ isOpen: false });
  }

  function handleCancel() {
    if (resolverRef.current) resolverRef.current(false);
    resolverRef.current = null;
    setState({ isOpen: false });
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <NovalaConfirmDialog
        isOpen={state.isOpen}
        title={state.title}
        subtitle={state.subtitle}
        message={state.message}
        confirmLabel={state.confirmLabel}
        cancelLabel={state.cancelLabel}
      hideCancel={state.hideCancel}
        danger={state.danger}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    // Fallback to window.confirm if provider not mounted (defensive)
    return function (opts) {
      return Promise.resolve(window.confirm((opts && opts.title) || "Are you sure?"));
    };
  }
  return ctx;
}