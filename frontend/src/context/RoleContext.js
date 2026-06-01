import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const RoleContext = createContext(null);

const API = "https://api.getnovala.com/api/v1";

const OWNER_PERMS = {
  can_edit: true,
  can_delete: true,
  can_invite: true,
  can_upload: true,
  can_export: true,
  can_manage_team: true,
  can_view_reports: true,
};

// Which sidebar pages each role can access
export const ROLE_ALLOWED_PAGES = {
  owner:      ["dashboard","documents","transactions","invoices","tax","vendors","budgets","receipts","agents","currency","team","integrations","settings","help","reports"],
  admin:      ["dashboard","documents","transactions","invoices","tax","vendors","budgets","receipts","agents","currency","team","integrations","settings","help","reports"],
  accountant: ["dashboard","documents","transactions","invoices","tax","vendors","budgets","receipts","agents","currency","integrations","settings","help","reports"],
  staff:      ["documents","receipts","settings","help"],
  viewer:     ["dashboard","documents","transactions","invoices","tax","vendors","budgets","settings","help","reports"],
};

export function canAccessPage(role, page) {
  const allowed = ROLE_ALLOWED_PAGES[role] || ROLE_ALLOWED_PAGES.viewer;
  return allowed.includes((page || "").toLowerCase());
}

export function RoleProvider({ children }) {
  const [role, setRole] = useState("owner");
  const [isOwner, setIsOwner] = useState(true);
  const [permissions, setPermissions] = useState(OWNER_PERMS);
  const [companyName, setCompanyName] = useState(null);
  const [ownerName, setOwnerName] = useState(null);
  const [roleLabel, setRoleLabel] = useState("Owner");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchContext = useCallback(async () => {
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("auth_token") || "";
      if (!token) {
        setLoading(false);
        return;
      }
      const res = await fetch(API + "/team/me", {
        headers: { Authorization: "Bearer " + token },
      });
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const data = await res.json();
      setRole(data.role || "owner");
      setIsOwner(data.is_owner !== false);
      setPermissions(data.permissions || OWNER_PERMS);
      setCompanyName(data.company_name || null);
      setOwnerName(data.owner_name || null);
      setRoleLabel(data.role_label || "Owner");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchContext(); }, [fetchContext]);

  // Source-of-truth sync: whenever backend tells us the company name, mirror it to localStorage
  // so other pages reading company_name from localStorage stay current.
  useEffect(() => {
    if (companyName) {
      localStorage.setItem('company_name', companyName);
    }
  }, [companyName]);

  return (
    <RoleContext.Provider value={{
      role, isOwner, permissions, companyName, ownerName, roleLabel,
      loading, error, refresh: fetchContext,
    }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) {
    return {
      role: "owner", isOwner: true, permissions: OWNER_PERMS,
      companyName: null, ownerName: null, roleLabel: "Owner",
      loading: false, error: null, refresh: () => {},
    };
  }
  return ctx;
}
