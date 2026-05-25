const TOKEN_KEY = "token";
const USER_KEY = "user";
const TENANT_KEY = "tenantCode";
const ROLE_CLAIM = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

function getStorage() {
  return typeof window === "undefined" ? null : window.localStorage;
}

export function parseToken(token) {
  if (!token) return null;

  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;

    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join("")
    );

    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function getToken() {
  return getStorage()?.getItem(TOKEN_KEY) || null;
}

export function getTenantCode() {
  return getStorage()?.getItem(TENANT_KEY) || null;
}

export function getStoredUser() {
  const value = getStorage()?.getItem(USER_KEY);
  if (!value) return null;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function getRole() {
  const token = getToken();
  const claims = parseToken(token);
  if (!claims) return getStoredUser()?.role || null;

  // Check common claim locations for role
  return (
    claims.role || 
    claims[ROLE_CLAIM] || 
    (claims.isSuperAdmin === "true" || claims.isSuperAdmin === true ? "SuperAdmin" : null) ||
    getStoredUser()?.role || 
    null
  );
}

export function isTokenExpired(token = getToken()) {
  if (!token) return true;
  const claims = parseToken(token);
  if (!claims?.exp) return false;
  // Buffer of 10 seconds
  return (claims.exp * 1000) - 10000 <= Date.now();
}

export function getSession() {
  const token = getToken();
  if (!token || isTokenExpired(token)) {
    clearSession();
    return null;
  }

  const claims = parseToken(token) || {};
  const storedUser = getStoredUser();
  const role = getRole();
  const tenantCode = claims.tenantCode || getTenantCode();
  const name = claims.name || storedUser?.name || "";
  const email = claims.email || storedUser?.email || "";

  return {
    token,
    role,
    tenantCode,
    user: {
      id: claims.uid || storedUser?.id || null,
      tenantId: claims.tenantId || storedUser?.tenantId || null,
      name,
      email,
      role,
    },
  };
}

export function saveSession(authResponse) {
  const storage = getStorage();
  if (!storage || !authResponse?.token) return null;

  storage.setItem(TOKEN_KEY, authResponse.token);

  const claims = parseToken(authResponse.token) || {};
  const role = authResponse.role || getRole();
  const tenantCode = authResponse.tenantCode || claims.tenantCode || null;
  const user = {
    id: claims.uid || authResponse.userId || null,
    tenantId: claims.tenantId || null,
    name: claims.name || authResponse.name || "",
    email: claims.email || authResponse.email || "",
    role,
  };

  if (tenantCode) {
    storage.setItem(TENANT_KEY, tenantCode);
  } else {
    storage.removeItem(TENANT_KEY);
  }

  storage.setItem(USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event("benkyou:session-changed"));

  return getSession();
}

export function clearSession() {
  const storage = getStorage();
  if (!storage) return;

  storage.removeItem(TOKEN_KEY);
  storage.removeItem(USER_KEY);
  storage.removeItem(TENANT_KEY);
  window.dispatchEvent(new Event("benkyou:session-changed"));
}

export function isAuthenticated() {
  return !!getSession();
}

export function getInitials(nameOrEmail = "") {
  const parts = nameOrEmail
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return (parts[0] || nameOrEmail || "U").slice(0, 2).toUpperCase();
}

export function buildDashboardPath(role, tenantCode) {
  if (role === "SuperAdmin") return "/superadmin/dashboard";
  if (role === "Admin") return `/${tenantCode || ""}/admin/dashboard`.replace("//", "/");
  if (role === "Instructor") return `/${tenantCode || ""}/instructor/dashboard`.replace("//", "/");
  if (role === "Operator") return `/${tenantCode || ""}/operator/dashboard`.replace("//", "/");
  if (role === "Student") return `/${tenantCode || ""}/student/dashboard`.replace("//", "/");
  return "/login";
}
