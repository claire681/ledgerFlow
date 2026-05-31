import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle, AlertCircle, LogIn, UserPlus, LogOut } from "lucide-react";

const TEAL = "#0F5959";
const ACCENT = "#0AB98A";
const FONT = "'Inter', -apple-system, sans-serif";
const API = "https://api.getnovala.com/api/v1";

export default function AcceptInvite() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [accepting, setAccepting] = useState(false);

  const currentUserEmail = (localStorage.getItem("user_email") || "").toLowerCase().trim();
  const authToken = localStorage.getItem("token") || localStorage.getItem("auth_token") || "";
  const isLoggedIn = currentUserEmail.length > 0 && authToken.length > 0;

  useEffect(() => {
    if (!token) {
      setError("No invitation token provided");
      setLoading(false);
      return;
    }
    fetch(API + "/team/invites/" + token)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.detail || "Could not load invitation");
          return;
        }
        setInvite(data);
      })
      .catch((e) => setError("Could not load invitation: " + e.message))
      .finally(() => setLoading(false));
  }, [token]);

  const handleAccept = async () => {
    setAccepting(true);
    setError("");
    try {
      const res = await fetch(API + "/team/invites/" + token + "/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + authToken,
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.detail || "Could not accept invitation");
        setAccepting(false);
        return;
      }
      navigate("/", { replace: true });
    } catch (e) {
      setError("Could not accept invitation: " + e.message);
      setAccepting(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.reload();
  };

  const inviteEmail = invite ? (invite.email || "").toLowerCase().trim() : "";
  const emailMatches = isLoggedIn && currentUserEmail === inviteEmail;

  const primaryBtn = {
    width: "100%",
    background: ACCENT,
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "13px 16px",
    fontSize: 14,
    fontWeight: 600,
    cursor: accepting ? "wait" : "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontFamily: FONT,
    boxShadow: "0 2px 8px rgba(10,185,138,0.25)",
    opacity: accepting ? 0.7 : 1,
  };

  const secondaryBtn = {
    width: "100%",
    background: "#fff",
    color: TEAL,
    border: "1px solid " + TEAL,
    borderRadius: 10,
    padding: "13px 16px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontFamily: FONT,
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #F0FDF9 0%, #F8FAFC 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
      fontFamily: FONT,
    }}>
      <div style={{
        width: "100%",
        maxWidth: 480,
        background: "#fff",
        borderRadius: 20,
        boxShadow: "0 20px 60px rgba(15,89,89,0.08)",
        padding: "40px 32px",
      }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: TEAL,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 12,
            boxShadow: "0 4px 14px rgba(15,89,89,0.25)",
          }}>
            <svg width="24" height="24" viewBox="0 0 22 22" fill="none">
              <path d="M3 16 L7 7 L11 12 L15 5 L19 9" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="19" cy="9" r="2" fill="#fff" />
            </svg>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: TEAL, letterSpacing: "-0.02em" }}>
            No<span style={{ color: ACCENT }}>vala</span>
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#64748B", fontSize: 14 }}>
            Loading invitation...
          </div>
        )}

        {!loading && !invite && (
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%", background: "#FEF2F2",
              display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16,
            }}>
              <AlertCircle size={28} color="#EF4444" />
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 10 }}>
              Invitation Unavailable
            </div>
            <div style={{ fontSize: 14, color: "#64748B", lineHeight: 1.6, marginBottom: 24 }}>
              {error || "This invitation could not be loaded."}
            </div>
            <button onClick={() => navigate("/")} style={primaryBtn}>
              Go to Novala
            </button>
          </div>
        )}

        {!loading && invite && (
          <>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#111827", marginBottom: 8, letterSpacing: "-0.02em" }}>
                You are invited
              </div>
              <div style={{ fontSize: 14, color: "#64748B", lineHeight: 1.6 }}>
                {invite.inviter_name ? invite.inviter_name + " invited you to join " : "You have been invited to join "}
                <strong style={{ color: "#111827" }}>{invite.company_name}</strong> on Novala
              </div>
            </div>

            <div style={{
              background: "#F0FDF9",
              border: "1px solid #D1FAE5",
              borderRadius: 12,
              padding: 18,
              marginBottom: 22,
            }}>
              <div style={{
                fontSize: 12, fontWeight: 700, color: "#065F46", marginBottom: 8,
                textTransform: "uppercase", letterSpacing: "0.06em",
              }}>
                {invite.role_icon || "•"} Your role: {invite.role_label || invite.role}
              </div>
              <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.6, marginBottom: 14 }}>
                {invite.role_description}
              </div>
              {invite.role_permissions && invite.role_permissions.length > 0 && (
                <div style={{ borderTop: "1px solid #D1FAE5", paddingTop: 12 }}>
                  <div style={{
                    fontSize: 11, fontWeight: 600, color: "#6B7280", marginBottom: 8,
                    textTransform: "uppercase", letterSpacing: "0.06em",
                  }}>
                    What you can do
                  </div>
                  {invite.role_permissions.map((p, i) => (
                    <div key={i} style={{
                      fontSize: 12, color: "#374151", display: "flex",
                      alignItems: "center", gap: 8, padding: "4px 0",
                    }}>
                      <CheckCircle size={13} color={ACCENT} style={{ flexShrink: 0 }} />
                      <span>{p}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {!isLoggedIn && (
              <>
                <div style={{
                  fontSize: 13, color: "#64748B", marginBottom: 16,
                  textAlign: "center", lineHeight: 1.5,
                }}>
                  This invitation is for <strong style={{ color: "#111827" }}>{invite.email}</strong>.<br />
                  Log in or create an account to accept.
                </div>
                <button
                  onClick={() => navigate("/login?return_to=" + encodeURIComponent("/accept-invite/" + token))}
                  style={primaryBtn}
                >
                  <LogIn size={16} />
                  Log in to accept
                </button>
                <div style={{ textAlign: "center", fontSize: 12, color: "#94A3B8", margin: "14px 0" }}>or</div>
                <button
                  onClick={() => navigate("/onboarding?invite_token=" + token + "&email=" + encodeURIComponent(invite.email))}
                  style={secondaryBtn}
                >
                  <UserPlus size={16} />
                  Create new account
                </button>
              </>
            )}

            {isLoggedIn && emailMatches && (
              <>
                {error && (
                  <div style={{
                    background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8,
                    padding: 12, marginBottom: 16, fontSize: 13, color: "#991B1B",
                  }}>
                    {error}
                  </div>
                )}
                <button onClick={handleAccept} disabled={accepting} style={primaryBtn}>
                  <CheckCircle size={16} />
                  {accepting ? "Accepting..." : "Accept Invitation"}
                </button>
              </>
            )}

            {isLoggedIn && !emailMatches && (
              <>
                <div style={{
                  background: "#FEF3C7", border: "1px solid #FCD34D", borderRadius: 10,
                  padding: 16, marginBottom: 16, fontSize: 13, color: "#92400E", lineHeight: 1.5,
                }}>
                  This invitation is for <strong>{invite.email}</strong> but you are logged in as <strong>{currentUserEmail}</strong>. Please log out and try again.
                </div>
                <button onClick={handleLogout} style={primaryBtn}>
                  <LogOut size={16} />
                  Log out
                </button>
              </>
            )}

            {invite.expires_at && (
              <div style={{
                textAlign: "center", fontSize: 11, color: "#94A3B8",
                marginTop: 18, lineHeight: 1.5,
              }}>
                Expires {new Date(invite.expires_at).toLocaleDateString("en-US", {
                  month: "long", day: "numeric", year: "numeric",
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
