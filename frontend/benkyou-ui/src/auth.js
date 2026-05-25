import {
  buildDashboardPath,
  clearSession,
  getRole,
  getSession,
  getTenantCode,
  getToken,
  isAuthenticated,
  parseToken,
  saveSession,
} from "./utils/session";

export {
  buildDashboardPath,
  clearSession,
  getRole,
  getSession,
  getTenantCode,
  getToken,
  isAuthenticated,
  parseToken,
  saveSession,
};

export function logout() {
  clearSession();
  window.location.href = "/login";
}
