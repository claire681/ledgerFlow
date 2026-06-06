import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const API = "https://api.getnovala.com/api/v1";

const ALLOWED_WHILE_UNVERIFIED = [
  "/",
  "/verify-code",
  "/login",
  "/register",
  "/checkout",
  "/pricing",
  "/add-payroll",
  "/cart",
  "/forgot-password",
  "/reset-password",
  "/accept-invite"
];

function getToken() {
  return localStorage.getItem("token") || localStorage.getItem("access_token");
}

function isAllowedPath(pathname) {
  if (ALLOWED_WHILE_UNVERIFIED.includes(pathname)) return true;
  if (pathname.startsWith("/help") || pathname.startsWith("/legal") || pathname.startsWith("/privacy") || pathname.startsWith("/terms")) return true;
  return false;
}

export default function VerificationGuard() {
  const navigate = useNavigate();
  const location = useLocation();
  const lastChecked = useRef("");

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    if (isAllowedPath(location.pathname)) return;
    if (lastChecked.current === location.pathname) return;
    lastChecked.current = location.pathname;

    fetch(API + "/auth/me", {
      headers: { "Authorization": "Bearer " + token }
    })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (user) {
        if (user && user.is_verified === false) {
          navigate("/verify-code", { replace: true });
        }
      })
      .catch(function () {});
  }, [location.pathname, navigate]);

  return null;
}
