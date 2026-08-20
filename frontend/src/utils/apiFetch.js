/**
 * apiFetch: fetch wrapper with automatic auth + silent token refresh.
 *
 * On 401 from any endpoint, calls /auth/refresh to get a fresh access_token
 * and retries the original request. Multiple parallel 401s share the same
 * refresh call. If refresh fails, clears storage and redirects to /login.
 *
 * Usage:
 *   const res = await apiFetch("/api/v1/employees");
 *   const data = await res.json();
 *
 * Pass an absolute URL to skip prefix, or a relative path (starting with /)
 * to have API_URL prefixed automatically.
 */

const API_URL = process.env.REACT_APP_API_URL || "https://api.getnovala.com";

function getAccessToken() {
  return localStorage.getItem("access_token") || localStorage.getItem("token") || "";
}
function getRefreshToken() {
  return localStorage.getItem("refresh_token") || "";
}
function setAccessToken(t) {
  localStorage.setItem("access_token", t);
  localStorage.setItem("token", t); // legacy key so old code still works
}
function clearTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("token");
}

// A single in-flight refresh promise (dedup concurrent 401s)
let refreshInFlight = null;

async function refreshAccessToken() {
  if (refreshInFlight) return refreshInFlight;

  const refresh = getRefreshToken();
  if (!refresh) {
    return Promise.reject(new Error("No refresh token"));
  }

  refreshInFlight = fetch(API_URL + "/api/v1/auth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refresh }),
  }).then(async function(r) {
    if (!r.ok) {
      throw new Error("Refresh failed with status " + r.status);
    }
    const data = await r.json();
    if (!data.access_token) throw new Error("No access token in refresh response");
    setAccessToken(data.access_token);
    return data.access_token;
  }).finally(function() {
    refreshInFlight = null;
  });

  return refreshInFlight;
}

function buildUrl(pathOrUrl) {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  if (pathOrUrl.startsWith("/")) return API_URL + pathOrUrl;
  return API_URL + "/" + pathOrUrl;
}

function buildOptions(opts, token) {
  const merged = Object.assign({}, opts || {});
  const headers = Object.assign({}, (opts && opts.headers) || {});
  if (token) headers["Authorization"] = "Bearer " + token;
  // Only set Content-Type if there's a body and it wasn't set
  if (merged.body && typeof merged.body === "string" && !headers["Content-Type"] && !headers["content-type"]) {
    headers["Content-Type"] = "application/json";
  }
  merged.headers = headers;
  return merged;
}

/**
 * The main wrapper.
 * @param {string} pathOrUrl - Path like "/api/v1/employees" or a full URL
 * @param {object} opts - Fetch options
 * @returns {Promise<Response>}
 */
export async function apiFetch(pathOrUrl, opts) {
  const url = buildUrl(pathOrUrl);
  const token = getAccessToken();

  let response = await fetch(url, buildOptions(opts, token));

  // Skip refresh logic for auth endpoints themselves
  const isAuthEndpoint = url.indexOf("/auth/") !== -1;

  if (response.status === 401 && !isAuthEndpoint && getRefreshToken()) {
    try {
      const newToken = await refreshAccessToken();
      response = await fetch(url, buildOptions(opts, newToken));
    } catch (e) {
      // Refresh failed - clear and redirect
      clearTokens();
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.href = "/login?session_expired=1";
      }
    }
  }

  return response;
}

// Convenience: for auth headers used by non-wrapped fetches during migration
export function apiAuthHeaders() {
  const token = getAccessToken();
  return token ? { Authorization: "Bearer " + token } : {};
}

// Called by Login page to store both tokens after successful login
export function storeAuthTokens(accessToken, refreshToken) {
  if (accessToken) {
    setAccessToken(accessToken);
  }
  if (refreshToken) {
    localStorage.setItem("refresh_token", refreshToken);
  }
}

export function clearAuthTokens() {
  clearTokens();
}

export default apiFetch;